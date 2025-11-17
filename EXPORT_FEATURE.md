# PDF/CBZ Export Feature

## Overview

The MangaFusion platform now supports exporting completed manga episodes as PDF or CBZ (Comic Book Archive) files. This feature allows users to download their AI-generated manga in industry-standard formats for reading on various devices and comic book readers.

## Features

### Supported Export Formats

1. **PDF (Portable Document Format)**
   - All 10 pages combined into a single PDF document
   - Preserves original image quality and aspect ratio
   - Includes metadata (title, author, creation date)
   - Compatible with all PDF readers

2. **CBZ (Comic Book Archive)**
   - ZIP archive containing properly named image files (page_001.png, page_002.png, etc.)
   - Includes ComicInfo.xml metadata for comic book readers
   - Compatible with popular comic readers (CDisplay, ComicRack, YACReader, etc.)
   - Optional audio file inclusion for audiobook episodes

### Optional Features

- **Audio Inclusion**: For episodes with audio narration, users can choose to include MP3 audio files in the export (CBZ format only)
- **Progress Tracking**: Real-time feedback during export generation
- **Automatic Download**: Files are automatically downloaded to the user's device

## Implementation Details

### Backend Components

#### 1. Export Service (`/backend/src/export/export.service.ts`)

The core service that handles file generation:

**Key Methods:**
- `exportAsPDF(options)`: Generates PDF files using pdf-lib
- `exportAsCBZ(options)`: Creates CBZ archives using archiver
- `downloadImage(url)`: Downloads images from Supabase storage
- `downloadAudio(url)`: Downloads audio files from storage
- `generateComicInfoXml()`: Creates metadata for CBZ files

**Dependencies:**
- `pdf-lib`: PDF creation and manipulation
- `archiver`: ZIP archive creation
- `axios`: HTTP client for downloading assets

#### 2. Export Endpoint (`POST /api/episodes/:id/export`)

**Location:** `/backend/src/episodes/episodes.controller.ts`

**Query Parameters:**
- `format`: Export format ('pdf' or 'cbz')
- `includeAudio`: Whether to include audio files ('true' or 'false')

**Response:**
- Content-Type: `application/pdf` or `application/x-cbz`
- Content-Disposition: `attachment; filename="<title>_manga.<format>"`
- Body: Binary file data

**Error Handling:**
- 400: Invalid format or no pages available
- 404: Episode not found
- 500: Export generation failed

### Frontend Components

#### 1. Export UI (`/pages/episodes/[id].tsx`)

**New Features:**
- Export button in completion screen
- Modal dialog for format selection
- Audio inclusion checkbox
- Real-time export progress indicator

**User Flow:**
1. User completes manga generation (10 pages)
2. Clicks "Export Episode" button
3. Selects format (PDF or CBZ) and audio options
4. Clicks "Export" to start download
5. File automatically downloads to device

### Database Schema Updates

**Added Field:**
- `Page.audioUrl` (String, optional): URL to audio narration file

**Migration Required:**
```bash
cd backend
npx prisma migrate dev --name add_audio_url
```

## File Format Specifications

### PDF Export

**Structure:**
- One page per manga page
- Full-page images (no margins)
- Maintains original image dimensions
- Embedded metadata

**Metadata:**
- Title: Episode title
- Author: "MangaFusion"
- Subject: "AI-Generated Manga Episode"
- Keywords: ["manga", "ai-generated", "comic"]
- Creation Date: Export timestamp

### CBZ Export

**Structure:**
```
episode_title_manga.cbz
├── ComicInfo.xml (metadata)
├── page_001.png
├── page_002.png
├── ...
├── page_010.png
└── audio/ (optional)
    ├── page_001.mp3
    ├── page_002.mp3
    └── README.txt
```

**ComicInfo.xml:**
- Follows ComicRack metadata standard
- Includes title, series, page count, creation date
- Marks as manga format
- Compatible with most comic readers

**Naming Convention:**
- Images: `page_XXX.<ext>` (zero-padded page numbers)
- Audio: `audio/page_XXX.mp3`

## Usage Examples

### Frontend Usage

```typescript
// Export as PDF
const response = await fetch(
  `${API_BASE}/episodes/${episodeId}/export?format=pdf`,
  { method: 'POST' }
);
const blob = await response.blob();
// Download file...

// Export as CBZ with audio
const response = await fetch(
  `${API_BASE}/episodes/${episodeId}/export?format=cbz&includeAudio=true`,
  { method: 'POST' }
);
```

### Backend Usage

```typescript
import { ExportService } from './export/export.service';

const result = await exportService.export({
  episodeId: 'uuid',
  episodeTitle: 'My Manga Episode',
  pages: [
    { pageNumber: 1, imageUrl: 'https://...', audioUrl: 'https://...' },
    { pageNumber: 2, imageUrl: 'https://...', audioUrl: 'https://...' },
    // ...
  ],
  format: 'pdf', // or 'cbz'
  includeAudio: true,
});

// result.buffer - File binary data
// result.filename - Suggested filename
// result.mimeType - Content type
// result.size - File size in bytes
```

## Testing Instructions

### Manual Testing

1. **Create a Test Episode:**
   ```bash
   # Start the development servers
   ./dev.sh
   ```

2. **Generate Pages:**
   - Navigate to the home page
   - Create a new manga episode
   - Wait for all 10 pages to generate

3. **Test PDF Export:**
   - Click "Export Episode" button
   - Select "PDF" format
   - Click "Export"
   - Verify file downloads
   - Open PDF and verify all pages are included

4. **Test CBZ Export:**
   - Click "Export Episode" button
   - Select "CBZ" format
   - Click "Export"
   - Verify file downloads
   - Extract CBZ (it's a ZIP file) and verify contents
   - Open in a comic reader (e.g., YACReader)

5. **Test Audio Inclusion:**
   - Generate audio for at least one page (using "Read Aloud")
   - Export as CBZ with "Include Audio Files" checked
   - Verify audio files are in the archive

### Automated Testing (Future)

```typescript
// Example test cases
describe('Export Service', () => {
  it('should export episode as PDF', async () => {
    const result = await exportService.exportAsPDF({
      episodeId: 'test-id',
      episodeTitle: 'Test Episode',
      pages: mockPages,
      format: 'pdf',
    });
    expect(result.mimeType).toBe('application/pdf');
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('should export episode as CBZ with audio', async () => {
    const result = await exportService.exportAsCBZ({
      episodeId: 'test-id',
      episodeTitle: 'Test Episode',
      pages: mockPagesWithAudio,
      format: 'cbz',
      includeAudio: true,
    });
    expect(result.mimeType).toBe('application/x-cbz');
    // Verify audio files are included
  });
});
```

## Performance Considerations

### File Size Estimates

- **PDF**: Approximately 5-15 MB for 10 pages (depends on image compression)
- **CBZ**: Approximately 8-20 MB for 10 pages + audio files
- **Audio**: ~100-500 KB per page (MP3 format)

### Generation Time

- **PDF**: 5-15 seconds (depends on image download speed)
- **CBZ**: 10-20 seconds (includes audio downloads if enabled)
- **Network**: Download speed affects total time

### Optimization Strategies

1. **Image Caching**: Images are downloaded on-demand (not pre-cached)
2. **Streaming**: Files are generated in-memory and streamed to client
3. **Compression**: CBZ uses maximum ZIP compression (level 9)
4. **Cleanup**: Temporary files are automatically cleaned up

## Limitations and Known Issues

### Current Limitations

1. **No Batch Export**: Can only export one episode at a time
2. **No Custom Page Range**: Always exports all available pages
3. **Memory Usage**: Large episodes may consume significant memory during generation
4. **Audio Format**: Only MP3 audio is supported
5. **Image Format**: PDF embedder supports PNG/JPEG only

### Known Issues

1. **Large Files**: Episodes with high-resolution images may produce large PDFs
2. **Timeout Risk**: Very slow networks may timeout during download
3. **Browser Compatibility**: File download may behave differently across browsers

### Future Improvements

1. **Progress Streaming**: Real-time progress updates via SSE
2. **Background Jobs**: Queue-based export for large files
3. **Custom Options**: Page range selection, quality settings
4. **Batch Export**: Export multiple episodes at once
5. **Cloud Storage**: Store exports temporarily for later download
6. **Additional Formats**: EPUB, MOBI support
7. **Watermarking**: Optional branding/watermarks
8. **Compression Options**: User-selectable quality/size tradeoff

## NPM Packages Added

### Backend

```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "archiver": "^7.0.1",
    "axios": "^1.7.2"
  },
  "devDependencies": {
    "@types/archiver": "^6.0.2"
  }
}
```

## Files Created/Modified

### Created Files

1. `/backend/src/export/export.service.ts` - Export service implementation
2. `/backend/src/export/export.module.ts` - Export module definition
3. `/home/user/mangafusion/EXPORT_FEATURE.md` - This documentation

### Modified Files

1. `/backend/prisma/schema.prisma` - Added audioUrl field to Page model
2. `/backend/src/app.module.ts` - Imported ExportModule
3. `/backend/src/episodes/episodes.module.ts` - Added ExportModule dependency
4. `/backend/src/episodes/episodes.controller.ts` - Added export endpoint
5. `/backend/package.json` - Added new dependencies
6. `/pages/episodes/[id].tsx` - Added export UI and functionality

## Security Considerations

1. **Input Validation**: Format parameter is validated
2. **Authentication**: (Note: Current implementation doesn't require auth - should be added in production)
3. **File Size Limits**: No explicit limits (should be added for production)
4. **URL Validation**: Image/audio URLs are assumed to be trusted from Supabase
5. **Temporary Files**: Cleaned up after use to prevent disk space issues

## Deployment Notes

### Environment Variables

No new environment variables required. Existing Supabase configuration is used for asset access.

### Database Migration

```bash
# Generate Prisma client with new schema
cd backend
npx prisma generate

# Run migration (if using database)
npx prisma migrate dev --name add_audio_url

# Or for production
npx prisma migrate deploy
```

### Build Process

```bash
# Backend build
cd backend
npm install
npm run build

# Frontend build
cd ..
npm install
npm run build
```

## Support and Troubleshooting

### Common Issues

**Issue**: Export fails with "Failed to download image"
- **Cause**: Image URL is invalid or inaccessible
- **Solution**: Verify Supabase storage permissions and URLs

**Issue**: PDF is blank or has missing pages
- **Cause**: Image format not supported by pdf-lib
- **Solution**: Ensure images are PNG or JPEG format

**Issue**: CBZ file won't open in comic reader
- **Cause**: Corrupted ZIP file or invalid metadata
- **Solution**: Verify archive integrity, check ComicInfo.xml format

**Issue**: Download timeout on large files
- **Cause**: Slow network or large image files
- **Solution**: Reduce image resolution or use background job queue

### Debug Mode

Enable detailed logging in the export service:

```typescript
// In export.service.ts
console.log('Downloading image:', url);
console.log('PDF generation started');
console.log('CBZ archive created:', filename);
```

## License

This feature is part of the MangaFusion platform and follows the same license as the main project.

## Credits

- **pdf-lib**: Used for PDF generation
- **archiver**: Used for CBZ/ZIP creation
- **ComicInfo.xml**: Standard defined by ComicRack community
