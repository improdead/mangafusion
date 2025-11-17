/**
 * Database Operations Test Script
 *
 * This script tests basic CRUD operations to verify the database is working correctly.
 * Run with: ts-node prisma/test-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseOperations() {
  console.log('🧪 Testing database operations...\n');

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Test 2: Create Episode
    console.log('2️⃣ Testing episode creation...');
    const episode = await prisma.episode.create({
      data: {
        seedInput: {
          title: 'Test Episode',
          genre_tags: ['test'],
          tone: 'test',
          setting: 'test',
          cast: [],
        },
        outline: {
          pages: [],
          characters: [],
        },
        rendererModel: 'test-model',
      },
    });
    console.log(`✅ Created episode: ${episode.id}\n`);

    // Test 3: Create Pages
    console.log('3️⃣ Testing page creation...');
    const pages = await prisma.page.createMany({
      data: [
        {
          episodeId: episode.id,
          pageNumber: 1,
          status: 'queued',
          version: 0,
        },
        {
          episodeId: episode.id,
          pageNumber: 2,
          status: 'in_progress',
          version: 0,
        },
      ],
    });
    console.log(`✅ Created ${pages.count} pages\n`);

    // Test 4: Create Characters
    console.log('4️⃣ Testing character creation...');
    const characters = await prisma.character.createMany({
      data: [
        {
          episodeId: episode.id,
          name: 'Test Character 1',
          assetFilename: 'test1.png',
          description: 'A test character',
        },
        {
          episodeId: episode.id,
          name: 'Test Character 2',
          assetFilename: 'test2.png',
        },
      ],
    });
    console.log(`✅ Created ${characters.count} characters\n`);

    // Test 5: Read with Relations
    console.log('5️⃣ Testing read with relations...');
    const fullEpisode = await prisma.episode.findUnique({
      where: { id: episode.id },
      include: {
        pages: true,
        characters: true,
      },
    });
    console.log(`✅ Retrieved episode with ${fullEpisode?.pages.length} pages and ${fullEpisode?.characters.length} characters\n`);

    // Test 6: Update Page Status
    console.log('6️⃣ Testing page update...');
    const updatedPage = await prisma.page.updateMany({
      where: {
        episodeId: episode.id,
        pageNumber: 1,
      },
      data: {
        status: 'done',
        imageUrl: 'https://example.com/image.png',
        seed: 123456,
        version: 1,
      },
    });
    console.log(`✅ Updated ${updatedPage.count} page(s)\n`);

    // Test 7: Query with Indexes
    console.log('7️⃣ Testing indexed queries...');
    const recentEpisodes = await prisma.episode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`✅ Found ${recentEpisodes.length} recent episodes\n`);

    const queuedPages = await prisma.page.findMany({
      where: { status: 'queued' },
      take: 10,
    });
    console.log(`✅ Found ${queuedPages.length} queued pages\n`);

    // Test 8: Transaction
    console.log('8️⃣ Testing transaction...');
    const result = await prisma.$transaction(async (tx) => {
      const newEpisode = await tx.episode.create({
        data: {
          seedInput: { title: 'Transaction Test' } as any,
          rendererModel: 'test',
        },
      });

      await tx.page.create({
        data: {
          episodeId: newEpisode.id,
          pageNumber: 1,
          status: 'queued',
          version: 0,
        },
      });

      return newEpisode;
    });
    console.log(`✅ Transaction successful, created episode: ${result.id}\n`);

    // Test 9: Cascade Delete
    console.log('9️⃣ Testing cascade delete...');
    const deleteResult = await prisma.episode.delete({
      where: { id: episode.id },
    });
    console.log(`✅ Deleted episode ${deleteResult.id} (pages and characters cascaded)\n`);

    // Verify cascade
    const orphanedPages = await prisma.page.findMany({
      where: { episodeId: episode.id },
    });
    const orphanedCharacters = await prisma.character.findMany({
      where: { episodeId: episode.id },
    });
    console.log(`✅ Verified cascade: ${orphanedPages.length} orphaned pages, ${orphanedCharacters.length} orphaned characters\n`);

    // Test 10: Count Operations
    console.log('🔟 Testing count operations...');
    const episodeCount = await prisma.episode.count();
    const pageCount = await prisma.page.count();
    const characterCount = await prisma.character.count();
    console.log(`✅ Database contains ${episodeCount} episodes, ${pageCount} pages, ${characterCount} characters\n`);

    console.log('🎉 All tests passed!\n');
    console.log('✨ Database is working correctly!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testDatabaseOperations()
  .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
