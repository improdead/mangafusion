import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { EpisodeSeed, PlannerOutput } from '../episodes/types';

export class PlannerService {
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly openaiApiKey = process.env.OPENAI_API_KEY;
  private readonly provider = process.env.PLANNER_PROVIDER || 'openai';
  private readonly geminiModel = process.env.PLANNER_MODEL || 'gemini-2.5-flash';
  private readonly openaiModel = process.env.OPENAI_PLANNER_MODEL || 'gpt-4o';

  private get geminiClient() {
    if (!this.geminiApiKey) throw new Error('GEMINI_API_KEY not set');
    return new GoogleGenerativeAI(this.geminiApiKey);
  }

  private get openaiClient() {
    if (!this.openaiApiKey) throw new Error('OPENAI_API_KEY not set');
    return new OpenAI({ apiKey: this.openaiApiKey });
  }

  async generateOutline(seed: EpisodeSeed): Promise<PlannerOutput> {
    if (this.provider === 'openai') {
      return this.generateOutlineOpenAI(seed);
    } else {
      return this.generateOutlineGemini(seed);
    }
  }

  private async generateOutlineOpenAI(seed: EpisodeSeed): Promise<PlannerOutput> {
    if (!this.openaiApiKey) throw new Error('Planner unavailable: OPENAI_API_KEY not set');

    const system = [
      'You are a manga production planner. Return STRICT JSON that adheres to the provided schema.',
      'Keep all values concise but specific and visual.',
      'Also prepare a concise character bible with stable asset filenames to be used as image references like <aoi.png>.',
      'Provide structured dialogue suggestions per panel for each page. These dialogues are for overlays (not baked into the image).',
      'When writing page prompts, explicitly reference characters using <asset_filename> tags and include staging.',
    ].join('\n');

    const schema = `{
  "characters": [
    {
      "name": "Aoi",
      "description": "concise visual design: hair/eyes/outfit/silhouette/props/pose",
      "asset_filename": "aoi.png"
    }
  ],
  "pages": [
    {
      "page_number": 1,
      "beat": "One-sentence story beat for this page",
      "setting": "Where/when",
      "key_actions": ["visually observable actions only"],
      "layout_hints": { "panels": 3-6, "notes": "angles, energy, pacing" },
      "visual_style": "global style description for the whole episode",
      "introduce_new_character": false,
      "new_characters": [],
      "dialogues": [
        {
          "panel_number": 1,
          "character": "Aoi",
          "text": "What was that sound?",
          "type": "dialogue"
        },
        {
          "panel_number": 2,
          "character": null,
          "text": "The wind howled through the empty streets",
          "type": "narration"
        }
      ],
      "prompt": "<aoi.png> stands on the rooftop at dusk..."
    }
    // up to page 10
  ]
}`;

    const user = [
      'Make a 10-page outline for a manga episode based on this seed:',
      `- title: ${seed.title}`,
      `- description: ${seed.description ?? ''}`,
      `- genre_tags: ${JSON.stringify(seed.genre_tags)}`,
      `- tone: ${seed.tone}`,
      `- setting: ${seed.setting}`,
      `- visual_vibe: ${seed.visual_vibe ?? ''}`,
      `- cast: ${JSON.stringify(seed.cast)}`,
      '',
      'Schema:',
      schema,
      '',
      'Constraints:',
      '- Page 1 establishes the style, cast silhouettes/outfits, time-of-day, and overall look.',
      '- Pages 2–10 must escalate or vary setting per beat, while staying within the same art style.',
      '- characters: include ALL main cast (from seed) + any new characters introduced by outline.',
      '- asset_filename: kebab-case or snake_case, ASCII only, .png extension, unique per character.',
      '- In each page.prompt reference characters via <asset_filename> tags used in characters[].',
      '- dialogues: Write compelling dialogue, thoughts, narration, and sound effects for each panel.',
      '- Include 3-6 dialogue entries per page matching the panel count in layout_hints.',
      '- Dialogue should advance the story, reveal character, and create engaging manga reading experience.',
      '- Output must be valid JSON and fit the schema exactly.',
      '',
      'Return ONLY the JSON. No prose, no markdown fences.'
    ].join('\n');

    try {
      console.log(`Calling OpenAI ${this.openaiModel} for manga planning...`);
      const response = await this.openaiClient.chat.completions.create({
        model: this.openaiModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('No response from OpenAI');

      const json = this.extractJson(text);
      // Basic validation
      if (!json || !json.pages || !Array.isArray(json.pages) || json.pages.length !== 10) {
        throw new Error('Planner returned invalid JSON shape');
      }
      return json as PlannerOutput;
    } catch (error) {
      console.error('OpenAI planner error:', error);
      throw error;
    }
  }

  private async generateOutlineGemini(seed: EpisodeSeed): Promise<PlannerOutput> {
    if (!this.geminiApiKey) throw new Error('Planner unavailable: GEMINI_API_KEY not set');

    const system = [
      'You are a manga production planner. Return STRICT JSON that adheres to the provided schema.',
      'Keep all values concise but specific and visual.',
      'Also prepare a concise character bible with stable asset filenames to be used as image references like <aoi.png>.',
      'Provide structured dialogue suggestions per panel for each page. These dialogues are for overlays (not baked into the image).',
      'When writing page prompts, explicitly reference characters using <asset_filename> tags and include staging.',
    ].join('\n');

    const schema = `{
  "characters": [
    {
      "name": "Aoi",
      "description": "concise visual design: hair/eyes/outfit/silhouette/props/pose",
      "asset_filename": "aoi.png"
    }
  ],
  "pages": [
    {
      "page_number": 1,
      "beat": "One-sentence story beat for this page",
      "setting": "Where/when",
      "key_actions": ["visually observable actions only"],
      "layout_hints": { "panels": 3-6, "notes": "angles, energy, pacing" },
      "visual_style": "global style description for the whole episode",
      "introduce_new_character": false,
      "new_characters": [],
      "dialogues": [
        {
          "panel_number": 1,
          "character": "Aoi",
          "text": "What was that sound?",
          "type": "dialogue"
        },
        {
          "panel_number": 2,
          "character": null,
          "text": "The wind howled through the empty streets",
          "type": "narration"
        }
      ],
      "prompt": "<aoi.png> stands on the rooftop at dusk..."
    }
    // up to page 10
  ]
}`;

    const user = [
      'Make a 10-page outline for a manga episode based on this seed:',
      `- title: ${seed.title}`,
      `- description: ${seed.description ?? ''}`,
      `- genre_tags: ${JSON.stringify(seed.genre_tags)}`,
      `- tone: ${seed.tone}`,
      `- setting: ${seed.setting}`,
      `- visual_vibe: ${seed.visual_vibe ?? ''}`,
      `- cast: ${JSON.stringify(seed.cast)}`,
      '',
      'Schema:',
      schema,
      '',
      'Constraints:',
      '- Page 1 establishes the style, cast silhouettes/outfits, time-of-day, and overall look.',
      '- Pages 2–10 must escalate or vary setting per beat, while staying within the same art style.',
      '- characters: include ALL main cast (from seed) + any new characters introduced by outline.',
      '- asset_filename: kebab-case or snake_case, ASCII only, .png extension, unique per character.',
      '- In each page.prompt reference characters via <asset_filename> tags used in characters[].',
      '- dialogues: Write compelling dialogue, thoughts, narration, and sound effects for each panel.',
      '- Include 3-6 dialogue entries per page matching the panel count in layout_hints.',
      '- Dialogue should advance the story, reveal character, and create engaging manga reading experience.',
      '- Output must be valid JSON and fit the schema exactly.',
      '',
      'Return ONLY the JSON. No prose, no markdown fences.'
    ].join('\n');

    const model = this.geminiClient.getGenerativeModel({ model: this.geminiModel, systemInstruction: system });
    const resp = await model.generateContent(user);
    const text = resp.response.text();

    const json = this.extractJson(text);
    // Basic validation
    if (!json || !json.pages || !Array.isArray(json.pages) || json.pages.length !== 10) {
      throw new Error('Planner returned invalid JSON shape');
    }
    return json as PlannerOutput;
  }

  private extractJson(text: string): any {
    // Try direct parse
    try {
      return JSON.parse(text);
    } catch {}
    // Try to find first { ... } block
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {}
    }
    // Try code fence pattern
    const fence = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
    if (fence) {
      const inner = fence[0].replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(inner);
      } catch {}
    }
    throw new Error('Failed to parse planner JSON');
  }
}
