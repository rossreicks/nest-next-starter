/**
 * Auth Module Barrel Exports
 *
 * Re-exports commonly used decorators and types from Better Auth NestJS integration
 */

export {
	AllowAnonymous,
	OptionalAuth,
	Session,
	type UserSession,
} from "@thallesp/nestjs-better-auth";
export { createAuthInstance } from "./auth";
export { authModuleAsyncConfig } from "./auth.config";
