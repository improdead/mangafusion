import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

interface TTSRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
}

export class TTSService {
  private readonly apiKey = process.env.ELEVENLABS_API_KEY;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';
  private readonly defaultVoiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice
  private readonly defaultModel = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5'; // Flash v2.5 model

  constructor(private readonly storage: StorageService) {}

  async generateSpeech(request: TTSRequest): Promise<{ audioUrl: string }> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = request.voice_id || this.defaultVoiceId;
    const modelId = request.model_id || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: modelId,
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.6,
            style: 0.2, // Flash v2.5 supports style parameter
            use_speaker_boost: true, // Flash v2.5 feature for better quality
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(audioBuffer);

      // Generate unique filename
      const filename = `tts/${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;
      
      // Upload to storage
      const audioUrl = await this.storage.uploadAudio(buffer, filename, 'audio/mpeg');

      return { audioUrl };
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  async generatePageAudio(dialogues: any[], voiceId?: string): Promise<{ audioUrl: string }> {
    if (!dialogues || dialogues.length === 0) {
      throw new Error('No dialogues provided');
    }

    // Process dialogues with better formatting for manga reading
    const processedDialogues = dialogues
      .filter(d => d.text && d.text.trim()) // Filter out empty dialogues
      .map((d, index) => {
        let text = d.text.trim();
        
        // Handle different dialogue types
        if (d.type === 'narration') {
          // Add narrative tone
          text = `${text}`;
        } else if (d.type === 'dialogue' && d.character) {
          // Add character name for dialogue
          text = `${d.character} says: ${text}`;
        } else if (d.type === 'thought' && d.character) {
          // Handle internal thoughts
          text = `${d.character} thinks: ${text}`;
        } else if (d.type === 'sound_effect') {
          // Handle sound effects
          text = `Sound effect: ${text}`;
        }

        // Add appropriate pauses based on content
        if (index < dialogues.length - 1) {
          if (d.type === 'narration') {
            text += '...'; // Longer pause after narration
          } else {
            text += '.'; // Shorter pause after dialogue
          }
        }

        return text;
      });

    // Combine with natural flow
    const combinedText = processedDialogues.join(' ');

    // Use Flash v2.5 model for faster, more natural speech
    return this.generateSpeech({ 
      text: combinedText,
      model_id: this.defaultModel,
      voice_id: voiceId 
    });
  }

  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }

  async getModels(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  async getUsage(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch usage: ${response.status}`);
      }

      const data = await response.json();
      return {
        characterCount: data.subscription?.character_count || 0,
        characterLimit: data.subscription?.character_limit || 0,
        canUseInstantVoiceCloning: data.subscription?.can_use_instant_voice_cloning || false,
        availableModels: data.subscription?.available_models || [],
      };
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      throw new Error(`Failed to fetch usage: ${error.message}`);
    }
  }
}
