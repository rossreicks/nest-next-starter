import { ConfigurableModuleAsyncOptions } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Auth } from "better-auth";
import type { Pool } from "pg";
import { DatabaseModule } from "../database/database.module";
import { PG_POOL } from "../database/database.providers";
import { createAuthInstance } from "./auth";

/**
 * Auth Module Async Configuration
 *
 * Provides the configuration for AuthModule.forRootAsync()
 * Injects ConfigService and PG_POOL to create the Better Auth instance
 */
export const authModuleAsyncConfig: ConfigurableModuleAsyncOptions<
	{ auth: Auth },
	"create"
> = {
	imports: [DatabaseModule],
	inject: [ConfigService, PG_POOL],
	useFactory: (configService: ConfigService, pool: Pool) => {
		const auth = createAuthInstance(configService, pool);
		return { auth };
	},
};
