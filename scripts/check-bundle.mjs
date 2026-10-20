// Runs after `npm run build` and fails it if the built site contains anything
// that looks like an OpenAI key or a call to OpenAI. Everything in dist/ is public.
//
// Usage: node scripts/check-bundle.mjs [dir]   (default: dist)

import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || 'dist');

// Key shapes (sk-..., sk-proj-...) and the API host.
const KEY = /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/;
const HOST = /api\.openai\.com/i;
const TEXT = new Set(['.js', '.mjs', '.css', '.html', '.json', '.map', '.txt', '.svg']);

if (!fs.existsSync(dir)) {
  console.error(`check-bundle: ${dir} does not exist. Build first.`);
  process.exit(1);
}

const problems = [];
let checked = 0;

const walk = (current) => {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const file = path.join(current, entry.name);
    if (entry.isDirectory()) {
      walk(file);
    } else if (TEXT.has(path.extname(entry.name).toLowerCase())) {
      checked += 1;
      const text = fs.readFileSync(file, 'utf8');
      const key = text.match(KEY);
      if (key) {
        // Never print the whole thing: first 8, last 4.
        const masked = `${key[0].slice(0, 8)}…${key[0].slice(-4)}`;
        problems.push(`${path.relative(dir, file)}: looks like an API key (${masked})`);
      }
      if (HOST.test(text)) problems.push(`${path.relative(dir, file)}: mentions api.openai.com`);
    }
  }
};

walk(dir);

if (problems.length) {
  console.error('check-bundle: the build is not safe to publish:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`check-bundle: ${checked} files in ${path.relative(process.cwd(), dir) || dir}, no API key and no api.openai.com.`);
