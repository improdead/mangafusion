export function getRendererConfig() {
  return {
    // Gemini Image model (aka "Nano Banana")
    imageModel: process.env.RENDERER_IMAGE_MODEL || 'gemini-2.5-flash-image-preview',
  } as const;
}

