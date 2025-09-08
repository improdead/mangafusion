export type CastMember = {
  name: string;
  traits?: string;
  silhouette?: string;
  outfit?: string;
  notable_prop?: string;
};

export type PanelDialogue = {
  panel_number: number;
  character?: string; // who is speaking, or null for narration
  text: string;
  type: 'dialogue' | 'thought' | 'narration' | 'sound_effect';
};

export type PlannerOutlinePage = {
  page_number: number;
  beat: string;
  setting: string;
  key_actions: string[];
  layout_hints: { panels: number; notes: string };
  visual_style?: string;
  introduce_new_character: boolean;
  new_characters: CastMember[];
  /**
   * Dialogue and text for each panel on this page
   */
  dialogues: PanelDialogue[];
  /**
   * Optional natural language prompt that explicitly references character assets
   * using <asset_filename> tags, e.g. "<spiderman.png> leaps across rooftops...".
   */
  prompt?: string;
};

export type PlannerCharacter = {
  name: string;
  description: string; // visual design notes for image generation
  asset_filename: string; // e.g. "spiderman.png"
};

export type PlannerOutput = {
  pages: PlannerOutlinePage[];
  /** Optional planner-produced character bible */
  characters?: PlannerCharacter[];
};

export type EpisodeSeed = {
  title: string;
  genre_tags: string[];
  tone: string;
  setting: string;
  visual_vibe?: string;
  description?: string; // optional user-provided synopsis/description
  cast: CastMember[];
};

export type Page = {
  id: string;
  episodeId: string;
  pageNumber: number;
  status: 'queued' | 'in_progress' | 'done' | 'failed';
  imageUrl?: string;
  seed?: number;
  version?: number;
  error?: string;
  /** Serializable overlay/layer data for editor */
  overlays?: any;
};

export type Episode = {
  id: string;
  seedInput: EpisodeSeed;
  outline?: PlannerOutput;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
  rendererModel?: string;
  characters?: Character[];
};

export type Character = {
  id: string;
  episodeId: string;
  name: string;
  description?: string;
  assetFilename: string; // sanitized filename used in prompts
  imageUrl?: string; // generated image URL in storage
};
