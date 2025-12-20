import { ConfigService } from "@nestjs/config";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./database.types";

/**
 * Injection tokens for database providers
 */
export const PG_POOL = "PG_POOL";
export const KYSELY_DB = "KYSELY_DB";

/**
 * PostgreSQL connection pool provider
 * Creates a pg Pool instance using environment variables
 */
export const pgPoolProvider = {
	provide: PG_POOL,
	useFactory: (configService: ConfigService) => {
		const databaseUrl = configService.get<string>("DATABASE_URL");

		if (databaseUrl) {
			// Use DATABASE_URL if provided
			return new Pool({
				connectionString: databaseUrl,
			});
		}

		// Fall back to individual environment variables
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

/**
 * Kysely database instance provider
 * Creates a Kysely instance using the pg Pool
 */
export const kyselyProvider = {
	provide: KYSELY_DB,
	useFactory: (pool: Pool) => {
		return new Kysely<Database>({
			dialect: new PostgresDialect({
				pool,
			}),
		});
	},
	inject: [PG_POOL],
};
