// Rebuilds public/data/sippData.json: finds each pundit's public predictions with
// a model that can search the web, rates the ones whose outcome is known, and
// writes the scores. The app only ever reads that file.
//
// Run it on your own machine:  OPENAI_API_KEY=... npm run refresh-data
// The key is read here and nowhere else. Never name it VITE_*: Vite copies those
// into the browser bundle.
//
// Nothing is made up. A prediction with no usable source link is dropped, and a
// pundit with fewer than MIN_VERIFIED rated predictions is left out, not padded.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import OpenAI from 'openai';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = path.join(ROOT, 'public/data/sippData.json');

// Current as of OpenAI's docs on 2026-10-20: a model that supports the Responses
// API and its web_search tool. Override with OPENAI_MODEL, e.g. gpt-6-luna to spend less.
const MODEL = process.env.OPENAI_MODEL || 'gpt-6.1-sol';
const SINCE = '2023-01-01';
const MIN_VERIFIED = 3;
const CATEGORIES = ['economy', 'politics', 'technology', 'foreign-policy', 'social-trends'];

const PUNDITS = [
  { id: 'tucker-carlson', name: 'Tucker Carlson', shortBio: 'Conservative political commentator, former Fox News host', photoUrl: '/portraits/dc4415b9-f384-4c81-b95d-952a1c7c3849.png' },
  { id: 'rachel-maddow', name: 'Rachel Maddow', shortBio: 'Progressive political commentator, MSNBC host', photoUrl: '/portraits/c844125c-dc7e-4e4d-878c-8c237999c9b5.png' },
  { id: 'elon-musk', name: 'Elon Musk', shortBio: 'Tech entrepreneur, owner of X/Twitter', photoUrl: '/portraits/0d2c9e34-5b94-48a2-a7ff-e928ed7818ac.png' },
  { id: 'nate-silver', name: 'Nate Silver', shortBio: 'Data journalist, founder of FiveThirtyEight', photoUrl: '/portraits/e9915d12-f691-4ce5-912c-330023f9a16b.png' },
  { id: 'sean-hannity', name: 'Sean Hannity', shortBio: 'Conservative political commentator, Fox News host', photoUrl: '/portraits/e08e1c1f-75ae-4e63-8e39-1031441d6435.png' },
  { id: 'anderson-cooper', name: 'Anderson Cooper', shortBio: 'CNN anchor and correspondent', photoUrl: '/portraits/a1a3d886-769a-4116-84b0-27a1cbbeb947.png' },
  { id: 'ben-shapiro', name: 'Ben Shapiro', shortBio: 'Conservative political commentator, founder of The Daily Wire', photoUrl: '/portraits/142a495e-df1d-48b0-b7b3-85d6a049d420.png' },
  { id: 'ezra-klein', name: 'Ezra Klein', shortBio: 'Liberal political analyst, co-founder of Vox', photoUrl: '/portraits/928cfe89-be28-4b21-b62d-84037e1c20f9.png' },
  { id: 'joe-rogan', name: 'Joe Rogan', shortBio: 'Podcast host with wide-ranging political discussions', photoUrl: '/portraits/aad243bb-10d6-4507-ba12-3c3feb720071.png' },
  { id: 'krystal-ball', name: 'Krystal Ball', shortBio: 'Progressive political commentator, co-host of Breaking Points', photoUrl: '/portraits/29d1d72f-3504-4b6c-9e6b-aecc18ce59b0.png' },
];

const HELP = `Usage: npm run refresh-data -- [options]

Rebuilds public/data/sippData.json from web searches. Needs OPENAI_API_KEY in the
environment or in a .env file. It makes about two requests per pundit, one of them
with web search, which OpenAI bills per call.

Options:
  --dry-run          Do the work and print a summary, but write nothing.
  --only a,b         Only these pundit ids (e.g. nate-silver). Needs --dry-run or
                     --out, so a partial result can never replace the app's file.
  --out <file>       Write here instead of public/data/sippData.json.
  --allow-partial    Write the pundits that worked even if others failed.
  --help             Show this.

Model: ${MODEL} (set OPENAI_MODEL to change).`;

// ---------------------------------------------------------------- arguments

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

if (flag('--help') || flag('-h')) {
  console.log(HELP);
  process.exit(0);
}

const dryRun = flag('--dry-run');
const allowPartial = flag('--allow-partial');
const only = value('--only')?.split(',').map((s) => s.trim()).filter(Boolean);
const out = value('--out') ? path.resolve(value('--out')) : DEFAULT_OUT;

if (only && !dryRun && !value('--out')) {
  fail('--only needs --dry-run or --out <file>: a partial result must not replace the app\'s data.');
}
if (only) {
  const unknown = only.filter((id) => !PUNDITS.some((p) => p.id === id));
  if (unknown.length) fail(`Unknown pundit id: ${unknown.join(', ')}. Known: ${PUNDITS.map((p) => p.id).join(', ')}`);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Put it in your shell or in a .env file (see .env.example).');
  if (process.env.VITE_OPENAI_API_KEY) {
    console.error('VITE_OPENAI_API_KEY is set, but it is not read: Vite would put a VITE_ variable in the public bundle. Rename it.');
  }
  process.exit(1);
}

const client = new OpenAI({ timeout: 10 * 60 * 1000 });

// ------------------------------------------------------------------ helpers

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Error messages from the API can quote part of a key.
const redact = (text) => String(text).replace(/sk-[A-Za-z0-9_*-]{6,}/g, 'sk-…');

const shown = (file) => {
  const relative = path.relative(ROOT, file);
  return relative.startsWith('..') ? file : relative;
};

const round = (n, places = 2) => Math.round(n * 10 ** places) / 10 ** places;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function outputText(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  return (response.output ?? [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text')
    .map((part) => part.text)
    .join('');
}

async function ask({ instructions, input, search = false }) {
  const response = await client.responses.create({
    model: MODEL,
    instructions,
    input,
    reasoning: { effort: search ? 'medium' : 'low' },
    ...(search ? { tools: [{ type: 'web_search' }], tool_choice: 'required' } : {}),
  });
  return outputText(response).trim();
}

function parseJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function webUrl(candidate) {
  if (typeof candidate !== 'string') return undefined;
  try {
    const url = new URL(candidate.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function isoDate(candidate) {
  if (typeof candidate !== 'string') return undefined;
  const full = /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : /^\d{4}-\d{2}$/.test(candidate) ? `${candidate}-01` : undefined;
  if (!full || Number.isNaN(Date.parse(full))) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  return full >= SINCE && full <= today ? full : undefined;
}

// Keeps what the schema and the rules allow; drops the rest. Returns undefined to drop.
function cleanPrediction(raw, sippId, index) {
  if (!raw || typeof raw !== 'object') return undefined;

  const predictedOutcome = typeof raw.predictedOutcome === 'string' ? raw.predictedOutcome.trim() : '';
  const source = webUrl(raw.source);
  const dateStated = isoDate(raw.dateStated);
  const category = String(raw.category ?? '').toLowerCase().trim().replace(/[_ ]/g, '-');
  if (!predictedOutcome || predictedOutcome.length > 600 || !source || !dateStated || !CATEGORIES.includes(category)) {
    return undefined;
  }

  const prediction = {
    id: `pred-${sippId}-${index}`,
    dateStated,
    predictedOutcome,
    source,
    category,
    timeframe: typeof raw.timeframe === 'string' && raw.timeframe.trim() ? raw.timeframe.trim() : 'Not specified',
    verificationStatus: 'pending',
  };

  // Verified needs an outcome and a rating of exactly 1, 2 or 3. Otherwise it is pending.
  const rating = Number(raw.accuracyRating);
  const actualOutcome = typeof raw.actualOutcome === 'string' ? raw.actualOutcome.trim() : '';
  if (raw.verificationStatus === 'verified' && [1, 2, 3].includes(rating) && actualOutcome) {
    prediction.verificationStatus = 'verified';
    prediction.actualOutcome = actualOutcome;
    prediction.accuracyRating = rating;
    prediction.normalizedScore = round(rating / 3);
    const outcomeSource = webUrl(raw.outcomeSource);
    if (outcomeSource) prediction.outcomeSource = outcomeSource;
  }
  return prediction;
}

// Same arithmetic as src/data/predictionAnalysis.ts calculateSippAccuracy.
function scoresFor(predictions) {
  const verified = predictions.filter((p) => p.verificationStatus === 'verified');
  const averageAccuracy = round(mean(verified.map((p) => p.accuracyRating)));
  const categoryAccuracy = {};
  for (const category of CATEGORIES) {
    const ratings = verified.filter((p) => p.category === category).map((p) => p.accuracyRating);
    categoryAccuracy[category.replace('-', '_')] = ratings.length ? round(mean(ratings)) : averageAccuracy;
  }
  return { averageAccuracy, categoryAccuracy };
}

// ------------------------------------------------------------------ the work

async function findPredictions(pundit) {
  const text = await ask({
    search: true,
    instructions:
      'You are a careful research assistant. Find predictions that a named public figure really made in public, and check how they turned out. Use the web search tool and report only what you found in pages you opened. Never invent or reconstruct a prediction, a quote, a date or a URL. If you cannot source something, leave it out.',
    input: `Find up to 15 specific, checkable predictions made by ${pundit.name} (${pundit.shortBio}) in public since ${SINCE}, across these categories where you can: ${CATEGORIES.join(', ')}.

For each prediction return an object with:
- predictedOutcome: what they predicted, quoted or closely paraphrased from the source
- source: URL of the page where you found it
- dateStated: YYYY-MM-DD, as precise as the source allows (use the first of the month if only the month is known)
- category: one of ${CATEGORIES.join(', ')}
- timeframe: when it was supposed to happen, in a few words
- verificationStatus: "verified" if the outcome is now known from reliable reporting, otherwise "pending"
- actualOutcome: for verified ones, one or two sentences on what happened
- outcomeSource: for verified ones, URL of a page reporting the outcome
- accuracyRating: for verified ones only. 3 if it came true as stated, 2 if it partly did (right direction, wrong size or timing), 1 if it did not come true.

Reply with a JSON array and nothing else. If you find none, reply with [].`,
  });

  const seen = new Set();
  const predictions = [];
  for (const raw of parseJsonArray(text)) {
    const prediction = cleanPrediction(raw, pundit.id, predictions.length);
    const key = prediction?.predictedOutcome.toLowerCase();
    if (!prediction || seen.has(key)) continue;
    seen.add(key);
    predictions.push(prediction);
  }
  return predictions;
}

function plainSummary(name, predictions, scores) {
  const entries = Object.entries(scores.categoryAccuracy);
  const best = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const worst = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
  const verified = predictions.filter((p) => p.verificationStatus === 'verified').length;
  return `Based on ${verified} rated predictions, ${name} averages ${scores.averageAccuracy} out of 3. The highest category average is ${best[0].replace('_', ' ')} (${best[1]}) and the lowest is ${worst[0].replace('_', ' ')} (${worst[1]}).`;
}

async function describePatterns(pundit, predictions, scores) {
  const verified = predictions
    .filter((p) => p.verificationStatus === 'verified')
    .map(({ category, predictedOutcome, accuracyRating, actualOutcome }) => ({ category, predictedOutcome, accuracyRating, actualOutcome }));
  try {
    const text = await ask({
      instructions:
        'You describe patterns in a set of rated predictions. Use only the data you are given. Do not speculate about the person\'s motives, ideology, character or background, and do not say anything the data does not show. Plain language, no headings.',
      input: `Ratings run from 1 (did not come true) to 3 (came true as stated). Predictions by ${pundit.name}:\n${JSON.stringify(verified, null, 2)}\n\nWrite two short paragraphs: first the overall accuracy and how it differs by category, then what kinds of predictions were hit or missed. If there are fewer than ten predictions, say how small the sample is.`,
    });
    return text || plainSummary(pundit.name, predictions, scores);
  } catch (error) {
    console.warn(`  pattern text failed (${redact(error.message)}); using a plain summary`);
    return plainSummary(pundit.name, predictions, scores);
  }
}

async function main() {
  const chosen = PUNDITS.filter((p) => !only || only.includes(p.id));
  console.log(`Model ${MODEL}. ${chosen.length} pundit(s). ${dryRun ? 'Dry run: nothing will be written.' : `Writing to ${shown(out)}.`}`);

  const sipps = [];
  const skipped = [];

  for (const pundit of chosen) {
    process.stdout.write(`${pundit.name}: searching... `);
    try {
      const predictions = await findPredictions(pundit);
      const verified = predictions.filter((p) => p.verificationStatus === 'verified').length;
      console.log(`${predictions.length} sourced predictions, ${verified} rated.`);

      if (verified < MIN_VERIFIED) {
        skipped.push(`${pundit.name}: only ${verified} rated predictions (needs ${MIN_VERIFIED})`);
        continue;
      }

      const scores = scoresFor(predictions);
      const patternAnalysis = await describePatterns(pundit, predictions, scores);
      sipps.push({
        id: pundit.id,
        name: pundit.name,
        photoUrl: pundit.photoUrl,
        shortBio: pundit.shortBio,
        ...scores,
        patternAnalysis,
        predictions,
      });
      console.log(`  average ${scores.averageAccuracy}`);
    } catch (error) {
      console.log('failed.');
      skipped.push(`${pundit.name}: ${redact(error.message)}`);
    }
  }

  if (skipped.length) {
    console.warn(`\nLeft out:\n${skipped.map((s) => `  - ${s}`).join('\n')}`);
  }
  if (sipps.length === 0) fail('\nNothing to write.');
  if (skipped.length && !allowPartial && !only) {
    fail('\nNot writing, so a half-empty dashboard cannot replace the data. Fix the above or pass --allow-partial.');
  }
  if (dryRun) {
    console.log(`\nDry run done: ${sipps.length} pundit(s) would be written.`);
    return;
  }

  const dataset = {
    meta: { kind: 'sourced', generatedAt: new Date().toISOString(), model: MODEL },
    sipps,
  };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = `${out}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dataset, null, 2) + '\n');
  fs.renameSync(tmp, out);
  console.log(`\nWrote ${sipps.length} pundit(s) to ${shown(out)}.`);
}

main().catch((error) => fail(redact(error?.stack || error)));
