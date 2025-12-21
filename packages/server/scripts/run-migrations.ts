import { promises as fs } from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";
import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	PostgresDialect,
} from "kysely";
import { Pool } from "pg";

config();

/**
 * Database Migration Runner
 *
 * Commands:
 * - up: Run all pending migrations
 * - down: Rollback the last migration
 * - seed: Run seed data (placeholder for now)
 * - clear: Drop all tables (dangerous!)
 *
 * Usage:
 * pnpm db:migrate:up
 * pnpm db:migrate:down
 * pnpm db:seed
 * pnpm db:clear
 */

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number.parseInt(process.env.DB_PORT || "5432", 10);
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

type DB = {
	[key: string]: any;
};

// Create database connection
function createDb() {
	const pool = DATABASE_URL
		? new Pool({ connectionString: DATABASE_URL })
		: new Pool({
				host: DB_HOST,
				port: DB_PORT,
				database: DB_NAME,
				user: DB_USER,
				password: DB_PASSWORD,
			});

	return new Kysely<DB>({
		dialect: new PostgresDialect({ pool }),
	});
}

// Create migrator instance
async function createMigrator(db: Kysely<DB>) {
	return new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, "../migrations"),
		}),
	});
}

// Run pending migrations
async function migrateUp() {
	const db = createDb();
	const migrator = await createMigrator(db);

	console.log("🔄 Running pending migrations...");

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it: { status: string; migrationName: string }) => {
		if (it.status === "Success") {
			console.log(`✅ Migration "${it.migrationName}" executed successfully`);
		} else if (it.status === "Error") {
			console.error(`❌ Migration "${it.migrationName}" failed`);
		}
	});

	if (error) {
		console.error("❌ Migration failed:");
		console.error(error);
		await db.destroy();
		process.exit(1);
	}

	if (!results || results.length === 0) {
		console.log("✨ No pending migrations to run");
	}

	await db.destroy();
	console.log("✅ Migrations completed");
}

// Rollback last migration
async function migrateDown() {
	const db = createDb();
	const migrator = await createMigrator(db);

	console.log("🔄 Rolling back last migration...");

	const { error, results } = await migrator.migrateDown();

	results?.forEach((it: { status: string; migrationName: string }) => {
		if (it.status === "Success") {
			console.log(
				`✅ Migration "${it.migrationName}" rolled back successfully`,
			);
		} else if (it.status === "Error") {
			console.error(`❌ Migration "${it.migrationName}" rollback failed`);
		}
	});

	if (error) {
		console.error("❌ Rollback failed:");
		console.error(error);
		await db.destroy();
		process.exit(1);
	}

	if (!results || results.length === 0) {
		console.log("✨ No migrations to roll back");
	}

	await db.destroy();
	console.log("✅ Rollback completed");
}

// Seed database with initial data
async function seed() {
	const db = createDb();

	console.log("🌱 Seeding database...");

	try {
		// Example seed data - customize as needed
		// Uncomment and modify when you have tables to seed

		/*
		await db
			.insertInto('user')
			.values([
				{ email: 'admin@example.com', name: 'Admin User' },
				{ email: 'user@example.com', name: 'Regular User' },
			])
			.execute();
		*/

		console.log("✅ Database seeded successfully");
		console.log("ℹ️  Add your seed data in scripts/run-migrations.ts");
	} catch (error) {
		console.error("❌ Seeding failed:");
		console.error(error);
		await db.destroy();
		process.exit(1);
	}

	await db.destroy();
}

// Clear all tables (dangerous!)
async function clear() {
	const db = createDb();

	console.log("⚠️  WARNING: This will drop ALL tables in the database!");
	console.log("⚠️  This action cannot be undone!");

	// In a real scenario, you might want to add a confirmation prompt
	// For now, we'll just proceed with caution

	console.log("🔄 Dropping all tables...");

	try {
		// Get all table names
		const tables = await db
			.selectFrom(`information_schema.tables`)
			.select("table_name")
			.where("table_schema", "=", "public")
			.where("table_type", "=", "BASE TABLE")
			.execute();

		// Drop each table
		for (const table of tables) {
			console.log(`  Dropping table: ${table.table_name}`);
			await db.schema
				.dropTable(table.table_name)
				.ifExists()
				.cascade()
				.execute();
		}

		console.log("✅ All tables dropped successfully");
	} catch (error) {
		console.error("❌ Clear failed:");
		console.error(error);
		await db.destroy();
		process.exit(1);
	}

	await db.destroy();
}

// Main execution
const command = process.argv[2];

async function main() {
	switch (command) {
		case "up":
			await migrateUp();
			break;
		case "down":
			await migrateDown();
			break;
		case "seed":
			await seed();
			break;
		case "clear":
			await clear();
			break;
		default:
			console.error("❌ Unknown command. Use: up, down, seed, or clear");
			process.exit(1);
	}
}

main().catch((error) => {
	console.error("❌ Unexpected error:");
	console.error(error);
	process.exit(1);
});
