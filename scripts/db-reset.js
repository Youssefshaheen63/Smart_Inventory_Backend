/**
 * Drops all tables in the stocksavvy public schema so TypeORM
 * synchronize can recreate them from scratch on next startup.
 *
 * Usage: node scripts/db-reset.js
 */
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^(DB_\w+)=(.+)$/);
      if (m) process.env[m[1]] = m[2];
    }
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'usef',
    password: process.env.DB_PASSWORD || 'usef',
    database: process.env.DB_NAME || 'stocksavvy',
  });

  await client.connect();
  console.log('Connected to', process.env.DB_NAME || 'stocksavvy');

  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  console.log('Public schema recreated — all tables dropped');

  await client.end();
  console.log('Done. Run "npm run build && npm start" to recreate tables.');
}

main().catch((err) => {
  console.error('db:reset failed:', err.message);
  process.exit(1);
});
