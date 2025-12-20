import type { Kysely } from "kysely";

/**
 * Initial schema migration
 * Creates a users table as an example
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable("users")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("email", "varchar(255)", (col) => col.notNull().unique())
		.addColumn("name", "varchar(255)", (col) => col.notNull())
		.addColumn("created_at", "timestamp", (col) =>
			col.defaultTo("now()").notNull(),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.defaultTo("now()").notNull(),
		)
		.execute();

	// Create an index on email for faster lookups
	await db.schema
		.createIndex("users_email_index")
		.on("users")
		.column("email")
		.execute();
}

/**
 * Rollback migration
 * Drops the users table
 */
export async function down(db: Kysely<unknown>): Promise<void> {
	await db.schema.dropTable("users").execute();
}
