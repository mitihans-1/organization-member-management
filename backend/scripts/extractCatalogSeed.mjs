import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '../prisma/seed.ts');
const seed = fs.readFileSync(seedPath, 'utf8');

const evMatch = seed.match(
  /const platformEvents = \[([\s\S]*?)\];\s*\n\s*const existingEvents/,
);
const svcMatch = seed.match(
  /const predefinedServices = \[([\s\S]*?)\];\s*\n\s*for \(const service of predefinedServices\)/,
);
const blogMatch = seed.match(
  /const platformBlogs = \[([\s\S]*?)\];\s*\n\s*const existing = await prisma\.blog\.findMany\(\{ where: \{ isPredefined: true \}/,
);

if (!evMatch || !svcMatch || !blogMatch) {
  console.error('parse failed', !!evMatch, !!svcMatch, !!blogMatch);
  process.exit(1);
}

const out = `/** Platform catalog seed — extracted from prisma/seed.ts */
export const PLATFORM_SERVICE_SEED = [${svcMatch[1]}] as const;

export const PLATFORM_EVENT_SEED = [${evMatch[1]}] as const;

export const PLATFORM_BLOG_SEED = [${blogMatch[1]}] as const;
`;

const outPath = path.join(__dirname, '../src/data/predefinedCatalogSeed.ts');
fs.writeFileSync(outPath, out);
console.log('wrote', outPath, out.length, 'bytes');
