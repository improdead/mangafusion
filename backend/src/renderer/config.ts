export function getRendererConfig() {
  return {
    // Image generation provider: 'openai' or 'gemini'
    provider: process.env.RENDERER_PROVIDER || 'openai',
    // OpenAI image model
    openaiModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    // Gemini Image model (fallback)
    geminiModel: process.env.RENDERER_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
  } as const;
}

