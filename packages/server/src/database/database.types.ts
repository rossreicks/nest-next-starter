import type { ColumnType } from "kysely";

/**
 * Database schema types
 *
 * Define your table types manually here.
 * Update this file whenever you add/modify tables in migrations.
 */

/**
 * Helpers for timestamp columns with automatic now() defaults
 */
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
	? ColumnType<S, I | undefined, U>
	: ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

/**
 * User table
 */
export interface UserTable {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	createdAt: Generated<Timestamp>;
	updatedAt: Generated<Timestamp>;
}

/**
 * Session table (better-auth)
 */
export interface SessionTable {
	id: string;
	expiresAt: Timestamp;
	token: string;
	createdAt: Generated<Timestamp>;
	updatedAt: Generated<Timestamp>;
	ipAddress: string | null;
	userAgent: string | null;
	userId: string;
}

/**
 * Account table (better-auth)
 */
export interface AccountTable {
	id: string;
	accountId: string;
	providerId: string;
	userId: string;
	accessToken: string | null;
	refreshToken: string | null;
	idToken: string | null;
	accessTokenExpiresAt: Timestamp | null;
	refreshTokenExpiresAt: Timestamp | null;
	scope: string | null;
	password: string | null;
	createdAt: Generated<Timestamp>;
	updatedAt: Generated<Timestamp>;
}

/**
 * Verification table (better-auth)
 */
export interface VerificationTable {
	id: string;
	identifier: string;
	value: string;
	expiresAt: Timestamp;
	createdAt: Generated<Timestamp>;
	updatedAt: Generated<Timestamp>;
}

/**
 * Database interface
 * Add your tables here as you create them
 */
export interface Database {
	user: UserTable;
	session: SessionTable;
	account: AccountTable;
	verification: VerificationTable;
}
