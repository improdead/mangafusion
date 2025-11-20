import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to generate consistent random manga images using Pollinations AI
export const getMangaCover = (id: string | number, width = 300, height = 450) => {
  const strId = String(id);
  
  // Special handling for feature visualizations to look more "tech product"
  if (strId.includes('viz') || strId.includes('ui') || strId.includes('analysis')) {
      // Switch to a cleaner, white, minimalist aesthetic
      const techPrompt = `minimalist 3d render of white paper sheets floating clean soft lighting abstract geometric composition high key photography product design ${strId}`;
      const encodedTechPrompt = encodeURIComponent(techPrompt);
      return `https://image.pollinations.ai/prompt/${encodedTechPrompt}?width=${width}&height=${height}&nologo=true&seed=${strId}&model=flux`;
  }

  // Default manga cover generation
  let keyword = strId;
  const genres = [
    "cyberpunk city action manga", 
    "fantasy magic academy manga", 
    "dark horror junji ito style", 
    "mecha robot space manga", 
    "high school romance shoujo", 
    "samurai historical manga", 
    "sports basketball manga",
    "post-apocalyptic adventure",
    "cooking gourmet manga",
    "mystery detective anime"
  ];
  
  if (!isNaN(Number(strId)) || strId.startsWith('top-mini')) {
    let hash = 0;
    for (let i = 0; i < strId.length; i++) {
      hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % genres.length;
    keyword = genres[index];
  }
  
  const prompt = `anime manga volume cover art ${keyword} high quality masterpiece detailed`;
  const encodedPrompt = encodeURIComponent(prompt);
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${strId}&model=flux`;
};

export const getMangaPage = (id: string, width = 300, height = 450) => {
   const descriptors: Record<string, string> = {
    'cyberpunk': 'cyberpunk city street manga panel explosion',
    'romance': 'shoujo manga couple moment sparkles emotional close up',
    'fantasy': 'fantasy manga magic spell casting battle scene',
    'horror': 'horror manga scary face monster screentones',
    'sports': 'sports manga intense moment action lines',
    'mecha': 'mecha robot battle damage cockpit view',
    'adventure': 'adventure manga landscape journey party',
    'sliceoflife': 'slice of life manga school classroom talking',
    'mystery': 'mystery manga detective finding clue shocked',
    'magicalgirl': 'magical girl transformation sequence sparkle',
    'samurai': 'samurai manga katana sword fight ink strokes dynamic',
    'cooking': 'cooking manga delicious food steam reaction gourmet close up',
    'music': 'music manga playing guitar band concert crowd energy',
    'psychological': 'psychological manga intense stare distorted background fear',
    'isekai': 'isekai manga new world fantasy landscape wide shot detailed',
    'thriller': 'thriller manga suspense shadow stalker rain',
    
    // Added specific UI visualizations
    'semantic-search-viz': 'clean minimalistic ui concept white cards floating simple lines vector art',
    'infinite-reader-ui': 'long vertical strip of manga panels scrolling infinite white background clean'
  };

  const specificPrompt = descriptors[id] || id;

  const prompt = `manga page black and white comic book style japanese manga panel screentones ink drawing ${specificPrompt} high quality masterpiece`;
  const encodedPrompt = encodeURIComponent(prompt);
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${id}&model=flux`;
};