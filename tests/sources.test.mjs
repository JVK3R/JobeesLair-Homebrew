// sources.json and the builder: every PS5 Repository List category maps to one of ours or to nothing, what is
// excluded stays out, and a moved repository is excluded by its current name too. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

test('sources: every PS5 Repository List category maps to one of ours or to nothing; exclusions stay out', () => {
  const sources = JSON.parse(readFileSync(path.join(root, 'sources.json'), 'utf8'));
  const ours = new Set(sources.categories.map((category) => category.id));
  assert.match(sources.upstream.config, /^https:\/\/raw\.githubusercontent\.com\/nexgen999\/PS5-Repository-List\//);
  for (const [name, category] of Object.entries(sources.upstream.categories)) assert.ok(category === null || ours.has(category), `${name} -> ${category}`);
  assert.equal(sources.upstream.categories.pc_apps, null, 'PC tools are not listed');
  for (const repo of ['JVK3R/JobeesLair', 'axotk1k1/hdrezka-ps5']) assert.ok(sources.exclude.includes(repo), repo);
  const listed = new Set(sources.apps.map((entry) => entry.repo.toLowerCase()));
  for (const repo of sources.exclude) assert.ok(!listed.has(repo.toLowerCase()), `${repo} is excluded but listed`);
  const builder = readFileSync(path.join(root, 'tools/build-index.mjs'), 'utf8');
  assert.match(builder, /if \(excluded\.has\(lower\(full\)\)\) return \{ skip: 'excluded' \}/, 'a moved repository is excluded by its current name too');
  assert.ok(!builder.includes('app/data/homebrew.json'), 'the builder writes index.json alone here');
});

test('index.json is the builder\'s shape and lists a few hundred apps', () => {
  const index = JSON.parse(readFileSync(path.join(root, 'index.json'), 'utf8'));
  assert.ok(Array.isArray(index.apps) && index.apps.length > 150, `${index.apps?.length} apps`);
  for (const app of index.apps.slice(0, 20)) assert.match(app.repo, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
});
