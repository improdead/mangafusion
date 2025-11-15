# MangaFusion - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How It Works](#how-it-works)
4. [AI Models](#ai-models)
5. [Setup & Installation](#setup--installation)
6. [Configuration](#configuration)
7. [Usage Guide](#usage-guide)
8. [API Reference](#api-reference)
9. [Technical Details](#technical-details)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**MangaFusion** is an AI-powered manga creation studio that transforms your story ideas into complete 10-page manga episodes with professional layouts, character designs, and dialogue.

### Key Features
- **AI Story Planning**: Generates structured 10-page manga outlines with panel layouts and dialogue
- **AI Image Generation**: Creates black & white manga artwork for each page
- **Character Consistency**: Maintains character designs across all pages
- **AI Audiobook**: Converts manga episodes into narrated audio experiences
- **Studio Editor**: Advanced editing tools with overlay support and AI regeneration

### Technology Stack
- **Frontend**: Next.js 15, React 18, TailwindCSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Supabase for image hosting
- **AI Providers**: OpenAI (default) or Google Gemini

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  - User Interface                                            │
│  - Form for story inputs                                     │
│  - Episode viewer & Studio editor                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST API
┌──────────────────▼──────────────────────────────────────────┐
│                   Backend (NestJS)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Planner   │  │  Renderer  │  │    TTS     │            │
│  │  Service   │  │  Service   │  │  Service   │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│  ┌─────────────────────────────────────────────┐            │
│  │           AI Provider Layer                  │            │
│  │  - OpenAI (GPT-5-Mini, GPT-Image-1)         │            │
│  │  - Google Gemini (Gemini 2.5 Flash)         │            │
│  └─────────────────────────────────────────────┘            │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Storage   │  │  Database  │  │   Queue    │            │
│  │ (Supabase) │  │ (Prisma)   │  │  (Redis)   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Frontend Layer
- **Pages**: Next.js pages for routing (`/`, `/episodes/[id]`, `/studio/[id]`)
- **Components**: Reusable UI components (Layout, Navigation)
- **API Routes**: Next.js API routes that proxy to backend

#### Backend Services
1. **Planner Service**: Generates story outlines
2. **Renderer Service**: Creates manga page images
3. **Episodes Service**: Manages episode state and orchestration
4. **Storage Service**: Handles image uploads to Supabase
5. **TTS Service**: Generates audiobook narration via ElevenLabs
6. **Queue Service**: Background job processing for long-running tasks

---

## How It Works

### End-to-End Flow

#### 1. Story Input Phase
User provides:
- **Title**: Manga episode title
- **Description**: Brief synopsis of the story
- **Genre Tags**: Action, adventure, supernatural, etc.
- **Tone & Mood**: Dynamic, heroic, dark, comedic, etc.
- **Setting**: Where and when the story takes place
- **Visual Style**: Reference to existing manga/anime styles
- **Style Reference Images** (optional): Upload images for art style guidance
- **Main Characters**: List of character names

#### 2. Story Planning Phase
```
User Input
    ↓
Planner Service
    ↓
AI Model (GPT-5-Mini or Gemini)
    ↓
Generates:
    - 10-page outline
    - Panel layouts per page (3-6 panels)
    - Story beats and key actions
    - Character designs with asset filenames
    - Dialogue for each panel
    - Visual style descriptions
    ↓
Saves to Database
```

**Output Structure:**
```json
{
  "characters": [
    {
      "name": "Aoi",
      "description": "Visual design: spiky blue hair, red eyes, black jacket...",
      "asset_filename": "aoi.png"
    }
  ],
  "pages": [
    {
      "page_number": 1,
      "beat": "Aoi discovers mysterious powers awakening",
      "setting": "Rooftop at sunset, rain-slick streets below",
      "key_actions": ["Aoi looking at glowing hands", "Energy crackling"],
      "layout_hints": {
        "panels": 4,
        "notes": "Wide establishing shot, then close-ups"
      },
      "visual_style": "Dynamic shōnen energy with dramatic lighting",
      "dialogues": [
        {
          "panel_number": 1,
          "character": "Aoi",
          "text": "What's happening to me?",
          "type": "dialogue"
        }
      ],
      "prompt": "<aoi.png> stands on rooftop, energy glowing..."
    }
  ]
}
```

#### 3. Character Generation Phase
```
For each character in outline:
    ↓
Renderer Service
    ↓
AI Image Model (GPT-Image-1 or Gemini Image)
    ↓
Generates character reference image
    ↓
Uploads to Supabase Storage
    ↓
Saves URL to database with character asset filename
```

#### 4. Page Generation Phase (Background Job)
```
For each of 10 pages:
    ↓
Build detailed prompt with:
    - Story beat
    - Panel layout
    - Dialogue
    - Character references (<aoi.png>)
    - Visual style
    - Technical manga requirements
    ↓
Renderer Service
    ↓
AI Image Model (GPT-Image-1 or Gemini Image)
    ↓
Generates 1024x1536 or 1024x1792 manga page
    ↓
Downloads image from AI provider
    ↓
Uploads to Supabase Storage
    ↓
Updates database with image URL
    ↓
Emits progress event via Server-Sent Events (SSE)
    ↓
Frontend receives update and displays progress
```

#### 5. Audiobook Generation (Optional)
```
Episode Complete
    ↓
User requests audiobook
    ↓
TTS Service
    ↓
ElevenLabs API (Flash v2.5)
    ↓
Generates narration for each page's dialogue
    ↓
Combines into single audio file
    ↓
Stores audio URL
    ↓
Returns playback URL to frontend
```

### Real-Time Progress Updates

The system uses **Server-Sent Events (SSE)** to stream progress updates:

```typescript
// Frontend subscribes to progress stream
const eventSource = new EventSource(`/api/episodes/${episodeId}/stream`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'planning_started') {
    console.log('AI is planning your story...');
  }

  if (data.type === 'page_complete') {
    console.log(`Page ${data.pageNumber} generated!`);
    // Update UI with new page
  }

  if (data.type === 'episode_complete') {
    console.log('All pages ready!');
    // Navigate to episode viewer
  }
};
```

---

## AI Models

### Current Configuration (Default: OpenAI)

#### Story Planning
- **Model**: `gpt-5-mini-2025-08-07`
- **Purpose**: Generate 10-page manga outlines
- **Input**: Story seed (title, description, genre, characters)
- **Output**: JSON with structured outline, characters, and dialogue
- **Temperature**: 0.7 (balanced creativity and structure)
- **Response Format**: JSON mode for structured output

#### Image Generation
- **Model**: `gpt-image-1`
- **Purpose**: Create manga page artwork
- **Input**: Detailed text prompt with manga specifications
- **Output**: 1024x1792 PNG image
- **Quality**: HD for pages, Standard for character references
- **Style**: Natural (more suitable for manga than vivid)
- **Prompt Limit**: 4000 characters

#### Audiobook Narration
- **Model**: ElevenLabs `eleven_flash_v2_5`
- **Purpose**: Text-to-speech narration
- **Voice**: Adam (or configurable)
- **Features**: Natural voice, fast generation, cost-effective

### Alternative: Google Gemini

You can switch to Gemini by setting:
```bash
PLANNER_PROVIDER=gemini
RENDERER_PROVIDER=gemini
```

**Gemini Models:**
- **Planning**: `gemini-2.5-flash`
- **Images**: `gemini-2.5-flash-image-preview` (Nano Banana)

**Gemini Advantages:**
- Supports multimodal inputs (can use character reference images)
- Returns images as base64 in response (no separate download)
- Better character consistency with reference images

**OpenAI Advantages:**
- More reliable structured JSON output
- Higher quality image generation
- Better prompt following

---

## Setup & Installation

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **PostgreSQL**: v14 or higher (for production)
- **Redis**: v6 or higher (optional, for queue)

### Quick Start

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/mangafusion.git
cd mangafusion
```

#### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Configure Environment Variables

**Backend Configuration** (`backend/.env`):
```bash
# Required: OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# AI Provider Selection (default: openai)
PLANNER_PROVIDER=openai
RENDERER_PROVIDER=openai

# OpenAI Model Configuration
OPENAI_PLANNER_MODEL=gpt-5-mini-2025-08-07
OPENAI_IMAGE_MODEL=gpt-image-1

# Supabase Storage (required for image hosting)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=manga-images

# Database (for production)
DATABASE_URL=postgresql://user:password@localhost:5432/mangafusion

# Optional: Redis for queue
REDIS_URL=redis://localhost:6379

# Optional: ElevenLabs for audiobooks
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_DEFAULT_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL=eleven_flash_v2_5

# Server
PORT=4000
```

**Frontend Configuration** (`.env.local` - optional):
```bash
# Only needed if backend is on different domain
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

#### 4. Setup Supabase Storage

1. Create a Supabase project at https://supabase.com
2. Create a storage bucket named `manga-images`
3. Set bucket to **public** (or configure RLS policies)
4. Copy your project URL and anon key to `.env`

#### 5. Setup Database (Production)
```bash
cd backend

# Generate Prisma client
npx prisma generate --schema prisma/schema.prisma

# Run migrations
npx prisma migrate deploy --schema prisma/schema.prisma
```

#### 6. Run Development Servers

**Option A: Run Both Together**
```bash
# From root directory
npm run dev          # Frontend on :3000
cd backend && npm run start:dev  # Backend on :4000
```

**Option B: Use Concurrently**
```bash
# Install concurrently globally
npm install -g concurrently

# Run both servers
concurrently "npm run dev" "cd backend && npm run start:dev"
```

#### 7. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

---

## Configuration

### Environment Variables Reference

#### AI Provider Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PLANNER_PROVIDER` | `openai` | Story planning provider: `openai` or `gemini` |
| `RENDERER_PROVIDER` | `openai` | Image generation provider: `openai` or `gemini` |

#### OpenAI Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | **Required** for OpenAI |
| `OPENAI_PLANNER_MODEL` | `gpt-5-mini-2025-08-07` | Story planning model |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | Image generation model |

#### Gemini Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | - | **Required** for Gemini |
| `PLANNER_MODEL` | `gemini-2.5-flash` | Story planning model |
| `RENDERER_IMAGE_MODEL` | `gemini-2.5-flash-image-preview` | Image generation model |

#### Storage Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | - | **Required** - Your Supabase project URL |
| `SUPABASE_ANON_KEY` | - | **Required** - Supabase anonymous key |
| `SUPABASE_BUCKET` | `manga-images` | Storage bucket name |

#### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `REDIS_URL` | - | Optional Redis for queue |

#### TTS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ELEVENLABS_API_KEY` | - | Optional for audiobooks |
| `ELEVENLABS_DEFAULT_VOICE_ID` | `pNInz6obpgDQGcFmaJgB` | Voice ID (Adam) |
| `ELEVENLABS_MODEL` | `eleven_flash_v2_5` | TTS model |

---

## Usage Guide

### Creating Your First Manga

#### Step 1: Fill Out Story Form
Navigate to http://localhost:3000 and fill in:

1. **Story Title**: e.g., "Shadow Sketch"
2. **Description**: Brief synopsis of your story
3. **Genre Tags**: e.g., "modern shonen, urban fantasy"
4. **Tone & Mood**: e.g., "dynamic, heroic, hopeful"
5. **Setting**: e.g., "rain-slick neon city at dusk"
6. **Visual Style**: e.g., "shōnen energy like Demon Slayer, JJK, OPM"
7. **Style References**: (Optional) Upload reference images
8. **Characters**: List names, one per line (e.g., "Aoi", "Kenji")

#### Step 2: Generate Manga
Click **"Generate Manga Episode"**

You'll see:
1. ✅ Planning started...
2. ✅ Planning complete!
3. ✅ Uploading style references...
4. ✅ Starting page generation...
5. ✅ Page 1/10 complete...
6. ... (progress updates for each page)
7. ✅ All pages complete!
8. → Redirects to episode viewer

**⏱️ Generation Time**: Typically 3-5 minutes for 10 pages

#### Step 3: View Episode
The episode page shows:
- All 10 generated manga pages
- Dialogue overlays on each page
- Character designs
- Audiobook player (if generated)

#### Step 4: Edit in Studio (Optional)
Click **"Edit in Studio"** to:
- Regenerate individual pages
- Edit dialogue text
- Add/modify overlays
- Adjust character consistency

#### Step 5: Generate Audiobook (Optional)
Click **"Generate Audiobook"** to create narrated version

---

## API Reference

### Core Endpoints

#### POST `/api/planner`
Generate manga outline

**Request Body:**
```json
{
  "title": "Shadow Sketch",
  "description": "A young artist discovers their sketches come to life",
  "genre_tags": ["urban fantasy", "shonen"],
  "tone": "dynamic, heroic",
  "setting": "modern Tokyo at night",
  "visual_vibe": "Demon Slayer style energy",
  "cast": [
    { "name": "Aoi", "traits": "mysterious character" }
  ]
}
```

**Response:**
```json
{
  "episodeId": "uuid-here"
}
```

#### POST `/api/episodes/{id}/generate10`
Start background generation of all 10 pages

**Response:**
```json
{
  "message": "Generation started",
  "episodeId": "uuid-here"
}
```

#### GET `/api/episodes/{id}/stream`
Subscribe to progress updates (Server-Sent Events)

**Event Types:**
- `planning_started`
- `planning_progress`
- `planning_complete`
- `page_started`
- `page_complete`
- `episode_complete`
- `error`

#### GET `/api/episodes/{id}`
Get episode data

**Response:**
```json
{
  "id": "uuid",
  "title": "Shadow Sketch",
  "status": "completed",
  "pages": [...],
  "characters": [...],
  "createdAt": "2025-11-14T..."
}
```

#### POST `/api/pages/{id}/regenerate`
Regenerate a specific page

**Request Body:**
```json
{
  "editPrompt": "Make Aoi look more determined"
}
```

#### POST `/api/pages/{id}/dialogue`
Update dialogue overlay

**Request Body:**
```json
{
  "dialogueText": "New dialogue text here"
}
```

---

## Technical Details

### Image Generation Prompts

The system builds detailed prompts for manga generation:

```typescript
function buildPrompt(request: RenderRequest): string {
  return [
    // Context
    `Generate a manga page image for "${episodeTitle}".`,
    `Page ${pageNumber} story beat: ${outline.beat}`,
    `Setting: ${outline.setting}`,
    `Key visual actions: ${outline.key_actions.join(', ')}`,

    // Dialogue to render
    `Dialogue to include as on-page speech bubbles:`,
    dialogueContext,

    // Layout
    `Panel layout: ${outline.layout_hints.panels} panels`,
    `${outline.layout_hints.notes}`,

    // Style
    `Art style: ${outline.visual_style || visualStyle}`,

    // Character references
    `Character consistency: Use attached reference images`,
    `Page prompt: ${outline.prompt}`,

    // Technical requirements
    `Technical requirements:`,
    `- Black and white manga artwork (1024x1536 pixels)`,
    `- Clean panel borders with proper gutters`,
    `- Dynamic camera angles and compositions`,
    `- Expressive character poses and facial expressions`,
    `- Appropriate screentones for shading`,
    `- Speed lines and motion effects for action`,
    `- Professional manga page layout with clear visual flow`,
    `- High contrast and clear line art`,
    `- Speech bubbles with readable text (upper-case, manga style)`,
    `- Place bubbles appropriately, avoid covering faces`,

    // Output spec
    `Output: Complete manga page, 1024x1536 pixels, B&W, with speech bubbles`
  ].filter(Boolean).join('\n');
}
```

### Database Schema

```prisma
model Episode {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      String   // 'planning', 'generating', 'completed', 'failed'
  outline     Json?    // Full planner output
  pages       Page[]
  characters  Character[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Page {
  id            String   @id @default(uuid())
  episodeId     String
  episode       Episode  @relation(fields: [episodeId], references: [id])
  pageNumber    Int
  imageUrl      String?
  status        String   // 'pending', 'generating', 'completed', 'failed'
  seed          Int?
  prompt        String?
  outlineData   Json     // PlannerOutlinePage data
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Character {
  id            String   @id @default(uuid())
  episodeId     String
  episode       Episode  @relation(fields: [episodeId], references: [id])
  name          String
  description   String
  assetFilename String
  imageUrl      String?
  createdAt     DateTime @default(now())
}
```

### Error Handling

The system includes fallback mechanisms:

1. **API Errors**: If AI provider fails, returns placeholder images with error info
2. **Storage Errors**: If Supabase fails, uses temporary URLs or placeholders
3. **Planning Errors**: If JSON parsing fails, retries with extraction logic
4. **Timeout Handling**: SSE streams timeout after 10 seconds, with fallback polling

### Performance Optimizations

1. **Background Processing**: Page generation runs in background queue
2. **Parallel Generation**: Can generate multiple pages concurrently (configurable)
3. **Image Caching**: Supabase provides CDN caching for generated images
4. **Progress Streaming**: SSE for real-time updates without polling
5. **Lazy Loading**: Frontend lazy-loads page images as user scrolls

---

## Troubleshooting

### Common Issues

#### 1. "API not reachable" Error
**Symptom**: Red banner on homepage saying API not reachable

**Solutions**:
- Check backend is running on port 4000
- Verify `NEXT_PUBLIC_API_BASE` if using external backend
- Check CORS settings if backend is on different domain

#### 2. Image Generation Fails with Placeholder
**Symptom**: Pages show error placeholders instead of manga art

**Solutions**:
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API credits/quota
- Review backend logs for specific error messages
- Try switching to Gemini provider

#### 3. Images Not Saving
**Symptom**: Images generate but don't persist

**Solutions**:
- Verify Supabase credentials in `.env`
- Check bucket exists and is public
- Verify bucket name matches `SUPABASE_BUCKET`
- Check Supabase storage quota

#### 4. Planning Returns Invalid JSON
**Symptom**: Error "Planner returned invalid JSON shape"

**Solutions**:
- Check AI model has proper JSON mode support
- Review backend logs for raw AI response
- Try different temperature setting
- Switch to alternative provider

#### 5. Playwright Browser Crashes (Development)
**Symptom**: Tests fail with "Page crashed"

**Solutions**:
- This is expected in sandboxed environments
- Tests work fine in real browsers
- Application works correctly when accessed normally
- Run `npm run build && npm start` to test production build

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=mangafusion:* npm run start:dev

# See all NestJS logs
LOG_LEVEL=debug npm run start:dev
```

### Check Service Health

```bash
# Backend health
curl http://localhost:4000/health

# Expected response
{"ok":true,"service":"mangafusion-backend"}
```

---

## Development Notes

### Project Structure

```
mangafusion/
├── backend/
│   ├── src/
│   │   ├── episodes/        # Episode management
│   │   ├── planner/         # AI story planning
│   │   ├── renderer/        # AI image generation
│   │   ├── storage/         # Supabase integration
│   │   ├── tts/             # ElevenLabs TTS
│   │   ├── queue/           # Background jobs
│   │   └── main.ts          # App entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── pages/
│   ├── index.tsx            # Homepage
│   ├── episodes/[id].tsx    # Episode viewer
│   ├── studio/[id].tsx      # Studio editor
│   └── api/                 # Next.js API routes (proxy)
├── components/
│   └── Layout.tsx           # Shared layout
├── styles/
│   └── globals.css          # Global styles
├── tests/                   # Playwright tests
├── playwright.config.ts     # Test configuration
├── next.config.js           # Next.js config
├── tailwind.config.js       # Tailwind config
└── package.json             # Frontend dependencies
```

### Testing

```bash
# Run Playwright tests
npx playwright test

# Run specific test
npx playwright test tests/app.spec.ts

# Run with UI
npx playwright test --ui
```

### Building for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build

# Start production
npm start  # Frontend
cd backend && npm run start:prod  # Backend
```

---

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/yourusername/mangafusion/issues
- Documentation: This file
- Example `.env`: See `backend/.env.example`

---

**Built with ❤️ for manga creators**
