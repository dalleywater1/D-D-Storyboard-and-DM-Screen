const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
for (const file of ['fallen-lands.js', 'fallen-lands-npcs.js', 'fallen-lands-network.js', 'stormhollow.js', 'hushed.js']) vm.runInContext(fs.readFileSync('src/' + file, 'utf8'), ctx);
const apply = (docs, writes) => { for (const [p, v] of writes) docs.set(p, structuredClone(v)); };
// a fresh browser: the Fallen Lands content runs first, then the Hushed
const docs = new Map();
apply(docs, ctx.fallenLandsUpdate(docs).writes);
apply(docs, ctx.fallenLandsNpcUpdate(docs));
apply(docs, ctx.fallenLandsNetworkUpdate(docs));
apply(docs, ctx.stormhollowUpdate(docs));
const before = structuredClone([...docs]);
apply(docs, ctx.hushedUpdate(docs));
for (const [p, v] of before) assert.deepEqual(docs.get(p), v, 'preserve ' + p);
const board = [...docs.keys()].find(p => p.endsWith('/contentUpdates/hushed-bestiary-v1')).split('/')[1];
const cr = id => docs.get('gmx/' + board + '/creatures/' + id);
const names = [...docs].filter(([p]) => p.startsWith('gmx/' + board + '/creatures/')).map(([, d]) => d.title).sort();
assert.deepEqual(names, ['Hushed Bass', 'Hushed Conductor', 'Hushed Crescendo', 'Hushed Drone', 'Hushed Presto', 'Hushed Staccato']);
for (const n of ['drone', 'staccato', 'presto', 'bass', 'crescendo', 'conductor']) {
  const c = cr('hushed-' + n);
  assert.equal(c.family, 'Hushed');
  for (const t of ['The Night Measure.', 'Empty Mind.', 'Mission Focus.', 'No Self-Preservation.']) assert.ok(c.sb.tr.includes(t), n + ' has ' + t);
  assert.equal(c.sb.type, 'Humanoid'); assert.equal(c.sb.al, 'Unaligned');
}
assert.equal(cr('hushed-drone').sb.cr, '1/2'); assert.equal(cr('hushed-drone').sb.hp, 27);
assert.deepEqual(cr('hushed-conductor').sb.ab, [12, 18, 16, 14, 16, 8]);
assert.match(cr('hushed-conductor').sb.a, /Change the Measure \(Recharge 5–6\)/);
assert.match(cr('hushed-crescendo').sb.tr, /DC 14 Strength saving throw/);
assert.match(cr('hushed-crescendo').role, /floorboard/);
const enc = docs.get('gmx/' + board + '/combats/stormhollow-tavern-composition');
assert.deepEqual(enc.monsters.map(m => [m.name, m.count]), [['Hushed Conductor', 1], ['Hushed Crescendo', 1], ['Hushed Bass', 2], ['Hushed Staccato', 2]]);
assert.equal(enc.monsters[0].srd, 'hb-hushed-conductor');
// idempotent
assert.equal(ctx.hushedUpdate(docs).length, 0);
// user edits survive; a deleted creature stays deleted
const edited = cr('hushed-bass'); edited.sb.hp = 70; docs.set('gmx/' + board + '/creatures/hushed-bass', edited);
docs.delete('gmx/' + board + '/creatures/hushed-drone');
assert.equal(ctx.hushedUpdate(docs).length, 0);
assert.equal(cr('hushed-bass').sb.hp, 70); assert.equal(cr('hushed-drone'), undefined);
// an older Hushed entry with the same name is replaced in place; other homebrew is untouched
const d2 = new Map([['boards/x', { name: 'Fallen Lands' }], ['gmx/x/creatures/old1', { id: 'old1', title: 'Hushed Staccato', sb: { hp: 1 } }], ['gmx/x/creatures/mine', { id: 'mine', title: 'Shadow Wolf', sb: { hp: 9 } }]]);
apply(d2, ctx.hushedUpdate(d2));
assert.equal(d2.get('gmx/x/creatures/old1').sb.hp, 38); assert.equal(d2.has('gmx/x/creatures/hushed-staccato'), false);
assert.deepEqual(d2.get('gmx/x/creatures/mine'), { id: 'mine', title: 'Shadow Wolf', sb: { hp: 9 } });
// unrelated campaigns get nothing
assert.equal(ctx.hushedUpdate(new Map([['boards/y', { name: 'Curse of Strahd' }]])).length, 0);
console.log('Passed Hushed: six creatures with shared traits, encounter roster, preservation, idempotency, edits/deletions kept, older entry replaced, unrelated campaigns untouched.');
