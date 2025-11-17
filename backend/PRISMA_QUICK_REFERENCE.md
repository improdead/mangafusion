# Prisma Quick Reference

Essential commands for working with the MangaFusion database.

## Prerequisites

```bash
# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/mangafusion"
```

## Common Commands

### Setup & Generation

```bash
# Install dependencies
npm install

# Generate Prisma Client (run after schema changes)
npm run prisma:generate

# Apply migrations to development database
npm run prisma:migrate:dev

# Apply migrations to production database
npm run prisma:migrate:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Database Management

```bash
# Seed database with test data
npm run prisma:seed

# Reset database (⚠️ DELETES ALL DATA)
npm run prisma:migrate:reset

# Check migration status
npx prisma migrate status

# Create a new migration after schema changes
npx prisma migrate dev --name description_of_change
```

### Development Workflow

```bash
# 1. Modify prisma/schema.prisma
# 2. Generate Prisma Client
npm run prisma:generate

# 3. Create and apply migration
npm run prisma:migrate:dev

# 4. (Optional) Add seed data
npm run prisma:seed

# 5. Start development server
npm run dev
```

## Schema File Location

`backend/prisma/schema.prisma`

## Migration Files Location

`backend/prisma/migrations/`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |

## Prisma Studio

Access database GUI at `http://localhost:5555` with:

```bash
npm run prisma:studio
```

## Troubleshooting

### Prisma Client Out of Sync

```bash
npm run prisma:generate
```

### Migration Conflicts

```bash
# Check status
npx prisma migrate status

# Resolve conflicts
npx prisma migrate resolve --applied "migration_name"
```

### Reset Everything

```bash
npm run prisma:migrate:reset
```

## Production Deployment

```bash
# 1. Set DATABASE_URL in production environment
# 2. Run migrations
npm run prisma:migrate:deploy

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Build and start
npm run build
npm start
```

## Additional Resources

- Full documentation: `DATABASE_SETUP.md`
- Schema reference: `prisma/schema.prisma`
- Seed script: `prisma/seed.ts`
