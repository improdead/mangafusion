import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getRendererConfig } from './config';
import { StorageService } from '../storage/storage.service';
import { Character, PlannerOutlinePage } from '../episodes/types';

export type RenderRequest = {
    pageNumber: number;
    outline: PlannerOutlinePage;
    episodeTitle: string;
    visualStyle: string;
    seed?: number;
    characterAssets?: Pick<Character, 'name' | 'assetFilename' | 'imageUrl'>[];
    baseImageUrl?: string; // when editing an existing page
    editPrompt?: string; // user-provided modification request
    styleRefUrls?: string[]; // additional reference images to bias style
};

@Injectable()
export class RendererService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly config = getRendererConfig();

    constructor(private readonly storage: StorageService) {}

    private get client() {
        if (!this.apiKey) throw new Error('GEMINI_API_KEY not set');
        return new GoogleGenerativeAI(this.apiKey);
    }

    async generatePage(request: RenderRequest): Promise<{ imageUrl: string; seed: number }> {
        if (!this.apiKey) {
            throw new Error('Renderer unavailable: GEMINI_API_KEY not set');
        }

        const seed = request.seed || Math.floor(Math.random() * 1_000_000);
        const prompt = this.buildPrompt(request);

        try {
            console.log(`Generating image for page ${request.pageNumber} with model ${this.config.imageModel}`);
            console.log(`Prompt: ${prompt.slice(0, 200)}...`);
            
            // Initialize the Gemini image model
            const model = this.client.getGenerativeModel({ 
                model: this.config.imageModel,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                }
            });
            
            // Generate image with Gemini
            console.log('Calling Gemini image generation...');
            const parts: any[] = [{ text: prompt }];
            // Attach base image if editing
            if (request.baseImageUrl) {
                try {
                    const res = await fetch(request.baseImageUrl);
                    const ab = await res.arrayBuffer();
                    const b64 = Buffer.from(ab).toString('base64');
                    parts.push({ inlineData: { data: b64, mimeType: 'image/png' } });
                } catch (e) {
                    console.warn('Failed to fetch baseImageUrl for editing', e);
                    parts.push({ text: `Reference current page image: ${request.baseImageUrl}` });
                }
            }
            // Try to attach character image references if available
            if (request.characterAssets?.length) {
                // If the planner provided explicit <filename> tags, only attach those used on this page
                let used: Set<string> | null = null;
                if (request.outline.prompt) {
                    const matches = Array.from(request.outline.prompt.matchAll(/<([^>]+)>/g)).map(m => m[1]);
                    used = new Set(matches);
                }
                for (const c of request.characterAssets) {
                    if (used && !used.has(c.assetFilename)) continue;
                    if (!c.imageUrl) continue;
                    try {
                        // Fetch the image and attach as inline data if possible
                        const res = await fetch(c.imageUrl);
                        const ab = await res.arrayBuffer();
                        const b64 = Buffer.from(ab).toString('base64');
                        parts.push({ inlineData: { data: b64, mimeType: 'image/png' } });
                    } catch {
                        // Fallback: just include the URL in the text prompt
                        parts.push({ text: `Reference image for ${c.name}: ${c.imageUrl}` });
                    }
                }
            }

            // Attach style reference images if provided
            if (request.styleRefUrls?.length) {
                for (const url of request.styleRefUrls) {
                    try {
                        const res = await fetch(url);
                        const ab = await res.arrayBuffer();
                        const b64 = Buffer.from(ab).toString('base64');
                        parts.push({ inlineData: { data: b64, mimeType: 'image/png' } });
                    } catch {
                        parts.push({ text: `Style reference: ${url}` });
                    }
                }
            }

            const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
            
            console.log('Gemini call completed, processing response...');
            const response = result.response;
            
            // Check if we have candidates in the response
            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) {
                throw new Error('No image candidates generated by Gemini');
            }

            const candidate = candidates[0];
            let imageBuffer: Buffer | null = null;
            
            // Try to extract image data from the response
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    // Check for inline data (base64 encoded image)
                    if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
                        console.log(`Found image data: ${part.inlineData.mimeType}`);
                        imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                        break;
                    }
                    // Check for file data (if using file uploads)
                    else if (part.fileData && part.fileData.mimeType?.startsWith('image/')) {
                        console.log(`Found file data: ${part.fileData.mimeType}`);
                        // Note: fileData would need additional handling to fetch the actual file
                        throw new Error('File data format not yet supported');
                    }
                }
            }
            
            // If no image data found, check if it's a text response with image description
            if (!imageBuffer) {
                const textContent = candidate.content?.parts?.find(part => part.text)?.text;
                if (textContent) {
                    console.log('Received text response instead of image:', textContent.slice(0, 100));
                    throw new Error('Model returned text instead of image. The model might not support image generation yet.');
                }
                throw new Error('No image data found in Gemini response');
            }

            console.log(`Generated image buffer: ${imageBuffer.length} bytes`);
            
            // Upload to storage
            let imageUrl: string;
            const padded = String(request.pageNumber).padStart(2, '0');
            const filename = `episodes/${request.episodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}/page_${padded}_${seed}.png`;
            
            if (this.storage.enabled) {
                imageUrl = await this.storage.uploadImage(imageBuffer, filename, 'image/png');
                console.log(`Image uploaded to storage: ${imageUrl}`);
            } else {
                console.warn('Storage not configured, cannot save generated image');
                // Create a placeholder that indicates real generation happened but couldn't be saved
                const shortBeat = encodeURIComponent(request.outline.beat.slice(0, 40));
                imageUrl = `https://placehold.co/1024x1536/00FF00/000000?text=GENERATED+PAGE+${padded}%0A${shortBeat}%0AStorage+Disabled`;
            }

            console.log(`Successfully generated page ${request.pageNumber}`);
            return { imageUrl, seed };
            
        } catch (error) {
            console.error('Image generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Check if it's a model availability issue
            if (errorMessage.includes('not found') || errorMessage.includes('not available')) {
                console.warn('Image model may not be available yet, falling back to enhanced placeholder');
                const padded = String(request.pageNumber).padStart(2, '0');
                const shortBeat = encodeURIComponent(request.outline.beat.slice(0, 40));
                const fallbackUrl = `https://placehold.co/1024x1536/FFA500/000000?text=MODEL+UNAVAILABLE%0APAGE+${padded}%0A${shortBeat}`;
                return { imageUrl: fallbackUrl, seed };
            }
            
            // General error fallback
            const padded = String(request.pageNumber).padStart(4, '0');
            const fallbackUrl = `https://placehold.co/1024x1536/FF0000/FFFFFF?text=ERROR%20Page%20${padded}%0A${encodeURIComponent(errorMessage.slice(0, 20))}`;
            
            console.log(`Using error fallback: ${fallbackUrl}`);
            return { imageUrl: fallbackUrl, seed };
        }
    }

    private buildPrompt(request: RenderRequest): string {
        const { outline, episodeTitle, visualStyle } = request;
        
        // Build dialogue context for visual storytelling
        const dialogueContext = outline.dialogues?.length > 0 
            ? outline.dialogues.map(d => {
                const speaker = d.character ? `${d.character}: ` : '';
                return `Panel ${d.panel_number} - ${d.type}: ${speaker}"${d.text}"`;
            }).join('\n')
            : '';
        
        // Build a detailed image generation prompt
        const prompt = [
            // Main instruction
            `Generate a manga page image for "${episodeTitle}".`,
            '',
            // Story context
            `Page ${request.pageNumber} story beat: ${outline.beat}`,
            `Setting: ${outline.setting}`,
            `Key visual actions: ${outline.key_actions.join(', ')}`,
            '',
            // Dialogue context for visual storytelling
            dialogueContext && 'Dialogue and text context (for visual storytelling - DO NOT include text in image):',
            dialogueContext,
            dialogueContext && '',
            // Layout specifications
            `Panel layout: ${outline.layout_hints.panels} panels arranged with ${outline.layout_hints.notes}`,
            '',
            // Visual style (from planner)
            `Art style: ${outline.visual_style || visualStyle}`,
            '',
            // Character information
            outline.new_characters.length > 0 && `New characters to introduce: ${outline.new_characters.map(c => `${c.name} - ${c.traits}`).join(', ')}`,
            '',
            // Character consistency with explicit references
            request.characterAssets?.length
              ? 'Character consistency: Use the attached reference images to keep faces/outfits consistent across pages.'
              : undefined,
            outline.prompt ? `Page prompt (with character tags): ${outline.prompt}` : undefined,
            '',
            // If user requested edits
            request.editPrompt ? `Edit request: ${request.editPrompt}` : undefined,
            request.baseImageUrl ? 'Modify the provided base image without redrawing characters from scratch.' : undefined,
            'Preserve character identity, outfits, and overall style. Maintain panel layout unless edits request otherwise.',
            '',
            request.styleRefUrls?.length ? 'Match the overall style of the attached style reference images.' : undefined,
            '',
            // Technical requirements for manga
            'Technical requirements:',
            '- Black and white manga artwork with consistent 2:3 aspect ratio (1024x1536 pixels)',
            '- Clean panel borders with proper gutters between panels',
            '- Dynamic camera angles and compositions that match the dialogue context',
            '- Expressive character poses and facial expressions that convey the emotions in dialogue',
            '- Appropriate use of screentones for shading and effects',
            '- Speed lines and motion effects where appropriate for action',
            '- Professional manga page layout with clear visual flow',
            '- High contrast and clear line art',
            '- Visual storytelling that matches dialogue context without including actual text',
            '- Speech bubble spaces where dialogue would appear (empty white bubbles)',
            '',
            // Output specifications
            'Output: A complete manga page as a single image, exactly 1024x1536 pixels (2:3 ratio), black and white.',
        ].filter(Boolean).join('\n');
        
        return prompt;
    }

    async generateCharacter(request: { episodeTitle: string; name: string; description: string; assetFilename: string; visualStyle: string }): Promise<{ imageUrl: string }> {
        if (!this.apiKey) {
            throw new Error('Renderer unavailable: GEMINI_API_KEY not set');
        }

        const prompt = [
            `Create a clean character reference image for a manga.`,
            `Character: ${request.name}`,
            `Design notes: ${request.description}`,
            `Art style: ${request.visualStyle}`,
            'Black-and-white manga line art with screentones, full-body or 3/4 view, neutral pose, no text.',
            'Transparent or white background. High-contrast, crisp lines. Centered composition.',
        ].join('\n');

        const model = this.client.getGenerativeModel({ model: this.config.imageModel });
        try {
            const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
            const candidate = result.response.candidates?.[0];
            let imageBuffer: Buffer | null = null;
            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if ((part as any).inlineData?.mimeType?.startsWith('image/')) {
                        imageBuffer = Buffer.from((part as any).inlineData.data, 'base64');
                        break;
                    }
                }
            }
            if (!imageBuffer) {
                // fallback placeholder
                const url = `https://placehold.co/768x1024/222/EEE?text=${encodeURIComponent(request.name)}`;
                return { imageUrl: url };
            }

            const filename = `episodes/${request.episodeTitle.replace(/[^a-zA-Z0-9]/g, '_')}/characters/${request.assetFilename}`;
            let imageUrl: string;
            if (this.storage.enabled) {
                imageUrl = await this.storage.uploadImage(imageBuffer, filename, 'image/png');
            } else {
                imageUrl = `https://placehold.co/768x1024/444/EEE?text=${encodeURIComponent(request.name)}`;
            }
            return { imageUrl };
        } catch (e) {
            const url = `https://placehold.co/768x1024/333/EEE?text=${encodeURIComponent(request.name)}`;
            return { imageUrl: url };
        }
    }
}
