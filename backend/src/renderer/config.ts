export function getRendererConfig() {
  return {
    // Image generation provider: 'openai' or 'gemini'
    provider: process.env.RENDERER_PROVIDER || 'openai',
    // OpenAI DALL-E model
    openaiModel: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
    // Gemini Image model (fallback)
    geminiModel: process.env.RENDERER_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
  } as const;
}

