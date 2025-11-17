import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean up existing data (optional - comment out if you want to keep existing data)
  await prisma.page.deleteMany();
  await prisma.character.deleteMany();
  await prisma.episode.deleteMany();

  // Create a sample episode
  const episode = await prisma.episode.create({
    data: {
      id: 'seed-episode-001',
      seedInput: {
        title: 'City of Shadows',
        genre_tags: ['action', 'mystery', 'supernatural'],
        tone: 'dark and mysterious',
        setting: 'A futuristic cyberpunk city at night',
        visual_vibe: 'noir manga with neon accents',
        description: 'A detective with supernatural abilities investigates a series of mysterious disappearances in the city.',
        cast: [
          {
            name: 'Rei',
            traits: 'stoic, determined, experienced',
            silhouette: 'tall and lean',
            outfit: 'long dark coat, tactical gear underneath',
            notable_prop: 'glowing eye implant',
          },
          {
            name: 'Yuki',
            traits: 'cheerful, tech-savvy, optimistic',
            silhouette: 'petite',
            outfit: 'casual streetwear with tech accessories',
            notable_prop: 'AR glasses',
          },
        ],
      },
      outline: {
        characters: [
          {
            name: 'Rei',
            description: 'tall detective with short dark hair, glowing cybernetic left eye, long black coat over tactical vest, serious expression',
            asset_filename: 'rei.png',
          },
          {
            name: 'Yuki',
            description: 'petite hacker with colorful hair, AR glasses, casual streetwear, energetic pose',
            asset_filename: 'yuki.png',
          },
        ],
        pages: [
          {
            page_number: 1,
            beat: 'Establish the cyberpunk city and introduce Rei',
            setting: 'Rain-soaked city streets at night, neon signs reflecting in puddles',
            key_actions: ['panoramic city shot', 'Rei walking through rain', 'close-up of glowing eye'],
            layout_hints: { panels: 4, notes: 'cinematic wide shots, dramatic angles' },
            visual_style: 'high-contrast manga black and white with detailed backgrounds, noir atmosphere',
            introduce_new_character: false,
            new_characters: [],
            dialogues: [
              { panel_number: 1, character: null, text: 'The city never sleeps...', type: 'narration' as const },
              { panel_number: 2, character: 'Rei', text: 'Another missing person. Third this week.', type: 'dialogue' as const },
              { panel_number: 3, character: null, text: 'But Rei could see what others couldn\'t.', type: 'narration' as const },
            ],
            prompt: '<rei.png> walks through rain-soaked cyberpunk streets, neon signs reflecting in puddles',
          },
        ],
      },
      rendererModel: 'gpt-image-1',
    },
  });

  console.log(`Created episode: ${episode.id}`);

  // Create pages for the episode
  const pages = await prisma.page.createMany({
    data: [
      {
        episodeId: episode.id,
        pageNumber: 1,
        status: 'done',
        imageUrl: 'https://placehold.co/1024x1536/000/FFF?text=Page+1',
        seed: 123456,
        version: 1,
      },
      {
        episodeId: episode.id,
        pageNumber: 2,
        status: 'in_progress',
        seed: 234567,
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 3,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 4,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 5,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 6,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 7,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 8,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 9,
        status: 'queued',
        version: 0,
      },
      {
        episodeId: episode.id,
        pageNumber: 10,
        status: 'queued',
        version: 0,
      },
    ],
  });

  console.log(`Created ${pages.count} pages`);

  // Create characters for the episode
  const characters = await prisma.character.createMany({
    data: [
      {
        episodeId: episode.id,
        name: 'Rei',
        description: 'tall detective with short dark hair, glowing cybernetic left eye, long black coat over tactical vest, serious expression',
        assetFilename: 'rei.png',
        imageUrl: 'https://placehold.co/768x1024/111/EEE?text=Rei',
      },
      {
        episodeId: episode.id,
        name: 'Yuki',
        description: 'petite hacker with colorful hair, AR glasses, casual streetwear, energetic pose',
        assetFilename: 'yuki.png',
        imageUrl: 'https://placehold.co/768x1024/222/EEE?text=Yuki',
      },
    ],
  });

  console.log(`Created ${characters.count} characters`);

  // Create another episode for testing multiple episodes
  const episode2 = await prisma.episode.create({
    data: {
      id: 'seed-episode-002',
      seedInput: {
        title: 'School Days Adventure',
        genre_tags: ['slice-of-life', 'comedy', 'school'],
        tone: 'light and fun',
        setting: 'Modern Japanese high school',
        visual_vibe: 'bright and cheerful manga style',
        description: 'A group of friends navigate daily school life and comedic situations.',
        cast: [
          {
            name: 'Hana',
            traits: 'energetic, clumsy, friendly',
            silhouette: 'average height',
            outfit: 'school uniform',
          },
          {
            name: 'Takeshi',
            traits: 'calm, smart, reliable',
            silhouette: 'tall',
            outfit: 'school uniform with glasses',
          },
        ],
      },
      outline: {
        characters: [
          {
            name: 'Hana',
            description: 'energetic student with ponytail, bright eyes, school uniform, cheerful expression',
            asset_filename: 'hana.png',
          },
          {
            name: 'Takeshi',
            description: 'tall student with glasses, neat hair, school uniform, calm demeanor',
            asset_filename: 'takeshi.png',
          },
        ],
        pages: [
          {
            page_number: 1,
            beat: 'Morning rush to school',
            setting: 'Suburban neighborhood, morning',
            key_actions: ['running late', 'toast in mouth', 'bumping into friend'],
            layout_hints: { panels: 5, notes: 'dynamic motion, comedic timing' },
            visual_style: 'clean manga style with simple backgrounds, expressive characters',
            introduce_new_character: false,
            new_characters: [],
            dialogues: [
              { panel_number: 1, character: 'Hana', text: 'I\'m late, I\'m late!', type: 'dialogue' as const },
              { panel_number: 2, character: 'Takeshi', text: 'Good morning, Hana.', type: 'dialogue' as const },
              { panel_number: 3, character: 'Hana', text: 'Takeshi! Wait up!', type: 'dialogue' as const },
            ],
            prompt: '<hana.png> runs down the street with toast in mouth, <takeshi.png> waits calmly at corner',
          },
        ],
      },
      rendererModel: 'gpt-image-1',
    },
  });

  console.log(`Created episode: ${episode2.id}`);

  // Create pages for second episode
  await prisma.page.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      episodeId: episode2.id,
      pageNumber: i + 1,
      status: 'queued' as const,
      version: 0,
    })),
  });

  console.log('Created 10 pages for second episode');

  // Create characters for second episode
  await prisma.character.createMany({
    data: [
      {
        episodeId: episode2.id,
        name: 'Hana',
        description: 'energetic student with ponytail, bright eyes, school uniform, cheerful expression',
        assetFilename: 'hana.png',
        imageUrl: 'https://placehold.co/768x1024/FFB6C1/000?text=Hana',
      },
      {
        episodeId: episode2.id,
        name: 'Takeshi',
        description: 'tall student with glasses, neat hair, school uniform, calm demeanor',
        assetFilename: 'takeshi.png',
        imageUrl: 'https://placehold.co/768x1024/87CEEB/000?text=Takeshi',
      },
    ],
  });

  console.log('Created 2 characters for second episode');

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
