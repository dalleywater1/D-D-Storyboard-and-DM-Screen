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

// Hushed Dissonance handover, 13 October 2026: the seventh Hushed variant
// (disruption / anti-caster), plus the seven-variant roster in the shared lore.
// The concept gave AC 15–16, HP ~50 and CR 2; the exact numbers below were set to
// match the other six and are listed in the creature's role note so they can be tuned.
const HUSHED_ROSTER = [
  '',
  '### The seven variants',
  '| Hushed | Role |',
  '|---|---|',
  '| Drone | Basic expendable operative |',
  '| Staccato | Fast melee assault |',
  '| Presto | Runner / retrieval |',
  '| Bass | Defensive anchor |',
  '| Crescendo | Heavy breacher |',
  '| Dissonance | Disruption / anti-caster |',
  '| Conductor | Commander |',
  '',
  'Seven variants quietly reinforce the manufactured Seven Stars structure.',
].join('\n');
const HUSHED_DISSONANCE = { id: 'hushed-dissonance', title: 'Hushed Dissonance',
  role: 'Disruption / anti-caster. A Dissonance is sent when the target group contains spellcasters, healers, commanders, or anyone capable of disrupting the Composition. Where the Bass holds the line and the Crescendo breaks it, the Dissonance makes the enemy\'s plan fall apart. Its job isn\'t massive damage; it\'s there to be annoying as hell, interfering with spellcasters, opportunity attacks, pursuit, concentration and coordinated movement. Very useful for retrieval missions.\n\nLight/medium armour, dark-red mantle, a one-handed hooked spear and small arcane suppression devices.\n\n*Working numbers (from the concept: AC 15–16, HP ~50, CR 2): AC 15, HP 52, +4 to hit, save DC 12, Break the Rhythm 2d4 Psychic, Suppressing Pulse 10-foot radius. Adjust with Edit.*',
  sb: hushedSb({ cr: '2', ac: 15, hp: 52, hd: '8d8 + 16', sp: '30 ft.', ab: [12, 14, 14, 11, 14, 6], sv: 'Con +4, Wis +4', sk: 'Arcana +2, Perception +4', se: 'Passive Perception 14',
    g: 'Chain Shirt, hooked spear, arcane suppression devices',
    a: ['Multiattack. The Dissonance makes two Discordant Strike attacks.',
        'Discordant Strike. Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage plus 3 (1d6) Psychic damage. If the target is concentrating, it has Disadvantage on the Constitution saving throw to maintain Concentration.',
        'Suppressing Pulse (Recharge 5–6). Wisdom Saving Throw: DC 12, each creature of the Dissonance\'s choice in a 10-foot Emanation originating from it. Failure: The target can\'t take Reactions, and its Speed is reduced by 10 feet until the end of its next turn.'],
    r: ['Break the Rhythm. Trigger: A creature the Dissonance can see within 30 feet of it casts a spell. Response: The caster makes a DC 12 Constitution saving throw. On a failure, it takes 5 (2d4) Psychic damage and can\'t take Reactions until the start of its next turn. The spell still takes effect.'] }) };

function hushedDissonanceUpdate(docs) {
  const markerName = 'hushed-dissonance-v1';
  const norm = x => String(x || '').trim().toLowerCase().replace(/^the /, '');
  const writes = [];
  const boards = [...docs].filter(([path]) => path === 'meta/campaign' || /^boards\/[^/]+$/.test(path))
    .map(([path, meta]) => ({ path, meta, board: path === 'meta/campaign' ? 'main' : path.split('/')[1] }));
  const order = boards.filter(b => norm(b.meta && b.meta.name) === 'order of the seven stars');
  const targets = order.length ? order : boards.filter(b => norm(b.meta && b.meta.name) === 'fallen lands' || docs.has('gmx/' + b.board + '/contentUpdates/fallen-lands-alessa-v1'));
  for (const { board } of targets) {
    const marker = 'gmx/' + board + '/contentUpdates/' + markerName;
    if (docs.has(marker)) continue;
    const cp = 'gmx/' + board + '/creatures/';
    const existing = [...docs].filter(([p]) => p.startsWith(cp) && !p.slice(cp.length).includes('/'));
    const now = new Date().toISOString();
    const e = HUSHED_DISSONANCE;
    const same = existing.find(([p, d]) => p === cp + e.id || norm(d && d.title) === norm(e.title));
    const id = same ? same[0].slice(cp.length) : e.id, old = same ? same[1] : {};
    writes.push([cp + id, { ...old, id, title: e.title, family: 'Hushed', role: e.role, lore: HUSHED_LORE + '\n' + HUSHED_ROSTER, sb: JSON.parse(JSON.stringify(e.sb)), created: old.created || now, updated: now }]);
    // the other Hushed get the seven-variant roster added to their shared lore (once)
    for (const [p, d] of existing) {
      if (p === cp + id || !d || d.family !== 'Hushed' || String(d.lore || '').includes('The seven variants')) continue;
      writes.push([p, { ...d, lore: (String(d.lore || '').trim() ? String(d.lore).trim() + '\n' : '') + HUSHED_ROSTER, updated: now }]);
    }
    writes.push([marker, { id: markerName, applied: now }]);
  }
  return writes;
}

// 13 October 2026: add one Hushed Dissonance to the Stormhollow Tavern Composition
// (alongside the existing six). Skipped if the encounter is gone or already has one.
function hushedCompositionDissonanceUpdate(docs) {
  const markerName = 'hushed-composition-dissonance-v1';
  const norm = x => String(x || '').trim().toLowerCase().replace(/^the /, '');
  const writes = [];
  const boards = [...docs].filter(([path]) => path === 'meta/campaign' || /^boards\/[^/]+$/.test(path))
    .map(([path, meta]) => ({ path, meta, board: path === 'meta/campaign' ? 'main' : path.split('/')[1] }));
  const order = boards.filter(b => norm(b.meta && b.meta.name) === 'order of the seven stars');
  const targets = order.length ? order : boards.filter(b => norm(b.meta && b.meta.name) === 'fallen lands' || docs.has('gmx/' + b.board + '/contentUpdates/fallen-lands-alessa-v1'));
  for (const { board } of targets) {
    const marker = 'gmx/' + board + '/contentUpdates/' + markerName;
    if (docs.has(marker)) continue;
    const now = new Date().toISOString();
    const cp = 'gmx/' + board + '/creatures/', ep = 'gmx/' + board + '/combats/';
    const dis = [...docs].find(([p, d]) => p.startsWith(cp) && d && norm(d.title) === 'hushed dissonance');
    const enc = [...docs].find(([p, d]) => p.startsWith(ep) && !p.slice(ep.length).includes('/') && d && (p === ep + HUSHED_ENCOUNTER.id || norm(d.title) === norm(HUSHED_ENCOUNTER.title)));
    if (dis && enc) {
      const [p, c] = enc, mons = c.monsters || [];
      if (!mons.some(m => norm(m.name) === 'hushed dissonance')) {
        const sb = dis[1].sb || {};
        writes.push([p, { ...c, monsters: [...mons, { name: 'Hushed Dissonance', cr: sb.cr || '2', count: 1, ac: sb.ac ?? 15, hp: sb.hp ?? 52, srd: 'hb-' + dis[0].slice(cp.length) }] }]);
      }
    }
    writes.push([marker, { id: markerName, applied: now }]);
  }
  return writes;
}

// Hushed revision handover, 14 October 2026 (changes made at the table):
// Psychic Death Pulse on every Hushed; Bass gains Resonant Expansion; the
// Dissonance becomes the Discord, the dedicated psychic mage (same ID, so
// encounter rows and links keep working); shared lore gains the core identity,
// the Death Pulse and the final variant table; and the first Hushed attack is
// recorded at the PCs' house in Stormhollow, not The Broken Lantern. Edits are
// targeted: lines are added or swapped, nothing unrelated is rewritten, and no
// Broken Lantern material is removed. Runs once per campaign.
const HUSHED_PULSE = { drone: ['1d8', 4], staccato: ['1d8', 4], presto: ['1d8', 4], bass: ['2d8', 9], discord: ['2d8', 9], crescendo: ['3d8', 13], conductor: ['4d8', 18] };
const hushedPulseLine = (dice, avg, dc) => `Psychic Death Pulse. When the Hushed is reduced to 0 Hit Points, psychic energy erupts from its body. Wisdom Saving Throw: DC ${dc}, each creature within 10 feet of it. Failure: ${avg} (${dice}) Psychic damage. Success: Half damage. Not fire or force: sudden mental pressure, painful ringing, intrusive noise, flashes of alien memories and psychic static.`;
const HUSHED_BASS_EXPANSION = 'Resonant Expansion. The Bass forces psychic energy through its body and immediately takes 10 damage that can\'t be reduced in any way (this can kill it). For 1 minute, or until it ends the effect (no action required) or falls Unconscious, it becomes Large, its reach increases by 5 feet, its melee attacks deal an extra 4 (1d8) damage of the weapon\'s type, and it has Advantage on Strength checks and Strength saving throws. Muscles swell, armour strains outward and its posture grows heavier: it is burning itself out to complete the mission.';
const HUSHED_DISCORD = { title: 'Hushed Discord',
  role: 'Psychic caster / battlefield disruption / mental assault. The Discord is the dedicated Hushed mage: not a wizard in red robes, and not a weapon fighter. Its magic is almost entirely psionic, manifesting as pressure inside the skull, overlapping whispers, distorted sound, mental static, brief visual distortions and memories flashing where they do not belong. A Discord dying should feel like a magical, psychic feedback event.\n\n*Working numbers (the handover suggested save DC 13–14 and +5 to hit): AC 12, HP 45, Intelligence casting with DC 13 and +5, Psychic Lash 60 ft. for 2d6 + 3, Dissonant Whispers and Mind Spike 2/Day each, Hold Person and Phantasmal Force 1/Day each, Shield 2/Day. Adjust with Edit.*',
  sb: () => hushedSb({ cr: '2', ac: 12, hp: 45, hd: '10d8', sp: '30 ft.', ab: [9, 14, 10, 16, 14, 6], sv: 'Int +5, Wis +4', sk: 'Arcana +5, Perception +4', se: 'Passive Perception 14',
    g: 'Dark-red field clothing',
    tr: ['Break Concentration. When a creature that is concentrating takes damage from the Discord, it has Disadvantage on the next saving throw it makes to maintain Concentration before the end of the Discord\'s turn.',
         hushedPulseLine('2d8', 9, 13)],
    a: ['Multiattack. The Discord makes two Psychic Lash attacks.',
        'Psychic Lash. Ranged Spell Attack Roll: +5, range 60 ft. Hit: 10 (2d6 + 3) Psychic damage, and the target can\'t take Reactions until the start of its next turn.',
        'Spellcasting. The Discord casts one of the following spells, requiring no spell components and using Intelligence as the spellcasting ability (spell save DC 13, +5 to hit with spell attacks). At will: Mage Hand, Mind Sliver, Minor Illusion. 2/Day each: Dissonant Whispers, Mind Spike. 1/Day each: Hold Person, Phantasmal Force.'],
    r: ['Shield (2/Day). Trigger: The Discord is hit by an attack roll or targeted by the Magic Missile spell. Response: The Discord casts Shield.'] }) };
const HUSHED_LORE_V2 = [
  '',
  '### Core identity',
  'All Hushed are living humanoids; former Dimmed who failed or rejected rehabilitation; stripped of most autobiographical identity; dressed in practical **dark-red** field clothing; unnaturally coordinated; emotionless rather than undead or zombie-like; and unconsciously humming **The Night Measure**.',
  '',
  '### Psychic Death Pulse',
  'Every Hushed releases psychic energy when killed: each creature within 10 feet makes a Wisdom save (the Hushed\'s own save DC, or DC 12 + its Proficiency Bonus), taking Psychic damage equal to its CR in d8s (minimum 1d8) on a failure, half on a success. Describe it as sudden mental pressure, painful ringing, intrusive noise, flashes of alien memories and psychic static, never fire or physical force. This is a defining Hushed mechanic: killing a Hushed in the middle of the party is a tactical decision.',
  '',
  '### The seven variants',
  '| Hushed | CR | Tactical role | Death Pulse |',
  '|---|---|---|---|',
  '| Drone | 1/2 | Expendable infantry | 1d8 |',
  '| Staccato | 1 | Melee skirmisher | 1d8 |',
  '| Presto | 1 | Retrieval / courier | 1d8 |',
  '| Bass | 2 | Defensive tank / enlarging bruiser | 2d8 |',
  '| Discord | 2 | Psychic mage | 2d8 |',
  '| Crescendo | 3 | Heavy breacher | 3d8 |',
  '| Conductor | 4 | Tactical commander | 4d8 |',
  '',
  '### Design principle',
  'The seven variants are parts of a single **Composition**. **Drone** establishes the rhythm. **Bass** anchors it. **Staccato** attacks rapidly. **Presto** moves quickly. **Discord** disrupts the opposition through psychic magic. **Crescendo** escalates force. **Conductor** controls the whole performance.',
  '',
  'Keep the musical terminology subtle and clinical, never theatrical bards. The Hushed are frightening because they behave like **people reduced to functions**.',
].join('\n');
const HUSHED_HOUSE_NOTE = 'Played: the first Hushed attack happened at the house provided to the PCs in Stormhollow, not at The Broken Lantern (which remains Alessa Dupont\'s tavern).';

function hushedRevisionUpdate(docs) {
  const markerName = 'hushed-revision-2026-10-14';
  const norm = x => String(x || '').trim().toLowerCase().replace(/^the /, '');
  const writes = [];
  const boards = [...docs].filter(([path]) => path === 'meta/campaign' || /^boards\/[^/]+$/.test(path))
    .map(([path, meta]) => ({ path, meta, board: path === 'meta/campaign' ? 'main' : path.split('/')[1] }));
  const order = boards.filter(b => norm(b.meta && b.meta.name) === 'order of the seven stars');
  const targets = order.length ? order : boards.filter(b => norm(b.meta && b.meta.name) === 'fallen lands' || docs.has('gmx/' + b.board + '/contentUpdates/fallen-lands-alessa-v1'));
  const inn = s => String(s || '').replace(/\bthe inn attack\b/gi, 'the attack on the PCs\' house').replace(/\binn attack\b/gi, 'house attack').replace(/\bStormhollow tavern raid\b/gi, 'first Stormhollow raid (played at the PCs\' house)');
  for (const { path, board } of targets) {
    const marker = 'gmx/' + board + '/contentUpdates/' + markerName;
    if (docs.has(marker)) continue;
    const now = new Date().toISOString();
    const put = (p, d) => { writes.push([p, d]); docs = new Map(docs); docs.set(p, d); };
    const cp = 'gmx/' + board + '/creatures/', ep = 'gmx/' + board + '/combats/', sp = 'gmx/' + board + '/sessions/';
    const cardP = board === 'main' ? 'cards/' : path + '/cards/', gmP = board === 'main' ? 'gm/' : 'gmx/' + board + '/gm/';
    const direct = prefix => [...docs].filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'));
    // --- creatures
    let discordId = null;
    for (const [p, d0] of direct(cp)) {
      if (!d0 || d0.family !== 'Hushed') continue;
      const d = JSON.parse(JSON.stringify(d0)), t = norm(d.title);
      const kind = (t.match(/^hushed (drone|staccato|presto|bass|crescendo|conductor|dissonance|discord)$/) || [])[1];
      if (!kind) continue;
      if (kind === 'dissonance' || kind === 'discord') {
        discordId = p.slice(cp.length);
        Object.assign(d, { title: HUSHED_DISCORD.title, role: HUSHED_DISCORD.role, sb: HUSHED_DISCORD.sb() });
      } else {
        const sb = d.sb || (d.sb = {});
        const dc = kind === 'crescendo' ? 14 : 14;
        const [dice, avg] = HUSHED_PULSE[kind];
        if (!/Psychic Death Pulse/.test(sb.tr || '')) {
          const lines = String(sb.tr || '').split('\n').filter(l => l.trim());
          const k = lines.findIndex(l => /^No Self-Preservation\./.test(l));
          lines.splice(k >= 0 ? k + 1 : lines.length, 0, hushedPulseLine(dice, avg, dc));
          sb.tr = lines.join('\n');
        }
        if (kind === 'bass' && !/Resonant Expansion/.test(sb.b || '')) sb.b = [String(sb.b || '').trim(), HUSHED_BASS_EXPANSION].filter(Boolean).join('\n');
        if (kind === 'bass') d.role = String(d.role || '').replace(/^Defensive foundation of a Composition\./, 'Defensive foundation of a Composition, and now an enlarging bruiser: Resonant Expansion lets it grow Large by burning through its own body.');
        if (kind === 'crescendo') d.role = inn(d.role);
      }
      let lore = String(d.lore || '');
      const oldRoster = lore.indexOf('\n### The seven variants');
      if (oldRoster >= 0) { const end = lore.indexOf('Seven variants quietly reinforce the manufactured Seven Stars structure.', oldRoster); lore = lore.slice(0, oldRoster) + (end >= 0 ? lore.slice(end + 'Seven variants quietly reinforce the manufactured Seven Stars structure.'.length) : ''); }
      if (!lore.includes('### Psychic Death Pulse')) lore = lore.trimEnd() + '\n' + HUSHED_LORE_V2 + '\n\nSeven variants quietly reinforce the manufactured Seven Stars structure.';
      d.lore = lore; d.updated = now;
      put(p, d);
    }
    // --- encounters: Dissonance rows become Discord; the first attack is at the PCs' house
    for (const [p, c0] of direct(ep)) {
      if (!c0) continue;
      const c = JSON.parse(JSON.stringify(c0)); let changed = false;
      for (const m of c.monsters || []) if (/^hushed (dissonance)$/i.test(String(m.name || '').trim())) { Object.assign(m, { name: 'Hushed Discord', cr: '2', ac: 12, hp: 45 }, discordId ? { srd: 'hb-' + discordId } : {}); changed = true; }
      if (c.run && Array.isArray(c.run.list)) for (const x of c.run.list) if (/^Hushed Dissonance/i.test(x.name || '')) { x.name = x.name.replace(/Dissonance/i, 'Discord'); changed = true; }
      if (p === ep + 'stormhollow-tavern-composition' || norm(c.title) === 'stormhollow tavern composition') {
        c.title = 'Stormhollow House Composition'; c.where = 'The house provided to the PCs in Stormhollow';
        const tac = String(c.tactics || '').replace(/reach the tavern/gi, 'reach the PCs\' house');
        c.tactics = tac.includes(HUSHED_HOUSE_NOTE) ? tac : HUSHED_HOUSE_NOTE + '\n\n' + tac;
        changed = true;
      }
      if (changed) put(p, c);
    }
    // --- Session 1: record where it happened
    for (const [p, s0] of direct(sp)) {
      if (!s0 || Number(s0.num) !== 1) continue;
      const s = { ...s0 };
      s.notes = inn(s.notes).replace(/SCENE 5 — TAVERN ASSAULT(?! \()/, 'SCENE 5 — TAVERN ASSAULT (played at the PCs\' house in Stormhollow instead of The Broken Lantern)');
      s.secrets = inn(s.secrets);
      if (!String(s.recap || '').includes(HUSHED_HOUSE_NOTE)) s.recap = [String(s.recap || '').trim(), HUSHED_HOUSE_NOTE].filter(Boolean).join('\n\n');
      put(p, s);
    }
    // --- storyboard: the "Attack on the Inn" scene and GM notes that mention the inn attack
    for (const [p, c0] of direct(cardP)) {
      if (!c0 || c0.kind !== 'scene' || norm(c0.title) !== 'attack on the inn') continue;
      put(p, { ...c0, title: 'Attack on the House', body: String(c0.body || '').includes(HUSHED_HOUSE_NOTE) ? c0.body : HUSHED_HOUSE_NOTE + '\n\n' + (c0.body || ''), updated: now });
    }
    for (const [p, g0] of direct(gmP)) {
      if (!g0 || !/\binn attack\b/i.test(g0.text || '')) continue;
      put(p, { ...g0, text: inn(g0.text) });
    }
    writes.push([marker, { id: markerName, applied: now }]);
  }
  return writes;
}
