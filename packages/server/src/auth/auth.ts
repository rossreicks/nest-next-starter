import type { ConfigService } from "@nestjs/config";
import { betterAuth } from "better-auth";
import type { Pool } from "pg";

/**
 * Create Better Auth instance with injected dependencies
 *
 * @param configService - NestJS ConfigService for accessing environment variables
 * @param pool - PostgreSQL connection pool
 * @returns Configured Better Auth instance
 */
export function createAuthInstance(configService: ConfigService, pool: Pool) {
	const secret = configService.get<string>("BETTER_AUTH_SECRET");
	const githubClientId = configService.get<string>("GITHUB_CLIENT_ID");
	const githubClientSecret = configService.get<string>("GITHUB_CLIENT_SECRET");
	const googleClientId = configService.get<string>("GOOGLE_CLIENT_ID");
	const googleClientSecret = configService.get<string>("GOOGLE_CLIENT_SECRET");

	return betterAuth({
		database: pool,
		secret,
		emailAndPassword: {
			enabled: true,
		},
		socialProviders: {
			github: {
				clientId: githubClientId || "",
				clientSecret: githubClientSecret || "",
				enabled: !!(githubClientId && githubClientSecret),
			},
			google: {
				clientId: googleClientId || "",
				clientSecret: googleClientSecret || "",
				enabled: !!(googleClientId && googleClientSecret),
			},
		},
	});
}
