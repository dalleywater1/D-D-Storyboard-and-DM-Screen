const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('src/hushed.js', 'utf8'), ctx);
const apply = (docs, writes) => { for (const [p, v] of writes) docs.set(p, structuredClone(v)); };
// a browser that already has the six Hushed in The Order of the Seven Stars (one with an edited HP)
const docs = new Map([['boards/seven', { name: 'The Order of the Seven Stars' }], ['boards/fl', { name: 'Fallen Lands' }]]);
apply(docs, ctx.hushedUpdate(docs));
const bass = docs.get('gmx/seven/creatures/hushed-bass'); bass.sb.hp = 70; docs.set('gmx/seven/creatures/hushed-bass', bass);
docs.set('gmx/seven/creatures/mine', { id: 'mine', title: 'Shadow Wolf', family: '', lore: 'x' });
apply(docs, ctx.hushedDissonanceUpdate(docs));
const d = docs.get('gmx/seven/creatures/hushed-dissonance');
assert.ok(d); assert.equal(docs.has('gmx/fl/creatures/hushed-dissonance'), false, 'only the Order');
assert.equal(d.family, 'Hushed'); assert.equal(d.sb.cr, '2'); assert.equal(d.sb.ac, 15); assert.equal(d.sb.hp, 52);
for (const t of ['The Night Measure.', 'Empty Mind.', 'Mission Focus.', 'No Self-Preservation.']) assert.ok(d.sb.tr.includes(t));
assert.match(d.sb.a, /Discordant Strike\. Melee Attack Roll: \+4/); assert.match(d.sb.a, /Disadvantage on the Constitution saving throw to maintain Concentration/);
assert.match(d.sb.a, /Suppressing Pulse \(Recharge 5–6\)\. Wisdom Saving Throw: DC 12/);
assert.match(d.sb.r, /^Break the Rhythm\. Trigger: .*within 30 feet.*can't take Reactions until the start of its next turn\. The spell still takes effect\.$/);
assert.match(d.lore, /\| Dissonance \| Disruption \/ anti-caster \|/);
// the other six get the roster once; edits kept; other homebrew untouched
for (const n of ['drone', 'staccato', 'presto', 'bass', 'crescendo', 'conductor']) assert.equal((docs.get('gmx/seven/creatures/hushed-' + n).lore.match(/The seven variants/g) || []).length, 1, n);
assert.equal(docs.get('gmx/seven/creatures/hushed-bass').sb.hp, 70);
assert.deepEqual(docs.get('gmx/seven/creatures/mine'), { id: 'mine', title: 'Shadow Wolf', family: '', lore: 'x' });
assert.equal(ctx.hushedDissonanceUpdate(docs).length, 0, 'once');
// the Composition gains one Dissonance, once, keeping its other rows
const enc0 = docs.get('gmx/seven/combats/stormhollow-tavern-composition');
apply(docs, ctx.hushedCompositionDissonanceUpdate(docs));
const enc = docs.get('gmx/seven/combats/stormhollow-tavern-composition');
assert.deepEqual(enc.monsters.map(m => [m.name, m.count]), [...enc0.monsters.map(m => [m.name, m.count]), ['Hushed Dissonance', 1]]);
assert.equal(enc.monsters.at(-1).srd, 'hb-hushed-dissonance'); assert.equal(enc.monsters.at(-1).hp, 52);
assert.equal(ctx.hushedCompositionDissonanceUpdate(docs).length, 0, 'composition once');
// already added by hand: no second row
const d3 = new Map([['boards/s', { name: 'Order of the Seven Stars' }], ['gmx/s/creatures/x', { title: 'Hushed Dissonance', sb: { cr: '2' } }], ['gmx/s/combats/e', { title: 'Stormhollow Tavern Composition', monsters: [{ name: 'Hushed Dissonance', count: 1 }] }]]);
apply(d3, ctx.hushedCompositionDissonanceUpdate(d3));
assert.equal(d3.get('gmx/s/combats/e').monsters.length, 1);
console.log('Passed Hushed Dissonance: seventh variant in The Order of the Seven Stars, shared traits, Discordant Strike / Break the Rhythm / Suppressing Pulse, roster added to all seven once, edits kept, once only; added once to the Stormhollow Tavern Composition.');
