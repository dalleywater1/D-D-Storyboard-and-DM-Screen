const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('src/fallen-lands.js', 'utf8'), ctx);
const plan = docs => ctx.fallenLandsUpdate(docs);
const apply = (docs, p) => { for (const [k, v] of p.writes) docs.set(k, structuredClone(v)); };
const docs = new Map();
const first = plan(docs);
assert.equal(first.initialBoard, 'fallen-lands');
apply(docs, first);
const alessa = docs.get('boards/fallen-lands/cards/fallen-alessa');
assert.equal(alessa.sb.cr, '8');
assert.equal(alessa.sb.hp, 136);
assert.equal(alessa.sb.a.split('\n').length, 5);
assert.match(alessa.sb.tr, /not immunity to Detect Thoughts/);
assert.match(alessa.sb.a, /Recharge 5–6/);
assert.match(alessa.sb.b, /Friendly Smile/);
assert.match(alessa.sb.r, /DC 15 Strength/);
assert.equal(docs.get('gmx/fallen-lands/plot/fallen-order-seven-stars').kind, 'main');
assert.equal(plan(docs).writes.length, 0);
alessa.body = 'User edited description';
docs.delete('gmx/fallen-lands/plot/fallen-order-seven-stars');
assert.equal(plan(docs).writes.length, 0, 'edits and deletions persist');
assert.equal(alessa.body, 'User edited description');
const old = new Map([
  ['meta/campaign', { name: 'The Fallen Lands', acts: [{ id: 'one', name: 'Session 1' }] }],
  ['cards/elias', { kind: 'npc', title: 'Elias / Thaumeryx', body: 'Original canon' }],
  ['gm/elias', { text: 'Original secrets' }],
  ['gmx/main/sessions/session1', { recap: 'Original recap' }],
  ['gmx/main/plot/metaplot', { title: 'Panoply', stages: [{ done: true }] }],
  ['gmx/main/combats/raid', { run: { turn: 2 }, monsters: [] }],
  ['gmx/main/screen/layout', { pos: { p: { x: 13, y: 42 } } }],
  ['stickies/note', { text: 'Keep this' }],
  ['boards/another', { name: 'Other campaign' }]
]);
const originals = structuredClone([...old]);
const update = plan(old);
assert.equal(update.initialBoard, null);
apply(old, update);
for (const [key, value] of originals) assert.deepEqual(old.get(key), value, key);
assert.ok(old.has('cards/fallen-alessa'));
assert.equal(plan(old).writes.length, 0);
const existing = new Map([
  ['meta/campaign', { name: 'The Order of the Seven Stars' }],
  ['cards/custom-id', { kind: 'npc', title: 'Alessa, Voice of the Seven Stars', sb: { hp: 99 } }],
  ['gmx/main/plot/custom-id', { title: 'The Order of the Seven Stars', kind: 'side', truth: 'Edited' }]
]);
apply(existing, plan(existing));
assert.ok(!existing.has('cards/fallen-alessa'), 'do not duplicate a named NPC');
assert.ok(!existing.has('gmx/main/plot/fallen-order-seven-stars'), 'do not replace a named plot');
assert.equal(existing.get('cards/custom-id').sb.hp, 99);
const collision = new Map([['boards/fallen-lands', { name: 'Unrelated campaign' }]]);
apply(collision, plan(collision));
assert.equal(collision.get('boards/fallen-lands').name, 'Unrelated campaign');
assert.ok(collision.has('boards/fallen-lands-2/cards/fallen-alessa'));
// A deleted campaign must not reappear on the next load.
assert.equal(plan(new Map([['contentUpdates/fallen-lands-alessa-v1', { applied: true }]])).writes.length, 0);
const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length >= 2);
for (const [, script] of scripts) new vm.Script(script);
console.log('Passed: new/existing campaigns, preservation, idempotency, edits/deletions, duplicate names, ID collision, stat completeness, built script syntax.');
