import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class BuilderService {
  private readonly logger = new Logger(BuilderService.name);
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly serpApiKey = process.env.SERPAPI_API_KEY;
  private readonly openai: OpenAI | null = null;

  constructor() {
    if (this.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: this.openaiApiKey });
    }
  }

  async refinePrompt(userPrompt: string): Promise<any> {
    // 1. Search Web (if key available)
    let searchContext = '';
    if (this.serpApiKey) {
      try {
        const searchResults = await this.searchWeb(userPrompt);
        searchContext = `Web Search Context (use this to inform the manga configuration):\n${searchResults}\n\n`;
      } catch (e) {
        this.logger.warn('SerpApi failed', e);
      }
    }

    // 2. Refine with LLM
    if (!this.openai) {
       this.logger.warn('No OPENAI_API_KEY, using mock refinement.');
       return this.mockRefinement(userPrompt);
    }

    const systemPrompt = `You are an expert manga editor and producer. Your goal is to take a user's vague idea and turn it into a detailed "Episode Seed" configuration for an AI manga generator.

Based on the user's request and the web research (if any), create a JSON object with the following structure:
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

Return ONLY valid JSON, no markdown fences.`;

    const userMessage = `${searchContext}The user wants: "${userPrompt}"`;

    try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' },
        });

        const text = completion.choices[0]?.message?.content;
        if (!text) {
          throw new Error('No response from OpenAI');
        }

        return JSON.parse(text);
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

