const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
for (const f of ['hushed.js', 'fallen-session-1.js']) vm.runInContext(fs.readFileSync('src/' + f, 'utf8'), ctx);
const apply = (docs, writes) => { for (const [p, v] of writes) docs.set(p, structuredClone(v)); };
const docs = new Map([
  ['boards/seven', { name: 'The Order of the Seven Stars' }],
  ['boards/seven/cards/aoi', { id: 'aoi', kind: 'scene', title: 'Attack on the Inn', body: 'Supposed Order operatives attack the inn.' }],
  ['boards/seven/cards/a1', { id: 'a1', kind: 'npc', title: 'Alessa Dupont', body: 'Runs The Broken Lantern.' }],
  ['gmx/seven/gm/x', { text: 'Truth: Alexander survived. During the inn attack, the enemies smash the floorboard.' }],
  ['gmx/seven/sessions/s1', { id: 's1', num: 1, title: 'Investigation and Pursuit', notes: 'Flow: investigation → inn attack → letter stolen.', secrets: '', start: '' }],
]);
for (const fn of ['hushedUpdate', 'hushedDissonanceUpdate', 'hushedCompositionDissonanceUpdate', 'fallenSession1Update']) apply(docs, ctx[fn](docs));
const bassBefore = docs.get('gmx/seven/creatures/hushed-bass'); bassBefore.sb.hp = 70; docs.set('gmx/seven/creatures/hushed-bass', bassBefore);
apply(docs, ctx.hushedRevisionUpdate(docs));
const cr = id => docs.get('gmx/seven/creatures/' + id);
// Death Pulse on all seven, right after the shared traits, scaled by CR
const want = { 'hushed-drone': '4 (1d8)', 'hushed-staccato': '4 (1d8)', 'hushed-presto': '4 (1d8)', 'hushed-bass': '9 (2d8)', 'hushed-dissonance': '9 (2d8)', 'hushed-crescendo': '13 (3d8)', 'hushed-conductor': '18 (4d8)' };
for (const [id, dmg] of Object.entries(want)) {
  const tr = cr(id).sb.tr; assert.equal((tr.match(/Psychic Death Pulse/g) || []).length, 1, id);
  assert.ok(tr.includes('Failure: ' + dmg + ' Psychic damage'), id + ' ' + dmg);
  for (const t of ['Empty Mind.', 'Mission Focus.', 'No Self-Preservation.']) assert.ok(tr.includes(t), id + ' keeps ' + t);
  assert.ok(cr(id).lore.includes('| Discord | 2 | Psychic mage | 2d8 |')); assert.equal(cr(id).lore.includes('Disruption / anti-caster'), false, 'old roster removed ' + id);
  assert.equal((cr(id).lore.match(/### The seven variants/g) || []).length, 1);
}
assert.ok(cr('hushed-drone').sb.tr.split('\n').findIndex(l => l.startsWith('Psychic Death Pulse')) === cr('hushed-drone').sb.tr.split('\n').findIndex(l => l.startsWith('No Self-Preservation')) + 1);
// Bass: Resonant Expansion with its cost; earlier edits kept
assert.match(cr('hushed-bass').sb.b, /^Resonant Expansion\. .*takes 10 damage that can't be reduced.*becomes Large, its reach increases by 5 feet, its melee attacks deal an extra 4 \(1d8\)/);
assert.equal(cr('hushed-bass').sb.hp, 70); assert.match(cr('hushed-bass').sb.r, /Interpose/);
// Discord replaces the Dissonance under the same ID
const dis = cr('hushed-dissonance');
assert.equal(dis.title, 'Hushed Discord'); assert.match(dis.role, /^Psychic caster/); assert.match(dis.sb.a, /Psychic Lash\. Ranged Spell Attack Roll: \+5, range 60 ft\./);
assert.match(dis.sb.a, /spell save DC 13/); assert.match(dis.sb.tr, /Break Concentration\./); assert.match(dis.sb.tr, /DC 13, each creature within 10 feet/);
assert.equal([...docs.values()].some(d => d && d.title === 'Hushed Dissonance'), false);
// encounter: renamed, at the house, Discord row
const enc = docs.get('gmx/seven/combats/stormhollow-tavern-composition');
assert.equal(enc.title, 'Stormhollow House Composition'); assert.match(enc.where, /house provided to the PCs/);
assert.ok(enc.tactics.startsWith('Played: the first Hushed attack happened at the house')); assert.equal(/reach the tavern/i.test(enc.tactics), false);
assert.deepEqual(enc.monsters.at(-1), { name: 'Hushed Discord', cr: '2', count: 1, ac: 12, hp: 45, srd: 'hb-hushed-dissonance' });
assert.match(cr('hushed-crescendo').role, /first Stormhollow raid \(played at the PCs' house\)/);
// session, card, GM note; Broken Lantern material untouched
const s = docs.get('gmx/seven/sessions/s1');
assert.match(s.recap, /house provided to the PCs/); assert.match(s.notes, /investigation → house attack → letter stolen/); assert.match(s.notes, /SCENE 5 — TAVERN ASSAULT \(played at the PCs' house/);
assert.equal(docs.get('boards/seven/cards/aoi').title, 'Attack on the House'); assert.ok(docs.get('boards/seven/cards/aoi').body.endsWith('Supposed Order operatives attack the inn.'));
assert.match(docs.get('gmx/seven/gm/x').text, /During the attack on the PCs' house, the enemies smash the floorboard/);
assert.equal(docs.get('boards/seven/cards/a1').body, 'Runs The Broken Lantern.');
// once
assert.equal(ctx.hushedRevisionUpdate(docs).length, 0);
console.log('Passed Hushed revision: Death Pulse on all seven (1d8–4d8), Bass Resonant Expansion, Dissonance → Discord (same ID), new roster, first attack recorded at the PCs\' house in encounter / session / card / GM note, Broken Lantern untouched, edits kept, once only.');
