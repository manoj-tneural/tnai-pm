const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'tnai_user',
  password: process.env.DB_PASSWORD || 'tneural123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tnai_pm',
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    const migrationDir = './supabase/migrations';
    const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
    
    console.log(`Found ${files.length} migration files`);
    
    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`\n✓ Executing: ${file} - ${statement.trim().substring(0, 60)}...`);
          await client.query(statement);
        }
      }
    }
    
    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
