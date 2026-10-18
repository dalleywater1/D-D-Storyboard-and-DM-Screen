const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({});
for(const f of ['fallen-lands','fallen-lands-npcs','fallen-lands-network','stormhollow','hushed','fallen-session-1','fallen-harmony']) vm.runInContext(fs.readFileSync('src/'+f+'.js','utf8'),ctx);
const apply=(d,w)=>w.forEach(([p,v])=>d.set(p,structuredClone(v)));
const d=new Map(); apply(d,ctx.fallenLandsUpdate(d).writes);
for(const fn of ['fallenLandsNpcUpdate','fallenLandsNetworkUpdate','stormhollowUpdate','hushedUpdate','hushedDissonanceUpdate','hushedCompositionDissonanceUpdate','hushedRevisionUpdate','fallenSession1Update'])apply(d,ctx[fn](d));
const before=structuredClone(d), cp='boards/fallen-lands/cards/',root='gmx/fallen-lands/';
const writes=ctx.fallenHarmonyUpdate(d);assert.deepEqual(d,before,'pure migration must not mutate input');apply(d,writes);
assert.equal(ctx.fallenHarmonyUpdate(d).length,0,'idempotent');
assert.equal([...d.keys()].filter(p=>p.startsWith(root+'timeline/')).length,16);
assert.equal([...d.keys()].filter(p=>p.startsWith(root+'plot/fallen-harmony-')).length,6);
for(const [p,v] of before){
  assert.ok(d.has(p),'no record removed: '+p);
  if(/\/(combats|screen|groups)\//.test(p))assert.deepEqual(d.get(p),v,p);
  if(p.startsWith(cp))for(const field of ['id','links','imageId','order'])assert.deepEqual(d.get(p)[field],v[field],p+' '+field);
  if(p.startsWith(root+'creatures/'))assert.deepEqual(d.get(p).sb,v.sb,'Hushed mechanics preserved');
}
assert.equal([...d].filter(([p,v])=>p.startsWith(cp)&&/Thomas/.test(v.title)).length,2,'Thomas Wren and Father Thomas remain distinct');
assert.match(d.get(root+'gm/fallen-voice-cantor').text,/not Father Thomas/);
assert.match(d.get(root+'sessions/fallen-session-1').recap,/NOT yet given chase/);
assert.match(d.get(root+'plot/fallen-harmony-tethers').truth,/intent and causation/);
const timeline=[...d].filter(([p])=>p.startsWith(root+'timeline/')).map(([,v])=>v);
assert.ok(timeline.every(e=>e.year===''),'no invented dates');
assert.equal(timeline.filter(e=>!e.hidden).length,1);
assert.doesNotMatch(JSON.stringify(timeline.filter(e=>!e.hidden).map(e=>({title:e.title,told:e.told,label:e.label}))),/alive|surviv|eight|Spelljammer|Juna|tether/i);
const custom=new Map([['meta/campaign',{name:'Fallen Lands'}],['cards/custom-thomas',{id:'custom-thomas',kind:'npc',title:'Thomas Wren',body:'Custom',links:['x'],imageId:'art',sb:{hp:987}}],['gm/custom-thomas',{text:'Authored private note',extra:42}],['gmx/main/sessions/custom',{num:1,notes:'Authored scene',recap:'Authored recap',scenes:['x']}],['gmx/main/combats/current',{round:7}],['gmx/main/plot/fallen-harmony-origin',{truth:'Authored collision'}]]);
apply(custom,ctx.fallenHarmonyUpdate(custom));assert.equal(custom.get('cards/custom-thomas').sb.hp,987);assert.match(custom.get('gm/custom-thomas').text,/Authored private note/);assert.equal(custom.get('gm/custom-thomas').extra,42);assert.match(custom.get('gmx/main/sessions/custom').notes,/Authored scene/);assert.equal(custom.get('gmx/main/combats/current').round,7);assert.equal(custom.get('gmx/main/plot/fallen-harmony-origin').truth,'Authored collision');assert.ok(custom.has('gmx/main/plot/fallen-harmony-origin-2'));
custom.delete('gmx/main/plot/fallen-harmony-origin-2');assert.equal(ctx.fallenHarmonyUpdate(custom).length,0,'respect subsequent deletion');
assert.equal(ctx.fallenHarmonyUpdate(new Map([['meta/campaign',{name:'Unrelated'}]])).length,0);
assert.ok(ctx.fallenHarmonyUpdate(new Map([['boards/renamed',{name:'Renamed'}],['gmx/renamed/contentUpdates/fallen-lands-alessa-v1',{}]])).length);
// Exercise actual Timeline renderer: selected hidden truth must not leak through
// its editor when the owner switches to Players' view.
const ui={MOD_COLLS:[],MODULES:[{id:'plot'}],S:{mod:{timeline:new Map(timeline.map(e=>[e.id,e]))},cards:new Map(),sel:{},canWrite:true},COLORS:['','slate'],ACTIONS:{},CHANGES:{},connections:()=>'',render:()=>'',pickSel:()=>timeline[0].id,esc:x=>String(x??''),md:x=>x,cardChip:()=>'',fInput:()=>'',fSelect:()=>'',fCheck:()=>'',fArea:(_m,_i,_k,_label)=>'SECRET EDITOR',fitRows:()=>4,delBtn:()=>''};
ui.document={addEventListener:()=>{}}; ui.renderModule=()=>{}; const ux=vm.createContext(ui);vm.runInContext(fs.readFileSync('src/timeline.js','utf8'),ux);ux.S.tl.view='players';
const html=ux.renderTimeline();assert.doesNotMatch(html,/SECRET EDITOR|Fundamental|Thaumeryx|FALSE HISTORY|survival/);assert.match(html,/The house attack/);
console.log('Passed Harmony: full migration, idempotency/deletions, custom IDs and collisions, unchanged blocks/combats, relative chronology, player-view spoiler isolation.');

