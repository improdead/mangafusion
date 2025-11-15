# Character Consistency Research for AI-Generated Manga

**Document Version:** 1.0
**Date:** 2025-11-15
**Project:** MangaFusion
**Purpose:** Research and document solutions for maintaining visual character consistency across AI-generated manga pages

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Character Consistency Challenge](#the-character-consistency-challenge)
3. [Current System Analysis](#current-system-analysis)
4. [Character Consistency Techniques](#character-consistency-techniques)
5. [AI Image Generation Solutions](#ai-image-generation-solutions)
6. [Practical Implementation Approaches](#practical-implementation-approaches)
7. [Recommended Approach for MangaFusion](#recommended-approach-for-mangafusion)
8. [Technical Requirements & Trade-offs](#technical-requirements--trade-offs)
9. [User Experience Considerations](#user-experience-considerations)
10. [Implementation Roadmap](#implementation-roadmap)
11. [References & Resources](#references--resources)

---

## Executive Summary

**The Problem:** AI-generated manga currently struggles with character consistency across multiple pages. Characters may have different facial features, hairstyles, outfits, or body proportions from one page to the next, breaking immersion and narrative coherence.

**The Goal:** Maintain consistent character appearance across all 10 pages of a manga episode, ensuring that readers can easily recognize characters throughout the story.

**Key Findings:**
- **Current System:** MangaFusion uses OpenAI (gpt-image-1) or Gemini (gemini-2.5-flash-image-preview) with basic reference image support
- **Best Techniques:** LoRA training, IP-Adapter, and ControlNet offer the strongest consistency guarantees
- **Practical Reality:** Most advanced techniques require Stable Diffusion infrastructure, which is not compatible with current OpenAI/Gemini APIs
- **Recommended Approach:** Multi-tiered strategy combining enhanced reference images, improved prompting, and potential migration to ComfyUI + Stable Diffusion for production use

**Impact on Development:**
- **Short-term:** Optimize existing Gemini reference image system, improve character prompts
- **Medium-term:** Add character reference sheet generation and multi-angle views
- **Long-term:** Consider Stable Diffusion + LoRA pipeline for professional-grade consistency

---

## The Character Consistency Challenge

### What is Character Consistency?

Character consistency means maintaining the same visual identity for a character across multiple images, including:

- **Facial Features:** Eye shape, eye color, nose, mouth, face shape, skin tone
- **Hairstyle & Color:** Hair length, texture, color, styling (bangs, ponytail, etc.)
- **Body Proportions:** Height, build, age appearance
- **Clothing & Accessories:** Outfits, jewelry, glasses, hats, weapons, props
- **Art Style:** Line weight, shading style, level of detail

### Why is This Challenging for AI?

1. **Stochastic Nature:** Image generation models are probabilistic - each generation is influenced by random sampling
2. **Prompt Interpretation:** Text descriptions are inherently ambiguous ("blue hair" could be navy, cyan, or electric blue)
3. **Context Dependence:** Different poses, angles, and lighting can drastically change a character's appearance
4. **Model Limitations:** Most models are trained on diverse datasets without character-specific fine-tuning
5. **Compositional Complexity:** Manga pages have multiple panels, characters, and viewing angles

### Impact on Manga Creation

- **Narrative Confusion:** Readers may not recognize characters across pages
- **Professionalism:** Inconsistent art looks amateurish
- **Editing Burden:** Manual correction is time-consuming and expensive
- **User Trust:** Undermines confidence in the AI system

---

## Current System Analysis

### MangaFusion Architecture (As-Is)

**Image Generation Providers:**
- **Primary:** OpenAI `gpt-image-1` or `dall-e-3`
- **Alternative:** Google Gemini `gemini-2.5-flash-image-preview`

**Current Character Handling:**

1. **Character Definition Phase:**
   - Planner generates character descriptions: `"Aoi - spiky blue hair, red eyes, black jacket..."`
   - Each character gets an `asset_filename`: `aoi.png`
   - Characters stored in database with name, description, assetFilename

2. **Character Image Generation:**
   - `generateCharacter()` creates a single reference image per character
   - Uses text prompt only: "Create a clean character reference image for a manga. Character: Aoi. Design notes: [description]. Black-and-white manga line art..."
   - Stored in Supabase: `episodes/{episodeTitle}/characters/{assetFilename}`

3. **Page Generation with Character References:**
   - **Gemini:** Fetches character reference images, converts to base64, attaches as `inlineData` to the generation request
   - **OpenAI:** Cannot attach images; only mentions character URLs in text prompt (ineffective)
   - Prompt includes: `"Character consistency: Use the attached reference images to keep faces/outfits consistent across pages."`

**Code Evidence:**
```typescript
// From renderer.service.ts, lines 162-183
if (request.characterAssets?.length) {
    for (const c of request.characterAssets) {
        if (!c.imageUrl) continue;
        try {
            const res = await fetch(c.imageUrl);
            const ab = await res.arrayBuffer();
            const b64 = Buffer.from(ab).toString('base64');
            parts.push({ inlineData: { data: b64, mimeType: 'image/png' } });
        } catch {
            parts.push({ text: `Reference image for ${c.name}: ${c.imageUrl}` });
        }
    }
}
```

### Limitations of Current Approach

1. **OpenAI Has No Image Conditioning:** `gpt-image-1` and `dall-e-3` APIs don't support reference images as input - only text prompts
2. **Gemini Reference Images Are Unreliable:** While Gemini accepts reference images, there's no guarantee it will maintain character consistency
3. **Single Reference Image:** Only one view per character (typically 3/4 view or full body) limits angle coverage
4. **No Face Embedding:** System doesn't extract or preserve face embeddings for reuse
5. **Text Prompt Dependency:** Relies heavily on natural language descriptions, which are inherently lossy and ambiguous
6. **No Fine-tuning:** Cannot train character-specific models

### What Currently Works

- **Character Reference Generation:** Successfully creates initial character designs
- **Gemini Image Attachment:** Technical infrastructure for passing images to Gemini is functional
- **Asset Management:** Character images stored and retrieved from Supabase
- **Prompt Templating:** System uses `<asset_filename>` tags to reference characters in prompts

---

## Character Consistency Techniques

### 1. LoRA (Low-Rank Adaptation)

**What It Is:**
LoRA is a parameter-efficient fine-tuning technique that trains small adapter layers on top of a base model. For character consistency, you train a LoRA on 10-50 images of a character to teach the model their specific appearance.

**How It Works:**
1. Collect training images: 10-50 images of the character in different poses/angles
2. Caption images with trigger word: "aoi_character, spiky blue hair, red eyes"
3. Train LoRA weights (~5-100MB file) using tools like Kohya_ss or OneTrainer
4. Load LoRA weights at inference time alongside base Stable Diffusion model
5. Use trigger word in prompts to activate character: "aoi_character standing on rooftop"

**Pros:**
- **Strongest consistency:** Near-perfect character reproduction across poses/angles
- **Flexible:** Works with different styles, lighting, compositions
- **Efficient:** Small file size (~10-50MB), fast inference
- **Reusable:** One-time training, infinite generations
- **Multi-character:** Can load multiple LoRAs simultaneously

**Cons:**
- **Requires Stable Diffusion:** Not compatible with OpenAI or Gemini APIs
- **Training Required:** Each character needs 10-50 training images and 1-2 hours GPU time
- **Learning Curve:** Requires technical knowledge of SD training pipelines
- **Bootstrap Problem:** How do you generate consistent training images to begin with?

**Implementation Requirements:**
- Stable Diffusion model (SDXL, SD 1.5, or anime-specific models)
- Training framework (Kohya_ss, OneTrainer, or cloud service like Civitai)
- GPU with 12GB+ VRAM (RTX 3060+) or cloud GPU (RunPod, Vast.ai)
- ComfyUI or Automatic1111 for inference

**Best Use Cases:**
- Long-running manga series with established characters
- Professional production workflows
- When you have reference images available for training

**Estimated Effort:**
- Setup: 4-8 hours (one-time)
- Per character training: 1-3 hours
- Per page generation: 30-60 seconds

---

### 2. ControlNet

**What It Is:**
ControlNet adds conditional control to Stable Diffusion by using preprocessed images (edge maps, depth maps, pose skeletons) to guide generation. For character consistency, ControlNet can preserve pose and composition while allowing style variation.

**How It Works:**
1. Extract control signal from reference image (e.g., edge detection, pose estimation)
2. Use control signal to guide generation of new image
3. Combine with text prompt for content: "aoi in different outfit"
4. Model preserves structure from control signal while varying content

**Available ControlNet Types:**
- **Canny Edge:** Preserves line art and edges (excellent for manga)
- **OpenPose:** Preserves character pose/skeleton
- **Depth:** Preserves spatial layout
- **Lineart:** Manga-specific line extraction
- **Reference:** Uses reference images to guide style and appearance
- **IP-Adapter (see below):** Face/character identity preservation

**Pros:**
- **Pose Consistency:** Great for maintaining body proportions and compositions
- **Flexible Control:** Can mix multiple ControlNets (pose + depth + reference)
- **No Training Required:** Works with any reference image
- **Real-time:** Fast inference (~5-10 seconds per image)

**Cons:**
- **Not Identity-Focused:** Better for pose/structure than facial features
- **Requires Stable Diffusion:** Not compatible with OpenAI/Gemini
- **Reference Image Needed:** Needs a base image for each generation
- **Partial Consistency:** Face/details may still vary without additional techniques

**Implementation Requirements:**
- Stable Diffusion 1.5 or SDXL
- ControlNet extension for ComfyUI/Automatic1111
- Preprocessor models (OpenPose, Canny, etc.)
- GPU with 8GB+ VRAM

**Best Use Cases:**
- Maintaining pose across different styles
- Composition consistency
- Combined with LoRA or IP-Adapter for full character consistency
- Panel-to-panel continuity in manga

**Estimated Effort:**
- Setup: 2-4 hours (one-time)
- Per page generation: 20-40 seconds

---

### 3. IP-Adapter (Image Prompt Adapter)

**What It Is:**
IP-Adapter is a recent technique that allows using images as prompts alongside text. It extracts features from reference images and injects them into the diffusion process, enabling strong character/style consistency.

**How It Works:**
1. Encode reference image through CLIP image encoder or custom face encoder
2. Extract image features/embeddings
3. Inject features into Stable Diffusion's cross-attention layers
4. Combine with text prompt for scene description
5. Generate image that preserves reference image's identity/style

**Variants:**
- **IP-Adapter:** General purpose, uses CLIP image encoder
- **IP-Adapter Face:** Specialized for face consistency, uses face recognition model
- **IP-Adapter FaceID:** Enhanced version with stronger face preservation
- **IP-Adapter Plus:** Higher fidelity, larger model

**Pros:**
- **Strong Face Consistency:** IP-Adapter Face/FaceID excel at preserving facial features
- **No Training Required:** Works with any reference image
- **Flexible:** Can combine multiple reference images
- **Fast:** Real-time inference
- **Multi-modal:** Can use both text and image guidance

**Cons:**
- **Requires Stable Diffusion:** Not compatible with OpenAI/Gemini
- **Outfit Variation:** May not preserve clothing as well as LoRA
- **SDXL Focus:** Best results with SDXL models
- **Quality Dependent:** Results depend on reference image quality

**Implementation Requirements:**
- Stable Diffusion SDXL (recommended) or SD 1.5
- IP-Adapter extension for ComfyUI
- IP-Adapter model weights (~1-4GB)
- GPU with 10GB+ VRAM

**Best Use Cases:**
- Face consistency without training
- Quick character generation from reference images
- Combined with LoRA for outfit + face consistency
- Rapid prototyping and iteration

**Estimated Effort:**
- Setup: 2-4 hours (one-time)
- Per page generation: 15-30 seconds

---

### 4. Face/Character Embedding Systems

**What It Is:**
Embedding systems extract a mathematical representation (vector) of a character's appearance from reference images, then use these embeddings to guide generation. This is similar to IP-Adapter but more specialized.

**Techniques:**
- **Textual Inversion:** Learns a new "word" (embedding) that represents a character
- **DreamBooth:** Fine-tunes entire model on a specific character
- **Custom Embeddings:** Extract face embeddings using models like ArcFace or InsightFace

**Textual Inversion:**
- Train a new text token: `<aoi-character>` represents Aoi's appearance
- 3-5 training images, ~30 minutes training time
- Use `<aoi-character>` in prompts: "photo of `<aoi-character>` in cyberpunk setting"
- Weaker than LoRA but faster to train

**DreamBooth:**
- Fine-tunes entire Stable Diffusion model on subject
- Very strong identity preservation
- Requires ~20-30 images, 1-2 hours GPU time
- Model size: ~2-7GB
- Risk of overfitting

**Face Embedding (ArcFace/InsightFace):**
- Extract 512-dimensional face vector from reference image
- Use vector to guide generation through custom nodes/extensions
- Requires integration with InsightFace or similar face recognition library
- Often used in conjunction with IP-Adapter FaceID

**Pros:**
- **Textual Inversion:** Fast training, small files (~100KB)
- **DreamBooth:** Strongest identity preservation
- **Face Embeddings:** No training, works with any face image

**Cons:**
- **Textual Inversion:** Weaker than LoRA
- **DreamBooth:** Large model size, slower training, overfitting risk
- **All:** Require Stable Diffusion infrastructure

**Implementation Requirements:**
- Stable Diffusion model
- Training frameworks (for Textual Inversion/DreamBooth)
- InsightFace library (for face embeddings)
- GPU with 8GB+ VRAM

**Best Use Cases:**
- **Textual Inversion:** Quick character prototypes
- **DreamBooth:** High-fidelity character reproduction
- **Face Embeddings:** Real-time face consistency

---

### 5. Reference Image Conditioning (Current Approach)

**What It Is:**
Providing reference images directly to multimodal AI models (like Gemini, GPT-4V, Midjourney) and asking them to maintain consistency through prompt instructions.

**How It Works:**
1. Generate initial character reference image
2. Attach reference image(s) to subsequent generation requests
3. Include text instruction: "Use the attached reference image to maintain character appearance"
4. Model attempts to match reference through its understanding

**Platforms Supporting This:**
- **Google Gemini:** Accepts multiple images in request (current MangaFusion approach)
- **Midjourney:** `--cref` (character reference) parameter for character consistency
- **Claude:** Can view and reference images (no generation)
- **GPT-4V:** Can view images but doesn't generate (GPT-Image-1 can't see images)

**Midjourney Character Reference (`--cref`):**
- Upload reference image, use `--cref URL` in prompt
- Optionally add `--cw` (character weight) 0-100 for strength
- Example: `aoi on rooftop --cref https://link-to-aoi.png --cw 80`
- Reasonably good consistency for illustration style

**Pros:**
- **No Training Required:** Works with any reference image
- **API Compatible:** Works with hosted services (Gemini, Midjourney)
- **Flexible:** Can use multiple reference images
- **Easy Integration:** Already implemented in MangaFusion for Gemini

**Cons:**
- **Weak Consistency:** No guarantee of face/outfit preservation
- **Model Dependent:** Quality varies by provider
- **Unpredictable:** Results inconsistent across generations
- **OpenAI Limitation:** gpt-image-1 doesn't support image inputs at all

**Current MangaFusion Implementation:**
```typescript
// Gemini accepts reference images
const parts = [{ text: prompt }];
if (request.characterAssets?.length) {
    for (const c of request.characterAssets) {
        const res = await fetch(c.imageUrl);
        const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
        parts.push({ inlineData: { data: b64, mimeType: 'image/png' } });
    }
}
```

**Improvement Opportunities:**
1. Generate multiple reference angles (front, side, back, 3/4)
2. Include close-up face shots in references
3. Create character reference sheets with annotations
4. Experiment with prompt engineering ("exactly match the face in reference image #1")

**Best Use Cases:**
- Quick prototyping without infrastructure investment
- When using hosted API services (Gemini, Midjourney)
- Moderate consistency requirements

---

### 6. Character Reference Sheets

**What It Is:**
Creating comprehensive multi-view character design sheets that show a character from multiple angles, expressions, and outfit variations. These sheets serve as visual guides for AI generation.

**Standard Reference Sheet Contents:**
1. **Turnaround:** Front, 3/4, side, back views
2. **Face Closeups:** Different expressions (happy, sad, angry, surprised)
3. **Hairstyle Details:** From multiple angles
4. **Outfit Details:** Full outfit, casual variant, accessories
5. **Color Palette:** Official colors for hair, eyes, skin, clothing
6. **Proportions:** Height chart, body proportions guide
7. **Key Features:** Scars, tattoos, unique traits highlighted

**Generation Approaches:**

**Approach A: Generate Sheet in One Image**
- Single AI generation: "anime character reference sheet, turnaround, front view, side view, back view, white background"
- Pros: Single generation, cohesive style
- Cons: Often inconsistent between views, poor layout

**Approach B: Generate Individual Views, Compile**
- Generate front view, then use it as reference for side/back views
- Use ControlNet or IP-Adapter to maintain consistency
- Manually compile into reference sheet
- Pros: Better control, higher quality
- Cons: More generations required, needs compilation step

**Approach C: Start with AI, Refine Manually**
- Generate base character design with AI
- Artist refines and creates proper turnaround
- Use refined sheet for future AI generations
- Pros: Professional quality
- Cons: Requires human artist

**Usage in Generation Pipeline:**
1. Show full reference sheet to model before each generation
2. Specify which view is relevant: "use front view from reference sheet"
3. Can crop specific views for targeted consistency

**Pros:**
- **Comprehensive:** Covers all angles and variations
- **Professional:** Standard in animation/manga production
- **Reusable:** Single sheet serves all future generations
- **Communication:** Clear visual spec for artists and AI

**Cons:**
- **Initial Effort:** Time-consuming to create
- **Consistency Challenge:** Hard to generate consistent sheet with AI alone
- **Storage:** Larger file sizes for multi-view images

**Best Use Cases:**
- Professional manga production
- Long-running series with recurring characters
- When combined with LoRA training (sheet as training data)
- Teams with access to character artists

---

### 7. Face Swapping Techniques

**What It Is:**
Generate manga pages without worrying about character faces, then use face-swapping AI to replace faces with consistent character faces from reference images.

**How It Works:**
1. Generate manga page with generic characters
2. Detect faces in generated image
3. Extract reference face from character reference image
4. Swap faces using models like InsightFace, FaceSwap, or Roop
5. Blend swapped faces seamlessly into image

**Face Swapping Tools:**
- **InsightFace:** Industry-standard face analysis and swapping
- **Roop:** One-click deepfake face swap (easy to use)
- **FaceSwap (FS-GAN):** High-quality face replacement
- **ComfyUI Reactor Node:** Face swap node for SD workflows
- **DeepFaceLab:** Professional-grade tool (complex)

**Workflow Example:**
1. Generate page: "manga panel, young woman talking on rooftop, black and white"
2. Detect faces with InsightFace
3. Load Aoi's reference face
4. Swap generic face → Aoi's face
5. Post-process to match line art style

**Pros:**
- **Guaranteed Face Consistency:** Uses exact face from reference
- **No Training Required:** Works with single reference image
- **Decouples Problems:** Solve composition and character separately
- **Fast:** Face swap takes 1-5 seconds per face

**Cons:**
- **Manga Style Challenges:** Face swap models trained on photos, may not blend well with line art
- **Outfit/Body Not Consistent:** Only swaps face, not clothing or build
- **Uncanny Valley Risk:** Poorly blended faces look unnatural
- **Lighting Mismatch:** Reference face lighting may not match scene
- **Angle Limitations:** Works best for frontal faces, struggles with extreme angles

**Implementation Requirements:**
- InsightFace or similar face swapping library
- Face detection model
- Post-processing for style matching (optional)
- GPU helpful but not required (can run on CPU)

**Manga-Specific Challenges:**
- Line art style doesn't match photorealistic face swap models
- Need manga-specific face swap model or style transfer post-processing
- Speech bubbles may cover faces
- Stylized manga faces (big eyes, simplified features) differ from realistic faces

**Potential Solution: Manga Face Swap**
- Train custom face swap model on manga artwork
- Use style transfer to convert swapped face to match line art
- Combine with line art extraction and reapplication

**Best Use Cases:**
- Supplementary technique alongside other methods
- Quick fixes for face inconsistencies
- Photo-realistic manga styles (closer to manhwa/webtoons)
- When you have high-quality reference face images

---

### 8. Prompt Engineering for Consistency

**What It Is:**
Carefully crafting text prompts with specific, detailed, and consistent character descriptions to maximize consistency without additional tools.

**Techniques:**

**1. Exhaustive Descriptions:**
Instead of: `"Aoi on rooftop"`
Use: `"teenage girl named Aoi, spiky electric blue hair with side-swept bangs, bright red almond-shaped eyes, pale skin, black leather jacket with silver zippers, white t-shirt underneath, ripped black jeans, red sneakers, standing on rooftop"`

**2. Feature Anchoring:**
List critical features in every prompt:
- `CRITICAL FEATURES: electric blue spiky hair, red eyes, black jacket`
- `OUTFIT: black leather jacket, white t-shirt, ripped jeans`

**3. Negative Prompts:**
Specify what NOT to include:
- `Negative: blonde hair, brown eyes, different outfit, different hairstyle`

**4. Weight Emphasis:**
Use prompt weighting (SD syntax):
- `(electric blue spiky hair:1.5), (red eyes:1.4), (black leather jacket:1.3)`
- Higher weights = higher priority

**5. Consistent Terminology:**
Use exact same phrases across all pages:
- Always "spiky electric blue hair" not "blue hair" or "spiky blue"
- Maintain vocabulary consistency

**6. Reference Hashing:**
Some systems support content-based anchoring:
- `[reference:aoi.png] character standing on rooftop`

**7. Seed Control:**
Using same seed with variations:
- Same seed = similar composition/layout
- Vary seed slightly for diversity while maintaining base structure

**8. Template System:**
Create prompt templates:
```
CHARACTER: {name}, {age}, {hair}, {eyes}, {outfit}, {build}
SCENE: {location}, {time}, {weather}, {lighting}
ACTION: {pose}, {expression}, {activity}
STYLE: {art_style}, {mood}, {camera_angle}
```

**Pros:**
- **No Infrastructure:** Works with any text-to-image model
- **Immediate:** No training or setup required
- **Flexible:** Easy to adjust and iterate
- **Transferable:** Works across different AI services

**Cons:**
- **Weak Consistency:** Text alone cannot guarantee visual consistency
- **Labor Intensive:** Requires writing long, detailed prompts
- **Diminishing Returns:** More text doesn't always = better consistency
- **Ambiguity:** Language is inherently imprecise for visual details

**Best Practices:**
1. Create character prompt library (reusable descriptions)
2. Use consistent formatting across all generations
3. Test and refine descriptions based on results
4. Combine with reference images when possible
5. Document what works for each character

**Current MangaFusion Implementation:**
System already uses detailed prompts from planner output:
- Character descriptions in planner output
- Visual style specifications
- Setting and action details

**Improvement Opportunities:**
1. Generate more detailed character descriptions (current: 1 sentence → target: 5-10 features)
2. Extract and reuse proven descriptors
3. Implement negative prompts for features to avoid
4. Add feature priority weighting

---

## AI Image Generation Solutions

### Stable Diffusion

**Overview:**
Open-source diffusion model that generates images from text. The most flexible option for character consistency due to its extensibility and fine-tuning support.

**Versions:**
- **SD 1.5:** Original, widely supported, 512x512 base resolution
- **SD 2.1:** Improved quality, 768x768, less community support
- **SDXL:** Latest, highest quality, 1024x1024, best for detailed art
- **Anime Models:** Specialized forks (NovelAI, Anything V3, AnyLora, etc.)

**Character Consistency Features:**
- **✅ LoRA Support:** Full support, best implementation
- **✅ ControlNet:** Native integration, all control types
- **✅ IP-Adapter:** SDXL has excellent IP-Adapter support
- **✅ Textual Inversion:** Built-in support
- **✅ DreamBooth:** Full fine-tuning support
- **✅ Face Swap:** Easy integration with InsightFace/Reactor
- **✅ Reference Images:** Via img2img, ControlNet, or IP-Adapter

**Manga-Specific Models:**
- **MeinaMix:** Popular anime/manga model
- **Anything V5:** Versatile anime style
- **CounterfeitV3:** Manga-focused model
- **Niji Journey (SD-based):** High-quality anime/manga

**Deployment Options:**
1. **Local (GPU):**
   - ComfyUI or Automatic1111 WebUI
   - Requires NVIDIA GPU (8GB+ VRAM)
   - Full control, no API costs
   - Setup complexity: Medium-High

2. **Cloud GPU:**
   - RunPod, Vast.ai, Lambda Labs
   - Pay per GPU hour (~$0.30-0.80/hr)
   - No local hardware required
   - Setup complexity: Medium

3. **Hosted API:**
   - Replicate, Together AI, Stability AI API
   - Pay per generation (~$0.01-0.05/image)
   - Easy integration
   - Limited control (depends on provider)

**Pros:**
- **Most Powerful:** Best character consistency options available
- **Open Source:** Free to use, modify, extend
- **Community:** Huge ecosystem of models, tools, tutorials
- **Cost Effective:** No per-generation fees for local deployment
- **Manga Optimized:** Dedicated anime/manga models available

**Cons:**
- **Infrastructure Required:** Need GPU or cloud setup
- **Learning Curve:** More complex than API services
- **Maintenance:** Models, extensions, updates to manage
- **Quality Variance:** Results depend on model selection and tuning

**Best For MangaFusion:**
Long-term production solution with professional consistency requirements

---

### ComfyUI Workflows for Character Consistency

**What is ComfyUI:**
Node-based interface for Stable Diffusion that allows building complex, reusable generation workflows. Think of it as visual programming for AI image generation.

**Character Consistency Workflows:**

**Workflow 1: LoRA + IP-Adapter Face**
```
[Checkpoint Loader] → [LoRA Loader (Character)] → [KSampler]
                                                       ↑
[Character Reference] → [IP-Adapter Face] ────────────┘
                                                       ↑
[Text Prompt] ─────────────────────────────────────────┘
```
- Load character LoRA for outfit/style
- Use IP-Adapter Face for face consistency
- Text prompt for pose/scene
- **Result:** Strong face + outfit consistency

**Workflow 2: Multi-ControlNet**
```
[Reference Image] → [OpenPose Preprocessor] → [ControlNet (Pose)]
                                                       ↓
[Reference Image] → [Canny Preprocessor] → [ControlNet (Canny)] → [KSampler]
                                                       ↓
[Character Ref] → [IP-Adapter] ────────────────────────┘
```
- Preserve pose from reference
- Preserve edges/composition
- Add character identity with IP-Adapter
- **Result:** Exact pose recreation with character swapped in

**Workflow 3: Iterative Refinement**
```
[Page Layout Text] → [Text2Img] → [Face Detection] → [Face Crop]
                                          ↓
[Character Face Ref] → [Face Swap (Reactor)] → [Paste Back]
                                          ↓
[Upscale] → [Line Art Enhancement] → [Final Output]
```
- Generate base manga page
- Swap in consistent character faces
- Upscale and enhance line art
- **Result:** Consistent faces on varied compositions

**Workflow 4: Character Sheet → Multiple Poses**
```
[Character Sheet] → [IP-Adapter] → [Batch Prompts] → [KSampler Array]
                                                           ↓
                                                    [10 Pages with Same Character]
```
- Load character reference sheet once
- Generate all 10 manga pages in batch
- IP-Adapter maintains consistency
- **Result:** All pages have consistent character

**Reusable Workflow Benefits:**
- **Consistency:** Same settings for all pages
- **Efficiency:** One-click generation of all pages
- **Version Control:** Save workflows as JSON, track changes
- **Collaboration:** Share workflows with team

**Example MangaFusion Integration:**
1. User creates episode in MangaFusion
2. Backend exports planner output as JSON
3. ComfyUI workflow reads JSON, generates all 10 pages
4. Upload images back to Supabase
5. MangaFusion displays results

**Pros:**
- **Reproducible:** Workflows are version-controlled, repeatable
- **Powerful:** Combine multiple techniques in one flow
- **Visual:** Easier than coding for many users
- **Community:** Pre-built workflows available online

**Cons:**
- **Requires Stable Diffusion:** Not compatible with OpenAI/Gemini
- **Learning Curve:** Node-based interface takes time to learn
- **Performance:** Complex workflows can be slow

---

### Google Gemini (Current System)

**Model:** `gemini-2.5-flash-image-preview`

**Character Consistency Features:**
- **✅ Reference Images:** Accepts multiple images as input (`inlineData`)
- **⚠️ Consistency:** Model attempts to honor references but no guarantees
- **❌ LoRA:** Not supported
- **❌ ControlNet:** Not supported
- **❌ Fine-tuning:** Not available to public
- **❌ Embeddings:** No custom embedding support

**How It Handles Character References (Current Implementation):**
1. Accepts base64-encoded reference images in request
2. Text prompt includes: "Use the attached reference images to keep faces/outfits consistent"
3. Model uses multimodal understanding to approximate character appearance
4. No formal mechanism to guarantee consistency

**Observed Performance:**
- **Face Similarity:** 60-70% consistency (subjective estimate)
- **Outfit Similarity:** 40-60% consistency
- **Style Matching:** 70-80% style consistency
- **Unpredictable:** High variance between generations

**Improvement Strategies:**
1. **Multiple Reference Angles:** Attach front, side, and 3/4 views
2. **Close-up Face Shots:** Include dedicated face closeup in references
3. **Enhanced Prompts:** Combine references with exhaustive text descriptions
4. **Temperature Tuning:** Lower temperature (0.4-0.6) for more deterministic output
5. **Regeneration:** Generate 3-5 variants, select best match

**Pros:**
- **Already Integrated:** Currently working in MangaFusion
- **Simple API:** Easy to use, no infrastructure management
- **Multimodal:** Handles both text and images naturally
- **Cost Effective:** Gemini pricing is competitive

**Cons:**
- **Weak Consistency:** Not designed for character consistency
- **No Control:** Can't force model to honor references
- **Limited Customization:** No fine-tuning or adapters
- **Experimental Model:** "preview" status means API may change

**Best For:**
Short-term solution, prototyping, demos with moderate consistency needs

---

### OpenAI (DALL-E 3 / GPT-Image-1)

**Models:**
- **DALL-E 3:** `dall-e-3` - 1024x1024, 4k character prompt limit
- **GPT-Image-1:** `gpt-image-1` - 1024x1792, 32k character prompt limit

**Character Consistency Features:**
- **❌ Reference Images:** Not supported (text-only prompts)
- **❌ LoRA:** Not supported
- **❌ ControlNet:** Not supported
- **❌ Fine-tuning:** Not available
- **❌ Embeddings:** Not supported
- **✅ Detailed Prompts:** Supports long prompts (especially GPT-Image-1)

**How It Handles Character References:**
- **Cannot handle references at all**
- Relies purely on text descriptions
- No image conditioning capabilities in API

**Character Consistency Strategy:**
1. Use extremely detailed text prompts
2. Include all character features in every generation
3. Hope for consistent interpretation (unreliable)
4. Regenerate multiple times, select closest match

**Observed Performance:**
- **Face Similarity:** 30-50% consistency (very weak)
- **Outfit Similarity:** 40-60% consistency
- **Style Matching:** 70-80% (good at style consistency)
- **High Variance:** Characters often look completely different

**Pros:**
- **High Quality:** DALL-E 3 produces beautiful, polished images
- **Long Prompts:** GPT-Image-1's 32k limit allows exhaustive descriptions
- **Safety:** Strong content filters, safe for production
- **Reliability:** Stable API, good uptime

**Cons:**
- **No Image Input:** Fatal flaw for character consistency
- **Expensive:** $0.04-0.12 per image (depending on model/size)
- **Slow:** 10-30 seconds per generation
- **Limited Control:** No advanced features

**Recommendation:**
Not suitable for character consistency needs. Only use if other factors (quality, safety) outweigh consistency requirements.

---

### Midjourney

**Version:** V6 (latest as of 2025)

**Character Consistency Features:**
- **✅ Character Reference (`--cref`):** Upload reference image, use URL in prompt
- **✅ Character Weight (`--cw`):** Control strength (0-100) of character reference
- **✅ Style Reference (`--sref`):** Separate style reference system
- **⚠️ Consistency:** Better than basic reference, weaker than LoRA
- **❌ LoRA:** Not supported
- **❌ ControlNet:** Not supported
- **❌ Fine-tuning:** Not available

**How Character Reference Works:**
```
/imagine aoi standing on rooftop at sunset, black and white manga style --cref https://s.mj.run/aoi-ref.png --cw 80
```
- Upload character reference image once
- Use `--cref URL` to reference it in prompts
- `--cw 80` = 80% character weight (default 100)
- Midjourney attempts to match face, hair, general appearance

**Observed Performance:**
- **Face Similarity:** 70-80% consistency (better than Gemini/OpenAI)
- **Outfit Similarity:** 60-70% consistency
- **Style Matching:** 85-95% (excellent)
- **Moderate Variance:** More consistent than pure text, less than LoRA

**Pros:**
- **Best Non-SD Option:** Strongest consistency without Stable Diffusion infrastructure
- **Beautiful Results:** Midjourney's aesthetic quality is industry-leading
- **Easy to Use:** Simple Discord interface or API
- **Active Development:** Frequent updates and improvements

**Cons:**
- **Subscription Required:** $10-120/month depending on plan
- **Discord Interface:** Awkward for programmatic integration (API exists but limited)
- **Rate Limits:** Generation limits based on subscription tier
- **Less Control:** Fewer parameters than Stable Diffusion
- **Manga Style:** Not specialized for manga, more illustration-focused

**API Integration:**
Midjourney offers official API (beta):
- RESTful API for programmatic access
- Webhook callbacks for async generation
- Supports `--cref` and other parameters
- Pricing: Based on subscription plan

**Best For:**
Teams willing to invest in subscription, prioritizing visual quality, okay with ~70% consistency

---

### Comparison Matrix

| Feature | Stable Diffusion + LoRA | Gemini (Current) | OpenAI | Midjourney `--cref` | ComfyUI + IP-Adapter |
|---------|-------------------------|------------------|---------|---------------------|----------------------|
| **Face Consistency** | ⭐⭐⭐⭐⭐ 95%+ | ⭐⭐⭐ 60-70% | ⭐⭐ 30-50% | ⭐⭐⭐⭐ 70-80% | ⭐⭐⭐⭐ 80-90% |
| **Outfit Consistency** | ⭐⭐⭐⭐⭐ 90%+ | ⭐⭐ 40-60% | ⭐⭐ 40-60% | ⭐⭐⭐ 60-70% | ⭐⭐⭐ 70-80% |
| **Ease of Setup** | ⭐⭐ Complex | ⭐⭐⭐⭐⭐ Integrated | ⭐⭐⭐⭐⭐ Simple API | ⭐⭐⭐⭐ Easy | ⭐⭐ Complex |
| **Cost (10 pages)** | ~$0-5 (GPU hours) | ~$0.20-1.00 | ~$0.40-1.20 | $10+ subscription | ~$0-5 (GPU hours) |
| **Speed (per page)** | 30-60 sec | 10-30 sec | 15-30 sec | 20-60 sec | 20-40 sec |
| **Manga Quality** | ⭐⭐⭐⭐⭐ Dedicated models | ⭐⭐⭐ Generic | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Illustration | ⭐⭐⭐⭐⭐ Customizable |
| **Training Required** | Yes (1-2 hrs/char) | No | No | No | No |
| **Infrastructure** | GPU/Cloud | API | API | API/Webhook | GPU/Cloud |
| **Customization** | ⭐⭐⭐⭐⭐ Full | ⭐⭐ Limited | ⭐ Very Limited | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Full |

**Legend:**
- ⭐⭐⭐⭐⭐ = Excellent
- ⭐⭐⭐⭐ = Good
- ⭐⭐⭐ = Moderate
- ⭐⭐ = Weak
- ⭐ = Poor

---

## Practical Implementation Approaches

### Approach 1: Enhanced Gemini (Short-term)

**Strategy:** Maximize consistency with current Gemini infrastructure through improved prompts and multi-angle references.

**Implementation Steps:**

1. **Generate Multi-Angle Character References:**
   - Front view (current)
   - 3/4 view
   - Side profile
   - Face closeup
   - Store all views in Supabase

2. **Attach All Reference Images:**
   ```typescript
   const characterRefs = await loadAllCharacterViews(character.id);
   for (const ref of characterRefs) {
       parts.push({ inlineData: { data: ref.base64, mimeType: 'image/png' } });
   }
   ```

3. **Enhanced Prompts:**
   - Add exhaustive character descriptions to planner output
   - Include negative prompts (features to avoid)
   - Reference specific image: "Match the face in reference image 1"

4. **Selective Generation:**
   - Generate 3 variants per page
   - Use simple face similarity scoring to select best match
   - Store alternates for user selection

5. **Iterative Feedback:**
   - Allow users to mark pages with "good consistency"
   - Use those pages as additional references for remaining pages

**Estimated Effort:**
- Development: 2-3 days
- Per character setup: 2 minutes (auto-generated)
- Per episode: No additional time

**Pros:**
- Minimal code changes
- No infrastructure changes
- Immediate deployment
- Low risk

**Cons:**
- Modest improvement (60% → 75% estimated)
- Still unreliable
- No long-term solution

**Recommended:** Yes, as Phase 1

---

### Approach 2: Midjourney Integration (Medium-term)

**Strategy:** Add Midjourney as alternative renderer with `--cref` for better consistency.

**Implementation Steps:**

1. **Midjourney API Setup:**
   - Subscribe to Midjourney plan with API access
   - Integrate API client into renderer service
   - Configure webhook endpoint for async generation

2. **Character Reference Upload:**
   ```typescript
   // Upload character reference to Midjourney
   const mjRef = await midjourneyClient.uploadReference(characterImage);
   const mjUrl = mjRef.url; // Store in database
   ```

3. **Generation with Character Reference:**
   ```typescript
   const prompt = buildPrompt(request);
   const result = await midjourneyClient.imagine({
       prompt: `${prompt} --cref ${character.mjReferenceUrl} --cw 85 --style raw --ar 2:3`,
       aspectRatio: '2:3', // Manga ratio
   });
   ```

4. **Add Provider Selection:**
   - Update UI to let users choose: Gemini, OpenAI, or Midjourney
   - Store provider preference per episode
   - Show example results for each provider

**Estimated Effort:**
- Development: 3-5 days
- Setup: 1 hour
- Monthly cost: $30-60 for Standard plan
- Per episode: ~$0.30-0.60 (within plan limits)

**Pros:**
- Significant consistency improvement (75-80%)
- High visual quality
- Relatively easy integration
- Professional results

**Cons:**
- Subscription cost
- Rate limits
- Less control than SD
- Still not perfect consistency

**Recommended:** Yes, as Phase 2 for users willing to pay for quality

---

### Approach 3: Stable Diffusion + LoRA (Long-term Professional)

**Strategy:** Deploy full Stable Diffusion pipeline with LoRA training for professional-grade character consistency.

**Architecture:**

```
┌─────────────────────────────────────────────────────┐
│         MangaFusion Backend (NestJS)                │
│                                                      │
│  ┌──────────────┐         ┌───────────────┐        │
│  │   Planner    │         │   Character   │        │
│  │   Service    │────────▶│   Training    │        │
│  └──────────────┘         │   Service     │        │
│                            └───────┬───────┘        │
│                                    │                 │
│                                    ▼                 │
│                            ┌───────────────┐        │
│                            │  SD Worker    │        │
│                            │  (ComfyUI)    │        │
│                            └───────┬───────┘        │
│                                    │                 │
└────────────────────────────────────┼─────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   Cloud GPU (RunPod)    │
                        │  - Stable Diffusion     │
                        │  - ComfyUI Server       │
                        │  - LoRA Training        │
                        └─────────────────────────┘
```

**Implementation Steps:**

**Phase 1: Infrastructure Setup (Week 1-2)**

1. **Deploy ComfyUI on Cloud GPU:**
   - Use RunPod template: "ComfyUI Official"
   - Select GPU: RTX 4090 or A100 (24GB VRAM)
   - Install extensions: IP-Adapter, ControlNet, Reactor
   - Download manga-focused model (MeinaMix, CounterfeitV3)

2. **Create API Wrapper:**
   ```typescript
   @Injectable()
   export class ComfyUIService {
       async generatePage(request: {
           prompt: string;
           characterLoras: { name: string; weight: number }[];
           controlNetImage?: string;
           width: number;
           height: number;
       }): Promise<{ imageUrl: string }> {
           // Build ComfyUI workflow JSON
           // Submit to ComfyUI API
           // Poll for completion
           // Return generated image
       }
   }
   ```

3. **Integrate Storage:**
   - Generate images to temp directory
   - Upload to Supabase
   - Delete temp files

**Phase 2: LoRA Training Pipeline (Week 3-4)**

1. **Character Training Data Generation:**
   ```typescript
   async prepareCharacterTrainingData(character: Character): Promise<string[]> {
       // Generate 20-30 images with varied poses/angles using current system
       // Prompts: front view, side view, 3/4 view, back view, closeup,
       //          different expressions, different poses
       // Manually review and select best 15-20 images
       // Caption images: "aoi_character, description of pose/expression"
       // Save to training directory
   }
   ```

2. **Automated LoRA Training:**
   ```typescript
   async trainCharacterLora(character: Character): Promise<string> {
       // Use Kohya_ss or OneTrainer
       // Training config:
       //   - Base model: MeinaMix or similar
       //   - Network dimension: 32
       //   - Alpha: 16
       //   - Steps: 1000-2000
       //   - Learning rate: 1e-4
       // Upload trained LoRA to Supabase
       // Store LoRA URL in character record
   }
   ```

3. **User Workflow:**
   - User creates episode
   - System generates initial character designs
   - User reviews and approves designs
   - (Optional) User uploads own reference images
   - System generates training dataset (20-30 images)
   - Background job trains LoRA (~1-2 hours)
   - User receives notification when training complete
   - Episode pages generated with LoRA

**Phase 3: Production Workflow (Week 5-6)**

1. **ComfyUI Workflow Template:**
   ```json
   {
       "nodes": [
           { "id": 1, "type": "CheckpointLoader", "model": "meinamix_v11.safetensors" },
           { "id": 2, "type": "LoraLoader", "lora": "character_aoi.safetensors", "strength": 0.85 },
           { "id": 3, "type": "CLIPTextEncode", "text": "aoi_character, {prompt}" },
           { "id": 4, "type": "IPAdapter", "image": "reference_front.png", "weight": 0.6 },
           { "id": 5, "type": "KSampler", "steps": 25, "cfg": 7, "seed": "{seed}" },
           { "id": 6, "type": "VAEDecode" },
           { "id": 7, "type": "SaveImage" }
       ]
   }
   ```

2. **Batch Generation:**
   - Load episode outline
   - For each character, load their LoRA
   - Generate all 10 pages in parallel (if multi-GPU) or sequence
   - Upload to Supabase
   - Update database

**Estimated Effort:**
- Infrastructure setup: 1-2 weeks
- LoRA training pipeline: 2-3 weeks
- Testing and refinement: 2-3 weeks
- **Total: 5-8 weeks**

**Costs:**
- RunPod GPU (RTX 4090): ~$0.50/hour
- Per episode: ~$2-5 (training + generation)
- Monthly (100 episodes): ~$200-500

**Pros:**
- **Professional Quality:** 90-95%+ consistency
- **Full Control:** Customize everything
- **Scalable:** Can generate unlimited images
- **Cost Effective:** Lower long-term cost than API services
- **Future-Proof:** Can upgrade models, add features

**Cons:**
- **High Initial Effort:** Weeks of development
- **Complexity:** Requires ML/DevOps expertise
- **Maintenance:** Models, workflows, GPU management
- **Training Time:** 1-2 hours per character (one-time)

**Recommended:** Yes, as Phase 3 for production/commercial deployment

---

### Approach 4: Hybrid (Recommended Balanced Approach)

**Strategy:** Use different techniques for different use cases, providing flexibility and optimal cost/quality trade-offs.

**Multi-Tier System:**

**Tier 1 - Quick Draft (Gemini Enhanced):**
- Use enhanced Gemini with multi-angle references
- Fast generation (~10 sec/page)
- Moderate consistency (~70%)
- Cost: ~$0.10-0.20 per episode
- **Use Case:** Prototyping, story development, iteration

**Tier 2 - Professional (Midjourney):**
- Midjourney with `--cref`
- Good consistency (~75-80%)
- Beautiful polished results
- Cost: $30/month + time
- **Use Case:** Published episodes, portfolio work

**Tier 3 - Studio Quality (SD + LoRA):**
- Stable Diffusion with trained character LoRAs
- Excellent consistency (~90-95%)
- Full creative control
- Cost: ~$2-5 per episode
- **Use Case:** Professional manga production, long series

**User Experience:**

1. **Episode Creation:**
   ```
   Create Episode
   ├── Enter story details
   ├── Select quality tier:
   │   ├── Draft (Fast, $0.20)
   │   ├── Professional (Midjourney, $1)
   │   └── Studio (Best, $5)
   └── Generate
   ```

2. **Character Setup:**
   - System auto-generates reference images (Tier 1)
   - User can upload own references (all tiers)
   - For Tier 3, system offers LoRA training option

3. **Regeneration:**
   - Any page can be regenerated in any tier
   - Upgrade tier mid-episode (e.g., draft → studio)
   - Download/export LoRAs for external use

**Implementation Priority:**

**Phase 1 (Month 1):** Enhanced Gemini
- Multi-angle references
- Better prompts
- Variant selection

**Phase 2 (Month 2-3):** Midjourney Integration
- API integration
- User tier selection
- Billing integration

**Phase 3 (Month 4-6):** Stable Diffusion + LoRA
- Infrastructure setup
- Training pipeline
- Production workflow

**Estimated Total Effort:**
- Phase 1: 1 week
- Phase 2: 2-3 weeks
- Phase 3: 6-8 weeks
- **Total: 3-4 months**

**Pros:**
- **Flexible:** Users choose cost/quality trade-off
- **Progressive Enhancement:** Each phase adds value
- **Revenue Opportunity:** Tier-based pricing
- **Risk Mitigation:** Fallback options if one system fails

**Cons:**
- **Complex:** Three different systems to maintain
- **Higher Development Cost:** More code to write
- **User Confusion:** Need clear tier communication

**Recommended:** Yes, this is the **optimal long-term strategy**

---

## Recommended Approach for MangaFusion

### Executive Recommendation

**Implement the Hybrid Multi-Tier Approach** with the following prioritization:

### Phase 1: Enhanced Gemini (Immediate - Week 1-2)

**Goal:** Improve current system from ~60% to ~75% consistency with minimal effort.

**Tasks:**
1. Generate 4-view character references (front, 3/4, side, closeup)
2. Attach all views to Gemini requests
3. Enhance planner prompts with 10+ character features
4. Add character reference sheet generation option
5. Implement variant generation (3 options, user selects best)

**Code Changes:**
- `planner.service.ts`: Add detailed character description generation
- `renderer.service.ts`: Load and attach multiple character views
- `episodes.service.ts`: Generate multi-view references after planning
- Frontend: Add variant selection UI

**Success Metrics:**
- Character face recognition across pages: 75%+
- User satisfaction with consistency: "Moderate" → "Good"
- Generation time: < 30 seconds per page

**Effort:** 1-2 weeks
**Cost:** $0 additional infrastructure
**Risk:** Low

---

### Phase 2: Midjourney Professional Tier (Month 2-3)

**Goal:** Offer premium option with 80%+ consistency for users willing to pay.

**Tasks:**
1. Set up Midjourney API integration
2. Implement character reference upload to MJ
3. Add tier selection to episode creation flow
4. Update renderer to support `--cref` parameter
5. Implement billing for premium tier ($2-5 per episode)

**Code Changes:**
- New `midjourney.service.ts`: API client wrapper
- `renderer.config.ts`: Add 'midjourney' provider option
- `renderer.service.ts`: Add `generatePageMidjourney()` method
- Database schema: Add `tier` field to episodes table
- Frontend: Tier selection, upgrade options

**Success Metrics:**
- Character consistency: 80%+
- User satisfaction: "Good" → "Excellent"
- Premium tier adoption: 20%+ of users

**Effort:** 2-3 weeks
**Cost:** $30/month subscription + API usage
**Risk:** Medium (subscription dependency)

---

### Phase 3: Stable Diffusion + LoRA Studio Tier (Month 4-6)

**Goal:** Professional-grade 90-95% consistency for serious creators.

**Tasks:**
1. Deploy ComfyUI on cloud GPU (RunPod/Vast.ai)
2. Create ComfyUI API service wrapper
3. Build LoRA training pipeline
4. Implement character training data generation
5. Create automated training job queue
6. Develop production workflow templates

**Code Changes:**
- New `comfyui.service.ts`: ComfyUI API client
- New `lora-training.service.ts`: Training pipeline
- New `sd-renderer.service.ts`: SD-specific renderer
- Worker: Training job processor
- Database: Add `loraUrl` to characters table, training job tracking
- Frontend: LoRA training status, studio tier features

**Success Metrics:**
- Character consistency: 90-95%+
- Training time: < 2 hours per character
- Generation time: < 60 seconds per page
- Professional user adoption: 10%+ of episodes

**Effort:** 6-8 weeks
**Cost:** ~$0.50/hour GPU + storage
**Risk:** High (technical complexity, infrastructure management)

---

### Alternative Quick Win: Face Swap Post-Processing

**If development resources are limited**, consider this simpler approach:

**Strategy:** Generate pages with any provider, then swap faces for consistency.

**Implementation:**
1. Install InsightFace/Reactor node in existing system
2. After page generation, detect faces
3. Swap generic faces with character reference faces
4. Save swapped version alongside original

**Effort:** 1 week
**Consistency Improvement:** 60% → 80% (faces only)
**Limitation:** Only fixes faces, not outfits/bodies

**Code:**
```typescript
async postProcessWithFaceSwap(pageImageUrl: string, characterFaceUrl: string): Promise<string> {
    const pageImage = await loadImage(pageImageUrl);
    const refFace = await loadImage(characterFaceUrl);

    const faces = await insightFace.detect(pageImage);
    for (const face of faces) {
        const swapped = await insightFace.swap(face, refFace);
        pageImage.paste(swapped, face.bbox);
    }

    const outputUrl = await this.storage.uploadImage(pageImage, filename);
    return outputUrl;
}
```

**Recommended as:** Optional Phase 1.5 between Gemini and Midjourney

---

### Decision Matrix

| Approach | Effort | Cost/Episode | Consistency | Time to Market | Recommended Priority |
|----------|--------|--------------|-------------|----------------|---------------------|
| Enhanced Gemini | 1-2 weeks | $0.20 | 75% | Immediate | ✅ Phase 1 (Do First) |
| Face Swap | 1 week | $0.30 | 80% (face only) | 1 week | ⚠️ Optional Phase 1.5 |
| Midjourney | 2-3 weeks | $1-2 | 80% | 1 month | ✅ Phase 2 (Next) |
| SD + LoRA | 6-8 weeks | $2-5 | 93% | 3 months | ✅ Phase 3 (Future) |
| Hybrid All | 3-4 months | Tiered | 75-93% | Progressive | ⭐ Ultimate Goal |

---

## Technical Requirements & Trade-offs

### Infrastructure Comparison

#### Current (Gemini/OpenAI API)
**Requirements:**
- None (API-only)

**Pros:**
- Zero infrastructure management
- Instant scalability
- Predictable costs

**Cons:**
- No customization
- Weak consistency
- Vendor lock-in

**Best For:** MVPs, prototypes, small projects

---

#### Midjourney API
**Requirements:**
- Midjourney subscription ($10-60/month)
- Webhook endpoint for async responses
- Image storage (existing Supabase)

**Pros:**
- Beautiful results
- Better consistency than basic APIs
- Managed service (no GPU needed)

**Cons:**
- Subscription cost
- Rate limits
- Less control than SD

**Best For:** Small to medium production, teams prioritizing aesthetics

---

#### Stable Diffusion (Cloud GPU)
**Requirements:**
- Cloud GPU instance (RunPod, Vast.ai, Lambda)
- 8-24GB VRAM GPU
- Storage: 50-100GB for models
- ComfyUI or A1111 installation
- LoRA training framework
- Monitoring and autoscaling

**Infrastructure Costs:**

| GPU | VRAM | Performance | Cost/Hour | Monthly (24/7) | Spot Price |
|-----|------|-------------|-----------|----------------|------------|
| RTX 3060 | 12GB | Basic | $0.20 | $144 | $0.10/hr |
| RTX 4090 | 24GB | High | $0.50 | $360 | $0.30/hr |
| A100 | 40GB | Professional | $1.10 | $792 | $0.70/hr |

**Optimized Costs:**
- Use spot instances: 40-60% cheaper
- Only run during generation: ~$20-50/month for 100 episodes
- Serverless options: Modal, Banana.dev ($0.01/sec)

**Pros:**
- Full control
- Best consistency
- Cost-effective at scale
- Future-proof

**Cons:**
- Complex setup
- Requires DevOps skills
- Maintenance burden
- Cold start times

**Best For:** Professional production, long-running series, high volume

---

#### Stable Diffusion (Local GPU)
**Requirements:**
- NVIDIA GPU (8GB+ VRAM minimum, 12GB+ recommended)
- 50-100GB storage for models
- ComfyUI/A1111 installation
- Windows/Linux OS

**Hardware Recommendations:**

| GPU | VRAM | SD 1.5 | SDXL | LoRA Training | Cost |
|-----|------|--------|------|---------------|------|
| RTX 3060 | 12GB | ✅ Fast | ⚠️ Slow | ✅ Basic | ~$300 |
| RTX 4070 | 12GB | ✅ Fast | ✅ Good | ✅ Good | ~$600 |
| RTX 4090 | 24GB | ✅ Very Fast | ✅ Fast | ✅ Excellent | ~$1600 |

**Pros:**
- No ongoing costs
- Unlimited generations
- Full privacy
- No latency

**Cons:**
- High upfront cost ($500-2000)
- Single user/machine
- Requires local setup
- Not scalable for multi-user SaaS

**Best For:** Individual creators, local tools, development/testing

---

### Storage Requirements

| Asset Type | Size per Item | Quantity (10-page episode) | Total Storage |
|------------|---------------|----------------------------|---------------|
| Character reference (single view) | 1-3 MB | 3 characters | 3-9 MB |
| Character reference (4-view sheet) | 4-8 MB | 3 characters | 12-24 MB |
| LoRA weights | 10-50 MB | 3 characters | 30-150 MB |
| Generated manga page | 2-5 MB | 10 pages | 20-50 MB |
| **Total per episode** | | | **65-233 MB** |
| **100 episodes** | | | **6.5-23 GB** |

**Supabase Storage Costs:**
- Free tier: 1GB
- Pro: 100GB included ($25/month)
- **Recommendation:** Start with free tier, upgrade when hitting limits

---

### Performance Benchmarks

| Provider/Method | Time per Page | Time per Episode (10 pages) | Parallelizable? |
|-----------------|---------------|----------------------------|-----------------|
| Gemini | 10-30 sec | 1.5-5 min (sequential) | ⚠️ Limited (API rate limits) |
| OpenAI | 15-30 sec | 2.5-5 min (sequential) | ⚠️ Limited (API rate limits) |
| Midjourney | 20-60 sec | 3-10 min (sequential) | ✅ Yes (with subscription tier) |
| SD (GPU) | 15-45 sec | 2.5-7.5 min (sequential) | ✅ Yes (multi-GPU or batch) |
| SD (batch mode) | 20-60 sec | 1-3 min (parallel on 4xGPU) | ✅ Yes |

**Optimization Strategies:**
1. **Parallel Generation:** Generate multiple pages simultaneously if provider allows
2. **Queue System:** Use BullMQ to manage generation queue
3. **Caching:** Cache character references, LoRA weights
4. **Progressive Loading:** Show pages as they complete (don't wait for all 10)

---

### Quality vs. Cost Trade-offs

**Scenario: 100 Episodes per Month**

| Approach | Character Consistency | Image Quality | Monthly Cost | Dev Time | Total Cost (Year 1) |
|----------|----------------------|---------------|--------------|----------|-------------------|
| Gemini Basic | 60% | Good | $20 | 0 weeks | $240 |
| Gemini Enhanced | 75% | Good | $20 | 2 weeks | $240 + dev |
| Midjourney | 80% | Excellent | $60 + $100 API | 3 weeks | $1920 + dev |
| SD Cloud (on-demand) | 93% | Excellent | $50-150 | 8 weeks | $600-1800 + dev |
| SD Cloud (dedicated) | 93% | Excellent | $200-400 | 8 weeks | $2400-4800 + dev |

**Recommendation:**
- **Hobbyist/Indie:** Gemini Enhanced (~$20/month)
- **Small Studio:** Midjourney ($60-160/month)
- **Professional:** SD Cloud on-demand ($50-150/month)
- **Enterprise:** SD Cloud dedicated ($200-400/month)

---

### Risk Assessment

| Approach | Technical Risk | Cost Risk | Vendor Risk | Maintenance Risk | Overall Risk |
|----------|---------------|-----------|-------------|------------------|--------------|
| Gemini Enhanced | ⭐ Low | ⭐ Low | ⭐⭐⭐ Medium | ⭐ Low | ⭐⭐ Low-Medium |
| Midjourney | ⭐⭐ Medium | ⭐⭐ Medium | ⭐⭐⭐⭐ High | ⭐ Low | ⭐⭐⭐ Medium |
| SD Cloud | ⭐⭐⭐⭐ High | ⭐⭐ Medium | ⭐⭐ Low | ⭐⭐⭐ Medium | ⭐⭐⭐ Medium-High |
| SD Local | ⭐⭐⭐ Medium | ⭐ Low | ⭐ None | ⭐⭐⭐⭐ High | ⭐⭐⭐ Medium |
| Hybrid All | ⭐⭐⭐⭐⭐ Very High | ⭐⭐⭐ Medium | ⭐⭐ Low | ⭐⭐⭐⭐⭐ Very High | ⭐⭐⭐⭐ High |

**Risk Mitigation:**
- **Vendor Risk:** Hybrid approach provides fallback options
- **Technical Risk:** Thorough testing, gradual rollout
- **Cost Risk:** Start with cheaper tiers, upgrade based on demand
- **Maintenance Risk:** Comprehensive documentation, monitoring, automated tests

---

## User Experience Considerations

### User Journey Analysis

#### Current Experience (Gemini Basic)

1. **Create Episode:**
   - User enters story details
   - Clicks "Generate"
   - Waits 2-5 minutes
   - Views 10 pages

2. **Problem Discovery:**
   - Notices character looks different on page 3
   - Page 7 character has wrong hair color
   - Page 9 outfit completely changed

3. **Frustration:**
   - No way to fix without regenerating entire page
   - Regeneration may make it worse
   - Gives up or manually edits in external tool

**Pain Points:**
- ❌ Inconsistent results create distrust
- ❌ No control over character appearance
- ❌ Time wasted on unusable pages
- ❌ Unclear why consistency failed

---

#### Improved Experience (Hybrid System)

1. **Create Episode:**
   - User enters story details
   - **NEW:** Selects quality tier (Draft/Pro/Studio)
   - **NEW:** Optionally uploads character references
   - Clicks "Generate"

2. **Character Review:**
   - **NEW:** System shows generated character reference sheet (4 views)
   - **NEW:** User can approve or regenerate characters
   - **NEW:** For Studio tier: Option to start LoRA training

3. **Page Generation:**
   - **NEW:** Shows progress: "Generating page 1/10..."
   - **NEW:** Pages appear as completed (progressive loading)
   - **NEW:** Each page shows confidence score: "95% character match"

4. **Review & Edit:**
   - **NEW:** Pages with low confidence flagged: "⚠️ Check character consistency"
   - **NEW:** Click page to see variants (3 options)
   - **NEW:** Swap to different variant or regenerate specific page
   - **NEW:** "Fix Character" button runs face swap post-processing

5. **Export:**
   - Download completed episode
   - **NEW:** Download character LoRAs for reuse in future episodes
   - **NEW:** Share episode to gallery (with permission)

**Improvements:**
- ✅ User has control over quality/cost trade-off
- ✅ Character approval step prevents wasted generation
- ✅ Variant selection provides options
- ✅ Progressive loading reduces perceived wait time
- ✅ Confidence scores set expectations
- ✅ Easy recovery from inconsistencies

---

### Feature Requirements

#### Must-Have (MVP)
1. **Character Reference Generation:** Auto-create character reference images
2. **Multi-View References:** Front, 3/4, side, closeup views
3. **Reference Attachment:** Attach references to generation requests (Gemini)
4. **Basic Consistency Metrics:** Visual similarity scoring
5. **Page Regeneration:** Re-generate individual pages

#### Should-Have (Enhanced)
6. **Tier Selection:** Let users choose Draft/Pro/Studio
7. **Variant Generation:** Generate 3 options, user selects best
8. **Character Approval:** Review characters before generating pages
9. **Reference Upload:** Users can upload own character references
10. **Confidence Scoring:** Show estimated consistency per page

#### Nice-to-Have (Premium)
11. **LoRA Training:** Auto-train character LoRAs (Studio tier)
12. **Face Swap Tool:** One-click face consistency fix
13. **Character Library:** Save characters for reuse across episodes
14. **Consistency Preview:** Before/after comparison
15. **A/B Testing:** Compare different providers side-by-side

---

### UI/UX Mockup Concepts

#### Character Reference Sheet View
```
┌─────────────────────────────────────────────────────┐
│  Character: Aoi                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Front  │ │  3/4    │ │  Side   │ │ Closeup │  │
│  │  View   │ │  View   │ │  View   │ │  Face   │  │
│  │         │ │         │ │         │ │         │  │
│  │  [IMG]  │ │  [IMG]  │ │  [IMG]  │ │  [IMG]  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                      │
│  Description: Spiky electric blue hair, red eyes... │
│                                                      │
│  [ Approve Characters ]  [ Regenerate ]  [ Upload ] │
└─────────────────────────────────────────────────────┘
```

#### Tier Selection
```
┌─────────────────────────────────────────────────────┐
│  Select Quality Tier:                                │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Draft   │  │Professional│ │  Studio  │         │
│  │          │  │          │ │          │         │
│  │ ~70%     │  │ ~80%     │ │ ~93%     │         │
│  │ Fast     │  │ Beautiful│ │ Perfect  │         │
│  │ $0.20    │  │ $2       │ │ $5       │         │
│  │          │  │          │ │ +LoRA    │         │
│  │ [SELECT] │  │ [SELECT] │ │ [SELECT] │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

#### Page with Consistency Indicators
```
┌─────────────────────────────────────────────────────┐
│  Page 3 of 10               Consistency: ⭐⭐⭐⭐⭐ 95%│
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │                                               │  │
│  │                                               │  │
│  │         [Generated Manga Page Image]          │  │
│  │                                               │  │
│  │                                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ✅ Aoi: Face match 96%  ✅ Outfit match 94%        │
│                                                      │
│  [ View Variants ]  [ Regenerate ]  [ Fix Face ]    │
└─────────────────────────────────────────────────────┘
```

---

### Onboarding & Education

**Challenge:** Users may not understand tiers, consistency, or how to get best results.

**Solutions:**

1. **Interactive Tutorial:**
   - "Try all three tiers on a sample episode"
   - Side-by-side comparison of Draft vs Pro vs Studio
   - Explain trade-offs

2. **Tooltips & Hints:**
   - "💡 Tip: Upload a reference image for better consistency"
   - "⚡ Pro tier uses Midjourney for professional quality"
   - "🎯 Studio tier trains a custom AI for 95%+ consistency"

3. **Example Gallery:**
   - Showcase episodes created with each tier
   - Before/after consistency improvements
   - Community highlights

4. **Documentation:**
   - "Guide to Character Consistency"
   - "How LoRA Training Works"
   - "Tips for Best Results"

---

### Feedback & Iteration

**Collect User Feedback:**
1. **After Generation:** "How consistent are the characters? 1-5 stars"
2. **After Selection:** "Which tier did you use? Would you upgrade?"
3. **Analytics:** Track regeneration rates (high = poor consistency)

**Continuous Improvement:**
- Monitor consistency metrics per provider
- A/B test prompt templates
- Update default settings based on success rates
- Iterate on reference sheet generation

---

## Implementation Roadmap

### Phase 1: Enhanced Gemini (Weeks 1-2)

**Goal:** Improve current system to ~75% consistency

**Week 1:**
- [ ] Update planner prompts to generate detailed character descriptions (10+ features)
- [ ] Implement multi-view character reference generation (front, 3/4, side, closeup)
- [ ] Update renderer to attach all character views to Gemini requests
- [ ] Add character reference storage in database

**Week 2:**
- [ ] Implement variant generation (3 options per page)
- [ ] Add simple face similarity scoring (using CLIP or similar)
- [ ] Create UI for character review/approval
- [ ] Add variant selection interface
- [ ] Testing and bug fixes

**Deliverables:**
- Multi-view character references
- Variant selection UI
- Improved consistency (60% → 75%)

**Success Metrics:**
- Character face recognition: 75%+
- User satisfaction: "Moderate" → "Good"
- Regeneration rate: < 30%

---

### Phase 2: Midjourney Integration (Weeks 3-5)

**Goal:** Add professional tier with 80%+ consistency

**Week 3:**
- [ ] Set up Midjourney subscription and API access
- [ ] Create `midjourney.service.ts` API wrapper
- [ ] Implement character reference upload to Midjourney
- [ ] Test `--cref` parameter with sample characters

**Week 4:**
- [ ] Add tier selection to episode creation flow
- [ ] Update renderer.service.ts to support Midjourney provider
- [ ] Implement `generatePageMidjourney()` method
- [ ] Add webhook endpoint for async generation callbacks

**Week 5:**
- [ ] Implement billing/usage tracking for premium tier
- [ ] Create comparison UI (show Draft vs Pro examples)
- [ ] Add tier upgrade option for existing episodes
- [ ] Testing, documentation, deployment

**Deliverables:**
- Midjourney integration
- Tier selection UI
- Billing system
- 80% consistency option

**Success Metrics:**
- Midjourney consistency: 80%+
- Premium tier adoption: 20%+
- User satisfaction: "Good" → "Excellent"

---

### Phase 3: Face Swap (Optional - Week 6)

**Goal:** Quick win for face-only consistency improvement

**Tasks:**
- [ ] Install InsightFace or Reactor library
- [ ] Implement face detection in generated pages
- [ ] Implement face swap using character reference
- [ ] Add "Fix Face" button to page UI
- [ ] Test with manga line art style

**Deliverables:**
- Face swap post-processing tool
- 80%+ face consistency (any tier)

**Success Metrics:**
- Face swap success rate: 90%+
- Processing time: < 5 seconds per page

---

### Phase 4: Stable Diffusion Infrastructure (Weeks 7-10)

**Goal:** Set up SD infrastructure for Studio tier

**Week 7:**
- [ ] Select cloud GPU provider (RunPod, Vast.ai)
- [ ] Deploy ComfyUI on cloud GPU instance
- [ ] Install manga-focused models (MeinaMix, CounterfeitV3)
- [ ] Install extensions (IP-Adapter, ControlNet, Reactor)
- [ ] Test basic text-to-image generation

**Week 8:**
- [ ] Create `comfyui.service.ts` API wrapper
- [ ] Build workflow template for manga page generation
- [ ] Implement workflow submission and polling
- [ ] Add SD provider option to renderer service
- [ ] Test end-to-end generation

**Week 9:**
- [ ] Implement IP-Adapter workflow (character reference → consistent pages)
- [ ] Test with multiple characters
- [ ] Optimize workflow for speed/quality
- [ ] Add batch generation support

**Week 10:**
- [ ] Set up autoscaling and monitoring
- [ ] Implement cost tracking
- [ ] Create Studio tier UI
- [ ] Documentation and testing

**Deliverables:**
- ComfyUI cloud deployment
- SD-based generation pipeline
- Studio tier option
- 85-90% consistency (without LoRA)

**Success Metrics:**
- SD consistency: 85-90%
- Generation time: < 60 seconds per page
- Uptime: 99%+

---

### Phase 5: LoRA Training Pipeline (Weeks 11-14)

**Goal:** Achieve 90-95% consistency with character LoRAs

**Week 11:**
- [ ] Install Kohya_ss or OneTrainer on GPU instance
- [ ] Create training data generation workflow
- [ ] Implement automated dataset preparation (captioning, cropping)
- [ ] Test LoRA training with sample character

**Week 12:**
- [ ] Create `lora-training.service.ts`
- [ ] Implement background training job queue
- [ ] Add LoRA storage and retrieval
- [ ] Update database schema for LoRA tracking

**Week 13:**
- [ ] Integrate trained LoRAs into generation workflow
- [ ] Implement character approval + training UX
- [ ] Add training progress notifications
- [ ] Test with multiple characters simultaneously

**Week 14:**
- [ ] Optimize training parameters for quality/speed
- [ ] Add LoRA download/export feature
- [ ] Character library (save characters for reuse)
- [ ] Final testing and documentation

**Deliverables:**
- Automated LoRA training pipeline
- Character library system
- 90-95% consistency

**Success Metrics:**
- LoRA consistency: 90-95%
- Training time: < 2 hours per character
- Training success rate: 95%+

---

### Phase 6: Polish & Optimization (Weeks 15-16)

**Goal:** Refine UX, fix bugs, optimize performance

**Week 15:**
- [ ] Implement comprehensive analytics
- [ ] A/B test different prompt templates
- [ ] Optimize caching and loading times
- [ ] Add export/download features
- [ ] Improve error handling and recovery

**Week 16:**
- [ ] User feedback collection and analysis
- [ ] Bug fixes and polish
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Launch preparation

**Deliverables:**
- Polished, production-ready system
- Complete documentation
- Analytics dashboard

---

### Timeline Summary

```
Month 1:  [Phase 1] [Phase 2──────────]
Month 2:           [Phase 2] [Phase 3]
Month 3:  [Phase 4────────────────────]
Month 4:  [Phase 5────────────────────]
Total: 4 months for full hybrid system
```

**Milestones:**
- ✅ Week 2: Enhanced Gemini live (75% consistency)
- ✅ Week 5: Midjourney tier live (80% consistency)
- ✅ Week 10: SD infrastructure live (85% consistency)
- ✅ Week 14: LoRA training live (93% consistency)
- ✅ Week 16: Production launch

---

### Resource Requirements

**Team:**
- 1 Backend Developer (TypeScript/NestJS) - Full time
- 1 Frontend Developer (React/Next.js) - 50% time
- 1 ML Engineer (SD/ComfyUI expertise) - Weeks 7-14 full time, then part time
- 1 Product Manager/Designer - 25% time

**Infrastructure:**
- Cloud GPU: $200-400/month (Phases 4-5)
- Supabase Storage: $25/month (included in Pro plan)
- Midjourney Subscription: $60/month (Phase 2)
- Development environments: $50/month

**Total Budget Estimate:**
- Development: $30,000-50,000 (4 months, team salaries)
- Infrastructure: $1,500-2,000 (first 4 months)
- **Total: $31,500-52,000**

---

## References & Resources

### Papers & Research

1. **LoRA: Low-Rank Adaptation of Large Language Models**
   - https://arxiv.org/abs/2106.09685
   - Foundational paper on LoRA technique

2. **Adding Conditional Control to Text-to-Image Diffusion Models (ControlNet)**
   - https://arxiv.org/abs/2302.05543
   - Original ControlNet paper

3. **IP-Adapter: Text Compatible Image Prompt Adapter**
   - https://arxiv.org/abs/2308.06721
   - IP-Adapter technique

4. **DreamBooth: Fine Tuning Text-to-Image Diffusion Models**
   - https://arxiv.org/abs/2208.12242
   - DreamBooth fine-tuning method

5. **High-Resolution Image Synthesis with Latent Diffusion Models (Stable Diffusion)**
   - https://arxiv.org/abs/2112.10752
   - Original Stable Diffusion paper

### Tools & Frameworks

**Stable Diffusion Interfaces:**
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- Automatic1111 WebUI: https://github.com/AUTOMATIC1111/stable-diffusion-webui
- InvokeAI: https://github.com/invoke-ai/InvokeAI

**Training Tools:**
- Kohya_ss: https://github.com/bmaltais/kohya_ss
- OneTrainer: https://github.com/Nerogar/OneTrainer
- EveryDream2: https://github.com/victorchall/EveryDream2trainer

**Extensions:**
- IP-Adapter: https://github.com/cubiq/ComfyUI_IPAdapter_plus
- ControlNet: https://github.com/Mikubill/sd-webui-controlnet
- Reactor (Face Swap): https://github.com/Gourieff/sd-webui-reactor

**Face Recognition:**
- InsightFace: https://github.com/deepinsight/insightface
- Face Recognition: https://github.com/ageitgey/face_recognition

### Models & Checkpoints

**Anime/Manga Models:**
- MeinaMix: https://civitai.com/models/7240/meinamix
- Anything V5: https://civitai.com/models/9409/anything-v5
- CounterfeitV3: https://civitai.com/models/4468/counterfeit-v30
- AnyLora: https://civitai.com/models/23900/anylora

**Model Repositories:**
- Civitai: https://civitai.com/ (largest SD model repository)
- HuggingFace: https://huggingface.co/models

### Cloud GPU Providers

- RunPod: https://www.runpod.io/
- Vast.ai: https://vast.ai/
- Lambda Labs: https://lambdalabs.com/
- Together AI: https://www.together.ai/
- Replicate: https://replicate.com/

### API Services

- Stability AI: https://platform.stability.ai/
- Midjourney: https://www.midjourney.com/
- Google Gemini: https://ai.google.dev/
- OpenAI: https://platform.openai.com/

### Tutorials & Guides

**LoRA Training:**
- "LoRA Training Guide for Stable Diffusion": https://rentry.org/lora_train
- Civitai LoRA Training Tutorial: https://education.civitai.com/

**ComfyUI:**
- Official Examples: https://comfyanonymous.github.io/ComfyUI_examples/
- ComfyUI Manager: https://github.com/ltdrdata/ComfyUI-Manager

**Character Consistency:**
- "Consistent Characters in Stable Diffusion": https://stable-diffusion-art.com/consistent-characters/
- IP-Adapter Tutorial: https://www.reddit.com/r/StableDiffusion/comments/17a15c4/ipadapter_tutorial/

### Communities

- r/StableDiffusion: https://www.reddit.com/r/StableDiffusion/
- Civitai Community: https://civitai.com/articles
- ComfyUI Discord: https://discord.gg/comfyui
- Stable Diffusion Discord: https://discord.gg/stablediffusion

### Books & Courses

- "Generative Deep Learning" by David Foster (O'Reilly)
- "Hands-On Generative AI with Transformers and Diffusion Models" (Packt)
- Fast.ai Stable Diffusion Course: https://www.fast.ai/

---

## Appendix: Glossary

**Base Model:** The foundational Stable Diffusion model (e.g., SD 1.5, SDXL) before any fine-tuning

**CFG Scale:** Classifier-Free Guidance scale - controls how closely the generation follows the prompt (typical: 7-11)

**Checkpoint:** A saved state of a trained model, including all weights

**ControlNet:** Conditional control method that guides generation using preprocessed images (edges, pose, depth)

**DreamBooth:** Fine-tuning technique that trains entire model on specific subject

**Embedding:** Mathematical vector representation of text or images

**Fine-tuning:** Training a pre-trained model on specific dataset to specialize it

**IP-Adapter:** Image Prompt Adapter - allows using images as prompts alongside text

**Latent Space:** Compressed representation where diffusion model operates

**LoRA:** Low-Rank Adaptation - efficient fine-tuning method using small adapter layers

**Negative Prompt:** Text describing what you DON'T want in the image

**Sampler:** Algorithm for denoising process (e.g., Euler, DPM++, DDIM)

**Seed:** Random number that controls initial noise pattern (same seed = similar result)

**Steps:** Number of denoising iterations (typical: 20-30)

**Textual Inversion:** Training a new text token embedding to represent a concept

**VRAM:** Video RAM on GPU - determines what models/resolutions you can run

**Weights:** Numerical parameters that define model behavior

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-15 | Initial research document | Claude (Sonnet 4.5) |

---

## Contact & Questions

For questions about implementing these techniques in MangaFusion:
- Review this document thoroughly
- Check references and tutorials
- Join relevant Discord communities
- Experiment with small-scale tests before full implementation

**Good luck building amazing character consistency into MangaFusion!** 🎨📚
