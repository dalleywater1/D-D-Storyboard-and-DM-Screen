// Campaign canon update, applied once with the existing atomic content transaction.
function fallenLandsNetworkUpdate(docs) {
  const version = 'fallen-lands-network-v1';
  const norm = s => String(s || '').trim().toLowerCase().replace(/^the /, '');
  const hierarchy = `CURRENT CANON — Elias directs three distinct groups.
Three Lights of Stormhollow: Darius Horn, First Light, Captain of the Guard / Defender of Elias (force); Alessa Dupont, Second Light, taverness / eyes and ears (information); Morgan Giles, Third Light, Merchant Lord (resources).
The Seven Voices are a distributed sleeper network, embedded in ordinary civilian life across major Sword Coast cities and regional hubs. They are not seven officials living in Stormhollow. Alessa is the Second Light, not one of the Seven Voices; older references to her as a Voice are superseded as hierarchy, while her homebrew ability names remain unchanged.
The two Shadows, Xal’ith the mind flayer and Vharaziel the demon, are direct messengers of Elias. They operate separately from the Lights and Voices. No demon subtype or new combat statistics have been assigned.
Morgan is secretly an Adult Green Dragon in humanoid guise. His contingency is to extract Elias if the party turns on him; Darius holds the line and Alessa confuses pursuit. Foreshadow the contingency and let player preparation interrupt it. Elias remains bound to the Fallen Lands under the existing 1/8 Panoply canon: an escape from Stormhollow must remain within that boundary unless the DM later changes the binding.`;
  const voices = [
    ['cantor', 'Thomas Wren', 'Human', 'Waterdeep', 'guild accounts clerk', 'The Cantor'],
    ['refrain', 'Mara Fenwick', 'Lightfoot halfling', 'Neverwinter', 'bakery owner', 'The Refrain'],
    ['aria', 'Lena Vale', 'Half-elf', 'Luskan', 'shipping agent', 'The Aria'],
    ['chorus', 'Borin Reed', 'Dwarf', 'Daggerford', 'wagonwright', 'The Chorus'],
    ['madrigal', 'Nella Finch', 'Rock gnome', 'Baldur’s Gate', 'stationer and bookbinder', 'The Madrigal'],
    ['dirge', 'Silas Ward', 'Tiefling', 'Beregost', 'undertaker', 'The Dirge'],
    ['coda', 'Elin Brooks', 'Wood elf', 'Athkatla', 'textile factor', 'The Coda']
  ];
  const roster = 'CUSTOM CAMPAIGN ADDITIONS — proposed mundane identities, races, jobs and city assignments; not previously confirmed canon.\n' + voices.map(v => `${v[5]} — ${v[1]}; ${v[2]}; ${v[3]}; ${v[4]}.`).join('\n');
  const codebook = `The Concordance — sheet-music communication and codebook
GM-only campaign cipher from the referenced discussion. Ordinary sheet music travels through taverns, merchants, performers and caravans. The heading identifies the sender; composition form identifies the recipient; key identifies location; tempo conveys urgency; dynamics govern visibility; consecutive note pairs encode the message.
Sender headings: Cantor, Refrain, Aria, Chorus, Madrigal, Dirge, Coda; Lumen I = Darius, Lumen II = Alessa, Lumen III = Morgan; Umbra I = Xal’ith (Quiet Shadow), Umbra II = Vharaziel (Crimson Shadow).
Recipient forms: Prelude = Darius; Intermezzo = Alessa; Finale = Morgan; Sonata = Cantor; Rondo = Refrain; Nocturne = Aria; Fugue = Chorus; Minuet = Madrigal; Requiem = Dirge; Toccata = Coda; Canon = Xal’ith; Fantasia = Vharaziel.
Keys: C Major = Stormhollow; G Major = Waterdeep; D Major = Neverwinter; A Major = Luskan; E Major = Daggerford; B Major = Baldur’s Gate; F Major = Beregost; A Minor = Athkatla; E Minor = travelling/mobile target; D Minor = recipient’s current location.
Tempo: Largo = observe only; Adagio = wait/prepare; Andante = routine; Moderato = act when opportunity permits; Allegro = act soon; Presto = immediate; Prestissimo = network emergency.
Dynamics: pp = absolute secrecy, leave no evidence; p = discreet; mp = maintain civilian cover; mf = local agents permitted; f = open action; ff = every available resource.
Note-pair grid: first note selects a row, second selects a column A–G.
A: A | B | C | D | E | F | G
B: H | I | J | K | L | M | N
C: O | P | Q | R | S | T | U
D: V | W | X | Y | Z | SPACE | STOP
E: 0 | 1 | 2 | 3 | 4 | 5 | 6
F: 7 | 8 | 9 | RELIC | MAYOR | GUEST | RED
G: SHADOW | LIGHT | VOICE | HOUSE | MOVE | WAIT | DANGER
Ignore octave, accidentals and duration. Ignore grace notes and ornaments before grouping consecutive notes into pairs. RED means Alexander; MAYOR means Elias. HOUSE numbers require a separate operational address list, not yet supplied.
Example: ARIA — PRELUDE IN C MAJOR; Allegro — p. From Aria to Darius, concerning Stormhollow; act soon, discreetly. FG DF GE DF FD DF CF CA DF GD DF ED DG decodes to RED MOVE RELIC TO HOUSE 3.
Authentication: each Voice ends a message with a signature cadence outside the encoded body. Cadences have not yet been specified; keep them out of an early player codebook. Discovery progresses from recognising communications, to decoding routing/text, to learning cadences and forging orders. Framed tavern sheet music can serve as a recurring clue.`;
  const entries = [
    {id:'fallen-darius-horn', title:'Darius Horn', role:'First Light — Captain of the Guard / Defender of Elias', town:'Stormhollow', body:'Captain of the Guard and defender of Elias.', gm:'First Light: force and defence. Holds attackers away from Elias and secures civilians during an extraction. Distinct from General Darius Kelm, the existing Panoply holder.'},
    {id:'fallen-alessa', title:'Alessa Dupont', aliases:['alessa'], role:'Second Light — Taverness / eyes and ears', town:'Stormhollow', body:'A personable dark-skinned woman with loose dreadlocks, a tan-and-white linen apron, and a quick temper. Her warm welcome and sharp tongue make her a memorable taverness.', gm:'Second Light: hidden cult authority and Elias’s eyes and ears. Controls local intelligence, redirects suspicion and confuses pursuit. Preserve the existing CR 8 homebrew block; Voice of the Seven Stars is an ability name, not her current rank.'},
    {id:'fallen-morgan', title:'Morgan Giles', role:'Third Light — Merchant Lord', town:'Stormhollow', body:'Stormhollow’s Merchant Lord, overseeing trade, caravans, supply and property.', gm:'Secret: an Adult Green Dragon in humanoid guise. Keep the dragon identity for a later reveal. CUSTOM CAMPAIGN LORE: the humanoid guise and extraction contingency are not abilities granted by the embedded stat block; transformation action, duration and equipment handling are unspecified. Do not treat extraction as automatic. The dragon block is copied from the available bundled bestiary, preserving its terminology; the conversion omits breath recharge, Legendary Resistance uses and the legendary-action budget. It is not a verified complete 2024/5.5e block. Confirm these omitted limits with the DM before combat.'},
    ...voices.map(v => ({id:'fallen-voice-'+v[0], title:v[1], role:v[4], town:v[3], body:`${v[2]}; ${v[4]} in ${v[3]}. Custom campaign cover identity, pending canon approval.`, gm:`${v[5]} — sleeper agent of Elias. Maintains a mundane public life and communicates through the Concordance. Custom cover identity, race, job and city assignment; musical title from the prior discussion.`})),
    {id:'fallen-xalith', title:'Xal’ith', aliases:["xal'ith"], role:'Quiet Shadow — direct messenger of Elias', body:'Mind flayer. GM-only identity.', gm:'One of the two Shadows. Direct messenger of Elias, separate from the Seven Voices. No additional mechanics assigned.'},
    {id:'fallen-vharaziel', title:'Vharaziel', role:'Crimson Shadow — direct messenger of Elias', body:'Demon. GM-only identity.', gm:'One of the two Shadows. Direct messenger of Elias, separate from the Seven Voices. Demon subtype and combat block remain unspecified.'}
  ];
  const writes = [];
  for (const [path, meta] of docs) {
    if (!(path === 'meta/campaign' || /^boards\/[^/]+$/.test(path))) continue;
    const id = path === 'meta/campaign' ? 'main' : path.split('/')[1];
    if (!['fallen lands','order of the seven stars'].includes(norm(meta.name)) && !docs.has('gmx/'+id+'/contentUpdates/fallen-lands-alessa-v1')) continue;
    const marker = 'gmx/'+id+'/contentUpdates/'+version;
    if (docs.has(marker)) continue;
    const cp = id === 'main' ? 'cards/' : path+'/cards/';
    const gp = id === 'main' ? 'gm/' : 'gmx/'+id+'/gm/';
    const cards = [...docs].filter(([p]) => p.startsWith(cp) && !p.slice(cp.length).includes('/'));
    for (const e of entries) {
      const matches = cards.filter(([p,c]) => c.kind === 'npc' && (p === cp+e.id || [e.title,...(e.aliases||[])].map(norm).includes(norm(c.title))));
      if (matches.length > 1) throw new Error('Ambiguous NPC identity: '+e.title);
      let cid = matches.length ? matches[0][0].slice(cp.length) : e.id;
      if (!matches.length) { let n=2; while(docs.has(cp+cid)||docs.has(gp+cid)) cid=e.id+'-'+n++; }
      const old = matches.length ? matches[0][1] : {id:cid,kind:'npc',act:'',status:'planned',links:[],order:null,tags:['Fallen Lands'],life:'Unknown',voice:'',wants:''};
      const card = {...old,title:e.title,role:e.role,town:e.town||old.town||'',body:[old.body,e.body].filter(Boolean).join('\n\n')};
      if (e.id === 'fallen-morgan' && !old.sb) card.sb = JSON.parse(JSON.stringify(FALLEN_MORGAN_SB));
      writes.push([cp+cid,card]);
      const notes = docs.get(gp+cid)||{};
      writes.push([gp+cid,{...notes,text:[notes.text,'CURRENT CANON — 12 October 2026\n'+e.gm].filter(Boolean).join('\n\n')}]);
    }
    const pp='gmx/'+id+'/plot/';
    for (const [slug,title,truth] of [['hierarchy','Elias — Lights, Voices and Shadows',hierarchy+'\n\n'+roster],['concordance','The Concordance — music-sheet codebook',codebook]]) {
      let key=pp+'fallen-'+slug, n=2; while(docs.has(key)) key=pp+'fallen-'+slug+'-'+n++;
      writes.push([key,{title,kind:'main',status:'active',order:null,summary:'GM-only campaign lore and operational reference.',truth,stages:[],ifIgnored:''}]);
    }
    // Keep prior plot prose while making its superseded rank unambiguous.
    for (const [p,plot] of docs) if(p.startsWith(pp) && !p.slice(pp.length).includes('/') && norm(plot.title)==='order of the seven stars') writes.push([p,{...plot,truth:'CURRENT CANON: Alessa Dupont is the Second Light, not one of the Seven Voices. See Elias — Lights, Voices and Shadows and The Concordance.\n\nPrior campaign notes (older rank references superseded):\n'+(plot.truth||'')}]);
    writes.push([marker,{applied:true}]);
  }
  return writes;
}

// Exact copy of the available bundled bestiary, without invented missing limits.
const FALLEN_MORGAN_SB = {
  "size": "Huge",
  "type": "dragon",
  "al": "lawful evil",
  "ac": 19,
  "hp": 207,
  "hd": "18d12 + 90",
  "sp": "40 ft., fly 80 ft., swim 40 ft.",
  "ab": [
    23,
    12,
    21,
    18,
    15,
    18
  ],
  "sv": "Dex +6, Wis +7",
  "sk": "Deception +9, Perception +12, Persuasion +9, Stealth +6",
  "vu": "",
  "re": "",
  "im": "poison",
  "ci": "Poisoned",
  "se": "Darkvision 120 ft., Blindsight 60 ft., Passive Perception 22",
  "la": "Common, Draconic",
  "g": "",
  "cr": "15",
  "from": "Adult Green Dragon",
  "tr": "Amphibious. The dragon can breathe air and water.\nLegendary Resistance. If the dragon fails a saving throw, it can choose to succeed instead.",
  "a": "Multiattack. The dragon makes three Rend attacks. It can replace one attack with a use of Spellcasting to cast Mind Spike (level 3 version).\nRend. Melee Attack Roll: +11, reach 10 ft. Hit: 15 (2d8 + 6) Slashing damage plus 7 (2d6) Poison damage.\nPoison Breath. Constitution Saving Throw: DC 18, each creature in a 60-foot Cone. Failure: 56 (16d6) Poison damage. Success: Half damage.\nSpellcasting. The dragon casts one of the following spells, requiring no Material components and using Charisma as the spellcasting ability (spell save DC 17): **At will:** Detect Magic, Mind Spike **1/day each:** Geas",
  "b": "",
  "r": "",
  "l": "Mind Invasion. The dragon uses Spellcasting to cast Mind Spike (level 3 version).\nNoxious Miasma. Constitution Saving Throw: DC 17, each creature in a 20-foot-radius Sphere centered on a point the dragon can see within 90 feet. Failure: 7 (2d6) Poison damage, and the target takes a −2 penalty to AC until the end of its next turn. Failure or Success: The dragon can’t take this action again until the start of its next turn.\nPounce. The dragon moves up to half its Speed, and it makes one Rend attack."
};
