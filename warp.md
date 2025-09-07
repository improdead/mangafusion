
# Warp: Streaming Manga Reader & Generation Spec

> **Scope (v0.5)** — Adds a **Planner step** (Gemini 2.5 Flash — model: gemini-2.5-flash) that outlines what happens on **each of 10 pages**, then streams image generation page‑by‑page. Page 1 gets a **very detailed** art prompt; Pages 2–10 use **the same style as Page 1** and **follow from the previous page** (visual continuity via reference image). **NEW**: AI Audiobook feature with ElevenLabs Flash v2.5 TTS brings manga to life with natural voice narration. Dialogue/SFX are generated for TTS but **not embedded** in image prompts by default.

---

## 1) User Flow

1. **Create Episode** → user picks style (e.g., Manga B/W), enters story seed: title, genre/tone, setting, cast (names + traits), and optional vibes (e.g., “modern shōnen like Demon Slayer / JJK / OPM”).
2. **Planner (Gemini 2.5 Flash)** generates a 10‑page outline + per‑page art directives (no dialogue).  
3. **Generate Page 1** immediately from the **detailed Page 1 prompt**.  
4. **Stream the Reader** → as each page finishes, it appears; **AI Audiobook** mode uses ElevenLabs Flash v2.5 TTS for immersive narration.  
5. **Generate Pages 2–10** sequentially, each including: “**use same style as Page 1**” and “**this page must follow visually from the previous page**”; optionally **introduce a new character** if the outline says so.  
6. **Edit any page** by adding that page as **reference** + changing the prompt; downstream pages can be re‑flowed.
7. **NEW**: **Reader Mode** with full-screen viewing, voice selection, keyboard navigation (← → Space Esc), and natural voice narration combining character dialogue, narration, and sound effects.

---

## 2) High‑Level Architecture (unchanged from v0.1)

```
Frontend (Next.js, Tailwind, React-Konva)
   │
   ├── REST: /episodes/:id/generate10  (enqueue jobs)
   ├── SSE : /episodes/:id/stream      (page events → client)
   ├── REST: /pages/:id                (page metadata)
   ├── REST: /pages/:id/read           (ElevenLabs Flash v2.5 TTS integration)
   │
Backend API (NestJS + BullMQ (scaffolded) + Prisma (optional) + S3)
   │
   ├── Queue: generate_page  ──▶ GPU Worker (ComfyUI + Nano Banana + IP‑Adapter)
   │                                 └─ uploads page.png → S3
   ├── Queue: extract_text   ──▶ Vision Worker (Gemini / OCR stack)
   └── Queue: synthesize_audio ─▶ TTS (ElevenLabs Flash v2.5)
   │
   └── Event bus → SSE: page_progress, page_done, page_failed
```

**Storage**: Postgres, Redis, S3/R2. **Observability**: Sentry + OTEL.

---

## 3) Data Model & APIs (extended from v0.1)

- Storage now supports Prisma/Postgres (optional). If DATABASE_URL is not set, an in-memory store is used.
- New endpoint:
  - GET /episodes/:id — returns episode metadata including pages and rendererModel.

(Other tables and routes as in v0.1; only the **prompts** change.)

---

## 4) Streaming Reader (same as v0.1)

(Reader subscribes to SSE and reveals pages as they finish. Read uses Vision→TTS.)

---

## 5) Generation Worker Expectations (same as v0.1)

- Image model: models/gemini-2.5-flash-image-preview (Nano Banana worker)
- Queue: generate_page (BullMQ) — worker stub exists and uses the image model; UI flow still uses the built-in simulator until the GPU worker is wired.
- If `continuity.use_reference == true`, apply IP‑Adapter and/or img2img with `denoise ≈ 0.33–0.42` and strength `≈ 0.32–0.38`.
- Save and reuse **seed** to support edits.
- Upload final PNG to S3 and emit `page_done`.

---

## Appendix A — **Planner + Prompt Templates (User‑Driven Story)**

This replaces the old “Minimal Page 1” appendix. The **Planner** creates a 10‑page outline first; then the **Renderer** prompts Nano Banana with Page 1 (detailed), followed by Pages 2–10 (continuations).

### A1) Inputs collected from the user
- `title`: e.g., “Shadow Sketch”  
- `genre_tags`: e.g., `["modern shonen", "urban fantasy"]`  
- `tone`: e.g., “dynamic, heroic, hopeful”  
- `setting`: e.g., “rain‑slick neon city at dusk”  
- `visual_vibe`: optional references (e.g., “shōnen energy akin to Demon Slayer / JJK / OPM — not copying, just vibe”)  
- `cast`: array of `{ name, traits, silhouette, outfit, notable_prop }`  
- `page_count`: fixed to 10 for v0.2

### A2) **Planner (Gemini 2.5 Flash — model: gemini-2.5-flash) Prompt**

Ask Gemini to return **strict JSON** (no prose), describing what happens on each page and what to draw — **no dialogue**. Example prompt:

```
SYSTEM:
You are a manga production planner. Return STRICT JSON that adheres to the provided schema.
Do not include dialogue or SFX. Keep all values concise but specific and visual.

USER:
Make a 10-page outline for a manga episode based on this seed:
- title: {{title}}
- genre_tags: {{genre_tags}}
- tone: {{tone}}
- setting: {{setting}}
- visual_vibe: {{visual_vibe}}
- cast: {{cast JSON}}

Schema:
{
  "pages": [
    {
      "page_number": 1,
      "beat": "One-sentence story beat for this page",
      "setting": "Where/when",
      "key_actions": ["visually observable actions only"],
      "layout_hints": { "panels": 3-6, "notes": "angles, energy, pacing" },
      "visual_style": "global style description for the whole episode",
      "introduce_new_character": false,
      "new_characters": []
    },
    {
      "page_number": 2,
      "beat": "...",
      "setting": "...",
      "key_actions": ["..."],
      "layout_hints": { "panels": 4, "notes": "..." },
      "introduce_new_character": true,
      "new_characters": [{ "name": "...", "traits": "...", "silhouette": "...", "outfit": "...", "prop": "..." }]
    }
    // ... up to page 10
  ]
}
Constraints:
- Page 1 establishes the style, cast silhouettes/outfits, time-of-day, and overall look.
- Pages 2–10 must escalate or vary setting per beat, while staying within the same art style.
- Output must be valid JSON and fit the schema exactly.
```

**Planner Output** (example shape):
```json
{
  "pages": [
    {
      "page_number": 1,
      "beat": "Protagonists discover an otherworldly ink orb in an after-school studio.",
      "setting": "indoor studio at dusk",
      "key_actions": ["glowing device", "ink orb forming", "team reacts"],
      "layout_hints": { "panels": 5, "notes": "wide establish, two close-ups, medium, dramatic close" },
      "visual_style": "high-contrast manga B/W; crisp screentones; dynamic speedlines; cinematic angles",
      "introduce_new_character": false,
      "new_characters": []
    }
    // ...
  ]
}
```

---

### A3) **Renderer Prompt — Page 1 (Very Detailed)**

Use this exact JSON to call Nano Banana (Comfy/worker). **No dialogue**, **no text**. The **Planner page 1** fields are inserted where noted.

```json
{
  "page_number": 1,
  "story_beat": "{{planner.pages[0].beat}}",
  "style_pack": "MANGA_BW",
  "visual_prompt": "{{planner.pages[0].visual_style}}; consistent modern shōnen energy; bold blacks; sharp screentones; clean panel borders; expressive posing; coherent lighting matching {{planner.pages[0].setting}}; avoid text or sound effects.",
  "negative_prompt": "color; low-res; warped anatomy; messy gutters; watermarks; illegible layout",
  "panel_layout": {
    "page_aspect": "A4-portrait",
    "gutters_mm": 4,
    "panels": [
      // Compose between 4 and 6 panels based on {{planner.pages[0].layout_hints}}.
      // Each panel object should specify shape, bbox_rel, camera, and a short 'action' based on {{planner.pages[0].key_actions}}.
    ]
  },
  "characters": {{cast JSON}},
  "continuity": { "use_reference": false },
  "generation": {
    "width": 1024, "height": 1536,
    "cfg_scale": 6.4, "steps": 26, "sampler": "DPM++ 2M Karras",
    "seed": {{random_int}}
  },
  "lettering": { "place_text_in_vector": false },
  "export": { "formats": ["png"], "dpi": 300, "with_bleed": false }
}
```

**Notes for Page 1**  
- This page **locks the style** for the whole episode. Save the seed.  
- Keep actions purely visual. No bubbles or text layers are required.

---

### A4) **Renderer Prompt — Page N (2–10) — Continuation Template**

Each subsequent page consumes: (1) the **Planner page N** node, and (2) the **previous page final image** as `reference_image_asset_id`. It **must** say “use the same style as page 1” and “follow the previous page”. If the planner page indicates a new character, add them minimally (silhouette/outfit/prop).

```json
{
  "page_number": {{N}},
  "story_beat": "{{planner.pages[N-1].beat}}",
  "style_pack": "MANGA_BW",
  "visual_prompt": "Use the exact same art style and rendering look as Page 1 ({{planner.pages[0].visual_style}}). Maintain character designs, outfits, lighting and time-of-day continuity unless the planner changes the setting. Draw only visuals—no text or SFX.",
  "negative_prompt": "color; low-res; off-model faces; messy gutters; watermarks",
  "panel_layout": {
    "page_aspect": "A4-portrait",
    "gutters_mm": 4,
    "panels": [
      // Build {{planner.pages[N-1].layout_hints.panels}} panels.
      // Translate {{planner.pages[N-1].key_actions}} into panel 'action' lines.
      // Keep camera language cinematic and consistent with Page 1.
    ]
  },
  "characters": [
    // Always include core cast.
    // If {{planner.pages[N-1].introduce_new_character}} is true, append {{planner.pages[N-1].new_characters}} with brief traits.
  ],
  "continuity": {
    "use_reference": true,
    "reference_image_asset_id": "asset://page_{{sprintf('%04d', N-1)}}/final",
    "strength": 0.34,
    "modules": ["ip_adapter_full", "controlnet_lineart"]
  },
  "generation": {
    "width": 1024, "height": 1536,
    "cfg_scale": 6.1, "steps": 24,
    "sampler": "DPM++ 2M Karras",
    "seed": {{random_int}},
    "denoise": 0.36  // only if your worker maps this to img2img
  },
  "lettering": { "place_text_in_vector": false },
  "export": { "formats": ["png"], "dpi": 300 }
}
```

**Rules for Pages 2–10**
- “**Follow previous page**”: poses, outfits, props, lighting, time‑of‑day must read as a continuation. Use IP‑Adapter/img2img with previous page image.  
- “**Same style as Page 1**”: reuse the Page 1 style phrase verbatim in `visual_prompt`.  
- “**Introduce character if necessary**”: only when the planner says so; define silhouette + outfit succinctly.  
- Keep prompts **text‑free** (no dialogue/SFX).

---

### A5) Orchestration (Planner → Renderer)

1. **POST /planner** → call Gemini 2.5 Flash with A2 prompt → store the returned `outline` JSON under the episode.  
2. **Enqueue Page 1** with A3 template filled from `outline.pages[0]`.  
3. As soon as Page 1 is **done**, **enqueue Page 2** with A4, injecting `reference_image_asset_id` = Page 1 final.  
4. Repeat until Page 10. Each page emits `page_done` to SSE so the Reader updates instantly.  
5. On **edit** of any page K, re‑enqueue K with same template + context; optionally re‑flow pages K+1..10.

---

## Appendix B — Event Types (unchanged)

```jsonc
// page_progress
{ "type":"page_progress", "episodeId":"...", "page":3, "pct":42 }

// page_done
{ "type":"page_done", "episodeId":"...", "page":3, "imageUrl":"https://cdn/.../page_0003.png", "seed":845223, "version":1 }

// page_failed
{ "type":"page_failed", "episodeId":"...", "page":3, "error":"Sampler timeout" }
```

---

## Appendix C — Implemented Features (v0.5)

- ✅ **AI Audiobook with ElevenLabs Flash v2.5**: Natural voice narration with character dialogue processing
- ✅ **Reader Mode**: Full-screen reading experience with keyboard navigation
- ✅ **Voice Selection**: Choose from available ElevenLabs voices with real-time usage tracking
- ✅ **Smart Dialogue Processing**: Combines character speech, narration, and sound effects with natural pauses
- ✅ **Consolidated Environment**: Single .env file for easier deployment and configuration

## Appendix D — Future Work

- Burst capacity via FAL.
- Panel‑level masked re‑gen with ControlNet Lineart.
- Continuous page‑audio stream (server‑side concatenation).
- Export to CBZ/EPUB3 with optional audio tracks.
- Multi-character voice assignment for dialogue.
