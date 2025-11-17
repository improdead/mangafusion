import { z } from 'zod';

/**
 * Schema for CastMember
 */
export const CastMemberSchema = z.object({
  name: z.string().min(1, 'Character name is required'),
  traits: z.string().optional(),
  silhouette: z.string().optional(),
  outfit: z.string().optional(),
  notable_prop: z.string().optional(),
});

/**
 * Schema for PanelDialogue
 */
export const PanelDialogueSchema = z.object({
  panel_number: z.number().int().positive('Panel number must be a positive integer'),
  character: z.string().optional(),
  text: z.string().min(1, 'Dialogue text cannot be empty'),
  type: z.enum(['dialogue', 'thought', 'narration', 'sound_effect']),
});

/**
 * Schema for PlannerCharacter
 */
export const PlannerCharacterSchema = z.object({
  name: z.string().min(1, 'Character name is required'),
  description: z.string().min(1, 'Character description is required'),
  asset_filename: z
    .string()
    .min(1, 'Asset filename is required')
    .regex(/^[a-z0-9_-]+\.png$/, 'Asset filename must be kebab-case or snake_case with .png extension')
    .refine(
      (filename) => /^[\x00-\x7F]+$/.test(filename),
      'Asset filename must contain only ASCII characters'
    ),
});

/**
 * Schema for PlannerOutlinePage
 */
export const PlannerOutlinePageSchema = z.object({
  page_number: z.number().int().min(1).max(10, 'Page number must be between 1 and 10'),
  beat: z.string().min(1, 'Story beat is required'),
  setting: z.string().min(1, 'Setting is required'),
  key_actions: z.array(z.string()).min(1, 'At least one key action is required'),
  layout_hints: z.object({
    panels: z.number().int().min(3).max(6, 'Panel count must be between 3 and 6'),
    notes: z.string(),
  }),
  visual_style: z.string().optional(),
  introduce_new_character: z.boolean(),
  new_characters: z.array(CastMemberSchema),
  dialogues: z
    .array(PanelDialogueSchema)
    .min(1, 'At least one dialogue entry is required per page')
    .refine(
      (dialogues) => {
        const panelNumbers = dialogues.map(d => d.panel_number);
        return panelNumbers.every(num => num >= 1);
      },
      'All panel numbers must be positive integers'
    ),
  prompt: z.string().optional(),
});

/**
 * Schema for PlannerOutput
 */
export const PlannerOutputSchema = z.object({
  pages: z
    .array(PlannerOutlinePageSchema)
    .length(10, 'Exactly 10 pages are required')
    .refine(
      (pages) => {
        const pageNumbers = pages.map(p => p.page_number);
        const sortedPages = [...pageNumbers].sort((a, b) => a - b);
        return sortedPages.every((num, idx) => num === idx + 1);
      },
      'Pages must be numbered sequentially from 1 to 10'
    )
    .refine(
      (pages) => {
        // Ensure dialogue panel numbers don't exceed layout hints
        return pages.every(page => {
          const maxPanelInDialogues = Math.max(...page.dialogues.map(d => d.panel_number));
          return maxPanelInDialogues <= page.layout_hints.panels;
        });
      },
      'Dialogue panel numbers cannot exceed the panel count in layout_hints'
    ),
  characters: z.array(PlannerCharacterSchema).optional(),
});

/**
 * Schema for EpisodeSeed input validation
 */
export const EpisodeSeedSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  genre_tags: z
    .array(z.string())
    .min(1, 'At least one genre tag is required')
    .max(10, 'Maximum 10 genre tags allowed'),
  tone: z.string().min(1, 'Tone is required').max(100, 'Tone must be less than 100 characters'),
  setting: z.string().min(1, 'Setting is required').max(500, 'Setting must be less than 500 characters'),
  visual_vibe: z.string().max(500, 'Visual vibe must be less than 500 characters').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  cast: z
    .array(CastMemberSchema)
    .min(1, 'At least one cast member is required')
    .max(20, 'Maximum 20 cast members allowed')
    .refine(
      (cast) => {
        const names = cast.map(c => c.name.toLowerCase());
        return new Set(names).size === names.length;
      },
      'Cast member names must be unique'
    ),
});

/**
 * Type exports inferred from schemas
 */
export type ValidatedEpisodeSeed = z.infer<typeof EpisodeSeedSchema>;
export type ValidatedPlannerOutput = z.infer<typeof PlannerOutputSchema>;
export type ValidatedPlannerCharacter = z.infer<typeof PlannerCharacterSchema>;
export type ValidatedPlannerOutlinePage = z.infer<typeof PlannerOutlinePageSchema>;
