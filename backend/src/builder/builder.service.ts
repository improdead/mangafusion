import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class BuilderService {
  private readonly logger = new Logger(BuilderService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly serpApiKey = process.env.SERPAPI_API_KEY;
  private readonly genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
    }
  }

  async refinePrompt(userPrompt: string): Promise<any> {
    this.logger.log(`Refining prompt: ${userPrompt}`);

    // 1. Search Web (if key available)
    let searchContext = '';
    if (this.serpApiKey) {
      try {
        this.logger.log('Searching web for context...');
        const searchResults = await this.searchWeb(userPrompt);
        searchContext = `Web Search Context (use this to inform the manga configuration):\n${searchResults}\n\n`;
      } catch (e) {
        this.logger.warn('SerpApi failed or not configured properly', e);
      }
    } else {
        this.logger.log('No SERPAPI_API_KEY, skipping web search.');
    }

    // 2. Refine with LLM
    if (!this.genAI) {
       this.logger.warn('No GEMINI_API_KEY, using mock refinement.');
       return this.mockRefinement(userPrompt);
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const systemPrompt = `
      You are an expert manga editor and producer. Your goal is to take a user's vague idea and turn it into a detailed "Episode Seed" configuration for an AI manga generator.
      
      The user wants: "${userPrompt}"
      
      ${searchContext}
      
      Based on the user's request and the web research (if any), create a JSON object with the following structure (do not add markdown fences, just JSON):
      {
        "title": "Catchy Title",
        "description": "Detailed synopsis...",
        "genre_tags": ["genre1", "genre2"],
        "tone": "adjectives describing tone (e.g. Dark, Whimsical)",
        "setting": "Time and place",
        "visual_vibe": "Art style description (e.g. 90s Cyberpunk, Watercolor, High Contrast Black & White)",
        "cast": [
           { "name": "Name", "role": "Protagonist", "description": "Visual description: hair, eyes, clothing" }
        ]
      }
      
      Return ONLY valid JSON.
    `;

    try {
        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();
        
        // Basic JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let jsonStr = jsonMatch ? jsonMatch[0] : text;
        
        return JSON.parse(jsonStr);
    } catch (e) {
        this.logger.error('Failed to generate/parse content', e);
        return this.mockRefinement(userPrompt);
    }
  }

  private searchWeb(query: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const SerpApi = require('google-search-results-nodejs');
            const search = new SerpApi.GoogleSearch(this.serpApiKey);
            
            search.json({
                q: query + " manga tropes plot ideas",
                num: 5
            }, (data: any) => {
                if (data.error) return reject(data.error);
                const snippets = data.organic_results?.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n');
                resolve(snippets || '');
            });
        } catch (e) {
            reject(e);
        }
    });
  }

  private mockRefinement(prompt: string) {
      return {
          title: "Project " + prompt.substring(0, 10),
          description: `A manga about ${prompt}. (Mock generated because API keys are missing)`,
          genre_tags: ["Shonen", "Action"],
          tone: "Exciting",
          setting: "Modern Day",
          visual_vibe: "Standard Anime Style",
          cast: [
              { name: "Hero", role: "Protagonist", description: "Spiky hair, determined look" }
          ]
      };
  }
}

