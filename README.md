# MangaFusion 🎌

Transform your ideas into stunning manga pages with AI-powered storytelling and image generation.

## Features

### 🎨 AI Story Planning
- 10-page outlines with panel hints, prompts, and dialogues
- Character design and consistency
- Visual style references

### 🖼️ Real Image Generation
- Nano Banana (Gemini 2.5 Flash Image Preview) renders crisp B/W manga pages
- Character consistency across pages
- Style reference support

### 📖 Audiobook Mode
- **NEW!** ElevenLabs Flash v2.5 TTS integration for dialogue narration
- Reader mode with full-screen page viewing
- Voice selection from available ElevenLabs voices
- Audio generation for each page's dialogue with natural pauses
- Usage tracking and character count monitoring
- Keyboard navigation (← → arrows, Space/Enter for audio, Esc to exit)

### ⚡ Instant Publishing
- Stream progress live during generation
- Studio editor for refining pages with overlays
- Real-time collaboration

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (for image storage)
- Google AI API key (for Gemini models)
- ElevenLabs API key (for audiobook feature)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd mangafusion
npm install
cd backend && npm install
```

2. **Configure environment variables:**
```bash
# Copy example files
cp backend/.env.example backend/.env
cp .env.local.example .env.local

# Edit backend/.env with your API keys:
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=manga-images
```

3. **Set up Supabase Storage:**
   - Create a new bucket named `manga-images`
   - Make it public
   - Set allowed MIME types: `image/png`, `image/jpeg`, `image/webp`, `audio/mpeg`

4. **Start development servers:**
```bash
# Start both frontend and backend
./dev.sh

# Or manually:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run start:dev
```

## API Keys Setup

### Google AI (Gemini)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

### ElevenLabs (Audiobook)
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the profile page
3. Add to `backend/.env` as `ELEVENLABS_API_KEY`
4. Optionally set `ELEVENLABS_DEFAULT_VOICE_ID` (defaults to Adam voice)
5. Optionally set `ELEVENLABS_MODEL` (defaults to `eleven_flash_v2_5` for speed and cost efficiency)

### Supabase (Storage)
1. Create a project at [Supabase](https://supabase.com/)
2. Go to Settings → API
3. Copy URL and anon key to `backend/.env`

## Usage

### Creating a Manga
1. Fill out the story form with title, genre, tone, setting, and characters
2. Optionally upload style reference images
3. Click "Generate Manga Episode"
4. Watch as AI plans and generates your 10-page manga

### Audiobook Mode
1. Once pages are generated, click "Reader Mode"
2. Navigate with arrow keys or buttons
3. Click "Read Aloud" or press Space/Enter to generate audio for the current page
4. Audio combines all dialogue and narration for the page

### Studio Editor
1. Click "Edit In Studio" from the episode page
2. Add text bubbles, images, and overlays
3. Use AI to regenerate pages with custom prompts
4. Insert dialogue suggestions from the planner

## Architecture

### Frontend (Next.js)
- `/pages/index.tsx` - Main creation form
- `/pages/episodes/[id].tsx` - Episode viewer with audiobook mode
- `/pages/studio/[id].tsx` - Studio editor
- `/components/` - Reusable UI components

### Backend (NestJS)
- `/src/planner/` - AI story planning with Gemini
- `/src/renderer/` - Image generation with Nano Banana
- `/src/tts/` - ElevenLabs text-to-speech integration
- `/src/episodes/` - Episode and page management
- `/src/storage/` - Supabase file storage

## Environment Variables

### Backend (`backend/.env`)
```bash
# Required
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional
PLANNER_MODEL=gemini-2.5-flash
RENDERER_IMAGE_MODEL=gemini-2.5-flash-image-preview
ELEVENLABS_DEFAULT_VOICE_ID=pNInz6obpgDQGcFmaJgB
ELEVENLABS_MODEL=eleven_flash_v2_5
SUPABASE_BUCKET=manga-images
PORT=4000
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
```

## Audiobook Feature Details

The audiobook feature uses ElevenLabs TTS to convert manga dialogue into speech:

1. **Dialogue Generation**: The planner creates structured dialogue for each panel
2. **Audio Synthesis**: ElevenLabs converts dialogue to natural speech
3. **Storage**: Audio files are stored in Supabase alongside images
4. **Playback**: Built-in audio player with controls

### Supported Dialogue Types
- **Dialogue**: Character speech with character name prefix
- **Narration**: Story narration without character attribution
- **Sound Effects**: Onomatopoeia and environmental sounds

### Reader Mode Controls
- **← →**: Navigate between pages
- **Space/Enter**: Generate and play audio for current page
- **Esc**: Exit reader mode
- **Audio Player**: Standard HTML5 controls for playback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the GitHub issues
2. Review the environment setup
3. Ensure all API keys are configured correctly
4. Check Supabase bucket permissions

---

Built with ❤️ using Next.js, NestJS, Gemini AI, and ElevenLabs TTS.