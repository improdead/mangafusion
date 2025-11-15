# Character Memory Systems Research for MangaFusion

**Document Version:** 1.0
**Date:** 2025-11-15
**Author:** Research Analysis

---

## Executive Summary

This document presents research findings and recommendations for implementing long-term character memory systems in MangaFusion, a manga/comic generation platform. The goal is to enable persistent character storage across episodes while maintaining visual consistency, personality traits, and relationship dynamics.

**Current State:**
- Characters are episode-specific and deleted when episodes are deleted (CASCADE)
- Character data: `id`, `episodeId`, `name`, `description`, `assetFilename`, `imageUrl`
- Character consistency is maintained within episodes via reference images
- No cross-episode character reusability or memory

**Recommended Primary Approach:** Hybrid Vector + Relational Database with Temporal Versioning (Approach #2)

---

## Table of Contents

1. [Problem Analysis](#1-problem-analysis)
2. [Current System Architecture](#2-current-system-architecture)
3. [Recommended Approaches](#3-recommended-approaches)
4. [Database Schema Proposals](#4-database-schema-proposals)
5. [Integration Points](#5-integration-points)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Research References](#7-research-references)

---

## 1. Problem Analysis

### 1.1 Core Challenges

**Character Consistency Across Episodes**
- Users want recurring characters to maintain visual appearance, personality, and style
- Current system regenerates characters from scratch for each episode
- No way to reference or import characters from previous episodes

**Character Evolution Over Time**
- Characters should be able to evolve (new outfits, aging, character development)
- Need to track character history and changes over time
- Maintain backward compatibility with old episodes

**Context Window Management**
- LLM prompts have token limits (4k-32k characters depending on model)
- Need efficient retrieval of relevant character information
- Must include only pertinent details for current generation context

**Relationship and Story Continuity**
- Characters have relationships with other characters
- Story arcs span multiple episodes
- Need to track character development, events, and interactions

### 1.2 Use Cases

1. **Serial Manga Creation:** User creates ongoing series with recurring cast
2. **Character Import:** User wants to use character from Episode A in new Episode B
3. **Character Evolution:** Character's appearance changes (new outfit, haircut, aging)
4. **Ensemble Cast:** Managing 10+ characters with complex relationships
5. **Multiverse Stories:** Same character in different art styles or alternate realities

---

## 2. Current System Architecture

### 2.1 Technology Stack
- **Database:** PostgreSQL via Prisma ORM
- **Storage:** Supabase Storage (S3-compatible)
- **AI Models:** OpenAI (gpt-5-mini, gpt-image-1) or Gemini (gemini-2.5-flash)
- **Backend:** NestJS
- **Frontend:** Next.js

### 2.2 Current Character Model

```prisma
model Character {
  id            String   @id @default(uuid())
  episodeId     String
  name          String
  description   String?
  assetFilename String
  imageUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([episodeId, assetFilename])
}
```

**Limitations:**
- Characters tied to specific episodes (foreign key with CASCADE delete)
- No cross-episode references
- No version history
- No rich metadata (personality, relationships, history)
- No semantic search capabilities

### 2.3 Character Usage in Generation Pipeline

1. **Planning Phase:** `PlannerService` generates character bible from episode seed
2. **Character Generation:** `RendererService.generateCharacter()` creates reference images
3. **Page Generation:** Character images passed as context via `characterAssets` parameter
4. **Prompt Injection:** Characters referenced using `<asset_filename>` tags (e.g., `<aoi.png>`)

---

## 3. Recommended Approaches

### Approach #1: Relational Database with JSON Metadata

**Overview:** Extend current Prisma schema with global character library and rich JSON metadata.

#### Architecture

```
GlobalCharacter (1) ──< (N) CharacterVersion (1) ──< (N) EpisodeCharacterUsage
```

#### Pros
- ✅ Minimal infrastructure changes (uses existing PostgreSQL)
- ✅ ACID transactions for data integrity
- ✅ Simple to implement with Prisma
- ✅ Easy to query and join with existing tables
- ✅ Version control via temporal tables

#### Cons
- ❌ Poor semantic search capabilities
- ❌ JSON querying less efficient than specialized tools
- ❌ Scaling concerns with large character libraries (1000+ characters)
- ❌ No built-in similarity search for "find similar characters"

#### Best For
- Small to medium deployments (< 500 characters)
- Teams already comfortable with SQL/Prisma
- MVP/Phase 1 implementation

---

### Approach #2: Hybrid Vector + Relational Database (RECOMMENDED)

**Overview:** Leverage Supabase's pgvector extension for semantic search while maintaining relational integrity.

#### Architecture

```
GlobalCharacter (relational) + character_embeddings (vector) + CharacterVersion (relational)
```

#### Key Features
- **Relational tables** for structured data (names, IDs, relationships)
- **Vector embeddings** for semantic search (personality traits, visual descriptions)
- **Temporal versioning** for character evolution tracking
- **pgvector** extension already available in Supabase PostgreSQL

#### Pros
- ✅ Best of both worlds: relational integrity + semantic search
- ✅ Uses existing Supabase infrastructure (no new services)
- ✅ Efficient similarity search for character discovery
- ✅ Context-aware retrieval for prompt optimization
- ✅ Scales to 10,000+ characters
- ✅ Supports multimodal embeddings (text + image)

#### Cons
- ⚠️ Requires learning pgvector and embeddings
- ⚠️ Embedding generation costs (OpenAI Embeddings API)
- ⚠️ Slightly more complex queries (vector similarity + SQL)
- ⚠️ Index maintenance overhead

#### Implementation Complexity
- **Phase 1 (2-3 weeks):** Basic global character library + simple embeddings
- **Phase 2 (2-3 weeks):** Semantic search + character versioning
- **Phase 3 (2-4 weeks):** Advanced RAG patterns + relationship graphs

#### Best For
- **Primary recommendation** for MangaFusion
- Production-ready, scalable solution
- Enables advanced features (semantic search, smart character suggestions)

---

### Approach #3: Graph Database with Character Relationships

**Overview:** Use Neo4j or similar graph database to model characters and their relationships.

#### Architecture

```
(Character)─[APPEARS_IN]→(Episode)
(Character)─[KNOWS]→(Character)
(Character)─[VERSION_OF]→(Character)
(Character)─[PARENT_OF]→(Character)
```

#### Pros
- ✅ Excellent for relationship modeling
- ✅ Natural representation of character networks
- ✅ Powerful traversal queries (e.g., "friends of friends")
- ✅ Supports complex story arcs and lineages

#### Cons
- ❌ Requires new infrastructure (Neo4j, etc.)
- ❌ Additional operational complexity
- ❌ Learning curve for team
- ❌ Need to maintain sync between PostgreSQL and graph DB
- ❌ Overkill for early stages

#### Best For
- Large-scale platforms with complex character universes
- Later optimization phase (v2.0+)
- Teams already using graph databases

---

### Approach #4: Document Database with Character Cards

**Overview:** Store characters as JSON documents following Character Card V2 specification.

#### Character Card V2 Format
Based on AI roleplay community standards (SillyTavern, Character.AI):

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "Aoi Tanaka",
    "description": "Protagonist of Urban Shadows",
    "personality": "Determined, thoughtful, athletic",
    "scenario": "High school detective investigating supernatural events",
    "first_mes": "Something's not right here...",
    "mes_example": "Aoi: We should investigate carefully.\nAoi: *adjusts her jacket*",
    "visual_appearance": {
      "hair": "short dark hair",
      "eyes": "determined brown eyes",
      "outfit": "school uniform with red jacket",
      "silhouette": "athletic build, 5'6\"",
      "notable_features": ["scar on left hand", "always wears red jacket"]
    },
    "creator_notes": "Created for Urban Shadows series",
    "character_version": "1.2.0",
    "tags": ["protagonist", "detective", "supernatural", "school"],
    "creator": "user_id_123",
    "character_book": {
      "entries": [
        {
          "keys": ["jacket", "red jacket"],
          "content": "Aoi's signature red jacket was a gift from her late father",
          "constant": true,
          "position": "before_char"
        }
      ]
    }
  }
}
```

#### Pros
- ✅ Industry-standard format
- ✅ Rich, flexible schema
- ✅ Easy import/export to other platforms
- ✅ Embedded lorebook for character-specific context

#### Cons
- ❌ Still needs relational layer for queries
- ❌ Primarily for storage, not retrieval optimization
- ⚠️ Can be combined with other approaches

#### Best For
- Character import/export feature
- Compatibility with existing AI tools
- Supplement to Approach #2

---

### Approach #5: File-Based Character Library

**Overview:** Store characters as files (JSON + images) in Supabase Storage.

#### Structure
```
characters/
  aoi-tanaka/
    metadata.json
    reference-v1.png
    reference-v2.png
    versions/
      1.0.0.json
      1.1.0.json
```

#### Pros
- ✅ Simple, human-readable
- ✅ Easy version control (git-like)
- ✅ No database schema changes
- ✅ Direct S3 access

#### Cons
- ❌ Poor query performance
- ❌ No transactional guarantees
- ❌ Difficult to maintain relationships
- ❌ No semantic search
- ❌ Scaling issues with 1000+ characters

#### Best For
- Prototyping and experimentation
- Small personal projects
- Not recommended for production

---

## 4. Database Schema Proposals

### 4.1 Hybrid Vector + Relational Schema (Recommended)

```sql
-- Enable pgvector extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Global character library (cross-episode characters)
CREATE TABLE global_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identity
  name VARCHAR(255) NOT NULL,
  canonical_name VARCHAR(255) NOT NULL, -- Normalized for search

  -- Ownership & privacy
  user_id VARCHAR(255) NOT NULL, -- Creator/owner
  is_public BOOLEAN DEFAULT false,

  -- Current version pointer
  current_version_id UUID,

  -- Metadata
  tags TEXT[], -- ['protagonist', 'detective', 'supernatural']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stats
  usage_count INT DEFAULT 0, -- Times used across episodes

  CONSTRAINT unique_user_character UNIQUE(user_id, canonical_name)
);

CREATE INDEX idx_global_characters_user ON global_characters(user_id);
CREATE INDEX idx_global_characters_tags ON global_characters USING GIN(tags);

-- Character versions (temporal tracking)
CREATE TABLE character_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES global_characters(id) ON DELETE CASCADE,

  -- Version info
  version_number VARCHAR(20) NOT NULL, -- Semantic versioning: "1.0.0"
  version_name VARCHAR(255), -- Optional: "School Arc", "Summer Outfit"
  is_current BOOLEAN DEFAULT false,

  -- Visual design
  description TEXT NOT NULL, -- Detailed visual appearance for AI generation
  reference_image_url TEXT, -- Primary reference image
  reference_images JSONB, -- Multiple angles/poses
  asset_filename VARCHAR(255) NOT NULL, -- e.g., "aoi_v1.png"

  -- Personality & traits
  personality TEXT, -- "Determined, thoughtful, athletic"
  backstory TEXT, -- Character background
  traits JSONB, -- Structured traits

  -- Visual appearance (structured)
  appearance JSONB, -- { hair, eyes, outfit, silhouette, notable_features }

  -- Voice & style
  dialogue_style TEXT, -- How character speaks
  example_dialogue TEXT[], -- Example lines

  -- AI generation metadata
  visual_style VARCHAR(255), -- "manga", "anime", "realistic"
  art_style_notes TEXT,

  -- Embeddings for semantic search
  description_embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  personality_embedding VECTOR(1536),
  combined_embedding VECTOR(1536), -- Fusion of description + personality

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255), -- User who created this version
  change_notes TEXT, -- What changed in this version

  CONSTRAINT unique_character_version UNIQUE(character_id, version_number)
);

CREATE INDEX idx_character_versions_character ON character_versions(character_id);
CREATE INDEX idx_character_versions_current ON character_versions(character_id, is_current) WHERE is_current = true;

-- Vector similarity indexes (HNSW for fast approximate nearest neighbor search)
CREATE INDEX idx_character_description_embedding ON character_versions
  USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX idx_character_personality_embedding ON character_versions
  USING hnsw (personality_embedding vector_cosine_ops);
CREATE INDEX idx_character_combined_embedding ON character_versions
  USING hnsw (combined_embedding vector_cosine_ops);

-- Episode character usage (links characters to episodes)
CREATE TABLE episode_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL, -- References Episode.id
  character_id UUID NOT NULL REFERENCES global_characters(id) ON DELETE CASCADE,
  character_version_id UUID NOT NULL REFERENCES character_versions(id),

  -- Episode-specific overrides
  episode_role VARCHAR(100), -- "protagonist", "antagonist", "supporting"
  episode_description_override TEXT, -- Optional: "wearing winter coat this episode"
  custom_asset_filename VARCHAR(255), -- Override for this episode
  generated_image_url TEXT, -- Episode-specific generated image

  -- Context
  first_appearance_page INT,
  total_appearances INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_episode_character UNIQUE(episode_id, character_id)
);

CREATE INDEX idx_episode_characters_episode ON episode_characters(episode_id);
CREATE INDEX idx_episode_characters_character ON episode_characters(character_id);

-- Character relationships (for advanced features)
CREATE TABLE character_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES global_characters(id) ON DELETE CASCADE,
  related_character_id UUID NOT NULL REFERENCES global_characters(id) ON DELETE CASCADE,

  relationship_type VARCHAR(100) NOT NULL, -- "friend", "rival", "family", "mentor"
  relationship_description TEXT,
  strength INT CHECK (strength >= 1 AND strength <= 10), -- Relationship strength

  -- Temporal context
  established_in_episode UUID, -- When relationship formed

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_relationship CHECK (character_id != related_character_id),
  CONSTRAINT unique_relationship UNIQUE(character_id, related_character_id)
);

CREATE INDEX idx_character_relationships_character ON character_relationships(character_id);

-- Foreign key to existing episodes table
ALTER TABLE episode_characters
  ADD CONSTRAINT fk_episode FOREIGN KEY (episode_id)
  REFERENCES "Episode"(id) ON DELETE CASCADE;

-- Update current version pointer constraint
ALTER TABLE global_characters
  ADD CONSTRAINT fk_current_version FOREIGN KEY (current_version_id)
  REFERENCES character_versions(id) ON DELETE SET NULL;
```

### 4.2 Prisma Schema Update

```prisma
// Add to backend/prisma/schema.prisma

model GlobalCharacter {
  id                String   @id @default(uuid())
  name              String
  canonicalName     String   @map("canonical_name")
  userId            String   @map("user_id")
  isPublic          Boolean  @default(false) @map("is_public")
  currentVersionId  String?  @map("current_version_id")
  tags              String[]
  usageCount        Int      @default(0) @map("usage_count")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  versions          CharacterVersion[]
  episodeUsages     EpisodeCharacter[]
  relationships     CharacterRelationship[] @relation("CharacterRelationships")
  relatedBy         CharacterRelationship[] @relation("RelatedCharacterRelationships")

  @@unique([userId, canonicalName])
  @@index([userId])
  @@map("global_characters")
}

model CharacterVersion {
  id                    String   @id @default(uuid())
  characterId           String   @map("character_id")
  versionNumber         String   @map("version_number")
  versionName           String?  @map("version_name")
  isCurrent             Boolean  @default(false) @map("is_current")

  description           String
  referenceImageUrl     String?  @map("reference_image_url")
  referenceImages       Json?    @map("reference_images")
  assetFilename         String   @map("asset_filename")

  personality           String?
  backstory             String?
  traits                Json?
  appearance            Json?

  dialogueStyle         String?  @map("dialogue_style")
  exampleDialogue       String[] @map("example_dialogue")

  visualStyle           String?  @map("visual_style")
  artStyleNotes         String?  @map("art_style_notes")

  // Vector embeddings stored as unsupported type (use raw SQL for queries)
  // descriptionEmbedding  Unsupported("vector(1536)")? @map("description_embedding")

  createdAt             DateTime @default(now()) @map("created_at")
  createdBy             String?  @map("created_by")
  changeNotes           String?  @map("change_notes")

  character             GlobalCharacter @relation(fields: [characterId], references: [id], onDelete: Cascade)
  episodeUsages         EpisodeCharacter[]

  @@unique([characterId, versionNumber])
  @@index([characterId])
  @@map("character_versions")
}

model EpisodeCharacter {
  id                          String   @id @default(uuid())
  episodeId                   String   @map("episode_id")
  characterId                 String   @map("character_id")
  characterVersionId          String   @map("character_version_id")

  episodeRole                 String?  @map("episode_role")
  episodeDescriptionOverride  String?  @map("episode_description_override")
  customAssetFilename         String?  @map("custom_asset_filename")
  generatedImageUrl           String?  @map("generated_image_url")

  firstAppearancePage         Int?     @map("first_appearance_page")
  totalAppearances            Int      @default(0) @map("total_appearances")

  createdAt                   DateTime @default(now()) @map("created_at")

  episode                     Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  character                   GlobalCharacter @relation(fields: [characterId], references: [id], onDelete: Cascade)
  characterVersion            CharacterVersion @relation(fields: [characterVersionId], references: [id])

  @@unique([episodeId, characterId])
  @@index([episodeId])
  @@index([characterId])
  @@map("episode_characters")
}

model CharacterRelationship {
  id                    String   @id @default(uuid())
  characterId           String   @map("character_id")
  relatedCharacterId    String   @map("related_character_id")

  relationshipType      String   @map("relationship_type")
  relationshipDescription String? @map("relationship_description")
  strength              Int?

  establishedInEpisode  String?  @map("established_in_episode")

  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  character             GlobalCharacter @relation("CharacterRelationships", fields: [characterId], references: [id], onDelete: Cascade)
  relatedCharacter      GlobalCharacter @relation("RelatedCharacterRelationships", fields: [relatedCharacterId], references: [id], onDelete: Cascade)

  @@unique([characterId, relatedCharacterId])
  @@index([characterId])
  @@map("character_relationships")
}

// Update existing Episode model
model Episode {
  // ... existing fields ...
  episodeCharacters EpisodeCharacter[]
}
```

### 4.3 Example Queries

```typescript
// 1. Semantic search for similar characters
const searchQuery = "determined female detective with dark hair";
const embedding = await generateEmbedding(searchQuery); // OpenAI embeddings API

const similarCharacters = await prisma.$queryRaw`
  SELECT
    gc.id,
    gc.name,
    cv.description,
    cv.reference_image_url,
    1 - (cv.combined_embedding <=> ${embedding}::vector) AS similarity
  FROM global_characters gc
  JOIN character_versions cv ON cv.id = gc.current_version_id
  WHERE gc.user_id = ${userId}
  ORDER BY cv.combined_embedding <=> ${embedding}::vector
  LIMIT 10
`;

// 2. Get character with current version
const character = await prisma.globalCharacter.findUnique({
  where: { id: characterId },
  include: {
    versions: {
      where: { isCurrent: true },
      take: 1
    }
  }
});

// 3. Get all characters in an episode
const episodeCharacters = await prisma.episodeCharacter.findMany({
  where: { episodeId },
  include: {
    character: true,
    characterVersion: true
  }
});

// 4. Create new character version
const newVersion = await prisma.characterVersion.create({
  data: {
    characterId,
    versionNumber: "1.1.0",
    versionName: "Summer Outfit",
    description: "Updated description with new outfit",
    isCurrent: true,
    changeNotes: "Changed outfit for summer arc"
  }
});

// Set as current version
await prisma.characterVersion.updateMany({
  where: { characterId, id: { not: newVersion.id } },
  data: { isCurrent: false }
});
```

---

## 5. Integration Points

### 5.1 Service Layer Changes

#### CharacterLibraryService (New)

```typescript
// backend/src/character-library/character-library.service.ts

@Injectable()
export class CharacterLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAI,
    private readonly storage: StorageService
  ) {}

  /**
   * Create a new global character
   */
  async createCharacter(userId: string, data: CreateCharacterDto) {
    // Generate embeddings for semantic search
    const descriptionEmbedding = await this.generateEmbedding(data.description);
    const personalityEmbedding = await this.generateEmbedding(data.personality || '');
    const combinedEmbedding = await this.generateEmbedding(
      `${data.description}\n${data.personality || ''}`
    );

    const character = await this.prisma.globalCharacter.create({
      data: {
        name: data.name,
        canonicalName: this.canonicalize(data.name),
        userId,
        tags: data.tags || [],
        versions: {
          create: {
            versionNumber: '1.0.0',
            isCurrent: true,
            description: data.description,
            personality: data.personality,
            assetFilename: this.sanitizeFilename(`${data.name}.png`),
            appearance: data.appearance,
            dialogueStyle: data.dialogueStyle,
            // Note: Embeddings added via raw SQL after creation
          }
        }
      },
      include: { versions: true }
    });

    // Update embeddings (Prisma doesn't support vector type directly)
    const versionId = character.versions[0].id;
    await this.prisma.$executeRaw`
      UPDATE character_versions
      SET
        description_embedding = ${descriptionEmbedding}::vector,
        personality_embedding = ${personalityEmbedding}::vector,
        combined_embedding = ${combinedEmbedding}::vector
      WHERE id = ${versionId}
    `;

    return character;
  }

  /**
   * Search characters by semantic similarity
   */
  async searchCharacters(userId: string, query: string, limit: number = 10) {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.prisma.$queryRaw`
      SELECT
        gc.id,
        gc.name,
        cv.description,
        cv.personality,
        cv.reference_image_url,
        1 - (cv.combined_embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM global_characters gc
      JOIN character_versions cv ON cv.id = gc.current_version_id
      WHERE gc.user_id = ${userId} OR gc.is_public = true
      ORDER BY cv.combined_embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Add character to episode
   */
  async addCharacterToEpisode(episodeId: string, characterId: string, versionId?: string) {
    const character = await this.prisma.globalCharacter.findUnique({
      where: { id: characterId },
      include: { versions: { where: { isCurrent: true } } }
    });

    const version = versionId
      ? await this.prisma.characterVersion.findUnique({ where: { id: versionId } })
      : character.versions[0];

    return this.prisma.episodeCharacter.create({
      data: {
        episodeId,
        characterId,
        characterVersionId: version.id
      }
    });
  }

  /**
   * Create new character version
   */
  async createVersion(characterId: string, data: CreateVersionDto) {
    // Mark current version as not current
    await this.prisma.characterVersion.updateMany({
      where: { characterId, isCurrent: true },
      data: { isCurrent: false }
    });

    const descriptionEmbedding = await this.generateEmbedding(data.description);
    const personalityEmbedding = await this.generateEmbedding(data.personality || '');
    const combinedEmbedding = await this.generateEmbedding(
      `${data.description}\n${data.personality || ''}`
    );

    const version = await this.prisma.characterVersion.create({
      data: {
        characterId,
        versionNumber: data.versionNumber,
        versionName: data.versionName,
        isCurrent: true,
        description: data.description,
        personality: data.personality,
        assetFilename: data.assetFilename,
        changeNotes: data.changeNotes
      }
    });

    await this.prisma.$executeRaw`
      UPDATE character_versions
      SET
        description_embedding = ${descriptionEmbedding}::vector,
        personality_embedding = ${personalityEmbedding}::vector,
        combined_embedding = ${combinedEmbedding}::vector
      WHERE id = ${version.id}
    `;

    return version;
  }

  /**
   * Generate text embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  }

  private canonicalize(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  private sanitizeFilename(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .concat('.png')
      .replace(/_+\.png$/, '.png');
  }
}
```

### 5.2 Update EpisodesService

```typescript
// backend/src/episodes/episodes.service.ts

// Add method to retrieve characters for episode generation
async getEpisodeCharactersForGeneration(episodeId: string) {
  const episodeChars = await this.prisma.episodeCharacter.findMany({
    where: { episodeId },
    include: {
      character: true,
      characterVersion: true
    }
  });

  return episodeChars.map(ec => ({
    name: ec.character.name,
    description: ec.episodeDescriptionOverride || ec.characterVersion.description,
    assetFilename: ec.customAssetFilename || ec.characterVersion.assetFilename,
    imageUrl: ec.generatedImageUrl || ec.characterVersion.referenceImageUrl,
    personality: ec.characterVersion.personality,
    dialogueStyle: ec.characterVersion.dialogueStyle
  }));
}

// Update planEpisode to support character import
async planEpisode(seed: EpisodeSeed, importCharacterIds?: string[]): Promise<{ episodeId: string; outline: PlannerOutput }> {
  const id = randomUUID();

  // ... existing planning logic ...

  // If importing characters, add them to episode
  if (importCharacterIds && importCharacterIds.length > 0) {
    for (const charId of importCharacterIds) {
      await this.characterLibrary.addCharacterToEpisode(id, charId);
    }
  }

  // ... rest of existing logic ...
}
```

### 5.3 Update PlannerService

```typescript
// backend/src/planner/planner.service.ts

// Enhance generateOutline to accept existing characters
async generateOutline(
  seed: EpisodeSeed,
  existingCharacters?: GlobalCharacterInfo[]
): Promise<PlannerOutput> {
  // Include existing character info in prompt
  const existingCharsContext = existingCharacters?.map(c =>
    `- ${c.name}: ${c.description} (personality: ${c.personality})`
  ).join('\n');

  const user = [
    'Make a 10-page outline for a manga episode based on this seed:',
    // ... existing seed info ...
    '',
    existingCharsContext ? 'Existing characters to include:' : '',
    existingCharsContext || '',
    // ... rest of prompt ...
  ].filter(Boolean).join('\n');

  // ... rest of implementation ...
}
```

### 5.4 Frontend Components

```typescript
// pages/characters/index.tsx - Character Library Page

export default function CharacterLibrary() {
  const [characters, setCharacters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const searchCharacters = async (query: string) => {
    const response = await fetch(`/api/characters/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setCharacters(data.characters);
  };

  return (
    <div>
      <h1>Character Library</h1>
      <SearchBar onChange={setSearchQuery} onSearch={searchCharacters} />
      <CharacterGrid characters={characters} />
    </div>
  );
}

// pages/api/characters/search.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  const userId = getUserId(req); // From auth

  const { characterLibrary } = getServices();
  const results = await characterLibrary.searchCharacters(userId, q as string);

  res.json({ characters: results });
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Database Setup**
- [ ] Add pgvector extension to Supabase
- [ ] Create new tables: `global_characters`, `character_versions`, `episode_characters`
- [ ] Write Prisma migration
- [ ] Test vector operations locally

**Week 2: Basic CRUD**
- [ ] Implement `CharacterLibraryService`
- [ ] Create character creation endpoint
- [ ] Build character list/detail views
- [ ] Add basic search (non-semantic)

**Week 3: Episode Integration**
- [ ] Add "Import Character" UI to episode creator
- [ ] Modify `EpisodesService.planEpisode()` to accept character imports
- [ ] Update renderer to use imported character data
- [ ] Test end-to-end character import flow

### Phase 2: Semantic Search & Versioning (Weeks 4-6)

**Week 4: Embeddings**
- [ ] Integrate OpenAI Embeddings API
- [ ] Generate embeddings on character create/update
- [ ] Implement semantic search endpoint
- [ ] Add similarity search UI

**Week 5: Versioning**
- [ ] Implement character version creation
- [ ] Add version history UI
- [ ] Build version comparison tool
- [ ] Test version rollback

**Week 6: Advanced Features**
- [ ] Character relationship management
- [ ] Character evolution timeline
- [ ] Usage analytics (character appearance stats)
- [ ] Export character as Character Card V2 JSON

### Phase 3: RAG & Optimization (Weeks 7-9)

**Week 7: Context Optimization**
- [ ] Implement smart character retrieval for prompts
- [ ] Add token budget management
- [ ] Build character context summarization
- [ ] Test prompt optimization impact on generation quality

**Week 8: Multimodal Embeddings**
- [ ] Generate image embeddings (CLIP)
- [ ] Implement visual similarity search
- [ ] Add "Find visually similar characters" feature

**Week 9: Polish & Testing**
- [ ] Performance optimization (query tuning, caching)
- [ ] User testing and feedback
- [ ] Documentation
- [ ] Deploy to production

### Phase 4: Advanced (Future)

- **Character Consistency Scoring:** AI-powered analysis of character consistency across episodes
- **Automated Character Evolution:** Suggest character changes based on story arcs
- **Community Character Library:** Public character marketplace
- **Graph Relationships:** Migrate to graph DB for complex relationship queries
- **Multiverse Support:** Same character across different art styles/universes

---

## 7. Research References

### Academic Research

1. **Graph RAG for Storytelling**
   - "Guiding Generative Storytelling with Knowledge Graphs" (arXiv 2025)
   - Graph RAG improves narrative coherence and character consistency
   - Knowledge graphs as central repositories of characters, locations, events

2. **Temporal Database Design**
   - "Temporal and versioning model for schema evolution in object-oriented databases"
   - Schema versioning creates new versions while preserving history
   - Critical for character evolution tracking

3. **RAG Survey Papers**
   - "Retrieval Augmented Generation Evaluation in the Era of Large Language Models" (2024)
   - Multimodal RAG extensions for text + image
   - Dynamic retrieval strategies (when to retrieve, how much)

### Industry Standards

4. **Character Card V2 Specification**
   - Community standard from SillyTavern, Character.AI ecosystem
   - Includes character_book for embedded lorebook entries
   - Supports scenario, personality, example dialogue

5. **Vector Databases for Characters**
   - Supabase pgvector documentation
   - halfvec(1536) for space-efficient embeddings
   - HNSW indexes for fast cosine similarity search

6. **AI Roleplay Memory Systems**
   - Multi-tiered memory architecture (recent → summarized → archived)
   - Scratchpad patterns for rolling context windows
   - Vector DB for long-term memory retrieval

### Technical Resources

7. **Supabase Vector Implementation**
   - Official docs: https://supabase.com/docs/guides/ai/semantic-search
   - pgvector extension guide
   - Automatic embeddings with Edge Functions

8. **OpenAI Embeddings**
   - text-embedding-3-small: 1536 dimensions, $0.02 per 1M tokens
   - text-embedding-3-large: 3072 dimensions, higher accuracy
   - Cosine similarity for semantic search

---

## Appendix A: Cost Analysis

### Embedding Generation Costs

**OpenAI text-embedding-3-small:**
- $0.02 per 1M tokens
- Average character description: ~500 tokens
- 1000 characters with 3 embeddings each = 1.5M tokens = $0.03

**Ongoing costs:**
- Character creation/updates: Negligible
- Semantic search queries: Free (using stored embeddings)

**Storage:**
- Vector storage: ~6KB per character (1536 dims × 4 bytes)
- 10,000 characters = 60MB
- Negligible cost on Supabase

### Recommended Budget
- Phase 1-3 development: ~$5-10 for testing
- Production (10K characters): < $1/month
- Extremely cost-effective

---

## Appendix B: Migration Strategy

### Migrating Existing Characters

```typescript
// backend/src/scripts/migrate-characters.ts

async function migrateExistingCharacters() {
  // Get all existing episode-specific characters
  const oldCharacters = await prisma.character.findMany({
    include: { episode: true }
  });

  for (const oldChar of oldCharacters) {
    // Check if global character already exists
    let globalChar = await prisma.globalCharacter.findFirst({
      where: {
        userId: 'system', // Or derive from episode creator
        canonicalName: canonicalize(oldChar.name)
      }
    });

    // Create global character if doesn't exist
    if (!globalChar) {
      globalChar = await characterLibrary.createCharacter('system', {
        name: oldChar.name,
        description: oldChar.description || 'Migrated character',
        tags: ['migrated']
      });
    }

    // Link to episode
    await prisma.episodeCharacter.create({
      data: {
        episodeId: oldChar.episodeId,
        characterId: globalChar.id,
        characterVersionId: globalChar.currentVersionId,
        generatedImageUrl: oldChar.imageUrl
      }
    });
  }

  console.log(`Migrated ${oldCharacters.length} characters`);
}
```

### Rollback Plan

1. Keep old `Character` table for 30 days
2. Add feature flag: `USE_GLOBAL_CHARACTERS`
3. Test in staging with flag enabled
4. Gradual rollout (10% → 50% → 100%)
5. Drop old table after validation period

---

## Appendix C: Example Prompts

### Character-Aware Episode Generation

```typescript
// Enhanced prompt with imported characters

const importedChars = await getEpisodeCharactersForGeneration(episodeId);

const prompt = `
Generate manga page ${pageNumber}.

**Story Context:**
${outline.beat}

**Characters in this scene:**
${importedChars.map(c => `
- ${c.name}:
  Visual: ${c.description}
  Personality: ${c.personality}
  Speaking style: ${c.dialogueStyle}
  Reference: <${c.assetFilename}>
`).join('\n')}

**Important:** Maintain character consistency using the reference images.
${c.name} always has ${c.appearance.hair} and ${c.appearance.outfit}.

[Rest of generation prompt...]
`;
```

---

## Conclusion

The **Hybrid Vector + Relational Database** approach (Approach #2) is the recommended solution for MangaFusion's character memory system. It provides:

- ✅ Scalable, production-ready architecture
- ✅ Leverages existing Supabase infrastructure
- ✅ Semantic search for intelligent character discovery
- ✅ Temporal versioning for character evolution
- ✅ Minimal cost ($0-5/month for 10K characters)
- ✅ Clear migration path from current system

**Next Steps:**
1. Review this document with team
2. Approve Phase 1 implementation
3. Create detailed engineering tickets
4. Begin database schema migration

**Questions or concerns?** Contact the engineering team for clarification.

---

**Document End**
