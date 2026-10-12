// Hushed Bestiary handover, 12 October 2026. Adds six homebrew Hushed creatures
// to the Bestiary of The Order of the Seven Stars (or the seeded Fallen Lands
// campaign in a browser without it), plus the planned Stormhollow Tavern Composition
// as a Combats encounter. Additive and once per campaign: later edits, deletions
// and anything unrelated are left alone. A homebrew creature with the same name
// (an older Hushed entry) is replaced in place.
const HUSHED_SHARED_TRAITS = [
  'The Night Measure. The Hushed unconsciously hums the same slow melody while idle or concentrating. It does not appear aware that it is doing so.',
  'Empty Mind. Magic that detects surface thoughts finds almost no normal internal monologue, emotional narrative or autobiographical memory. Occasional procedural fragments may still be detected: *Door. Upstairs. Retrieve. Hold. Return.* This trait does **not** grant immunity to Psychic damage, the Charmed condition or mind-reading magic.',
  'Mission Focus. While actively pursuing an assigned objective, the Hushed has Advantage on saving throws against the Charmed and Frightened conditions.',
  'No Self-Preservation. The Hushed does not normally retreat because of injury, casualties or fear. It withdraws only when retreat is part of its mission instructions.',
];
const HUSHED_LORE = [
  '**Creature type:** Humanoid  ',
  '**Faction:** Manufactured Order of the Seven Stars / Elias Vane  ',
  '**Typical appearance:** Dark-red field clothing, cloaks, scarves or mantles, deliberately chosen to visually associate them with Alexander Elethar and the supposed Order.',
  '',
  'The Hushed are former **Dimmed** who repeatedly rejected rehabilitation, returned to serious violence, or continued deliberately harming others despite repeated attempts at treatment. Elias regards becoming Hushed as a final alternative to execution.',
  '',
  'Their autobiographical identities are largely removed while useful procedural knowledge remains. They can still speak, walk, fight, use weapons, follow instructions, navigate, perform trained skills and understand language. They retain very little personal identity.',
  '',
  'They are **living humanoids**, not undead, constructs or magical puppets.',
  '',
  'All Hushed unconsciously hum the same slowed, low version of *All Through the Night*, known inside Elias\'s organisation as **The Night Measure**. They usually hum while travelling, waiting, concentrating or carrying out repetitive tasks.',
  '',
  '### Operational terminology',
  'A deployed Hushed team is called a **Composition**. Reports use musical terminology rather than conventional military unit names, and should feel clinical rather than theatrical.',
  '',
  '*Composition Seven deployed: one Conductor, one Crescendo, two Bass, two Staccato.*',
].join('\n');
const HUSHED_LANG = 'Common plus one retained language';
const hushedSb = o => ({ size: 'Medium', type: 'Humanoid', al: 'Unaligned', hd: '', vu: '', re: '', im: '', ci: '', g: '', la: HUSHED_LANG, sv: '', b: '', r: '', l: '',
  ...o, tr: [...HUSHED_SHARED_TRAITS, ...(o.tr || [])].join('\n'), a: (o.a || []).join('\n'), b: (o.b || []).join('\n'), r: (o.r || []).join('\n'), from: 'Hushed handover' });
const HUSHED_CREATURES = [
  { id: 'hushed-drone', title: 'Hushed Drone',
    role: 'Basic disposable operative. Used to block doors, stairways, corridors, alleys and escape routes.',
    sb: hushedSb({ cr: '1/2', ac: 14, hp: 27, sp: '30 ft.', ab: [14, 14, 13, 8, 12, 5], sk: 'Athletics +4, Perception +3', se: 'Passive Perception 13',
      a: ['Short Blade. Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.',
          'Light Crossbow. Ranged Attack Roll: +4, range 80/320 ft. Hit: 6 (1d8 + 2) Piercing damage.'],
      r: ['Interpose. When a hostile creature within 5 feet attempts to move past the Drone, the Drone makes one Short Blade attack. On a hit, the target\'s Speed is reduced by 10 feet for that movement.'] }) },
  { id: 'hushed-staccato', title: 'Hushed Staccato',
    role: 'Fast assault infantry. The Staccato is the standard Hushed combatant, used when speed and repeated attacks are more useful than defence.',
    sb: hushedSb({ cr: '1', ac: 15, hp: 38, sp: '30 ft.', ab: [13, 16, 13, 9, 13, 6], sk: 'Acrobatics +5, Perception +3, Stealth +5', se: 'Passive Perception 13',
      tr: ['Relentless Mission (1/Day). When damage would reduce the Staccato to 0 Hit Points, it drops to 1 Hit Point instead.'],
      a: ['Multiattack. The Staccato makes two Short Blade attacks.',
          'Short Blade. Melee Attack Roll: +5, reach 5 ft. Hit: 6 (1d6 + 3) Piercing damage. Once during each of the Staccato\'s turns, one successful weapon attack deals an additional 2 (1d4) Psychic damage.',
          'Crossbow. Ranged Attack Roll: +5, range 80/320 ft. Hit: 7 (1d8 + 3) Piercing damage.'],
      b: ['Objective Advance. The Staccato takes the Disengage action. If possible, it must finish this movement closer to its assigned objective.'] }) },
  { id: 'hushed-presto', title: 'Hushed Presto',
    role: 'Courier, thief and retrieval specialist. A Presto is not expected to win fights. Its purpose is: **get the objective and leave.**',
    sb: hushedSb({ cr: '1', ac: 15, hp: 31, sp: '40 ft.', ab: [11, 17, 12, 10, 14, 6], sk: 'Acrobatics +5, Perception +4, Sleight of Hand +5, Stealth +7', se: 'Passive Perception 14',
      tr: ['Objective Secured. While carrying an assigned document, relic, object or package, the Presto\'s Speed increases to 50 ft., and Opportunity Attacks against it have Disadvantage.'],
      a: ['Knife. Melee Attack Roll: +5, reach 5 ft. Hit: 6 (1d6 + 3) Piercing damage.',
          'Hand Crossbow. Ranged Attack Roll: +5, range 30/120 ft. Hit: 6 (1d6 + 3) Piercing damage.'],
      b: ['Rapid Movement. The Presto takes the Dash, Disengage or Hide action.'],
      r: ['Slip Away. After an attack misses the Presto, it can move up to 10 feet without provoking Opportunity Attacks.'] }) },
  { id: 'hushed-bass', title: 'Hushed Bass',
    role: 'Defensive foundation of a Composition. The Bass protects important operatives, stairways, objectives and withdrawal routes.',
    sb: hushedSb({ cr: '2', ac: 17, hp: 60, sp: '30 ft.', ab: [17, 12, 16, 9, 13, 5], sv: 'Str +5, Con +5', sk: 'Athletics +5, Perception +3', se: 'Passive Perception 13',
      tr: ['Hold. When the Bass hits a creature with an Opportunity Attack, that creature\'s Speed becomes 0 for the rest of the turn.',
           'Brace. The Bass has Advantage on checks and saving throws made to resist being shoved, knocked Prone or forcibly moved.'],
      a: ['Multiattack. The Bass makes two Heavy Blade attacks.',
          'Heavy Blade. Melee Attack Roll: +5, reach 5 ft. Hit: 8 (1d8 + 4) Slashing damage.'],
      r: ['Interpose. When another Hushed within 5 feet is hit by an attack, the Bass can switch places with that creature and become the target of the attack instead.'] }) },
  { id: 'hushed-crescendo', title: 'Hushed Crescendo',
    role: 'Heavy breaching specialist. Used against doors, barricades, defensive positions, reinforced rooms and physical obstacles.\n\nFor the Stormhollow tavern raid, the Crescendo is specifically ordered to reach Alexander\'s room and destroy the known floorboard hiding place. It knows exactly where it is and goes directly to it rather than searching the room.',
    sb: hushedSb({ cr: '3', ac: 17, hp: 78, sp: '30 ft.', ab: [19, 10, 17, 8, 12, 5], sv: 'Str +6, Con +5', sk: 'Athletics +6', se: 'Passive Perception 11',
      tr: ['Breach. The Crescendo deals double damage against unattended objects and structures.',
           'Clear the Way (1/Turn). After the Crescendo hits a creature with its Breaching Maul, the target must succeed on a DC 14 Strength saving throw or be pushed 10 feet. If the target fails by 5 or more, it also has the Prone condition.',
           'Unstoppable Purpose. While the Crescendo can see its assigned objective, it has Advantage against effects that would knock it Prone, reduce its Speed or forcibly move it.'],
      a: ['Multiattack. The Crescendo makes two Breaching Maul attacks.',
          'Breaching Maul. Melee Attack Roll: +6, reach 5 ft. Hit: 9 (1d10 + 4) Bludgeoning damage plus 2 (1d4) Thunder damage.'] }) },
  { id: 'hushed-conductor', title: 'Hushed Conductor',
    role: 'Commander and intended survivor. The Conductor retains considerably more tactical knowledge than ordinary Hushed and is the field commander of a Hushed operational group. It coordinates the entire Composition and is normally the operative most likely to know mission details, routes, objectives and extraction plans.',
    sb: hushedSb({ cr: '4', ac: 17, hp: 88, sp: '35 ft.', ab: [12, 18, 16, 14, 16, 8], sv: 'Dex +6, Wis +5', sk: 'Acrobatics +6, Insight +5, Perception +5, Stealth +6', se: 'Passive Perception 15',
      tr: ['Break Contact (1/Day). When the Conductor falls below half its Hit Points, secures its objective, or determines that the mission is impossible, it immediately moves up to its Speed without provoking Opportunity Attacks. This is physical movement, not teleportation; the Conductor can still be stopped by clever positioning, restraints, spells or preparation.'],
      a: ['Multiattack. The Conductor makes two Red Blade or Hand Crossbow attacks.',
          'Red Blade. Melee Attack Roll: +6, reach 5 ft. Hit: 8 (1d8 + 4) Piercing damage plus 3 (1d6) Psychic damage.',
          'Hand Crossbow. Ranged Attack Roll: +6, range 30/120 ft. Hit: 7 (1d6 + 4) Piercing damage plus 3 (1d6) Psychic damage.',
          'Change the Measure (Recharge 5–6). The Conductor chooses up to three Hushed creatures within 60 feet. Each chosen creature may immediately move up to half its Speed. After this movement, one of the chosen creatures may make one weapon attack.',
          'Smoke Charge (2/Day). The Conductor throws a smoke capsule at a point within 30 feet. A 15-foot-radius area becomes Heavily Obscured until the end of the Conductor\'s next turn. The smoke is deliberately nonflammable.'],
      b: ['Conduct. One Hushed the Conductor can see within 60 feet can immediately do one of the following: move up to half its Speed without provoking Opportunity Attacks; make one weapon attack; or interact with one unattended object.'],
      r: ['Counterstep. After a melee attack against the Conductor resolves, the Conductor can move up to 10 feet without provoking Opportunity Attacks.'] }) },
];
const HUSHED_ENCOUNTER = {
  id: 'stormhollow-tavern-composition', title: 'Stormhollow Tavern Composition', where: 'Stormhollow tavern', status: 'prep',
  roster: [['hushed-conductor', 1], ['hushed-crescendo', 1], ['hushed-bass', 2], ['hushed-staccato', 2]],
  tactics: [
    'Mission: enter Stormhollow covertly → stage the apparent death of a watch guard → reach the tavern → retrieve material from Alexander\'s hidden floorboard → recover correspondence concerning the next Node → Conductor escapes → surviving Hushed delay pursuit.',
    'The floorboard is already empty. The Crescendo knows exactly where it is and goes directly to it rather than searching Alexander\'s room. When the compartment is found empty, the Hushed report simply: "Absent."',
    'If the Conductor withdraws, its final command to the remaining Hushed may simply be: "Hold." They then continue fighting without attempting to flee, quietly humming The Night Measure.',
    'Option: a Hushed Presto may replace one Staccato if the encounter needs a dedicated courier for the stolen letter.',
  ].join('\n\n'),
};

function hushedUpdate(docs) {
  const markerName = 'hushed-bestiary-v1';
  const norm = x => String(x || '').trim().toLowerCase().replace(/^the /, '');
  const writes = [];
  const boards = [...docs].filter(([path]) => path === 'meta/campaign' || /^boards\/[^/]+$/.test(path))
    .map(([path, meta]) => ({ path, meta, board: path === 'meta/campaign' ? 'main' : path.split('/')[1] }));
  // The Order of the Seven Stars is the campaign; Fallen Lands only when it doesn't exist here
  const order = boards.filter(b => norm(b.meta && b.meta.name) === 'order of the seven stars');
  const targets = order.length ? order : boards.filter(b => norm(b.meta && b.meta.name) === 'fallen lands' || docs.has('gmx/' + b.board + '/contentUpdates/fallen-lands-alessa-v1'));
  for (const { path, board } of targets) {
    const marker = 'gmx/' + board + '/contentUpdates/' + markerName;
    if (docs.has(marker)) continue;
    const cp = 'gmx/' + board + '/creatures/';
    const existing = [...docs].filter(([p]) => p.startsWith(cp) && !p.slice(cp.length).includes('/'));
    const now = new Date().toISOString();
    const ids = {};
    for (const e of HUSHED_CREATURES) {
      // an older homebrew entry with the same name is replaced in place; anything else is left alone
      const same = existing.find(([p, d]) => p === cp + e.id || norm(d && d.title) === norm(e.title));
      const id = same ? same[0].slice(cp.length) : e.id;
      ids[e.id] = id;
      const old = same ? same[1] : {};
      writes.push([cp + id, { ...old, id, title: e.title, family: 'Hushed', role: e.role, lore: HUSHED_LORE, sb: JSON.parse(JSON.stringify(e.sb)), created: old.created || now, updated: now }]);
    }
    const encPath = 'gmx/' + board + '/combats/' + HUSHED_ENCOUNTER.id;
    if (!docs.has(encPath)) {
      const guild = docs.get('gmx/' + board + '/screen/guild') || {};
      const party = (guild.party || []).filter(p => p && (p.char || p.player));
      const lvls = party.map(p => parseInt(p.lvl, 10)).filter(n => n > 0);
      const sbOf = id => HUSHED_CREATURES.find(c => c.id === id).sb;
      writes.push([encPath, { id: HUSHED_ENCOUNTER.id, title: HUSHED_ENCOUNTER.title, where: HUSHED_ENCOUNTER.where, status: HUSHED_ENCOUNTER.status,
        partySize: party.length || 4, partyLevel: lvls.length ? Math.min(20, Math.max(1, Math.round(lvls.reduce((a, b) => a + b, 0) / lvls.length))) : 1,
        monsters: HUSHED_ENCOUNTER.roster.map(([cid, count]) => { const c = HUSHED_CREATURES.find(x => x.id === cid); return { name: c.title, cr: sbOf(cid).cr, count, ac: sbOf(cid).ac, hp: sbOf(cid).hp, srd: 'hb-' + ids[cid] }; }),
        tactics: HUSHED_ENCOUNTER.tactics, loot: '', run: null, created: now }]);
    }
    writes.push([marker, { id: markerName, applied: now }]);
  }
  return writes;
}
