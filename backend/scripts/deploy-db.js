const { execSync } = require('child_process');
const path = require('path');

// 1. Resolve DATABASE_URL
if ((!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('${')) && process.env.MYSQL_ADDON_URI) {
  process.env.DATABASE_URL = process.env.MYSQL_ADDON_URI;
}

// Strip outer quotes if any
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '').trim();
}

console.log('Resolved database connection string prefix:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[0] : 'NONE');

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

  console.log('Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });

  console.log('Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit', env: process.env });

  console.log('Seeding initial data...');
  const seedPath = path.join(__dirname, '../dist/prisma/seed.js');
  require(seedPath);
  console.log('Database preparation complete!');
} catch (err) {
  console.error('Database deployment failed:', err);
  process.exit(1);
}

