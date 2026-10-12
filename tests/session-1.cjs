const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
for (const file of ['hushed.js', 'fallen-session-1.js']) vm.runInContext(fs.readFileSync('src/' + file, 'utf8'), ctx);
const apply = (docs, writes) => { for (const [p, v] of writes) docs.set(p, structuredClone(v)); };
// a browser with both The Order of the Seven Stars and a seeded Fallen Lands: only the Order gets it
const docs = new Map([
  ['boards/seven', { name: 'The Order of the Seven Stars' }],
  ['boards/fallen-lands', { name: 'Fallen Lands' }],
  ['gmx/fallen-lands/contentUpdates/fallen-lands-alessa-v1', {}],
  ['boards/seven/cards/a1', { id: 'a1', kind: 'npc', title: 'Alessa Dupont' }],
  ['boards/seven/cards/e1', { id: 'e1', kind: 'npc', title: 'Elias Vane / Thaumeryx Avarr' }],
  ['boards/seven/cards/t1', { id: 't1', kind: 'town', title: 'Stormhollow' }],
  ['boards/seven/cards/x1', { id: 'x1', kind: 'npc', title: 'Ted' }],
  ['boards/seven/cards/old', { id: 'old', kind: 'npc', title: 'Bill', archived: true }],
]);
const w = ctx.fallenSession1Update(docs); apply(docs, w);
const s = docs.get('gmx/seven/sessions/fallen-session-1');
assert.ok(s, 'session in the Order'); assert.equal([...docs.keys()].some(k => k.startsWith('gmx/fallen-lands/sessions/')), false, 'not in Fallen Lands');
assert.equal(s.num, 1); assert.equal(s.title, 'The Red Cloaks'); assert.equal(s.status, 'planned');
assert.deepEqual(s.scenes, ['t1', 'a1', 'x1', 'e1']);
assert.match(s.start, /grey and wet over Stormhollow/);
assert.match(s.secrets, /Red and Rikan had an ongoing war involving boots/);
for (const t of ['SCENE 1 — MORNING IN STORMHOLLOW', 'QUICK NPC RESPONSES', 'SCENE 5 — TAVERN ASSAULT', 'Stormhollow Tavern Composition', 'SCENE 8 — INTO THE MOUNTAINS', 'Cult Lead 4', 'Interesting route.', 'Ideally, they tell you.']) assert.ok(s.notes.includes(t), 'notes has ' + t);
assert.equal(/\*\*|^#/m.test(s.notes), false, 'no markdown symbols left');
assert.equal(ctx.fallenSession1Update(docs).length, 0, 'once');
// the Hushed follow the same rule
apply(docs, ctx.hushedUpdate(docs));
assert.ok(docs.has('gmx/seven/creatures/hushed-conductor')); assert.equal(docs.has('gmx/fallen-lands/creatures/hushed-conductor'), false);
// an existing Session 1 is filled in, never overwritten
const d2 = new Map([['meta/campaign', { name: 'Order of the Seven Stars' }], ['gmx/main/sessions/s9', { id: 's9', num: 1, title: '', start: 'My own opener', secrets: '', notes: '', scenes: ['keep'] }], ['cards/h', { id: 'h', kind: 'npc', title: 'Hesta Varn' }]]);
apply(d2, ctx.fallenSession1Update(d2));
const m = d2.get('gmx/main/sessions/s9');
assert.equal(m.title, 'The Red Cloaks'); assert.ok(m.start.startsWith('My own opener\n\n')); assert.match(m.start, /irritatingly normal/);
assert.deepEqual(m.scenes, ['keep', 'h']); assert.equal([...d2.keys()].filter(k => k.includes('/sessions/')).length, 1);
// unrelated campaigns get nothing
assert.equal(ctx.fallenSession1Update(new Map([['boards/y', { name: 'Curse of Strahd' }]])).length, 0);
console.log('Passed Session 1: goes to The Order of the Seven Stars over Fallen Lands, links cards, full plan in notes, existing Session 1 filled not overwritten, once only, unrelated campaigns untouched.');
