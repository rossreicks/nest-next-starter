import { type Kysely, sql } from "kysely";

/**
 * Migration: Create better-auth tables
 */
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("user")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("name", "text", (col) => col.notNull())
		.addColumn("email", "text", (col) => col.notNull().unique())
		.addColumn("emailVerified", "boolean", (col) => col.notNull())
		.addColumn("image", "text")
		.addColumn("createdAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.addColumn("updatedAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.execute();

	await db.schema
		.createTable("session")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("expiresAt", "timestamptz", (col) => col.notNull())
		.addColumn("token", "text", (col) => col.notNull().unique())
		.addColumn("createdAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.addColumn("updatedAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.addColumn("ipAddress", "text")
		.addColumn("userAgent", "text")
		.addColumn("userId", "text", (col) => col.notNull().references("user.id"))
		.execute();

	await db.schema
		.createTable("account")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("accountId", "text", (col) => col.notNull())
		.addColumn("providerId", "text", (col) => col.notNull())
		.addColumn("userId", "text", (col) => col.notNull().references("user.id"))
		.addColumn("accessToken", "text")
		.addColumn("refreshToken", "text")
		.addColumn("idToken", "text")
		.addColumn("accessTokenExpiresAt", "timestamptz")
		.addColumn("refreshTokenExpiresAt", "timestamptz")
		.addColumn("scope", "text")
		.addColumn("password", "text")
		.addColumn("createdAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.addColumn("updatedAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.execute();

	await db.schema
		.createTable("verification")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("identifier", "text", (col) => col.notNull())
		.addColumn("value", "text", (col) => col.notNull())
		.addColumn("expiresAt", "timestamptz", (col) => col.notNull())
		.addColumn("createdAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.addColumn("updatedAt", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("user").execute();
	await db.schema.dropTable("session").execute();
	await db.schema.dropTable("account").execute();
	await db.schema.dropTable("verification").execute();
}
