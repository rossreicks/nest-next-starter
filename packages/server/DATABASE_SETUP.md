# PostgreSQL + Kysely ORM Setup Guide

This guide documents how to set up PostgreSQL with Kysely ORM in a NestJS application. Use this as a reference for recreating this setup in future projects.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Usage](#usage)
- [Migrations](#migrations)
- [Type Generation](#type-generation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

1. **PostgreSQL installed and running**
   - macOS: `brew install postgresql@16 && brew services start postgresql@16`
   - Ubuntu: `sudo apt install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **A PostgreSQL database created**
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create a database
   CREATE DATABASE your_database_name;

   # Create a user (optional)
   CREATE USER your_username WITH PASSWORD 'your_password';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;
   ```

3. **Node.js and pnpm** (or npm/yarn)

## Installation

### 1. Install Required Packages

Add the following dependencies to your `package.json`:

```bash
# Production dependencies
pnpm add kysely pg

# Development dependencies
pnpm add -D @types/pg kysely-codegen tsx
```

**Package purposes:**
- `kysely` - Type-safe SQL query builder
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript types for pg
- `kysely-codegen` - Generate TypeScript types from database schema
- `tsx` - TypeScript execution tool (for running migration scripts)

### 2. Add NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "db:migrate:up": "tsx scripts/run-migrations.ts up",
    "db:migrate:down": "tsx scripts/run-migrations.ts down",
    "db:seed": "tsx scripts/run-migrations.ts seed",
    "db:clear": "tsx scripts/run-migrations.ts clear",
    "db:types": "kysely-codegen --out-file=src/database/database.types.ts"
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
# Option 1: Use DATABASE_URL (recommended)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Option 2: Use individual variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

**Note:** The providers will prioritize `DATABASE_URL` if it's set, otherwise fall back to individual variables.

## Architecture

### Directory Structure

```
packages/server/
├── src/
│   └── database/
│       ├── database.module.ts      # NestJS module
│       ├── database.providers.ts   # Provider factories
│       └── database.types.ts       # Generated types
├── migrations/
│   └── 001_initial_schema.ts       # Migration files
├── scripts/
│   └── run-migrations.ts           # Migration runner
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

Initially a placeholder file that will be populated by `kysely-codegen`:

```typescript
export interface Database {
  // Tables will be added here by kysely-codegen
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

# 2. Run the migration
pnpm db:migrate:up

# 3. Generate TypeScript types from the new schema
pnpm db:types

# 4. If something went wrong, rollback
pnpm db:migrate:down
```

## Type Generation

### Generating Types from Database Schema

After running migrations, generate TypeScript types that match your database schema:

```bash
pnpm db:types
```

This runs `kysely-codegen` which:
1. Connects to your database
2. Introspects the schema
3. Generates TypeScript interfaces in `src/database/database.types.ts`

### Generated Types Example

After running migrations, your `database.types.ts` might look like:

```typescript
export interface Database {
  users: {
    id: number;
    email: string;
    name: string;
    created_at: Date;
    updated_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string | null;
    created_at: Date;
  };
}
```

### Type Safety Benefits

With generated types, you get:
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

### Workflow

1. Create and run migrations
2. Generate types: `pnpm db:types`
3. Commit both migration files and generated types
4. Types stay in sync with your database schema

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
- Verify PostgreSQL is running: `pg_isready`
- Check connection string format: `postgresql://user:password@host:port/database`
- Ensure database exists: `psql -l`
- Check firewall/network settings
- Verify credentials

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
- Check: `SELECT * FROM kysely_migration;`
- If needed, manually remove the entry (be careful!)

### Type Generation Issues

**Problem:** `kysely-codegen` fails to connect

**Solutions:**
- Ensure database is running and accessible
- Verify environment variables are loaded
- Check that migrations have been run
- Try running with explicit connection string:
  ```bash
  kysely-codegen --url postgresql://user:pass@localhost:5432/db --out-file=src/database/database.types.ts
  ```

**Problem:** Generated types are empty

**Solution:**
- Ensure migrations have been run: `pnpm db:migrate:up`
- Check that tables exist: `psql -d your_db -c "\dt"`
- Verify codegen is pointing to the correct database

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
3. **Generate types after schema changes** - Keep types in sync with database
4. **Use transactions for related operations** - Ensure data consistency
5. **Index frequently queried columns** - Improve query performance
6. **Use connection pooling** - Already configured via pg Pool
7. **Handle errors gracefully** - Use try-catch and proper error handling
8. **Version control migrations** - Commit migration files to git
9. **Test migrations** - Run up and down to verify they work
10. **Document complex queries** - Add comments for maintainability

## Additional Resources

- [Kysely Documentation](https://kysely.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [pg (node-postgres) Documentation](https://node-postgres.com/)

## Summary

You now have a complete PostgreSQL + Kysely setup with:
- ✅ Type-safe database queries
- ✅ Automated migrations system
- ✅ Type generation from schema
- ✅ NestJS dependency injection
- ✅ Environment-based configuration
- ✅ Seed and clear commands

To recreate this in a new project, follow the steps in order:
1. Install packages
2. Configure environment variables
3. Create database module and providers
4. Create migrations folder and runner script
5. Register DatabaseModule in AppModule
6. Run migrations and generate types
7. Start building your application!

