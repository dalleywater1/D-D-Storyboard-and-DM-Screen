const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
for (const file of ['fallen-lands.js', 'fallen-lands-npcs.js']) vm.runInContext(fs.readFileSync('src/' + file, 'utf8'), ctx);
const apply = (docs, writes) => { for (const [p, v] of writes) docs.set(p, structuredClone(v)); };
const docs = new Map();
apply(docs, ctx.fallenLandsUpdate(docs).writes);
const before = structuredClone([...docs]);
apply(docs, ctx.fallenLandsNpcUpdate(docs));
for (const [p, v] of before) assert.deepEqual(docs.get(p), v, 'preserve ' + p);
const cards = [...docs].filter(([p]) => p.startsWith('boards/fallen-lands/cards/'));
assert.equal(cards.length, 11);
const byId = id => docs.get('boards/fallen-lands/cards/fallen-' + id);
assert.equal(byId('brenna').sb.hp, 68);
assert.equal(byId('brenna').sb.cr, '5');
assert.match(byId('brenna').sb.tr, /spell save DC 13/);
assert.match(byId('brenna').sb.a, /10 \(1d10 \+ 5\)/);
assert.match(byId('brenna').sb.b, /PB times per Long Rest/);
assert.match(byId('brenna').sb.r, /30 feet/);
assert.equal(byId('elias').sb.cr, '9');
assert.equal(byId('elias').sb.l, '');
assert.equal(byId('elias').sb.a, '');
assert.match(byId('elias').sb.tr, /DC unspecified/);
assert.match(byId('elias').sb.tr, /No Legendary Actions or Legendary Resistance/);
for (const id of ['alexander', 'miravel', 'cael', 'sareth', 'darius', 'seraphine', 'torren', 'ilyra']) assert.equal(byId(id).sb, undefined, 'no invented stats for ' + id);
assert.match(docs.get('gmx/fallen-lands/gm/fallen-alexander').text, /does NOT grant immunity to ordinary psychic damage/);
assert.equal(ctx.fallenLandsNpcUpdate(docs).length, 0);
docs.delete('boards/fallen-lands/cards/fallen-brenna');
byId('elias').body = 'User edit';
assert.equal(ctx.fallenLandsNpcUpdate(docs).length, 0, 'no re-seeding after edits/deletions');
const old = new Map([
  ['meta/campaign', {name:'The Order of the Seven Stars'}],
  ['cards/old-elias', {kind:'npc', title:'Elias / Thaumeryx', body:'Keep canon', imageId:'portrait'}],
  ['gm/old-elias', {text:'Keep secrets', extra:true}],
  ['cards/brenna', {kind:'npc', title:'Brenna', sb:{hp:77}, body:'Edited'}],
  ['gmx/main/sessions/one', {recap:'Keep session'}],
  ['gmx/main/combats/one', {run:{turn:5}}],
  ['gmx/main/screen/layout', {pos:{x:5}}]
]);
const saved = structuredClone([...old]);
apply(old, ctx.fallenLandsNpcUpdate(old));
assert.equal(old.get('cards/old-elias').body, 'Keep canon');
assert.equal(old.get('cards/old-elias').imageId, 'portrait');
assert.equal(old.get('cards/old-elias').sb.hp, 125);
assert.ok(!old.has('cards/fallen-elias'));
assert.match(old.get('gm/old-elias').text, /^Keep secrets/);
assert.equal(old.get('gm/old-elias').extra, true);
assert.equal(old.get('cards/brenna').sb.hp, 77);
for (const [p,v] of saved.filter(([p])=>p.startsWith('gmx/'))) assert.deepEqual(old.get(p),v);
const renamed = new Map([['boards/fallen-lands', {name:'Renamed campaign'}], ['gmx/fallen-lands/contentUpdates/fallen-lands-alessa-v1', {applied:true}]]);
assert.equal(ctx.fallenLandsNpcUpdate(renamed).filter(([p])=>p.includes('/cards/')).length, 10);
assert.equal(ctx.fallenLandsNpcUpdate(new Map([['meta/campaign', {name:'Unrelated'}]])).length, 0);
console.log('Passed: ten NPCs, specified mechanics, no invented blocks, existing-browser migration, preserved records, idempotency and renamed campaigns.');
