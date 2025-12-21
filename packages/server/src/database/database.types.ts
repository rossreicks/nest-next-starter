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
 * Database interface
 * Add your tables here as you create them
 */
export interface Database {
	user: UserTable;
}
