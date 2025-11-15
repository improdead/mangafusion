# Story Continuity and Long-Term Narrative Memory Research

**Document Version**: 1.0
**Date**: 2025-11-15
**Purpose**: Research and design recommendations for implementing multi-episode manga series continuity

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Story Continuity Challenges](#story-continuity-challenges)
4. [Story Memory & Continuity Solutions](#story-memory--continuity-solutions)
5. [Narrative Context Systems](#narrative-context-systems)
6. [AI Context Management](#ai-context-management)
7. [Database Schema Design](#database-schema-design)
8. [Existing Tools & Patterns](#existing-tools--patterns)
9. [Recommended Architecture](#recommended-architecture)
10. [User Interface Considerations](#user-interface-considerations)
11. [Implementation Roadmap](#implementation-roadmap)
12. [References & Resources](#references--resources)

---

## Executive Summary

This document provides comprehensive research and recommendations for implementing story continuity and long-term narrative memory in MangaFusion to support multi-episode manga series creation.

### Key Findings

1. **Current Gap**: MangaFusion treats each episode as an isolated unit with no series-level continuity tracking
2. **Industry Solutions**: Tools like NovelAI, Sudowrite use hierarchical memory systems (Memory + Lorebook + Context)
3. **Technical Approach**: Combination of semantic embeddings, hierarchical summarization, and graph-based relationships
4. **Context Challenge**: AI models have token limits; must use smart compression and retrieval strategies
5. **Database Design**: Requires hierarchical structure (Series → Arc → Episode → Scene) with rich metadata

### Recommended Approach

**Three-Tier Memory System**:
1. **Persistent Story Bible**: Characters, locations, rules, relationships (always available)
2. **Episode Summaries**: Hierarchical summaries with semantic search (retrieved as needed)
3. **Recent Context**: Last N episodes/scenes kept verbatim (immediate continuity)

---

## Current State Analysis

### Existing Architecture

**Database Schema** (Prisma):
```prisma
model Episode {
  id            String   @id @default(uuid())
  seedInput     Json     // Title, genre, tone, setting, cast
  outline       Json?    // PlannerOutput with 10 pages
  rendererModel String?
  pages         Page[]
  characters    Character[]
  createdAt     DateTime
  updatedAt     DateTime
}

model Page {
  id         String     @id
  episodeId  String
  pageNumber Int
  status     PageStatus
  imageUrl   String?
  seed       Int?
  version    Int?
  error      String?
  overlays   Json?      // Dialogue overlays, etc.
  episode    Episode    @relation(fields: [episodeId], references: [id])
}

model Character {
  id            String   @id
  episodeId     String
  name          String
  description   String?
  assetFilename String   // e.g., "aoi.png"
  imageUrl      String?  // Generated character reference
  episode       Episode  @relation(fields: [episodeId], references: [id])
}
```

### Current Workflow

1. **Episode Creation**: User provides seed input (title, genre, cast, setting)
2. **Planning**: AI generates 10-page outline with character designs
3. **Character Generation**: Each character gets a reference image
4. **Page Generation**: 10 pages generated sequentially with character consistency
5. **Isolation**: Each episode is completely independent

### What's Working Well

- ✅ **Character Consistency**: Characters maintain visual consistency within an episode via reference images
- ✅ **Visual Style**: Page 1 establishes style, subsequent pages follow it
- ✅ **Structured Planning**: 10-page outline with beats, dialogues, actions
- ✅ **Dialogue Tracking**: Structured dialogue per panel

### Critical Gaps for Series Continuity

- ❌ **No Series Entity**: Episodes aren't grouped into series
- ❌ **No Story Arcs**: No concept of multi-episode story arcs
- ❌ **No Character Evolution**: Characters reset each episode
- ❌ **No World State**: Location details, rules, timeline not preserved
- ❌ **No Plot Memory**: Past events, foreshadowing, callbacks impossible
- ❌ **No Relationship Tracking**: Character relationships don't evolve
- ❌ **No Canon Management**: Can't mark episodes as canon/non-canon/what-if

---

## Story Continuity Challenges

### 1. Narrative Continuity Challenges

**Character Consistency Across Episodes**
- Characters must maintain personality, relationships, growth arcs
- Visual designs must stay consistent (or evolve deliberately)
- Skills/abilities gained should persist
- Emotional state and development should carry forward

**Plot Thread Management**
- Ongoing storylines that span multiple episodes
- Foreshadowing and callbacks to earlier events
- Mystery/revelation tracking (what readers know vs. what characters know)
- Parallel plot threads that converge

**World-Building Consistency**
- Locations maintain consistent descriptions and layouts
- World rules (magic systems, technology, society) stay stable
- Timeline and chronology tracking
- Weather, seasons, time passage

**Tone and Style Evolution**
- Visual style may evolve but should feel cohesive
- Narrative tone should maintain series identity
- Genre conventions should remain consistent

### 2. Technical Challenges

**AI Context Window Limits**
- GPT-5-Mini: ~128K tokens (~96K words) context window
- GPT-Image-1: ~32K character prompt limit
- Gemini 2.5 Flash: ~1M tokens but summarization still needed
- Can't fit entire series history in one prompt

**Character Visual Drift**
- AI image generation may produce slight variations
- Need strong reference images and consistent prompts
- Multiple character reference images may be needed (expressions, angles)

**Combinatorial Explosion**
- With N episodes, tracking N² relationships becomes complex
- Graph structure grows rapidly
- Query performance degrades without optimization

**Storage and Performance**
- Episode count grows over time
- Image storage costs increase
- Query complexity for "what happened when" searches

### 3. Creative Challenges

**Balancing Freedom vs. Continuity**
- Too strict: limits creativity, makes series feel rigid
- Too loose: continuity errors, plot holes
- Need flexibility for retcons and story evolution

**Canon vs. Non-Canon**
- Side stories, what-if scenarios, alternate timelines
- Flashbacks, dream sequences, unreliable narrators
- Need to track what "counts" in main continuity

**Multiple Authors/Collaborators**
- If system supports collaboration, need consensus on canon
- Version control for story elements
- Conflict resolution when changes contradict

---

## Story Memory & Continuity Solutions

### 1. Core Memory Types

Based on research into NovelAI, Sudowrite, and game narrative systems, we need **three tiers of memory**:

#### Tier 1: Story Bible (Persistent, Always Active)
**What**: Canonical reference data that's always available to AI
**Contains**:
- Character profiles (personality, appearance, abilities, relationships)
- Location codex (descriptions, maps, significance)
- World rules (magic systems, technology, society, physics)
- Important objects (artifacts, weapons, items)
- Faction/organization data
- Timeline of major events

**Storage**: Dedicated database tables with structured fields
**Retrieval**: Always injected into AI context (budget: ~2-5K tokens)
**Update Pattern**: Manual edits + AI-suggested updates after each episode

#### Tier 2: Episode Memory (Summarized, Semantically Retrieved)
**What**: Compressed summaries of past episodes with semantic search
**Contains**:
- Per-episode summaries (hierarchical: full → medium → short)
- Per-scene/page summaries
- Plot events and consequences
- Character interactions and relationship changes
- Emotional beats and themes

**Storage**: Summaries in database + vector embeddings for semantic search
**Retrieval**: Dynamically selected based on relevance to current episode (budget: ~3-8K tokens)
**Update Pattern**: Auto-generated after episode completion, human-editable

#### Tier 3: Recent Context (Verbatim, Window-Based)
**What**: Full text of recent episodes for immediate continuity
**Contains**:
- Last 1-3 episodes in full detail
- Current episode outline and generated pages

**Storage**: Database + in-memory cache
**Retrieval**: Always included for immediate episodes (budget: ~10-20K tokens)
**Update Pattern**: Sliding window, automatically maintained

### 2. Character Relationship Evolution

**Relationship Graph**:
```typescript
type Relationship = {
  characterA: string;
  characterB: string;
  type: 'ally' | 'enemy' | 'romantic' | 'family' | 'mentor' | 'rival' | 'neutral';
  strength: number; // -100 to +100
  history: RelationshipEvent[];
  currentStatus: string; // e.g., "estranged", "close friends", "complicated"
  firstMet: EpisodeReference;
  lastInteraction: EpisodeReference;
}

type RelationshipEvent = {
  episodeId: string;
  pageNumber?: number;
  description: string;
  impact: number; // How much this changed the relationship
  timestamp: Date;
}
```

**Update Strategy**:
- After each episode, AI reviews interactions and suggests relationship updates
- User can approve/reject/edit suggestions
- Relationship changes feed into character profiles for next episode

### 3. World-Building Consistency

**Location System**:
```typescript
type Location = {
  id: string;
  name: string;
  description: string; // Rich text description
  visualDescription: string; // For image generation
  type: 'city' | 'building' | 'room' | 'landscape' | 'other';
  parentLocation?: string; // Hierarchy: room → building → city
  firstAppearance: EpisodeReference;
  appearances: EpisodeReference[];
  referenceImages: string[]; // URLs to generated images of this location
  rules: string[]; // Special properties, e.g., "no magic allowed"
  inhabitants: string[]; // Character IDs
  significance: string; // Why this place matters to the story
}
```

**Consistency Checking**:
- Before generating episode, AI reviews mentioned locations
- Flag inconsistencies (e.g., character in two places at once)
- Suggest corrections or explanations

### 4. Story Arc Management

**Arc System**:
```typescript
type StoryArc = {
  id: string;
  seriesId: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'abandoned';
  type: 'main' | 'subplot' | 'character' | 'theme';

  episodes: string[]; // Episode IDs in this arc
  plotPoints: PlotPoint[];

  foreshadowing: Foreshadowing[];
  payoffs: Payoff[];

  startEpisode?: string;
  endEpisode?: string;
}

type PlotPoint = {
  id: string;
  description: string;
  episodeId?: string; // Where this happens (if already occurred)
  pageNumber?: number;
  status: 'foreshadowed' | 'planned' | 'occurred' | 'resolved';
  type: 'setup' | 'development' | 'climax' | 'resolution';
}

type Foreshadowing = {
  id: string;
  hint: string; // What was hinted at
  episodeId: string; // Where the hint appeared
  payoffId?: string; // Link to eventual payoff
  subtlety: 'obvious' | 'moderate' | 'subtle';
}

type Payoff = {
  id: string;
  resolution: string;
  episodeId?: string;
  setupIds: string[]; // Links to foreshadowing
}
```

**Arc Planning Interface**:
- Visual timeline showing arcs and episodes
- Drag-and-drop arc planning
- AI suggests arc ideas based on existing story
- Continuity checker warns about unresolved plot threads

### 5. Canon Management

**Episode Types**:
```typescript
type EpisodeCanonStatus =
  | 'canon' // Main storyline
  | 'side_story' // Canon but not main plot
  | 'flashback' // Past events, canon
  | 'what_if' // Alternate timeline, non-canon
  | 'dream' // Not real within story
  | 'retconned'; // Was canon, now replaced

type Episode = {
  // ... existing fields ...
  canonStatus: EpisodeCanonStatus;
  canonPriority: number; // Higher = more important to continuity
  timelinePosition?: number; // For flashbacks/flashforwards
  replacedBy?: string; // If retconned, link to replacement
}
```

**Continuity Error Detection**:
- Track contradictions between episodes
- AI flags potential errors (e.g., "Character X died in Ep 3 but appears in Ep 5")
- User can resolve: mark as error, mark as non-canon, add explanation
- Store resolutions in continuity log

---

## Narrative Context Systems

### 1. Episode Summarization

**Multi-Level Summaries** (inspired by hierarchical summarization):

```typescript
type EpisodeSummary = {
  episodeId: string;

  // Different compression levels
  oneLine: string; // Tweet-length (280 chars)
  short: string; // Paragraph (500-1000 chars)
  medium: string; // Half-page (2000-3000 chars)
  full: string; // Full summary with all plot points (5000-8000 chars)

  // Structured data
  keyEvents: KeyEvent[];
  charactersAppearing: string[];
  locationsVisited: string[];
  plotThreadsAdvanced: string[]; // Arc IDs
  emotionalBeats: string[];

  // Metadata
  generatedAt: Date;
  manuallyEdited: boolean;
  embedding?: number[]; // Vector embedding for semantic search
}

type KeyEvent = {
  description: string;
  importance: 'critical' | 'major' | 'minor';
  pageNumber?: number;
  characters: string[];
  consequences: string[];
}
```

**Summarization Strategy**:
1. **Automatic Generation**: After episode completes, AI generates all summary levels
2. **Human Review**: User can edit summaries to emphasize what matters
3. **Embedding**: Generate vector embedding of medium summary for semantic search
4. **Storage**: Store in database, index embeddings in vector store

**Example Workflow**:
```
Episode Complete
  ↓
Generate Summaries (GPT-5-Mini)
  ├─ One-line: Extract most important sentence
  ├─ Short: Compress full outline to paragraph
  ├─ Medium: Detailed summary of each page's beat
  └─ Full: Complete plot with all character moments
  ↓
Extract Structured Data
  ├─ Parse character appearances from dialogue
  ├─ Identify location mentions
  ├─ Tag plot threads from arc system
  └─ Classify emotional beats (triumph, loss, mystery, etc.)
  ↓
Generate Embedding (OpenAI text-embedding-3-large)
  ↓
Store in Database + Vector Store (Supabase pgvector)
  ↓
User Reviews & Edits
```

### 2. Plot Graph / Timeline Visualization

**Visual Timeline System**:
- Horizontal timeline showing all episodes in order
- Color-coded by arc
- Vertical stacks for parallel plots
- Hover shows episode summary
- Click to expand details

**Graph Structure**:
```typescript
type PlotGraph = {
  nodes: PlotNode[];
  edges: PlotEdge[];
}

type PlotNode = {
  id: string;
  type: 'episode' | 'event' | 'character_moment' | 'location';
  label: string;
  episodeId?: string;
  pageNumber?: number;
  timestamp: number; // In-story timeline position
  metadata: any;
}

type PlotEdge = {
  from: string; // Node ID
  to: string;
  type: 'causes' | 'references' | 'foreshadows' | 'parallels' | 'contrasts';
  label?: string;
}
```

**Visualization Tools** (potential libraries):
- **React Flow**: For interactive node graphs
- **Vis.js Timeline**: For horizontal timelines
- **D3.js**: For custom visualizations
- **Mermaid**: For generated diagrams in documentation

### 3. Character Interaction History

**Interaction Tracking**:
```typescript
type CharacterInteraction = {
  id: string;
  episodeId: string;
  pageNumber?: number;

  participants: string[]; // Character IDs
  type: 'dialogue' | 'conflict' | 'cooperation' | 'revelation' | 'reunion';
  summary: string;

  emotionalTone: string[];
  relationshipImpact: {
    [characterPair: string]: number; // -100 to +100
  };

  topics: string[]; // What they discussed
  decisions: string[]; // Choices made during interaction
}
```

**History View**:
- Per-character timeline of all interactions
- Filter by character pair (e.g., "All Aoi & Kenji scenes")
- Visualize relationship evolution over time
- Export interaction history as context for AI

### 4. Important Events Tracking

**Event Registry**:
```typescript
type ImportantEvent = {
  id: string;
  title: string;
  description: string;

  episodeId: string;
  pageNumber?: number;

  type: 'revelation' | 'death' | 'betrayal' | 'victory' | 'loss' | 'discovery' | 'transformation';
  importance: 'critical' | 'major' | 'moderate' | 'minor';

  charactersInvolved: string[];
  consequences: EventConsequence[];

  foreshadowedBy: string[]; // Links to earlier hints
  paysOff: string[]; // Links to later payoffs

  tags: string[];
  userNotes: string;
}

type EventConsequence = {
  description: string;
  affectedEntity: string; // Character, location, or world state
  type: 'character_change' | 'world_change' | 'relationship_change' | 'plot_progression';
}
```

**Auto-Detection**:
- AI scans generated episodes for significant events
- Uses narrative analysis to classify importance
- Suggests events for user to confirm/edit
- Links to relevant characters, locations, plot threads

### 5. Continuity Error Detection

**Error Detection System**:
```typescript
type ContinuityError = {
  id: string;
  type: 'contradiction' | 'timeline' | 'character' | 'location' | 'ability' | 'object';
  severity: 'critical' | 'major' | 'minor';
  status: 'detected' | 'confirmed' | 'resolved' | 'dismissed';

  description: string;

  // References to conflicting content
  occurrences: ErrorOccurrence[];

  suggestedFix?: string;
  resolution?: string;
  resolvedAt?: Date;
}

type ErrorOccurrence = {
  episodeId: string;
  pageNumber?: number;
  excerpt: string;
}
```

**Detection Strategies**:

1. **Rule-Based Checks**:
   - Character appears after death (unless resurrection explained)
   - Timeline contradictions (event A before B, then B before A)
   - Location impossibility (character can't be in two places)
   - Ability consistency (character uses power they shouldn't have yet)

2. **AI-Powered Analysis**:
   - Prompt AI with: "Compare this episode to story bible. Find contradictions."
   - Use semantic search to find related past events
   - Check for character trait consistency
   - Verify relationship status matches history

3. **User Reporting**:
   - Allow users to flag potential errors
   - Community/collaborative feedback on public series
   - Manual continuity check tool

**Error Resolution Workflow**:
```
Error Detected
  ↓
User Reviews
  ├─ Dismiss (not actually an error)
  ├─ Confirm (is an error)
  └─ Needs Investigation
      ↓
If Confirmed:
  ├─ Edit Current Episode
  ├─ Edit Past Episode (retcon)
  ├─ Add Explanation (note in story bible)
  └─ Mark Episode as Non-Canon
      ↓
Update Story Bible & Summaries
  ↓
Resolved ✓
```

---

## AI Context Management

### 1. Context Budget Allocation

**Total Context Available**: ~100K tokens for GPT-5-Mini, ~1M for Gemini 2.5 Flash

**Recommended Allocation** (for GPT-5-Mini baseline):

| Component | Token Budget | Priority | Notes |
|-----------|--------------|----------|-------|
| System Prompt | 500-1K | Critical | Persona, formatting rules |
| Story Bible | 2-5K | Critical | Core facts, always included |
| Recent Episodes (Full) | 10-20K | High | Last 1-3 episodes verbatim |
| Retrieved Episode Summaries | 5-10K | Medium | Semantically relevant past episodes |
| Current Episode Context | 20-30K | Critical | Outline, generated pages so far |
| Character Profiles | 2-4K | High | Relevant characters for this episode |
| Location Descriptions | 1-2K | Medium | Locations appearing in episode |
| Plot Thread Context | 2-4K | Medium | Active arcs and plot points |
| User Instructions | 1-2K | High | Specific requests for this episode |
| **Total** | **44-78K** | - | Leaves 20-50K for AI response |

**Dynamic Adjustment**:
- For Gemini 2.5 Flash (1M tokens): Can include more summaries, full episodes
- For image generation prompts (32K char limit): Must be more selective
- Adjust based on episode complexity

### 2. Summarization Techniques

**Hierarchical Summarization** (based on research):

```typescript
async function generateHierarchicalSummary(episode: Episode): Promise<EpisodeSummary> {
  // Level 1: Summarize each page
  const pageSummaries = await Promise.all(
    episode.outline.pages.map(page =>
      summarizePage(page) // 100-200 chars each
    )
  );

  // Level 2: Combine page summaries into acts (pages 1-3, 4-7, 8-10)
  const actSummaries = [
    await combineSummaries(pageSummaries.slice(0, 3), 'setup'),
    await combineSummaries(pageSummaries.slice(3, 7), 'development'),
    await combineSummaries(pageSummaries.slice(7, 10), 'climax')
  ];

  // Level 3: Combine act summaries into full summary
  const fullSummary = await combineSummaries(actSummaries, 'complete');

  // Level 4: Extract one-line and short versions
  const oneLine = await extractKeyBeat(fullSummary);
  const shortSummary = await compressSummary(fullSummary, 1000);

  return {
    episodeId: episode.id,
    oneLine,
    short: shortSummary,
    medium: fullSummary,
    full: pageSummaries.join('\n'),
    // ... other fields
  };
}
```

**Compression Strategies**:

1. **Extractive Summarization**: Select most important sentences
   - Use TF-IDF to identify key information
   - Preserve character dialogue verbatim when significant

2. **Abstractive Summarization**: AI rewrites in compressed form
   - GPT-5-Mini prompt: "Summarize this episode in exactly 500 words, focusing on plot progression and character development"
   - Multiple passes for different lengths

3. **Structured Extraction**: Pull out facts
   - "List all character names mentioned"
   - "Extract locations visited"
   - "Identify decisions made"

### 3. Hierarchical Context Structure

**Context Layers** (from most general to most specific):

```
Series Level
├─ Series Bible (characters, locations, rules)
├─ Series Summary (overall plot arc)
└─ All Arc Summaries
    │
Arc Level
├─ Arc Summary
├─ Arc Plot Points
└─ Episodes in Arc
    │
Episode Level
├─ Episode Summary (multi-level)
├─ Character Interactions
└─ Pages/Scenes
    │
Scene/Page Level
├─ Page Beat
├─ Panel Descriptions
└─ Dialogue Lines
```

**Context Selection Algorithm**:
```typescript
async function buildContextForNewEpisode(
  seriesId: string,
  arcId: string,
  userPrompt: string
): Promise<string> {
  const context = [];

  // 1. System prompt (always)
  context.push(SYSTEM_PROMPT);

  // 2. Story Bible (always)
  const bible = await getStoryBible(seriesId);
  context.push(formatStoryBible(bible));

  // 3. Relevant arcs
  const currentArc = await getArc(arcId);
  context.push(formatArc(currentArc));

  // 4. Recent episodes (last 2-3)
  const recentEpisodes = await getRecentEpisodes(seriesId, 3);
  context.push(...recentEpisodes.map(formatEpisode));

  // 5. Semantically relevant episodes
  const relevant = await findRelevantEpisodes(seriesId, userPrompt, limit: 5);
  context.push(...relevant.map(e => e.summary.medium));

  // 6. Active plot threads
  const activePlots = await getActivePlotThreads(arcId);
  context.push(formatPlotThreads(activePlots));

  // 7. User prompt
  context.push(userPrompt);

  // 8. Verify token count and trim if needed
  return trimToTokenLimit(context.join('\n\n'), 80000);
}
```

### 4. Dynamic Context Selection

**Semantic Search** for relevant past episodes:

```typescript
// Generate embedding for current episode prompt
const queryEmbedding = await generateEmbedding(userPrompt);

// Find similar episodes using vector similarity
const relevantEpisodes = await vectorStore.similaritySearch(
  queryEmbedding,
  {
    seriesId,
    limit: 10,
    minSimilarity: 0.7
  }
);

// Rank by relevance and recency
const ranked = relevantEpisodes
  .map(ep => ({
    ...ep,
    score: ep.similarity * 0.7 + recencyBonus(ep.createdAt) * 0.3
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
```

**Keyword-Based Retrieval**:
```typescript
// Extract entities from prompt
const entities = await extractEntities(userPrompt);
// entities = { characters: ['Aoi', 'Kenji'], locations: ['Tokyo Tower'], ... }

// Find episodes mentioning these entities
const mentions = await findEpisodesMentioning(entities);

// Combine with semantic search results
const combined = mergeAndDeduplicate(semanticResults, mentions);
```

**Hybrid Retrieval** (inspired by SCORE framework):
- Combine TF-IDF (keyword matching) with cosine similarity (semantic)
- Weight by importance scores
- Prefer recent episodes when similarity is equal

### 5. Memory Consolidation Strategies

**Periodic Consolidation** (run after every N episodes):

```typescript
async function consolidateMemory(seriesId: string) {
  // 1. Re-summarize old episodes with better compression
  const oldEpisodes = await getEpisodesOlderThan(seriesId, '90 days');
  for (const ep of oldEpisodes) {
    if (ep.summary.medium.length > 2000) {
      ep.summary.medium = await compressSummary(ep.summary.medium, 1500);
      await updateEpisodeSummary(ep);
    }
  }

  // 2. Merge related plot threads
  const inactivePlots = await getInactivePlotThreads(seriesId);
  for (const plot of inactivePlots) {
    if (plot.status === 'completed') {
      await archivePlotThread(plot);
    }
  }

  // 3. Update story bible with new canonical facts
  const recentEpisodes = await getRecentEpisodes(seriesId, 10);
  const updates = await extractStoryBibleUpdates(recentEpisodes);
  await applyBibleUpdates(seriesId, updates);

  // 4. Regenerate series summary
  const allEpisodes = await getAllEpisodes(seriesId);
  const seriesSummary = await generateSeriesSummary(allEpisodes);
  await updateSeriesSummary(seriesId, seriesSummary);
}
```

**Archive Strategy**:
- Keep full data for all episodes (never delete)
- Mark old/irrelevant episodes as "archived" for context purposes
- Archived episodes only retrieved if explicitly relevant (high semantic similarity)
- Recent episodes (last 10) always considered "active"

---

## Database Schema Design

### 1. Core Schema

```prisma
// New top-level entity
model Series {
  id          String   @id @default(uuid())
  title       String
  description String?
  genre       String[]
  status      SeriesStatus

  // Story Bible
  characters  SeriesCharacter[]
  locations   Location[]
  worldRules  WorldRule[]

  // Structure
  arcs        StoryArc[]
  episodes    Episode[]

  // Metadata
  coverImage  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  // User ID if auth implemented

  // Settings
  canonOnly   Boolean @default(true)
  isPublic    Boolean @default(false)
}

enum SeriesStatus {
  planning
  in_progress
  on_hiatus
  completed
  abandoned
}

// Story Arc structure
model StoryArc {
  id          String   @id @default(uuid())
  seriesId    String
  series      Series   @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  title       String
  description String?
  type        ArcType
  status      ArcStatus

  episodes    Episode[]
  plotPoints  PlotPoint[]

  startEpisode String?
  endEpisode   String?

  order       Int      // Position in series
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([seriesId, order])
}

enum ArcType {
  main
  subplot
  character
  theme
}

enum ArcStatus {
  planned
  in_progress
  completed
  abandoned
}

// Enhanced Episode model
model Episode {
  id            String   @id @default(uuid())
  seriesId      String?  // Optional: standalone episodes still supported
  series        Series?  @relation(fields: [seriesId], references: [id])
  arcId         String?
  arc           StoryArc? @relation(fields: [arcId], references: [id])

  // Existing fields
  seedInput     Json
  outline       Json?
  rendererModel String?
  pages         Page[]
  characters    Character[]

  // New continuity fields
  episodeNumber Int?     // Position in series
  canonStatus   CanonStatus @default(canon)
  timelinePosition Float? // For flashbacks/flash-forwards

  summary       EpisodeSummary?

  // References
  previousEpisode String? // For sequential continuity
  nextEpisode     String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([seriesId, episodeNumber])
  @@index([arcId])
}

enum CanonStatus {
  canon
  side_story
  flashback
  what_if
  dream
  retconned
}

// Episode summaries with embeddings
model EpisodeSummary {
  id          String   @id @default(uuid())
  episodeId   String   @unique
  episode     Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  oneLine     String
  short       String   @db.Text
  medium      String   @db.Text
  full        String   @db.Text

  // Structured extraction
  keyEvents   Json     // KeyEvent[]
  characters  String[] // Character IDs
  locations   String[] // Location IDs
  plotThreads String[] // Arc/plot IDs
  emotionalBeats String[]

  // For semantic search (requires pgvector extension)
  embedding   Unsupported("vector(1536)")? // OpenAI embedding dimension

  manuallyEdited Boolean @default(false)
  generatedAt    DateTime @default(now())

  @@index([episodeId])
}

// Series-level character profiles
model SeriesCharacter {
  id          String   @id @default(uuid())
  seriesId    String
  series      Series   @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  name        String
  aliases     String[] // Other names they go by

  // Core profile
  description String   @db.Text // Personality, background
  visualDescription String @db.Text // For image generation

  // Appearance
  referenceImages String[] // URLs to character references
  designNotes     String?  @db.Text

  // Story role
  role        CharacterRole
  status      CharacterStatus

  // First appearance
  firstEpisode String?

  // Relationships (see separate table)
  relationshipsFrom Relationship[] @relation("CharacterA")
  relationshipsTo   Relationship[] @relation("CharacterB")

  // Evolution tracking
  abilityHistory Json? // { episodeId: abilities[] }
  statusHistory  Json? // { episodeId: status }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([seriesId, name])
}

enum CharacterRole {
  protagonist
  antagonist
  supporting
  minor
  background
}

enum CharacterStatus {
  active
  deceased
  missing
  inactive
  unknown
}

// Character relationships
model Relationship {
  id          String   @id @default(uuid())

  characterAId String
  characterA   SeriesCharacter @relation("CharacterA", fields: [characterAId], references: [id], onDelete: Cascade)

  characterBId String
  characterB   SeriesCharacter @relation("CharacterB", fields: [characterBId], references: [id], onDelete: Cascade)

  type        RelationType
  strength    Int      // -100 to +100
  status      String   // Free text: "estranged", "close friends", etc.

  firstMet    String?  // Episode ID
  lastInteraction String? // Episode ID

  history     RelationshipEvent[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([characterAId, characterBId])
}

enum RelationType {
  ally
  enemy
  romantic
  family
  mentor
  rival
  neutral
}

model RelationshipEvent {
  id            String   @id @default(uuid())
  relationshipId String
  relationship   Relationship @relation(fields: [relationshipId], references: [id], onDelete: Cascade)

  episodeId     String
  pageNumber    Int?

  description   String   @db.Text
  impact        Int      // -100 to +100

  timestamp     DateTime @default(now())
}

// Locations
model Location {
  id          String   @id @default(uuid())
  seriesId    String
  series      Series   @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  name        String
  description String   @db.Text
  visualDescription String @db.Text // For image generation

  type        LocationType
  parentLocationId String? // Hierarchy
  parentLocation   Location? @relation("LocationHierarchy", fields: [parentLocationId], references: [id])
  childLocations   Location[] @relation("LocationHierarchy")

  firstAppearance String? // Episode ID
  appearances     String[] // Episode IDs

  referenceImages String[] // Generated images

  rules       String[] // Special properties
  inhabitants String[] // Character IDs
  significance String? @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([seriesId, name])
}

enum LocationType {
  city
  building
  room
  landscape
  dimension
  other
}

// World rules (magic systems, technology, etc.)
model WorldRule {
  id          String   @id @default(uuid())
  seriesId    String
  series      Series   @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  name        String
  category    RuleCategory
  description String   @db.Text

  establishedIn String? // Episode ID
  exceptions    String?  @db.Text

  relatedCharacters String[] // Character IDs affected
  relatedLocations  String[] // Location IDs where this applies

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([seriesId, name])
}

enum RuleCategory {
  magic
  technology
  society
  physics
  other
}

// Plot points and threads
model PlotPoint {
  id          String   @id @default(uuid())
  arcId       String
  arc         StoryArc @relation(fields: [arcId], references: [id], onDelete: Cascade)

  title       String
  description String   @db.Text

  episodeId   String?  // Where this occurred
  pageNumber  Int?

  status      PlotStatus
  type        PlotType
  importance  Importance

  foreshadowing Foreshadowing[]
  payoffs       Payoff[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum PlotStatus {
  foreshadowed
  planned
  occurred
  resolved
}

enum PlotType {
  setup
  development
  climax
  resolution
}

enum Importance {
  critical
  major
  moderate
  minor
}

// Foreshadowing tracking
model Foreshadowing {
  id          String   @id @default(uuid())
  plotPointId String
  plotPoint   PlotPoint @relation(fields: [plotPointId], references: [id], onDelete: Cascade)

  hint        String   @db.Text
  episodeId   String
  pageNumber  Int?

  subtlety    Subtlety
  payoffId    String?  // Link to Payoff

  createdAt   DateTime @default(now())
}

enum Subtlety {
  obvious
  moderate
  subtle
}

model Payoff {
  id          String   @id @default(uuid())
  plotPointId String
  plotPoint   PlotPoint @relation(fields: [plotPointId], references: [id], onDelete: Cascade)

  resolution  String   @db.Text
  episodeId   String?
  pageNumber  Int?

  setupIds    String[] // Foreshadowing IDs

  createdAt   DateTime @default(now())
}

// Important events
model ImportantEvent {
  id          String   @id @default(uuid())
  seriesId    String   // Not foreign key to avoid cascade issues

  title       String
  description String   @db.Text

  episodeId   String
  pageNumber  Int?

  type        EventType
  importance  Importance

  charactersInvolved String[] // Character IDs
  consequences       Json      // EventConsequence[]

  foreshadowedBy String[] // Foreshadowing IDs
  paysOff        String[] // Payoff IDs

  tags        String[]
  userNotes   String?  @db.Text

  createdAt   DateTime @default(now())
}

enum EventType {
  revelation
  death
  betrayal
  victory
  loss
  discovery
  transformation
}

// Continuity errors
model ContinuityError {
  id          String   @id @default(uuid())
  seriesId    String

  type        ErrorType
  severity    Severity
  status      ErrorStatus

  description String   @db.Text
  occurrences Json     // ErrorOccurrence[]

  suggestedFix String?  @db.Text
  resolution   String?  @db.Text

  detectedAt  DateTime @default(now())
  resolvedAt  DateTime?
}

enum ErrorType {
  contradiction
  timeline
  character
  location
  ability
  object
}

enum Severity {
  critical
  major
  minor
}

enum ErrorStatus {
  detected
  confirmed
  resolved
  dismissed
}
```

### 2. Database Indexes

**Critical Indexes**:
```sql
-- Series queries
CREATE INDEX idx_episodes_series ON Episode(seriesId, episodeNumber);
CREATE INDEX idx_episodes_arc ON Episode(arcId);

-- Semantic search (requires pgvector extension)
CREATE INDEX idx_episode_summaries_embedding
  ON EpisodeSummary
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Character lookups
CREATE INDEX idx_series_characters_name ON SeriesCharacter(seriesId, name);
CREATE INDEX idx_relationships_characters ON Relationship(characterAId, characterBId);

-- Location searches
CREATE INDEX idx_locations_series ON Location(seriesId, name);

-- Timeline queries
CREATE INDEX idx_episodes_timeline ON Episode(seriesId, timelinePosition);

-- Event searches
CREATE INDEX idx_events_episode ON ImportantEvent(episodeId);
CREATE INDEX idx_events_characters ON ImportantEvent USING gin(charactersInvolved);
```

### 3. Relationship Modeling

**Character-to-Character** (handled by Relationship table above)

**Episode-to-Episode**:
```typescript
// Implicit through seriesId and episodeNumber
// Explicit through previousEpisode/nextEpisode fields
// Semantic through embedding similarity
```

**Episode-to-Arc**:
```typescript
// Direct foreign key relationship
// Many episodes can belong to one arc
// Episodes can exist without arcs (standalone)
```

**Character-to-Episode**:
```typescript
// Tracked through EpisodeSummary.characters array
// First appearance tracked in SeriesCharacter.firstEpisode
// Can query: "SELECT * FROM Episode e JOIN EpisodeSummary es ON e.id = es.episodeId WHERE 'char_id' = ANY(es.characters)"
```

### 4. Timeline/Chronology Tracking

**Timeline System**:
```typescript
// Each episode has timelinePosition (Float)
// Main story: 1.0, 2.0, 3.0, ...
// Flashback before Ep 1: 0.5
// Flashback between Ep 2 and 3: 2.5
// Flash-forward: 100.0, 101.0, ...

// Query chronological order:
SELECT * FROM Episode
WHERE seriesId = $1
ORDER BY timelinePosition ASC;

// Query story order:
SELECT * FROM Episode
WHERE seriesId = $1
ORDER BY episodeNumber ASC;
```

**Temporal References**:
```typescript
type TemporalReference = {
  episodeId: string;
  type: 'flashback' | 'flashforward' | 'dream' | 'alternate_timeline';
  referencesEpisode?: string; // Links to the "real" timepoint
  temporalOffset?: string; // e.g., "3 years earlier", "next week"
}
```

### 5. Tag/Category Systems

**Tagging Strategy**:
```prisma
model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  category  TagCategory

  episodes  EpisodeTag[]
  characters CharacterTag[]
  locations  LocationTag[]
}

enum TagCategory {
  theme
  genre
  mood
  content_warning
  narrative_device
  custom
}

model EpisodeTag {
  episodeId String
  episode   Episode @relation(fields: [episodeId], references: [id])
  tagId     String
  tag       Tag     @relation(fields: [tagId], references: [id])

  @@id([episodeId, tagId])
}
```

**Hierarchical Tags**:
```typescript
// Tags can have parent/child relationships
// Example: "combat" > "swordfight", "magic" > "fire_magic"

model Tag {
  // ... existing fields ...
  parentTagId String?
  parentTag   Tag?   @relation("TagHierarchy", fields: [parentTagId], references: [id])
  childTags   Tag[]  @relation("TagHierarchy")
}
```

---

## Existing Tools & Patterns

### 1. NovelAI Pattern

**Key Takeaways**:
- **Memory**: Short persistent text always in context (200-500 tokens)
- **Lorebook**: Triggered entries based on keywords/regex
  - Each entry has activation keys
  - Can be "always on" or conditional
  - Budget system (max tokens per category)
- **Context Viewer**: Shows exactly what AI saw in last generation
  - Helps debug bloat and trimmed entries
  - Verify memory/lorebook usage

**Application to MangaFusion**:
```typescript
// Story Bible = NovelAI Memory (always on)
// Character/Location profiles = Lorebook entries
// Activation: Triggered when mentioned in user prompt

type LoreEntry = {
  id: string;
  type: 'character' | 'location' | 'rule' | 'event';
  content: string;
  activationKeys: string[]; // Triggers when these appear in prompt
  alwaysActive: boolean;
  priority: number;
  tokenBudget: number;
}

// When building context:
function buildContext(prompt: string, lore: LoreEntry[]) {
  const active = lore.filter(entry =>
    entry.alwaysActive ||
    entry.activationKeys.some(key =>
      prompt.toLowerCase().includes(key.toLowerCase())
    )
  );

  // Sort by priority, apply token budget
  return allocateTokens(active);
}
```

### 2. Sudowrite Pattern

**Key Takeaways**:
- **Chapter Continuity**: Links chapters sequentially
  - Reads up to 25 previous chapters (20K words)
  - Creates smooth transitions and character arcs
- **Story Bible**: Tracks characters, settings, plot
  - Character-aware menus auto-populate
  - Maintains consistency across books
- **Series Timeline**: Tracks book order and events
- **POV & Tense Controls**: Ensures narrative consistency
- **Worldbuilding Cards**: Import/export lore

**Application to MangaFusion**:
```typescript
// Series = Sudowrite Project
// Story Arc = Book
// Episode = Chapter

// "Up to 25 previous chapters" → Include recent episodes + summaries
// "Story Bible" → SeriesCharacter, Location, WorldRule tables
// "Series Timeline" → timelinePosition field
// "POV & Tense" → Visual style consistency

// Auto-population:
async function getCharacterMenu(seriesId: string): Promise<string[]> {
  const characters = await db.seriesCharacter.findMany({
    where: { seriesId, status: 'active' }
  });
  return characters.map(c => c.name);
}
```

### 3. Obsidian Pattern

**Key Takeaways**:
- **Bidirectional Links**: `[[Character Name]]` creates automatic connections
- **Graph View**: Visualize how everything connects
- **Backlinks**: See all mentions of an entity
- **Tags**: Flexible categorization
- **Daily Notes**: Can adapt for episode-by-episode work

**Application to MangaFusion**:
```typescript
// Auto-linking in episode text:
// When user types "[[Aoi]]", create link to character
// Show backlinks: "Aoi appears in Episodes 1, 3, 5, 7"

// Graph view:
// Nodes: Episodes, Characters, Locations
// Edges: Appears-in, References, Foreshadows

type GraphNode = {
  id: string;
  type: 'episode' | 'character' | 'location' | 'event';
  label: string;
  data: any;
}

type GraphEdge = {
  from: string;
  to: string;
  type: 'appears_in' | 'mentions' | 'foreshadows' | 'references';
}

// Build graph:
async function buildSeriesGraph(seriesId: string): Promise<Graph> {
  // Add character nodes
  // Add episode nodes
  // Add edges from EpisodeSummary.characters
  // Add edges from PlotPoint relationships
  // ...
}
```

### 4. Game Narrative Systems (Articy, Ink)

**Key Takeaways**:
- **Node-Based Editing**: Visual dialogue/story trees
- **Variable Tracking**: State management for player choices
- **Conditional Logic**: Content unlocked based on state
- **Branching Visualization**: See all possible paths
- **Export Formats**: JSON, XML for engine integration

**Application to MangaFusion**:
```typescript
// Branching: Support alternate timelines, what-if scenarios
// Variables: Track world state changes
// Conditional: "This arc only makes sense if Character X is alive"

type WorldState = {
  seriesId: string;
  variables: {
    [key: string]: any; // e.g., { "magic_revealed": true, "villain_defeated": false }
  };
  updatedAt: Date;
}

// Conditional episode:
type Episode = {
  // ... existing fields ...
  prerequisites?: Condition[];
}

type Condition = {
  variable: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'exists';
  value: any;
}

// Check if episode can be created:
function canCreateEpisode(episode: Episode, state: WorldState): boolean {
  return episode.prerequisites?.every(cond =>
    evaluateCondition(cond, state.variables)
  ) ?? true;
}
```

### 5. Vector Embeddings / Semantic Search Pattern

**Key Takeaways** (from research):
- **SCORE Framework**: For narrative AI
  - Dynamic State Tracking (symbolic logic for entities)
  - Context-Aware Summarization (hierarchical)
  - Hybrid Retrieval (TF-IDF + semantic embeddings)
  - Results: 23.6% higher coherence, 89.7% emotional consistency
- **Embeddings**: Dense vector representations of text
  - Semantic similarity via cosine distance
  - Vector databases (pgvector, Pinecone, Weaviate)
- **RAG (Retrieval-Augmented Generation)**: Fetch relevant context before generation

**Application to MangaFusion**:
```typescript
// 1. Generate embeddings for episode summaries
import OpenAI from 'openai';
const openai = new OpenAI();

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1536
  });
  return response.data[0].embedding;
}

// 2. Store in database with pgvector
await prisma.$executeRaw`
  INSERT INTO EpisodeSummary (id, episodeId, medium, embedding)
  VALUES (${id}, ${episodeId}, ${summary}, ${embedding}::vector)
`;

// 3. Semantic search
async function findRelevantEpisodes(
  seriesId: string,
  query: string,
  limit: number = 5
): Promise<EpisodeSummary[]> {
  const queryEmbedding = await generateEmbedding(query);

  const results = await prisma.$queryRaw`
    SELECT es.*, e.title,
           1 - (es.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM EpisodeSummary es
    JOIN Episode e ON e.id = es.episodeId
    WHERE e.seriesId = ${seriesId}
    ORDER BY es.embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results;
}

// 4. Hybrid search (TF-IDF + semantic)
async function hybridSearch(
  seriesId: string,
  query: string
): Promise<EpisodeSummary[]> {
  // Semantic search
  const semanticResults = await findRelevantEpisodes(seriesId, query, 10);

  // Keyword search (PostgreSQL full-text search)
  const keywordResults = await prisma.$queryRaw`
    SELECT es.*, ts_rank(to_tsvector('english', es.medium), plainto_tsquery('english', ${query})) as rank
    FROM EpisodeSummary es
    JOIN Episode e ON e.id = es.episodeId
    WHERE e.seriesId = ${seriesId}
      AND to_tsvector('english', es.medium) @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 10
  `;

  // Combine and re-rank
  return mergeAndRank(semanticResults, keywordResults);
}
```

---

## Recommended Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Series      │  │  Episode     │  │  Story       │          │
│  │  Manager     │  │  Creator     │  │  Bible       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│  ┌──────▼────────────────▼─────────────────▼───────┐          │
│  │         Timeline Visualizer & Graph View         │          │
│  └──────────────────────┬───────────────────────────┘          │
└─────────────────────────┼──────────────────────────────────────┘
                          │ REST API
┌─────────────────────────▼──────────────────────────────────────┐
│                      Backend (NestJS)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Series Service (NEW)                     │      │
│  │  - Manage series, arcs, continuity                   │      │
│  │  - Build context with memory system                  │      │
│  │  - Detect continuity errors                          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Planner     │  │  Renderer    │  │  Summarizer  │          │
│  │  Service     │  │  Service     │  │  Service     │          │
│  │  (Enhanced)  │  │  (Enhanced)  │  │  (NEW)       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                          │                                      │
│  ┌───────────────────────▼──────────────────────────────┐      │
│  │           AI Provider Layer                           │      │
│  │  - OpenAI (GPT-5-Mini, GPT-Image-1, Embeddings)      │      │
│  │  - Google Gemini (2.5 Flash, Image Preview)          │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Prisma      │  │  pgvector    │  │  Supabase    │          │
│  │  (Postgres)  │  │  (Semantic   │  │  (Storage)   │          │
│  │              │  │   Search)    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### New Services

#### 1. Series Service
```typescript
@Injectable()
export class SeriesService {
  async createSeries(input: CreateSeriesInput): Promise<Series>;
  async getSeries(id: string): Promise<Series>;
  async updateStoryBible(seriesId: string, updates: StoryBibleUpdate);

  // Arc management
  async createArc(seriesId: string, input: CreateArcInput): Promise<StoryArc>;
  async getActivePlotThreads(arcId: string): Promise<PlotPoint[]>;

  // Context building
  async buildContextForEpisode(
    seriesId: string,
    arcId: string,
    userPrompt: string
  ): Promise<string>;

  // Continuity
  async detectContinuityErrors(seriesId: string): Promise<ContinuityError[]>;
  async resolveError(errorId: string, resolution: string);
}
```

#### 2. Summarizer Service
```typescript
@Injectable()
export class SummarizerService {
  async summarizeEpisode(episode: Episode): Promise<EpisodeSummary>;
  async generateEmbedding(text: string): Promise<number[]>;
  async findRelevantEpisodes(seriesId: string, query: string, limit: number);

  async consolidateMemory(seriesId: string): Promise<void>;
  async updateSeriesSummary(seriesId: string): Promise<string>;
}
```

#### 3. Enhanced Planner Service
```typescript
@Injectable()
export class PlannerService {
  // Existing: generateOutline(seed: EpisodeSeed)

  // NEW: Series-aware planning
  async generateEpisodeWithContinuity(
    seriesId: string,
    arcId: string,
    userPrompt: string
  ): Promise<PlannerOutput>;

  async suggestPlotPoints(arcId: string): Promise<PlotPoint[]>;
  async checkConsistency(episode: Episode, storyBible: StoryBible): Promise<Issue[]>;
}
```

### Context Building Flow

```
User Creates New Episode in Series
        ↓
SeriesService.buildContextForEpisode()
        ↓
    ┌───┴───────────────────────────────┐
    │                                   │
    ▼                                   ▼
Story Bible                    Relevant Episode Retrieval
(always include)                     ↓
    ↓                          Semantic Search (embeddings)
Character Profiles                   ↓
Location Profiles              TF-IDF Keyword Search
World Rules                          ↓
    │                          Merge & Rank Results
    │                                  │
    └──────────────┬───────────────────┘
                   ↓
            Assemble Context
                   ├─ System Prompt (500 tokens)
                   ├─ Story Bible (3K tokens)
                   ├─ Recent Episodes (15K tokens)
                   ├─ Retrieved Summaries (7K tokens)
                   ├─ Active Plot Threads (3K tokens)
                   └─ User Prompt (2K tokens)
                   ↓
            Verify Token Budget
            (trim if needed)
                   ↓
        Send to PlannerService
                   ↓
        AI Generates Outline
                   ↓
     Check Continuity Consistency
                   ↓
         User Reviews & Edits
                   ↓
        Generate Episode Pages
```

### Data Flow for Episode Creation

```
1. Planning Phase
   ├─ SeriesService.buildContextForEpisode()
   ├─ PlannerService.generateEpisodeWithContinuity()
   ├─ Store outline with episode
   └─ Extract mentioned characters/locations

2. Generation Phase
   ├─ For each page:
   │  ├─ Include story bible context
   │  ├─ Include character reference images
   │  └─ Generate with RendererService
   └─ Store pages

3. Post-Generation Phase
   ├─ SummarizerService.summarizeEpisode()
   ├─ Generate embedding for summary
   ├─ Extract key events, relationships
   ├─ Update character interaction history
   ├─ Update relationship strengths
   ├─ Detect continuity errors
   └─ Suggest story bible updates

4. User Review
   ├─ View episode + generated summary
   ├─ Edit summary if needed
   ├─ Approve story bible updates
   ├─ Resolve any continuity errors
   └─ Publish episode
```

---

## User Interface Considerations

### 1. Series Management UI

**Series Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│  Shadow Sketch                                 [Edit]   │
│  Urban fantasy manga series                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  📊 Stats:  12 Episodes  |  3 Arcs  |  8 Characters     │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Story Bible    │  │  Timeline       │              │
│  │                 │  │                 │              │
│  │  Characters (8) │  │  [Vis timeline] │              │
│  │  Locations (12) │  │                 │              │
│  │  World Rules(5) │  │  Ep1 → Ep2 → Ep3│              │
│  │                 │  │    ↓             │              │
│  │  [Manage]       │  │   Arc 1          │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  Recent Episodes:                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Ep 12: The Final Confrontation         [View]   │   │
│  │ Ep 11: Secrets Revealed                [View]   │   │
│  │ Ep 10: Gathering Storm                 [View]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [+ Create New Episode]  [+ Create New Arc]             │
└─────────────────────────────────────────────────────────┘
```

**Story Bible Editor**:
```
┌─────────────────────────────────────────────────────────┐
│  Story Bible: Shadow Sketch               [Save] [Help] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  📑 Categories:                                          │
│  ├─ Characters (8)        ← Selected                    │
│  ├─ Locations (12)                                      │
│  ├─ World Rules (5)                                     │
│  ├─ Important Events (24)                               │
│  └─ Plot Threads (6)                                    │
│                                                          │
│  ┌──────────────┬────────────────────────────────────┐  │
│  │ Characters   │  Aoi Nakamura                      │  │
│  │              │  ────────────────                  │  │
│  │ • Aoi        │                                    │  │
│  │ • Kenji      │  Protagonist | Active              │  │
│  │ • Dr. Sato   │  First Appearance: Episode 1       │  │
│  │ • Shadow     │                                    │  │
│  │              │  [Portrait] [Ref Images: 3]        │  │
│  │ [+ Add]      │                                    │  │
│  │              │  Personality:                      │  │
│  │              │  [Determined artist who discovers  │  │
│  │              │   their sketches come to life...] │  │
│  │              │                                    │  │
│  │              │  Visual Description:               │  │
│  │              │  [Short dark hair, intense eyes,   │  │
│  │              │   black jacket, red scarf...]      │  │
│  │              │                                    │  │
│  │              │  Abilities:                        │  │
│  │              │  • Sketch Manifestation (Ep 1)     │  │
│  │              │  • Shadow Control (Ep 5)           │  │
│  │              │                                    │  │
│  │              │  Relationships:                    │  │
│  │              │  • Kenji: Close Friend (+85)       │  │
│  │              │  • Shadow: Rival/Complicated (-20) │  │
│  │              │                                    │  │
│  │              │  [Edit] [View History]             │  │
│  └──────────────┴────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Episode Creation Flow (Series-Aware)

**Step 1: Choose Series & Arc**:
```
┌─────────────────────────────────────────────────────────┐
│  Create New Episode                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Series:                                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Shadow Sketch ▾                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Story Arc:                                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Arc 2: The Shadow's Origin ▾                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Episode Number: [13]  (Previous: Ep 12)                │
│                                                          │
│  Canon Status:                                           │
│  ◉ Canon  ○ Side Story  ○ Flashback  ○ What-If          │
│                                                          │
│  Timeline Position:                                      │
│  ◉ After Episode 12  ○ Custom: [___]                    │
│                                                          │
│  [Next: Episode Details →]                               │
└─────────────────────────────────────────────────────────┘
```

**Step 2: Episode Details (With Context)**:
```
┌─────────────────────────────────────────────────────────┐
│  New Episode: Shadow Sketch #13                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Episode Title:                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ The Truth Unveiled                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  What happens in this episode?                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Aoi discovers the true origin of the Shadow and  │  │
│  │ must make a difficult choice...                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  🔍 Story Context (Auto-loaded):                         │
│  ├─ Last Episode: "The Final Confrontation"             │
│  │   → Aoi defeated the Shadow temporarily             │
│  ├─ Active Plot Thread: "Shadow's Origin Mystery"       │
│  └─ Referenced Characters: Aoi, Shadow, Dr. Sato        │
│                                                          │
│  Characters Appearing:                                   │
│  ☑ Aoi Nakamura    ☑ Shadow    ☑ Dr. Sato              │
│  ☐ Kenji Tanaka    [+ Add Character]                    │
│                                                          │
│  Locations:                                              │
│  ☑ Underground Laboratory (from Ep 8)                   │
│  [+ Add Location]                                        │
│                                                          │
│  Advance Plot Threads:                                   │
│  ☑ Shadow's Origin Mystery → Revelation                 │
│  ☑ Aoi's Power Growth                                   │
│  ☐ [+ Add Thread]                                        │
│                                                          │
│  Additional Notes for AI:                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Show flashback to when Shadow was created.       │  │
│  │ Emotional climax. Aoi must choose between power  │  │
│  │ and humanity.                                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  [← Back]  [Generate 10-Page Outline →]                 │
└─────────────────────────────────────────────────────────┘
```

**AI Context Preview** (Advanced users):
```
┌─────────────────────────────────────────────────────────┐
│  AI Context Preview                          [Collapse]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  📊 Token Budget: 45,832 / 100,000 tokens (45.8%)       │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ System Prompt                    782 tokens    │     │
│  │ Story Bible                     4,234 tokens    │     │
│  │ Recent Episodes (3)            18,456 tokens    │     │
│  │ Retrieved Summaries (5)         8,921 tokens    │     │
│  │ Active Plot Threads             3,112 tokens    │     │
│  │ Character Profiles              2,845 tokens    │     │
│  │ Location Descriptions           1,234 tokens    │     │
│  │ User Prompt                     6,248 tokens    │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Retrieved Episodes (by relevance):                      │
│  1. Ep 8: "The Laboratory" (similarity: 0.89)           │
│  2. Ep 3: "First Shadow Encounter" (0.76)               │
│  3. Ep 12: "The Final Confrontation" (0.74)             │
│  4. Ep 5: "Awakening Powers" (0.71)                     │
│  5. Ep 1: "Discovery" (0.68)                            │
│                                                          │
│  [View Full Context] [Adjust Budget]                    │
└─────────────────────────────────────────────────────────┘
```

### 3. Timeline Visualization

**Interactive Timeline**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Shadow Sketch Timeline                    [Canon Only ▾] [🔍]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  Arc 1: Discovery ════════════════════╗                         │
│  ┌──┬──┬──┬──┐                        ║                         │
│  │E1│E2│E3│E4│                        ║                         │
│  └──┴──┴──┴──┘                        ║                         │
│                                        ║                         │
│  Arc 2: Revelations ═══════════════════╬═══════════╗            │
│                    ┌──┬──┬──┬──┬──┐   ║           ║            │
│                    │E5│E6│E7│E8│E9│   ║           ║            │
│                    └──┴──┴──┴──┴──┘   ║           ║            │
│                                        ║           ║            │
│  Arc 3: Confrontation ═════════════════╩═══════════╬═══════╗   │
│                                     ┌──┬──┬──┬─?─┐ ║       ║   │
│                                     │10│11│12│13 │ ║       ║   │
│                                     └──┴──┴──┴───┘ ║       ║   │
│                                                     ║       ║   │
│  Side Stories ──────────────────────────────────────╩───────╩─  │
│          ┌────┐              ┌────┐                             │
│          │ S1 │              │ S2 │                             │
│          └────┘              └────┘                             │
│  (Flashback)              (What-If)                             │
│                                                                  │
│  [Hover for details | Click to view | Drag to reorder]          │
└─────────────────────────────────────────────────────────────────┘
```

**Graph View** (Obsidian-style):
```
┌─────────────────────────────────────────────────────────────────┐
│  Story Graph                              [Filter ▾] [Layout ▾] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│                    ╭──────────╮                                 │
│             ┌──────│   Aoi    │──────┐                          │
│             │      ╰──────────╯      │                          │
│             │                        │                          │
│         ╭───▼────╮              ╭────▼─────╮                    │
│         │  Ep 1  │              │  Shadow  │                    │
│         ╰───┬────╯              ╰────┬─────╯                    │
│             │                        │                          │
│         ╭───▼────╮              ╭────▼─────╮                    │
│         │  Ep 2  │◄─────────────│Dr. Sato  │                    │
│         ╰───┬────╯              ╰──────────╯                    │
│             │                                                    │
│         ╭───▼────╮      ╭──────────╮                            │
│         │  Ep 3  │─────►│  Kenji   │                            │
│         ╰───┬────╯      ╰────┬─────╯                            │
│             │                │                                   │
│            ...              ...                                  │
│                                                                  │
│  Legend:                                                         │
│  ●── Character appears in     ═══ Story arc                     │
│  ○── Character mentioned      ⚡ Conflict/tension                │
│  ─►  Foreshadows/references   ♥ Relationship                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Continuity Checker

**Error Dashboard**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Continuity Checker                       [Run Check] [Filter▾] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  🔴 Critical Issues (1)                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠ Character Timeline Error                                │ │
│  │                                                            │ │
│  │ Shadow appears in Episode 13 but was destroyed in Ep 12.  │ │
│  │                                                            │ │
│  │ Occurrences:                                               │ │
│  │ • Ep 12, Page 10: "Shadow dissolved into nothingness"     │ │
│  │ • Ep 13, Page 2: "Shadow reappeared in the laboratory"    │ │
│  │                                                            │ │
│  │ Suggested Fix:                                             │ │
│  │ Add explanation for Shadow's return (resurrection,         │ │
│  │ duplicate, or mark Ep 13 as flashback/alternate timeline) │ │
│  │                                                            │ │
│  │ [Edit Ep 13] [Edit Ep 12] [Add Explanation] [Dismiss]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🟡 Major Issues (3)                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠ Location Inconsistency                                  │ │
│  │ Laboratory described as "underground" in Ep 8 but          │ │
│  │ "rooftop facility" in Ep 13.                               │ │
│  │ [View Details] [Resolve]                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [+ 2 more]                                                      │
│                                                                  │
│  🟢 Minor Issues (5)  [Expand]                                   │
│  ✓ Resolved (12)     [View Archive]                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Relationship Tracker

**Relationship Matrix**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Character Relationships                         [View Graph ▾]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│           Aoi      Kenji    Shadow   Dr.Sato   Akane            │
│  Aoi      ─        +85♥     -20⚔     +40🎓     +65♥             │
│  Kenji    +85♥     ─        -5       +30       +20              │
│  Shadow   -20⚔     -5       ─        +15       -80⚔             │
│  Dr.Sato  +40🎓    +30      +15      ─          0               │
│  Akane    +65♥     +20      -80⚔     0          ─               │
│                                                                  │
│  ♥ Romantic  ⚔ Rivalry  🎓 Mentor  🤝 Alliance                   │
│                                                                  │
│  Selected: Aoi ↔ Shadow                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Rival / Complicated  |  Strength: -20                      │ │
│  │                                                             │ │
│  │ History:                                                    │ │
│  │ • Ep 1: First encounter – hostile (-30)                    │ │
│  │ • Ep 5: Shadow saves Aoi from danger (+15)                 │ │
│  │ • Ep 7: Betrayal revealed (-20)                            │ │
│  │ • Ep 12: Aoi defeats Shadow (-15)                          │ │
│  │ • Ep 13: Truth about Shadow's origin (+30) ← LATEST        │ │
│  │                                                             │ │
│  │ Current Status: "Understanding but cautious"               │ │
│  │                                                             │ │
│  │ [View Interaction Timeline] [Edit Relationship]            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Mobile/Responsive Considerations

- **Timeline**: Vertical scroll on mobile instead of horizontal
- **Graph View**: Touch gestures for zoom/pan
- **Story Bible**: Collapsible sections, search bar
- **Episode Creation**: Multi-step wizard with progress indicator
- **Context Preview**: Expandable accordion on mobile

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Database Schema**
- [ ] Extend Prisma schema with Series, Arc, SeriesCharacter, Location, etc.
- [ ] Create database migration scripts
- [ ] Set up pgvector extension for embeddings
- [ ] Create indexes for performance
- [ ] Seed development database with sample data

**Week 2: Backend Services - Part 1**
- [ ] Create SeriesService (CRUD for Series, Arcs)
- [ ] Create SummarizerService (episode summarization)
- [ ] Integrate OpenAI embeddings API
- [ ] Implement semantic search with pgvector
- [ ] Write unit tests for new services

**Week 3: Backend Services - Part 2**
- [ ] Enhance PlannerService for series-aware planning
- [ ] Implement context building logic
- [ ] Create relationship tracking system
- [ ] Implement continuity error detection (basic rules)
- [ ] API endpoints for series management

**Deliverable**: Working backend with series support, summarization, and basic continuity

---

### Phase 2: Frontend - Series UI (Weeks 4-6)

**Week 4: Series Management**
- [ ] Series dashboard page
- [ ] Story Bible editor UI
- [ ] Character profile forms
- [ ] Location management UI
- [ ] World rules editor

**Week 5: Episode Creation Flow**
- [ ] Series-aware episode creation form
- [ ] Arc selector
- [ ] Context preview component
- [ ] Character/location selector with autocomplete
- [ ] Plot thread tracking UI

**Week 6: Timeline & Visualization**
- [ ] Timeline component (React Flow or custom)
- [ ] Arc visualization
- [ ] Episode ordering UI
- [ ] Canon status badges
- [ ] Responsive mobile timeline

**Deliverable**: Full UI for creating and managing series

---

### Phase 3: Advanced Features (Weeks 7-9)

**Week 7: Graph Visualization**
- [ ] Character relationship graph (React Flow)
- [ ] Plot graph (events, foreshadowing, payoffs)
- [ ] Interactive filtering
- [ ] Zoom/pan/search
- [ ] Export graph as image

**Week 8: Continuity System**
- [ ] Continuity checker dashboard
- [ ] Error detection algorithms
- [ ] Resolution workflow UI
- [ ] Notification system for errors
- [ ] Auto-suggestions for fixes

**Week 9: Memory & Context**
- [ ] Memory consolidation cron job
- [ ] Hybrid search (TF-IDF + semantic)
- [ ] Dynamic context adjustment
- [ ] Context viewer (see what AI saw)
- [ ] Token budget visualization

**Deliverable**: Advanced continuity and memory features

---

### Phase 4: Polish & Optimization (Weeks 10-12)

**Week 10: Performance**
- [ ] Database query optimization
- [ ] Caching strategy (Redis)
- [ ] Lazy loading for large series
- [ ] Pagination for episodes/summaries
- [ ] Background jobs for summarization

**Week 11: UX Improvements**
- [ ] Onboarding flow for first-time users
- [ ] Tooltips and help text
- [ ] Keyboard shortcuts
- [ ] Dark mode support
- [ ] Accessibility audit (WCAG 2.1)

**Week 12: Testing & Documentation**
- [ ] E2E tests for series workflows (Playwright)
- [ ] Integration tests
- [ ] User documentation
- [ ] Video tutorials
- [ ] Migration guide for existing episodes

**Deliverable**: Production-ready series continuity system

---

### Future Enhancements (Post-MVP)

**Phase 5: Collaboration & Sharing**
- Multi-user series with permissions
- Collaborative story bible editing
- Version control for episodes
- Public series gallery
- Community feedback system

**Phase 6: AI Enhancements**
- AI-suggested plot twists based on foreshadowing
- Auto-generate character relationship updates
- Predictive continuity checking (warn before errors)
- Style transfer across episodes
- Voice cloning for consistent audiobook characters

**Phase 7: Export & Publishing**
- CBZ/EPUB export with embedded metadata
- Print-ready PDF generation
- Webtoon format conversion
- Integration with publishing platforms
- Analytics (views, engagement per episode)

---

## References & Resources

### Academic Papers
1. **SCORE Framework** - "Story Coherence and Retrieval Enhancement for AI Narratives"
   - https://arxiv.org/html/2503.23512v1
   - Key insights: Hybrid retrieval, hierarchical summarization for narrative coherence

2. **NEXUSSUM** - "Hierarchical LLM Agents for Long-Form Summarization"
   - Demonstrates 30% improvement in narrative summarization
   - Relevant for episode summary generation

### Tools & Platforms
1. **NovelAI** - https://novelai.net
   - Documentation: https://docs.novelai.net/en/text/lorebook/
   - Pattern: Memory + Lorebook + Context Viewer

2. **Sudowrite** - https://sudowrite.com
   - Documentation: https://docs.sudowrite.com
   - Pattern: Chapter Continuity + Story Bible + Series Timeline

3. **Articy Draft** - https://www.articy.com
   - Game narrative design tool
   - Pattern: Node-based editing + variable tracking

4. **Obsidian** - https://obsidian.md
   - Knowledge graph for writers
   - Pattern: Bidirectional links + graph view

### Technical Resources
1. **pgvector** - https://github.com/pgvector/pgvector
   - PostgreSQL extension for vector similarity search
   - Essential for semantic episode retrieval

2. **OpenAI Embeddings** - https://platform.openai.com/docs/guides/embeddings
   - text-embedding-3-large: 1536 dimensions
   - Cost-effective for semantic search

3. **Supabase AI** - https://supabase.com/docs/guides/ai
   - Built-in pgvector support
   - Example implementations of semantic search

4. **React Flow** - https://reactflow.dev
   - For graph/timeline visualizations
   - Highly customizable node-based UI

### Best Practices Articles
1. "Context Window Management Strategies for Long-Context AI" - https://www.getmaxim.ai/articles/context-window-management
2. "Hierarchical Summarization Techniques" - Multiple sources on compression ratios
3. "Graph Databases for Story Management" - Neo4j documentation

---

## Appendix A: Example Prompts

### Episode Planning Prompt (Series-Aware)

```
SYSTEM:
You are a manga production planner for the series "Shadow Sketch." You have access to the full story bible and previous episodes. Maintain strict continuity with established facts.

STORY BIBLE:
Characters:
- Aoi Nakamura: Protagonist, can manifest sketches into reality. Visual: short dark hair, red scarf, black jacket. Status: Active. Abilities: Sketch Manifestation (Ep 1), Shadow Control (Ep 5).
- Kenji Tanaka: Aoi's best friend, tech genius. Visual: messy brown hair, glasses, hoodie. Relationship with Aoi: +85 (close friends).
- Shadow: Mysterious antagonist, revealed in Ep 13 to be a failed experiment. Visual: dark silhouette, glowing eyes. Relationship with Aoi: -20 (rival, complicated).

Locations:
- Underground Laboratory: Secret facility under Tokyo Tower. First seen in Ep 8. Rules: No magic works here (anti-magic field).

World Rules:
- Sketch Manifestation: Requires concentration and emotional connection to the subject.
- Magic System: Powered by "creative energy" – imagination and willpower.

RECENT EPISODES:
Ep 12 Summary: Aoi confronts Shadow in a final battle. Shadow is seemingly defeated but hints at a deeper truth before vanishing.
Ep 11 Summary: Dr. Sato reveals the existence of the Underground Laboratory and its connection to Shadow's creation.

RELEVANT PAST EPISODES:
Ep 8: Aoi and Kenji first discover the Underground Laboratory.
Ep 5: Aoi awakens shadow control abilities, foreshadowing connection to Shadow.
Ep 1: Aoi first discovers sketch manifestation power.

ACTIVE PLOT THREADS:
- Arc 2: "Shadow's Origin Mystery" - Status: Nearing resolution
- Aoi's power growth arc
- Kenji's unrequited feelings for Aoi (subtle, not main plot)

USER REQUEST:
Episode 13: "The Truth Unveiled"
Aoi discovers the true origin of Shadow in the Underground Laboratory. Emotional climax where Aoi must choose between power and humanity. Include flashback to Shadow's creation. Characters: Aoi, Shadow, Dr. Sato.

TASK:
Generate a 10-page outline for Episode 13. Follow the established visual style (high-contrast manga B/W). Reference character asset files using tags like <aoi.png>. Ensure continuity with previous episodes, especially Ep 12's ending. The revelation should feel earned and answer questions raised in Ep 5 and Ep 11.

Return strict JSON matching PlannerOutput schema.
```

### Continuity Check Prompt

```
SYSTEM:
You are a continuity checker for manga series. Analyze the provided episode against the story bible and flag potential errors.

STORY BIBLE:
[... truncated ...]

EPISODE TO CHECK:
Episode 13: "The Truth Unveiled"
[Episode outline or generated pages]

TASK:
1. Check for contradictions with established facts
2. Verify character abilities match their progression
3. Check location descriptions for consistency
4. Verify timeline makes sense (no impossible sequences)
5. Check relationship dynamics match current status

Return JSON:
{
  "errors": [
    {
      "type": "character" | "location" | "timeline" | "ability" | "relationship",
      "severity": "critical" | "major" | "minor",
      "description": "...",
      "occurrences": [
        { "episodeId": "...", "pageNumber": 3, "excerpt": "..." }
      ],
      "suggestedFix": "..."
    }
  ],
  "warnings": [...],
  "suggestions": [...]
}
```

---

## Appendix B: Database Migration Examples

### Adding Series Support (Initial Migration)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Series table
CREATE TABLE "Series" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "genre" TEXT[],
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  "coverImage" TEXT,
  "canonOnly" BOOLEAN NOT NULL DEFAULT true,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Story Arcs
CREATE TABLE "StoryArc" (
  "id" TEXT PRIMARY KEY,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startEpisode" TEXT,
  "endEpisode" TEXT,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_storyarc_series" ON "StoryArc"("seriesId", "order");

-- Update Episode table
ALTER TABLE "Episode" ADD COLUMN "seriesId" TEXT REFERENCES "Series"("id");
ALTER TABLE "Episode" ADD COLUMN "arcId" TEXT REFERENCES "StoryArc"("id");
ALTER TABLE "Episode" ADD COLUMN "episodeNumber" INTEGER;
ALTER TABLE "Episode" ADD COLUMN "canonStatus" TEXT NOT NULL DEFAULT 'canon';
ALTER TABLE "Episode" ADD COLUMN "timelinePosition" REAL;
ALTER TABLE "Episode" ADD COLUMN "previousEpisode" TEXT;
ALTER TABLE "Episode" ADD COLUMN "nextEpisode" TEXT;

CREATE INDEX "idx_episode_series" ON "Episode"("seriesId", "episodeNumber");
CREATE INDEX "idx_episode_arc" ON "Episode"("arcId");

-- Episode Summaries
CREATE TABLE "EpisodeSummary" (
  "id" TEXT PRIMARY KEY,
  "episodeId" TEXT UNIQUE NOT NULL REFERENCES "Episode"("id") ON DELETE CASCADE,
  "oneLine" TEXT NOT NULL,
  "short" TEXT NOT NULL,
  "medium" TEXT NOT NULL,
  "full" TEXT NOT NULL,
  "keyEvents" JSONB NOT NULL,
  "characters" TEXT[] NOT NULL,
  "locations" TEXT[] NOT NULL,
  "plotThreads" TEXT[] NOT NULL,
  "emotionalBeats" TEXT[] NOT NULL,
  "embedding" vector(1536),
  "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
  "generatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_summary_episode" ON "EpisodeSummary"("episodeId");
CREATE INDEX "idx_summary_embedding" ON "EpisodeSummary"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

-- Series Characters
CREATE TABLE "SeriesCharacter" (
  "id" TEXT PRIMARY KEY,
  "seriesId" TEXT NOT NULL REFERENCES "Series"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "aliases" TEXT[],
  "description" TEXT NOT NULL,
  "visualDescription" TEXT NOT NULL,
  "referenceImages" TEXT[],
  "designNotes" TEXT,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "firstEpisode" TEXT,
  "abilityHistory" JSONB,
  "statusHistory" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("seriesId", "name")
);

-- Relationships
CREATE TABLE "Relationship" (
  "id" TEXT PRIMARY KEY,
  "characterAId" TEXT NOT NULL REFERENCES "SeriesCharacter"("id") ON DELETE CASCADE,
  "characterBId" TEXT NOT NULL REFERENCES "SeriesCharacter"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "strength" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "firstMet" TEXT,
  "lastInteraction" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("characterAId", "characterBId")
);

CREATE TABLE "RelationshipEvent" (
  "id" TEXT PRIMARY KEY,
  "relationshipId" TEXT NOT NULL REFERENCES "Relationship"("id") ON DELETE CASCADE,
  "episodeId" TEXT NOT NULL,
  "pageNumber" INTEGER,
  "description" TEXT NOT NULL,
  "impact" INTEGER NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ... (Continue with Location, WorldRule, PlotPoint, etc.)
```

---

## Conclusion

Implementing story continuity and long-term narrative memory for MangaFusion requires:

1. **Hierarchical Memory Architecture**: Story Bible + Episode Summaries + Recent Context
2. **Semantic Search**: Vector embeddings for intelligent context retrieval
3. **Rich Metadata**: Character relationships, plot graphs, timeline tracking
4. **AI-Assisted Continuity**: Auto-detection of errors, smart summarization
5. **Intuitive UI**: Timeline views, graph visualizations, easy-to-use editors

The recommended approach balances **automated AI assistance** with **human oversight**, ensuring creative freedom while maintaining consistency. By implementing this in phases, MangaFusion can evolve from a single-episode tool to a comprehensive manga series creation platform.

**Next Steps**:
1. Review and approve this research document
2. Prioritize features based on user needs
3. Begin Phase 1 implementation (database + backend services)
4. Iterate based on user feedback
5. Scale to support large series (100+ episodes)

This system will enable manga creators to build rich, interconnected stories that span multiple episodes while maintaining the quality and consistency readers expect.
