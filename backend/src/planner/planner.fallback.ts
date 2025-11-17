import { EpisodeSeed, PlannerOutput, PlannerCharacter, PlannerOutlinePage } from '../episodes/types';

/**
 * Generate a basic stub outline as a last-resort fallback
 * This ensures the system can always produce a valid output even if AI fails
 */
export function generateStubOutline(seed: EpisodeSeed): PlannerOutput {
  console.warn('Generating stub outline as fallback - AI generation failed');

  // Create character entries from seed cast
  const characters: PlannerCharacter[] = seed.cast.map((castMember, index) => ({
    name: castMember.name,
    description: [
      castMember.traits || 'mysterious character',
      castMember.silhouette || 'average build',
      castMember.outfit || 'casual clothing',
      castMember.notable_prop || '',
    ]
      .filter(Boolean)
      .join(', '),
    asset_filename: sanitizeFilename(castMember.name, index),
  }));

  // Generate 10 basic pages
  const pages: PlannerOutlinePage[] = Array.from({ length: 10 }, (_, index) => {
    const pageNumber = index + 1;
    const isFirstPage = pageNumber === 1;
    const isLastPage = pageNumber === 10;

    let beat: string;
    if (isFirstPage) {
      beat = `Introduction: ${seed.title} begins`;
    } else if (isLastPage) {
      beat = 'Conclusion: The story reaches its climax';
    } else if (pageNumber <= 3) {
      beat = 'Setup: Establishing the world and conflict';
    } else if (pageNumber <= 7) {
      beat = 'Development: The story unfolds and tension builds';
    } else {
      beat = 'Rising action: Moving toward the climax';
    }

    // Create basic dialogues
    const panelCount = 4; // Default to 4 panels
    const dialogues = Array.from({ length: panelCount }, (_, panelIndex) => {
      const panelNumber = panelIndex + 1;
      const character = characters[panelIndex % characters.length];

      if (panelNumber === 1 && isFirstPage) {
        return {
          panel_number: panelNumber,
          character: undefined,
          text: `${seed.title} - A ${seed.genre_tags.join(', ')} story`,
          type: 'narration' as const,
        };
      }

      if (panelNumber % 2 === 0) {
        return {
          panel_number: panelNumber,
          character: undefined,
          text: `The scene unfolds in ${seed.setting}`,
          type: 'narration' as const,
        };
      }

      return {
        panel_number: panelNumber,
        character: character.name,
        text: isFirstPage && panelNumber === 2
          ? 'This is just the beginning...'
          : `Dialogue for page ${pageNumber}`,
        type: 'dialogue' as const,
      };
    });

    // Build character reference tags for prompt
    const characterTags = characters.map(c => `<${c.asset_filename}>`).join(', ');

    return {
      page_number: pageNumber,
      beat,
      setting: seed.setting,
      key_actions: [
        'Characters appear on screen',
        'Scene establishes atmosphere',
        'Story progresses naturally',
      ],
      layout_hints: {
        panels: panelCount,
        notes: `${seed.tone} tone with ${seed.visual_vibe || 'standard'} visual style`,
      },
      visual_style: isFirstPage
        ? `${seed.visual_vibe || 'Classic manga style'} with ${seed.tone} atmosphere`
        : undefined,
      introduce_new_character: false,
      new_characters: [],
      dialogues,
      prompt: `${characterTags} in ${seed.setting}. ${seed.tone} mood. ${seed.visual_vibe || 'Standard manga style'}. ${seed.description || 'Characters interact in the scene'}.`,
    };
  });

  return {
    pages,
    characters,
  };
}

/**
 * Sanitize character name into a valid asset filename
 */
function sanitizeFilename(name: string, fallbackIndex: number): string {
  // Convert to lowercase
  let filename = name.toLowerCase();

  // Replace spaces and special chars with underscores
  filename = filename.replace(/[^a-z0-9]+/g, '_');

  // Remove leading/trailing underscores
  filename = filename.replace(/^_+|_+$/g, '');

  // If empty after sanitization, use fallback
  if (!filename) {
    filename = `character_${fallbackIndex + 1}`;
  }

  // Add .png extension
  return `${filename}.png`;
}

/**
 * Attempt to merge partial AI output with stub outline
 * This is useful when AI returns incomplete but partially valid data
 */
export function mergeWithStub(partial: Partial<PlannerOutput>, seed: EpisodeSeed): PlannerOutput {
  console.log('Merging partial AI output with stub outline');

  const stub = generateStubOutline(seed);

  // Use AI characters if available and valid, otherwise use stub
  const characters = Array.isArray(partial.characters) && partial.characters.length > 0
    ? partial.characters
    : stub.characters;

  // Merge pages
  let pages: PlannerOutlinePage[];

  if (Array.isArray(partial.pages) && partial.pages.length > 0) {
    const aiPages = partial.pages;
    const stubPages = stub.pages;

    // Fill in missing pages with stub pages
    pages = Array.from({ length: 10 }, (_, index) => {
      const pageNumber = index + 1;
      const aiPage = aiPages.find(p => p.page_number === pageNumber);

      if (aiPage) {
        // Validate that AI page has minimum required fields
        const hasRequiredFields =
          aiPage.beat &&
          aiPage.setting &&
          Array.isArray(aiPage.key_actions) &&
          aiPage.layout_hints &&
          Array.isArray(aiPage.dialogues);

        if (hasRequiredFields) {
          return aiPage;
        }
      }

      // Use stub page if AI page is missing or invalid
      return stubPages[index];
    });
  } else {
    pages = stub.pages;
  }

  return {
    pages,
    characters,
  };
}
