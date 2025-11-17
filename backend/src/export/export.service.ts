import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb } from 'pdf-lib';
import archiver from 'archiver';
import axios from 'axios';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type ExportFormat = 'pdf' | 'cbz';

export interface ExportOptions {
  episodeId: string;
  episodeTitle: string;
  pages: Array<{
    pageNumber: number;
    imageUrl?: string;
    audioUrl?: string;
  }>;
  format: ExportFormat;
  includeAudio?: boolean;
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ExportService {
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Failed to download image:', url, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to download image: ${errorMessage}`);
    }
  }

  private async downloadAudio(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Failed to download audio:', url, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to download audio: ${errorMessage}`);
    }
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9_\-]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async exportAsPDF(options: ExportOptions): Promise<ExportResult> {
    const { episodeTitle, pages } = options;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Set metadata
    pdfDoc.setTitle(episodeTitle);
    pdfDoc.setAuthor('MangaFusion');
    pdfDoc.setSubject('AI-Generated Manga Episode');
    pdfDoc.setKeywords(['manga', 'ai-generated', 'comic']);
    pdfDoc.setProducer('MangaFusion Platform');
    pdfDoc.setCreator('MangaFusion');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Download all images in parallel for better performance
    const imageDownloadPromises = pages
      .filter((page) => page.imageUrl)
      .map(async (page) => {
        try {
          const imageBytes = await this.downloadImage(page.imageUrl!);
          return {
            pageNumber: page.pageNumber,
            imageBytes,
            success: true,
          };
        } catch (error) {
          console.error(`Failed to download image for page ${page.pageNumber}:`, error);
          return {
            pageNumber: page.pageNumber,
            imageBytes: null,
            success: false,
          };
        }
      });

    const downloadedImages = await Promise.all(imageDownloadPromises);

    // Add each downloaded image to the PDF (must be sequential for correct page order)
    for (const download of downloadedImages) {
      if (!download.success || !download.imageBytes) {
        console.warn(`Page ${download.pageNumber} has no image, skipping`);
        continue;
      }

      try {
        // Embed the image in the PDF
        let image;
        try {
          // Try PNG first
          image = await pdfDoc.embedPng(download.imageBytes);
        } catch (pngError) {
          try {
            // Try JPEG if PNG fails
            image = await pdfDoc.embedJpg(download.imageBytes);
          } catch (jpgError) {
            console.error(`Failed to embed image for page ${download.pageNumber}:`, jpgError);
            continue;
          }
        }

        // Get image dimensions
        const { width, height } = image.scale(1);

        // Create a page in the PDF with the same aspect ratio as the image
        // Most manga pages are portrait, typically around 768x1024 or similar
        const pdfPage = pdfDoc.addPage([width, height]);

        // Draw the image on the page (fill entire page)
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });

        console.log(`Added page ${download.pageNumber} to PDF (${width}x${height})`);
      } catch (error) {
        console.error(`Error processing page ${download.pageNumber}:`, error);
        // Continue with next page instead of failing the entire export
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    const sanitizedTitle = this.sanitizeFilename(episodeTitle);
    const filename = `${sanitizedTitle}_manga.pdf`;

    return {
      buffer,
      filename,
      mimeType: 'application/pdf',
      size: buffer.length,
    };
  }

  async exportAsCBZ(options: ExportOptions): Promise<ExportResult> {
    const { episodeTitle, pages, includeAudio } = options;

    return new Promise(async (resolve, reject) => {
      try {
        // Create a temporary directory for the CBZ contents
        const tempDir = path.join(os.tmpdir(), `cbz_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // CBZ is essentially a ZIP file containing images
        // Standard naming convention: page_001.png, page_002.png, etc.
        const archive = archiver('zip', {
          zlib: { level: 9 }, // Maximum compression
        });

        const chunks: Buffer[] = [];

        archive.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        archive.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const sanitizedTitle = this.sanitizeFilename(episodeTitle);
          const filename = `${sanitizedTitle}_manga.cbz`;

          // Clean up temp directory
          this.cleanupTempDir(tempDir);

          resolve({
            buffer,
            filename,
            mimeType: 'application/x-cbz',
            size: buffer.length,
          });
        });

        archive.on('error', (err: Error) => {
          this.cleanupTempDir(tempDir);
          reject(err);
        });

        // Add metadata file (ComicInfo.xml) for comic readers
        const comicInfo = this.generateComicInfoXml(episodeTitle, pages.length);
        archive.append(comicInfo, { name: 'ComicInfo.xml' });

        // Download and add each page image
        for (const page of pages) {
          if (!page.imageUrl) {
            console.warn(`Page ${page.pageNumber} has no image, skipping`);
            continue;
          }

          try {
            const imageBytes = await this.downloadImage(page.imageUrl);

            // Determine file extension from URL or content
            const ext = page.imageUrl.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)?.[1] || 'png';
            const paddedNumber = String(page.pageNumber).padStart(3, '0');
            const imageName = `page_${paddedNumber}.${ext}`;

            archive.append(imageBytes, { name: imageName });
            console.log(`Added ${imageName} to CBZ`);
          } catch (error) {
            console.error(`Error adding page ${page.pageNumber} to CBZ:`, error);
            // Continue with next page
          }
        }

        // Optionally include audio files
        if (includeAudio) {
          const audioDir = 'audio/';
          let hasAudio = false;

          for (const page of pages) {
            if (!page.audioUrl) continue;

            try {
              const audioBytes = await this.downloadAudio(page.audioUrl);
              const paddedNumber = String(page.pageNumber).padStart(3, '0');
              const audioName = `${audioDir}page_${paddedNumber}.mp3`;

              archive.append(audioBytes, { name: audioName });
              hasAudio = true;
              console.log(`Added ${audioName} to CBZ`);
            } catch (error) {
              console.error(`Error adding audio for page ${page.pageNumber}:`, error);
            }
          }

          // Add a README for audio files if any were included
          if (hasAudio) {
            const audioReadme = `Audio Files for ${episodeTitle}\n\nThis CBZ archive includes audiobook narration for each page.\nAudio files are located in the 'audio/' directory.\n\nFile naming: page_XXX.mp3 corresponds to page_XXX.png\n`;
            archive.append(audioReadme, { name: 'audio/README.txt' });
          }
        }

        // Finalize the archive
        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateComicInfoXml(title: string, pageCount: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    return `<?xml version="1.0"?>
<ComicInfo xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <Title>${this.escapeXml(title)}</Title>
  <Series>MangaFusion</Series>
  <Number>1</Number>
  <Summary>AI-generated manga episode created with MangaFusion</Summary>
  <Publisher>MangaFusion Platform</Publisher>
  <Genre>AI-Generated</Genre>
  <PageCount>${pageCount}</PageCount>
  <Year>${year}</Year>
  <Month>${month}</Month>
  <Day>${day}</Day>
  <Writer>AI</Writer>
  <Penciller>AI</Penciller>
  <Inker>AI</Inker>
  <Colorist>AI</Colorist>
  <Letterer>AI</Letterer>
  <CoverArtist>AI</CoverArtist>
  <Manga>Yes</Manga>
  <BlackAndWhite>No</BlackAndWhite>
</ComicInfo>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private cleanupTempDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    if (options.format === 'pdf') {
      return this.exportAsPDF(options);
    } else if (options.format === 'cbz') {
      return this.exportAsCBZ(options);
    } else {
      throw new Error(`Unsupported export format: ${options.format}`);
    }
  }
}
