const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: process.env.DB_USER || 'tnai_user',
  password: process.env.DB_PASSWORD || 'tneural123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tnai_pm',
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync('./alter_features_table.sql', 'utf-8');
    console.log('Running migration...');
    console.log(sql);
    
    // Split by semicolon to run individual statements
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\nExecuting: ${statement.trim().substring(0, 50)}...`);
        await client.query(statement);
        console.log('✓ Success');
      }
    }
    
    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
