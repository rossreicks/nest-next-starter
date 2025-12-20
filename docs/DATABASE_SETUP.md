# PostgreSQL + Kysely ORM Setup Guide

This guide documents how to set up PostgreSQL with Kysely ORM in a NestJS application. Use this as a reference for recreating this setup in future projects.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Usage](#usage)
- [Migrations](#migrations)
- [Type Definitions](#type-definitions)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

1. **Docker and Docker Compose installed**
   - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - Ubuntu: `sudo apt install docker.io docker-compose`
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)

2. **Node.js and pnpm** (or npm/yarn)

## PostgreSQL Setup with Docker

### 1. Create Docker Compose Configuration

Create a `docker-compose.yml` file in your server package root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: nest-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nest_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 2. Start PostgreSQL

```bash
# Start PostgreSQL in the background
docker-compose up -d

# Check if it's running
docker-compose ps

# View logs
docker-compose logs postgres

# Stop PostgreSQL
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### 3. Connect to PostgreSQL

```bash
# Connect using docker exec
docker exec -it nest-postgres psql -U postgres -d nest_db

# Or using psql if installed locally
psql postgresql://postgres:postgres@localhost:5432/nest_db
```

### 4. Create Additional Databases (Optional)

```bash
# Connect to PostgreSQL
docker exec -it nest-postgres psql -U postgres

# Inside psql:
CREATE DATABASE your_database_name;

# Create a user (optional)
CREATE USER your_username WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;

# Exit
\q
```

### 5. Database Management Commands

```bash
# List all databases
docker exec -it nest-postgres psql -U postgres -c "\l"

# List all tables in a database
docker exec -it nest-postgres psql -U postgres -d nest_db -c "\dt"

# Describe a table
docker exec -it nest-postgres psql -U postgres -d nest_db -c "\d table_name"

# Run a SQL query
docker exec -it nest-postgres psql -U postgres -d nest_db -c "SELECT * FROM users;"

# Backup database
docker exec nest-postgres pg_dump -U postgres nest_db > backup.sql

# Restore database
docker exec -i nest-postgres psql -U postgres nest_db < backup.sql
```

## Installation

### 1. Install Required Packages

Add the following dependencies to your `package.json`:

```bash
# Production dependencies
pnpm add kysely pg

# Development dependencies
pnpm add -D @types/pg tsx
```

**Package purposes:**
- `kysely` - Type-safe SQL query builder
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript types for pg
- `tsx` - TypeScript execution tool (for running migration scripts)

### 2. Add NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "db:migrate:up": "tsx scripts/run-migrations.ts up",
    "db:migrate:down": "tsx scripts/run-migrations.ts down",
    "db:seed": "tsx scripts/run-migrations.ts seed",
    "db:clear": "tsx scripts/run-migrations.ts clear"
  }
}
```

### 3. Enable Strict TypeScript

Update your `tsconfig.json` to enable strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    // ... other options
  }
}
```

## Configuration

### Environment Variables

Create a `.env` file in your server package root (copy from `env.example`):

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
# Option 1: Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nest_db

# Option 2: Use individual variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nest_db
DB_USER=postgres
DB_PASSWORD=postgres
```

**Note:** The providers will prioritize `DATABASE_URL` if it's set, otherwise fall back to individual variables.

**For Docker setup:** The default values above match the `docker-compose.yml` configuration.

## Architecture

### Directory Structure

```
packages/server/
├── src/
│   └── database/
│       ├── database.module.ts      # NestJS module
│       ├── database.providers.ts   # Provider factories
│       └── database.types.ts       # Type definitions
├── migrations/
│   └── 001_initial_schema.ts       # Migration files
├── scripts/
│   └── run-migrations.ts           # Migration runner
├── docker-compose.yml              # PostgreSQL container
└── env.example                     # Environment template
```

### Provider Architecture

The setup provides two injectable providers:

1. **PG_POOL** - PostgreSQL connection pool
2. **KYSELY_DB** - Kysely database instance

```mermaid
graph LR
    ConfigService --> PG_POOL
    PG_POOL --> KYSELY_DB
    KYSELY_DB --> YourServices
```

### Database Module

The `DatabaseModule` is marked as `@Global()`, making the providers available throughout your application without needing to import the module in every feature module.

**Files:**

#### `src/database/database.module.ts`

```typescript
import { Global, Module } from "@nestjs/common";
import { kyselyProvider, pgPoolProvider } from "./database.providers";

@Global()
@Module({
  providers: [pgPoolProvider, kyselyProvider],
  exports: [pgPoolProvider, kyselyProvider],
})
export class DatabaseModule {}
```

#### `src/database/database.providers.ts`

```typescript
import { ConfigService } from "@nestjs/config";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./database.types";

export const PG_POOL = "PG_POOL";
export const KYSELY_DB = "KYSELY_DB";

export const pgPoolProvider = {
  provide: PG_POOL,
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get<string>("DATABASE_URL");

    if (databaseUrl) {
      return new Pool({ connectionString: databaseUrl });
    }

    return new Pool({
      host: configService.get<string>("DB_HOST", "localhost"),
      port: configService.get<number>("DB_PORT", 5432),
      database: configService.get<string>("DB_NAME"),
      user: configService.get<string>("DB_USER"),
      password: configService.get<string>("DB_PASSWORD"),
    });
  },
  inject: [ConfigService],
};

export const kyselyProvider = {
  provide: KYSELY_DB,
  useFactory: (pool: Pool) => {
    return new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    });
  },
  inject: [PG_POOL],
};
```

#### `src/database/database.types.ts`

Manually defined database types:

```typescript
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface UsersTable {
  id: Generated<number>;
  email: string;
  name: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}

export interface Database {
  users: UsersTable;
}
```

### Register the Module

Import `DatabaseModule` in your `AppModule`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage

### Injecting Kysely in Services

```typescript
import { Inject, Injectable } from "@nestjs/common";
import { Kysely } from "kysely";
import { KYSELY_DB } from "./database/database.providers";
import type { Database } from "./database/database.types";

@Injectable()
export class UserService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>
  ) {}

  async findAll() {
    return await this.db
      .selectFrom("users")
      .selectAll()
      .execute();
  }

  async findById(id: number) {
    return await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async create(email: string, name: string) {
    return await this.db
      .insertInto("users")
      .values({ email, name })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, name: string) {
    return await this.db
      .updateTable("users")
      .set({ name, updated_at: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: number) {
    return await this.db
      .deleteFrom("users")
      .where("id", "=", id)
      .execute();
  }
}
```

### Query Examples

```typescript
// Select with conditions
const users = await db
  .selectFrom("users")
  .select(["id", "email", "name"])
  .where("email", "like", "%@example.com")
  .orderBy("created_at", "desc")
  .limit(10)
  .execute();

// Join tables
const result = await db
  .selectFrom("users")
  .innerJoin("posts", "posts.user_id", "users.id")
  .select(["users.name", "posts.title"])
  .execute();

// Transactions
await db.transaction().execute(async (trx) => {
  await trx.insertInto("users").values({ email, name }).execute();
  await trx.insertInto("profiles").values({ user_id, bio }).execute();
});

// Aggregations
const count = await db
  .selectFrom("users")
  .select(db.fn.count("id").as("total"))
  .executeTakeFirst();
```

## Migrations

### Migration System Overview

Migrations are managed using Kysely's built-in migration system. Migration files are stored in the `migrations/` folder and executed via the `run-migrations.ts` script.

### Creating a Migration

Create a new file in `migrations/` with a numbered prefix:

```typescript
// migrations/002_add_posts_table.ts
import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("posts")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("title", "varchar(255)", (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo("now()").notNull()
    )
    .execute();

  await db.schema
    .createIndex("posts_user_id_index")
    .on("posts")
    .column("user_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("posts").execute();
}
```

### Migration Commands

```bash
# Run all pending migrations
pnpm db:migrate:up

# Rollback the last migration
pnpm db:migrate:down

# Seed the database with initial data
pnpm db:seed

# Drop all tables (dangerous!)
pnpm db:clear
```

### Migration Runner Script

The `scripts/run-migrations.ts` file handles all migration operations:

- **up**: Runs all pending migrations using `migrateToLatest()`
- **down**: Rolls back the last migration using `migrateDown()`
- **seed**: Runs seed data (customize the seed function as needed)
- **clear**: Drops all tables in the database (use with caution!)

### Migration Tracking

Kysely automatically creates a `kysely_migration` table to track which migrations have been executed. You don't need to manage this manually.

### Example Migration Workflow

```bash
# 1. Create a new migration file
# migrations/003_add_comments_table.ts

# 2. Update database.types.ts with the new table type

# 3. Run the migration
pnpm db:migrate:up

# 4. If something went wrong, rollback
pnpm db:migrate:down
```

## Type Definitions

### Defining Types Manually

Database types are defined manually in `src/database/database.types.ts`. Update this file whenever you add or modify tables.

### Type Helpers

Use Kysely's type helpers for better type safety:

**`Generated<T>`** - For columns with database defaults (like auto-increment IDs, timestamps):
```typescript
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
```

**`Timestamp`** - For timestamp columns that accept Date or string:
```typescript
export type Timestamp = ColumnType<Date, Date | string, Date | string>;
```

### Adding a New Table

When you create a new migration, add the corresponding type:

```typescript
// 1. Create the migration
// migrations/002_add_posts_table.ts
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("posts")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) => col.references("users.id"))
    .addColumn("title", "varchar(255)", (col) => col.notNull())
    .addColumn("content", "text")
    .addColumn("created_at", "timestamp", (col) => col.defaultTo("now()"))
    .execute();
}

// 2. Add the type to database.types.ts
export interface PostsTable {
  id: Generated<number>;
  user_id: number;
  title: string;
  content: string | null;
  created_at: Generated<Timestamp>;
}

export interface Database {
  users: UsersTable;
  posts: PostsTable;  // Add here
}
```

### Type Safety Benefits

With properly defined types, you get:
- **Autocomplete** for table and column names
- **Type checking** for queries
- **Compile-time errors** for invalid queries

```typescript
// ✅ Valid - TypeScript knows about the 'users' table and its columns
const users = await db.selectFrom("users").select(["id", "email"]).execute();

// ❌ Error - 'userz' table doesn't exist
const users = await db.selectFrom("userz").select(["id"]).execute();

// ❌ Error - 'emailz' column doesn't exist
const users = await db.selectFrom("users").select(["emailz"]).execute();
```

### Column Type Mapping

Common PostgreSQL to TypeScript type mappings:

| PostgreSQL Type | TypeScript Type | Notes |
|----------------|-----------------|-------|
| `serial`, `integer` | `number` | Use `Generated<number>` for serial |
| `varchar`, `text` | `string` | |
| `boolean` | `boolean` | |
| `timestamp` | `Date` | Use `Timestamp` helper for flexibility |
| `json`, `jsonb` | `unknown` or specific type | Define your JSON structure |
| `uuid` | `string` | |
| `numeric`, `decimal` | `string` | Precision numbers as strings |

### Workflow

1. Create a migration file
2. Update `database.types.ts` with the new table interface
3. Add the table to the `Database` interface
4. Run the migration: `pnpm db:migrate:up`
5. Commit both migration and type files together

## Troubleshooting

### Docker Issues

**Problem:** Docker container won't start

**Solutions:**
- Check if port 5432 is already in use: `lsof -i :5432` (macOS/Linux) or `netstat -ano | findstr :5432` (Windows)
- Stop any existing PostgreSQL services
- Check Docker logs: `docker-compose logs postgres`
- Ensure Docker Desktop is running
- Try removing and recreating: `docker-compose down -v && docker-compose up -d`

**Problem:** Container starts but can't connect

**Solutions:**
- Wait for healthcheck to pass: `docker-compose ps` (should show "healthy")
- Check container logs: `docker-compose logs postgres`
- Verify port mapping: `docker-compose ps` should show `0.0.0.0:5432->5432/tcp`
- Test connection: `docker exec -it nest-postgres pg_isready -U postgres`

### Connection Issues

**Problem:** Cannot connect to PostgreSQL from application

**Solutions:**
- Verify PostgreSQL container is running: `docker-compose ps`
- Check connection string format: `postgresql://user:password@host:port/database`
- Ensure database exists: `docker exec -it nest-postgres psql -U postgres -l`
- Check environment variables are loaded correctly
- Verify credentials match docker-compose.yml
- For Docker Desktop on Mac/Windows, use `localhost` not `127.0.0.1`

### Migration Errors

**Problem:** Migration fails partway through

**Solutions:**
- Check the error message in the console
- Manually inspect the database state
- Rollback if needed: `pnpm db:migrate:down`
- Fix the migration file
- Run again: `pnpm db:migrate:up`

**Problem:** "Migration X has already been run"

**Solution:**
- Kysely tracks migrations in the `kysely_migration` table
- Check: `docker exec -it nest-postgres psql -U postgres -d nest_db -c "SELECT * FROM kysely_migration;"`
- If needed, manually remove the entry (be careful!)

### Type Definition Issues

**Problem:** Types don't match database schema

**Solution:**
- Manually verify your type definitions match your migrations
- Inspect the actual schema: `docker exec -it nest-postgres psql -U postgres -d nest_db -c "\d table_name"`
- Update `database.types.ts` to match the actual schema

**Problem:** TypeScript errors about missing columns

**Solution:**
- Check that you've added all columns from your migration to the type definition
- Ensure nullable columns are marked with `| null`
- Use `Generated<T>` for columns with database defaults

### Data Persistence Issues

**Problem:** Data is lost when container restarts

**Solution:**
- Ensure you're using the volume defined in docker-compose.yml
- Check volumes: `docker volume ls`
- Verify volume mount in docker-compose.yml: `postgres_data:/var/lib/postgresql/data`

**Problem:** Need to reset database completely

**Solution:**
```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for healthy status
docker-compose ps

# Run migrations
pnpm db:migrate:up
```

### TypeScript Strict Mode Errors

**Problem:** Strict mode causes errors in existing code

**Solutions:**
- Fix type errors incrementally
- Use proper null checks: `if (value !== null && value !== undefined)`
- Define return types explicitly
- Use type guards for narrowing types

### Common Query Issues

**Problem:** Query returns `undefined` instead of throwing error

**Solution:**
- Use `executeTakeFirstOrThrow()` instead of `executeTakeFirst()`
- Add proper null checks
- Handle the case where no rows are returned

**Problem:** Date/timestamp handling issues

**Solution:**
- PostgreSQL returns dates as Date objects
- Use `new Date()` when inserting timestamps
- Consider using `timestamp with time zone` for timezone-aware dates

## Best Practices

1. **Always run migrations in order** - Use numbered prefixes (001, 002, etc.)
2. **Write reversible migrations** - Always implement both `up()` and `down()`
3. **Keep types in sync** - Update `database.types.ts` when creating migrations
4. **Use transactions for related operations** - Ensure data consistency
5. **Index frequently queried columns** - Improve query performance
6. **Use connection pooling** - Already configured via pg Pool
7. **Handle errors gracefully** - Use try-catch and proper error handling
8. **Version control migrations** - Commit migration files to git
9. **Test migrations** - Run up and down to verify they work
10. **Document complex queries** - Add comments for maintainability
11. **Use Docker volumes** - Persist data across container restarts
12. **Backup regularly** - Use `pg_dump` for production data
13. **Don't commit .env** - Keep credentials secure, use env.example as template

## Additional Resources

- [Kysely Documentation](https://kysely.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [pg (node-postgres) Documentation](https://node-postgres.com/)

## Summary

You now have a complete PostgreSQL + Kysely setup with:
- ✅ Type-safe database queries
- ✅ Automated migrations system
- ✅ Manual type definitions for full control
- ✅ NestJS dependency injection
- ✅ Environment-based configuration
- ✅ Seed and clear commands

To recreate this in a new project, follow the steps in order:
1. Create docker-compose.yml for PostgreSQL
2. Start PostgreSQL: `docker-compose up -d`
3. Install packages: `pnpm add kysely pg && pnpm add -D @types/pg tsx`
4. Configure environment variables
5. Create database module and providers
6. Create migrations folder and runner script
7. Create database.types.ts with your table definitions
8. Register DatabaseModule in AppModule
9. Run migrations: `pnpm db:migrate:up`
10. Start building your application!

