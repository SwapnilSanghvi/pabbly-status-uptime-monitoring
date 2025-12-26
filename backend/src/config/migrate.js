import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../../..', 'database', 'migrations');
const seedsDir = path.join(__dirname, '../../..', 'database', 'seeds');

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...\n');

    // Get all migration files sorted by name
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

async function runSeeds() {
  try {
    console.log('🌱 Running database seeds...\n');

    // Get all seed files sorted by name
    const seedFiles = fs
      .readdirSync(seedsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running seed: ${file}`);
      await pool.query(sql);
      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('✅ All seeds completed successfully!\n');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

async function setupDatabase() {
  try {
    await runMigrations();
    await runSeeds();
    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup database:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { runMigrations, runSeeds, setupDatabase };
