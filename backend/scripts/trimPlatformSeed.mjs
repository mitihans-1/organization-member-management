import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '../prisma/seed.ts');
let seed = fs.readFileSync(seedPath, 'utf8');

seed = seed.replace(
  /\n  const platformEventTarget[\s\S]*?console\.log\('Platform predefined events seeded'\);\n  \}\n/,
  '\n',
);
seed = seed.replace(
  /\n  const serviceCount[\s\S]*?console\.log\('Predefined platform services seeded'\);\n  \}\n/,
  '\n',
);

fs.writeFileSync(seedPath, seed);
console.log('trimmed platform seed blocks');
