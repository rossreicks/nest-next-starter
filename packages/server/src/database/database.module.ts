import { Global, Module } from "@nestjs/common";
import { kyselyProvider, pgPoolProvider } from "./database.providers";

/**
 * Database Module
 *
 * Provides PostgreSQL connection pool and Kysely database instance.
 * Marked as Global so providers are available throughout the application.
 *
 * Usage in services:
 * ```typescript
 * import { Inject, Injectable } from '@nestjs/common';
 * import { Kysely } from 'kysely';
 * import { KYSELY_DB } from './database/database.providers';
 * import type { Database } from './database/database.types';
 *
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @Inject(KYSELY_DB) private readonly db: Kysely<Database>
 *   ) {}
 *
 *   async findAll() {
 *     return await this.db.selectFrom('users').selectAll().execute();
 *   }
 * }
 * ```
 */
@Global()
@Module({
	providers: [pgPoolProvider, kyselyProvider],
	exports: [pgPoolProvider, kyselyProvider],
})
export class DatabaseModule {}
