import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyMigration() {
  const client = await pool.connect();

  try {
    console.log('Verifying migration...\n');

    // Check if api_groups table exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'api_groups'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ api_groups table exists');

      // Check groups in the table
      const groups = await client.query('SELECT * FROM api_groups');
      console.log(`✅ Found ${groups.rows.length} group(s):`);
      groups.rows.forEach(group => {
        console.log(`   - ${group.name} (ID: ${group.id}, Order: ${group.display_order})`);
      });
      console.log('');

      // Check if group_id column exists in apis table
      const columnCheck = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'apis' AND column_name = 'group_id'
      `);

      if (columnCheck.rows.length > 0) {
        console.log('✅ group_id column exists in apis table');
        console.log(`   Type: ${columnCheck.rows[0].data_type}`);

        // Check how many APIs have groups assigned
        const apiCheck = await client.query(`
          SELECT
            COUNT(*) as total,
            COUNT(group_id) as with_group,
            COUNT(*) - COUNT(group_id) as without_group
          FROM apis
        `);

        const stats = apiCheck.rows[0];
        console.log(`\n✅ API Assignment Stats:`);
        console.log(`   Total APIs: ${stats.total}`);
        console.log(`   With group assigned: ${stats.with_group}`);
        console.log(`   Without group: ${stats.without_group}`);
      } else {
        console.log('❌ group_id column NOT found in apis table');
      }
    } else {
      console.log('❌ api_groups table NOT found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyMigration();
