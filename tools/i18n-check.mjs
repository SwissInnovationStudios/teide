#!/usr/bin/env node
/* Website i18n gate (the website/ analog of the app's i18n:validate).
   Scans the HTML for data-i18n* keys, then checks every locale JSON has exactly
   those keys with non-empty values. For rich (data-i18n-html) keys it also checks
   that link/<strong> counts match the German source, catching dropped tags. */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = ['index.html', 'datenschutz.html', 'impressum.html', 'lizenzen.html'];
const LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl'];

const textKeys = new Set();   // data-i18n + data-i18n-attr targets
const htmlKeys = new Set();   // data-i18n-html targets

for (const f of HTML) {
  const src = readFileSync(join(root, f), 'utf8');
  for (const m of src.matchAll(/\bdata-i18n="([^"]+)"/g)) textKeys.add(m[1]);
  for (const m of src.matchAll(/\bdata-i18n-html="([^"]+)"/g)) htmlKeys.add(m[1]);
  for (const m of src.matchAll(/\bdata-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) {
      const i = pair.indexOf(':');
      if (i >= 0) textKeys.add(pair.slice(i + 1).trim());
    }
  }
}
const required = new Set([...textKeys, ...htmlKeys]);
const count = (s, re) => (String(s).match(re) || []).length;

let errors = 0;
const err = (msg) => { console.error('  ✖ ' + msg); errors++; };

let de = {};
try { de = JSON.parse(readFileSync(join(root, 'i18n', 'de.json'), 'utf8')); }
catch (e) { console.error('Cannot read i18n/de.json — ' + e.message); process.exit(1); }

console.log(`Required keys from HTML: ${required.size} (${htmlKeys.size} rich)`);

for (const lang of LANGS) {
  let dict;
  try { dict = JSON.parse(readFileSync(join(root, 'i18n', `${lang}.json`), 'utf8')); }
  catch (e) { console.error(`\n${lang}.json — MISSING or invalid (${e.message})`); errors++; continue; }

  console.log(`\n${lang}.json — ${Object.keys(dict).length} keys`);
  for (const k of required) {
    if (!(k in dict)) { err(`missing key: ${k}`); continue; }
    const v = dict[k];
    if (typeof v !== 'string' || v.trim() === '') err(`empty value: ${k}`);
    if (typeof v === 'string' && /⟨TODO⟩|\bTODO\b/.test(v)) err(`leftover TODO: ${k}`);
  }
  for (const k of Object.keys(dict)) if (!required.has(k)) err(`unused key (not in HTML): ${k}`);

  if (lang !== 'de') {
    for (const k of htmlKeys) {
      if (!(k in dict) || !(k in de)) continue;
      if (count(dict[k], /href=/g) !== count(de[k], /href=/g)) err(`link count mismatch in ${k}`);
      if (count(dict[k], /<strong/g) !== count(de[k], /<strong/g)) err(`<strong> count mismatch in ${k}`);
      if (count(dict[k], /<li>/g) !== count(de[k], /<li>/g)) err(`<li> count mismatch in ${k}`);
    }
  }
}

const files = readdirSync(join(root, 'i18n')).filter((f) => f.endsWith('.json'));
console.log(`\nLocale files present: ${files.sort().join(', ')}`);
console.log(errors ? `\n❌ ${errors} problem(s).` : '\n✅ All locales complete and consistent.');
process.exit(errors ? 1 : 0);
