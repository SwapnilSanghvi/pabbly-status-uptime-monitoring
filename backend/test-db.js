import pool from './src/config/database.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Server time:', result.rows[0].now, '\n');

    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables in database:');
    if (tables.rows.length === 0) {
      console.log('❌ No tables found! Run migrations with: npm run migrate\n');
    } else {
      tables.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.table_name}`);
      });
      console.log();
    }

    // Check admin user
    const adminCheck = await pool.query('SELECT email, full_name FROM admin_user LIMIT 1');
    if (adminCheck.rows.length > 0) {
      console.log('👤 Admin user found:');
      console.log(`   Email: ${adminCheck.rows[0].email}`);
      console.log(`   Name: ${adminCheck.rows[0].full_name}\n`);
    }

    // Check sample APIs
    const apisCheck = await pool.query('SELECT COUNT(*) as count FROM apis');
    console.log(`🔗 Sample APIs: ${apisCheck.rows[0].count} endpoints configured\n`);

    console.log('✨ Database is ready!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database "status_monitor" exists');
    console.error('3. Connection string in .env is correct\n');
    process.exit(1);
  }
}

testDatabase();
