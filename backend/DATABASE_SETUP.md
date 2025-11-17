# MangaFusion Database Setup Guide

This guide explains how to set up and use the PostgreSQL database with Prisma ORM for MangaFusion.

## Overview

MangaFusion uses **Prisma ORM** with **PostgreSQL** for full data persistence. The application supports two modes:

1. **In-memory mode** (default): When `DATABASE_URL` is not set, all data is stored in memory and lost when the server restarts.
2. **Database mode**: When `DATABASE_URL` is set, all episodes, pages, and characters are persisted to PostgreSQL.

## Database Schema

The database consists of three main models:

### Episode
Stores manga episode metadata including seed input, outline, and renderer configuration.

**Fields:**
- `id` (UUID): Unique identifier
- `seedInput` (JSON): Original episode creation parameters
- `outline` (JSON): Generated story outline with pages and characters
- `rendererModel` (String): AI model used for rendering
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `createdAt`: For chronological queries
- `updatedAt`: For recently modified episodes

### Page
Stores individual manga pages with their generation status and results.

**Fields:**
- `id` (UUID): Unique identifier
- `episodeId` (UUID): Foreign key to Episode
- `pageNumber` (Int): Page number (1-10)
- `status` (Enum): `queued`, `in_progress`, `done`, or `failed`
- `imageUrl` (String): URL to generated image in storage
- `audioUrl` (String): URL to generated audio (for TTS feature)
- `seed` (Int): Random seed used for generation
- `version` (Int): Version number for regenerations
- `error` (String): Error message if generation failed
- `overlays` (JSON): Dialogue and visual overlay data

**Indexes:**
- `episodeId`: For quick page lookups by episode
- `status`: For querying pages by status
- `episodeId + status`: Composite index for filtered queries

**Unique Constraints:**
- `episodeId + pageNumber`: Each episode has exactly one page per number

### Character
Stores character reference images and metadata for consistency across pages.

**Fields:**
- `id` (UUID): Unique identifier
- `episodeId` (UUID): Foreign key to Episode
- `name` (String): Character name
- `description` (String): Visual design description
- `assetFilename` (String): Filename used in prompts (e.g., "rei.png")
- `imageUrl` (String): URL to generated character reference image
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Indexes:**
- `episodeId`: For quick character lookups by episode

**Unique Constraints:**
- `episodeId + assetFilename`: Each character has a unique filename per episode

## Prerequisites

1. **PostgreSQL 12+** installed and running
2. **Node.js 18+** and npm/yarn
3. Database credentials (username, password, host, port, database name)

## Installation Steps

### 1. Install PostgreSQL

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**On macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**On Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE mangafusion;
CREATE USER mangafusion_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mangafusion TO mangafusion_user;
\q
```

### 3. Configure Environment Variables

Create or update `.env` file in the `backend/` directory:

```bash
# Database connection string
DATABASE_URL="postgresql://mangafusion_user:your_secure_password@localhost:5432/mangafusion"

# Other required variables
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
# ... etc
```

**Connection String Format:**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

**Example for cloud databases:**
- **Supabase:** `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
- **Railway:** Provided in Railway dashboard
- **Neon:** Provided in Neon dashboard

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client from your schema.

### 6. Run Database Migrations

**For development:**
```bash
npm run prisma:migrate:dev
```

This applies all migrations and optionally runs the seed script.

**For production:**
```bash
npm run prisma:migrate:deploy
```

This applies migrations without prompts (suitable for CI/CD).

### 7. (Optional) Seed Test Data

```bash
npm run prisma:seed
```

This populates the database with two sample episodes for testing.

## Database Management

### View Database in Prisma Studio

```bash
npm run prisma:studio
```

Opens a web UI at `http://localhost:5555` to browse and edit data.

### Reset Database

**⚠️ WARNING: This deletes all data!**

```bash
npm run prisma:migrate:reset
```

This drops the database, recreates it, runs all migrations, and runs the seed script.

### Create New Migration

After modifying `prisma/schema.prisma`:

```bash
npm run prisma:migrate:dev
```

Prisma will detect changes and create a new migration file.

## Error Handling

The application includes comprehensive error handling for database operations:

### Common Prisma Error Codes

- **P2002**: Unique constraint violation (duplicate entry)
- **P2003**: Foreign key constraint violation (referenced record doesn't exist)
- **P2025**: Record not found
- **P2014**: Required relation violation
- **P2034**: Transaction conflict (retry needed)

### Error Handling Strategy

1. **Automatic Fallback**: Read operations fall back to in-memory cache if database fails
2. **Transaction Support**: Critical operations (like creating episodes) use transactions
3. **Detailed Logging**: All database errors are logged with context
4. **Graceful Degradation**: The app continues to work in memory-only mode if database is unavailable

## Transaction Support

Critical operations use Prisma transactions to ensure data consistency:

### Example: Creating an Episode

```typescript
// Episode creation is atomic - either all succeeds or all fails
await prisma.$transaction(async (tx) => {
  // 1. Create episode
  const episode = await tx.episode.create({ ... });

  // 2. Create 10 pages
  await tx.page.createMany({ ... });

  // 3. Create characters
  await tx.character.createMany({ ... });
});
```

If any step fails, the entire transaction is rolled back.

## Monitoring and Maintenance

### Check Connection

```typescript
await prisma.$queryRaw`SELECT 1`;
```

### Database Size

```sql
SELECT pg_size_pretty(pg_database_size('mangafusion'));
```

### Table Sizes

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Connections

```sql
SELECT * FROM pg_stat_activity WHERE datname = 'mangafusion';
```

## Performance Optimization

### Indexes

The schema includes optimized indexes for common queries:

```prisma
// Episode indexes
@@index([createdAt])     // Recent episodes
@@index([updatedAt])     // Recently modified

// Page indexes
@@index([episodeId])           // Pages by episode
@@index([status])              // Pages by status
@@index([episodeId, status])   // Filtered page queries

// Character indexes
@@index([episodeId])     // Characters by episode
```

### Connection Pooling

Prisma automatically manages connection pooling. Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

For production, use connection pooling services like:
- PgBouncer
- Supabase Pooler
- Neon Serverless Driver

## Backup and Recovery

### Manual Backup

```bash
pg_dump -U mangafusion_user -d mangafusion -F c -f backup_$(date +%Y%m%d).dump
```

### Restore from Backup

```bash
pg_restore -U mangafusion_user -d mangafusion -c backup_20250117.dump
```

### Automated Backups

For production, use your cloud provider's automated backup features:
- **Supabase**: Automatic daily backups (Pro plan)
- **Railway**: Point-in-time recovery
- **Neon**: Branch-based backups

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Start PostgreSQL: `sudo systemctl start postgresql`
3. Verify port: `sudo netstat -plnt | grep 5432`

### Authentication Failed

```
Error: password authentication failed for user "mangafusion_user"
```

**Solution:**
1. Check `DATABASE_URL` credentials
2. Reset password: `ALTER USER mangafusion_user WITH PASSWORD 'new_password';`
3. Check `pg_hba.conf` authentication method

### Migration Conflicts

```
Error: Migration engine error: P1012
```

**Solution:**
1. Check migration history: `npx prisma migrate status`
2. Reset migrations: `npm run prisma:migrate:reset` (⚠️ deletes data)
3. Or manually resolve in `_prisma_migrations` table

### Out of Connections

```
Error: too many clients already
```

**Solution:**
1. Check active connections: `SELECT count(*) FROM pg_stat_activity;`
2. Increase `max_connections` in PostgreSQL config
3. Use connection pooling (PgBouncer)

## Environment-Specific Configuration

### Development

```bash
DATABASE_URL="postgresql://localhost:5432/mangafusion_dev"
```

### Testing

```bash
DATABASE_URL="postgresql://localhost:5432/mangafusion_test"
```

### Production

Use environment variables from your hosting platform:

```bash
# Railway
DATABASE_URL=${{ RAILWAY_PROVIDED_DATABASE_URL }}

# Render
DATABASE_URL=${{ DATABASE_URL }}

# Heroku
DATABASE_URL=${{ DATABASE_URL }}
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Use strong passwords** - At least 16 characters
3. **Rotate credentials regularly** - Especially after team changes
4. **Use SSL in production** - Add `?sslmode=require` to connection string
5. **Limit permissions** - Grant only necessary privileges
6. **Enable audit logging** - Track database changes in production

## Migration to Database from In-Memory

If you've been running in-memory mode and want to migrate to database:

1. **Set up database** following steps above
2. **Run migrations**: `npm run prisma:migrate:deploy`
3. **Restart server** - Data will now persist
4. **Verify** - Create an episode and restart server to confirm persistence

Note: Existing in-memory data is not automatically migrated. You'll start fresh.

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Schema Reference](./prisma/schema.prisma)
- [Seed Data Script](./prisma/seed.ts)
- [Error Handler](./src/prisma/prisma-error-handler.ts)

## Support

For issues or questions:
1. Check error logs in console
2. Review Prisma Studio for data inspection
3. Consult the troubleshooting section above
4. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
