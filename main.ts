// Pocket Grove — day one vs day seven (make.fun entry hand-in)
//
// Reads VIDEO.json from the bot directory, checks that it names a TikTok
// video post, copies it into the output directory and proves the copy is
// byte-identical to the source before reporting success.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR || "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function fail(message) {
  console.error(`hand-in failed: ${message}`);
  process.exit(1);
}

// Load and parse the hand-in file. Any problem here is fatal: an entry
// whose VIDEO.json cannot be read or parsed names nothing at all.
const sourcePath = join(BOT_DIR, "VIDEO.json");
let raw;
try {
  raw = readFileSync(sourcePath);
} catch (err) {
  fail(`cannot read ${sourcePath}: ${err.message}`);
}

let entry;
try {
  entry = JSON.parse(raw.toString("utf8"));
} catch (err) {
  fail(`VIDEO.json is not valid JSON: ${err.message}`);
}

if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
  fail("VIDEO.json must hold a JSON object");
}
if (typeof entry.url !== "string" || entry.url.length === 0) {
  fail('VIDEO.json must carry a non-empty string "url"');
}

// The url has to point at one specific TikTok video post: https scheme,
// the canonical tiktok.com host, and a path of exactly /@<handle>/video/<id>
// with a numeric id — short links, profile pages and photo posts name no
// playable video and are refused.
let parsed;
try {
  parsed = new URL(entry.url);
} catch {
  fail(`VIDEO.json url is not a valid URL: ${entry.url}`);
}
if (parsed.protocol !== "https:") {
  fail(`VIDEO.json url must use https: ${entry.url}`);
}
if (parsed.hostname !== "www.tiktok.com" && parsed.hostname !== "tiktok.com") {
  fail(`VIDEO.json url is not on the canonical tiktok.com host: ${entry.url}`);
}
if (!/^\/@[\w.-]+\/video\/\d+\/?$/.test(parsed.pathname)) {
  fail(`VIDEO.json url does not name a video post (/@handle/video/<id>): ${entry.url}`);
}

// Copy the file exactly as it stands, then read the copy back and
// compare it byte for byte with the source.
mkdirSync(OUTPUT_DIR, { recursive: true });
const outPath = join(OUTPUT_DIR, "VIDEO.json");
writeFileSync(outPath, raw);

const back = readFileSync(outPath);
if (!back.equals(raw)) {
  fail(`copy at ${outPath} differs from the source (${back.length} vs ${raw.length} bytes)`);
}

console.log(`VIDEO.json copied to ${outPath} (${raw.length} bytes, verified identical); it names ${entry.url}`);
