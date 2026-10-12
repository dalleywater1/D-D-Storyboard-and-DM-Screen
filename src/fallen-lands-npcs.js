// Supplied Fallen Lands NPC Stat Block Handover, 12 October 2026.
// Missing mechanics stay unspecified; working material is explicitly labelled.
function fallenLandsNpcUpdate(docs) {
  const version = "fallen-lands-npcs-v1";
  const normalize = s => String(s || "").trim().toLowerCase().replace(/^the /, "");
  const blank = { size: "", type: "", al: "", hd: "", sv: "", sk: "", re: "", im: "", ci: "", vu: "", se: "", la: "", g: "", tr: "", a: "", b: "", r: "", l: "" };
  const entries = [
    {
      id: "fallen-brenna", title: "Brenna Stonepath", aliases: ["brenna"],
      role: "Mountain guide / temporary ally", tags: ["Locked / usable", "Support NPC"],
      body: "Locked / usable. Medium Humanoid (Dwarf). Mountain guide and temporary ally. Approximate CR 5 support NPC; PB +3. No alignment or languages have been specified.",
      gm: "Tactics: cast Aid and Longstrider before danger, then Bless when serious combat begins. Protect vulnerable PCs, reposition allies, rescue falling characters and heal downed PCs. Brenna should support the players, not take their major kills. Her Runebound Pick works as an axe blade or a climbing/mining pick. The supplied CR is approximate, not a newly balanced rating.",
      sb: { ...blank, size: "Medium", type: "Humanoid (Dwarf)", ac: 16, hp: 68, sp: "25 ft.", ab: [18, 12, 18, 10, 15, 9], cr: "5",
        sv: "Str +7, Con +7, Wis +5", sk: "Athletics +7, Nature +3, Perception +5, Survival +8", re: "Poison", se: "Passive Perception 15",
        tr: [
          "Support NPC. Locked / usable block; approximate CR 5, PB +3.",
          "Mountain Born. Ignores nonmagical Difficult Terrain caused by rock, snow, scree, ice and steep natural slopes. Advantage on checks and saving throws involving altitude, severe cold, avalanches, unstable footing and natural mountain hazards.",
          "Expert Guide. When travelling in mountainous terrain, one member of Brenna’s group making a Survival check can use +8 instead of their own modifier. The group has Advantage on checks made to avoid becoming lost in mountains.",
          "Dwarven Resilience. Advantage on saving throws against the Poisoned condition and Resistance to Poison damage.",
          "Sure-Footed. Advantage on Strength and Dexterity saving throws against effects that would knock her Prone or move her against her will while standing on natural stone, snow or ice.",
          "Oath of Guiding the Lost. Wisdom spellcasting; spell save DC 13, spell attack +5. At will: Guidance, Light. 3/day: Cure Wounds (2d8 + 2 HP). 2/day each: Bless, Longstrider. 1/day each: Aid, Lesser Restoration."
        ].join("\n"),
        a: [
          "Multiattack. Two Runebound Pick attacks.",
          "Runebound Pick. Melee Weapon Attack: +8 to hit, reach 5 ft. Hit: 10 (1d10 + 5) magical Slashing or Piercing damage. Can be used as an axe blade or climbing/mining pick.",
          "Frost-Rune Strike. Once per turn when Brenna hits with her Runebound Pick, she deals an additional 3 (1d6) Cold damage. If the target is standing on stone, ice or snow, its Speed is reduced by 10 feet until the start of Brenna’s next turn.",
          "Throwing Hammer. Ranged Weapon Attack: +7 to hit, range 20/60 ft. Hit: 7 (1d6 + 4) Bludgeoning damage."
        ].join("\n"),
        b: "Get Your Feet Under You (PB times per Long Rest). Brenna chooses herself or one creature within 5 feet. That creature may stand from Prone without spending movement, or move up to 5 feet without provoking Opportunity Attacks.",
        r: "Rope! When a creature within 15 feet would fall, be swept away or be pushed over an edge, Brenna can make an Athletics check against a DC determined by the hazard. On a success, stop the creature at the edge or reduce its falling distance by up to 30 feet."
      }
    },
    {
      id: "fallen-elias", title: "Elias Vane / Thaumeryx Avarr", aliases: ["elias", "elias vane", "elias / thaumeryx", "thaumeryx", "thaumeryx avarr"],
      role: "Early-campaign Thaumeryx — 1/8 Panoply", tags: ["Working combat block", "1/8 Panoply"],
      body: "WORKING COMBAT BLOCK — approximate CR 9; HP approximately 125. Represents Elias after the Veil of Remembrance has been destroyed, restoring Thaumeryx’s first Panoply component. Spell uses, Cloud Memory’s DC and action cost, and remaining combat mechanics are not finalized. Size, creature type, alignment and spoken languages are unspecified. No Legendary Actions or Legendary Resistance at this stage.",
      gm: "Partitioned Mind: Elias maintains a genuine mental persona as his public identity. Surface-level Detect Thoughts reveals concern for the PCs, the supposed Order, the next Node, or Alexander being dangerous — things Elias genuinely believes or deliberately focuses on. A successful deep probe can reveal fragments: ancient Netherese towers; the PCs beside him before they supposedly met; Alexander laughing with the party; eight lights rather than seven; writing Order of the Seven Stars doctrine; centuries passing; affection and disappointment toward the PCs; the name Thaumeryx; flashes of the first memory wipe. Do not reveal the entire truth from one probe. Thaumeryx remains physically bound to the Fallen Lands, although his supernatural influence may reach farther. His power scales substantially as more Panoply pieces are destroyed. Cloud Memory’s stronger possibility — temporarily forgetting why he was regarded as hostile — remains a proposal requiring tuning.",
      sb: { ...blank, size: "Size unspecified", type: "Type unspecified", ac: 16, hp: 125, sp: "30 ft.", ab: [9, 14, 16, 20, 16, 20], cr: "9",
        sv: "Int +9, Wis +7, Cha +9", re: "Psychic", la: "Telepathy 60 ft.; spoken languages unspecified",
        tr: [
          "Working Block — 1/8 Panoply. Approximate CR 9 and approximately 125 HP. Applies after the Veil of Remembrance is destroyed. Spell uses and Cloud Memory mechanics still need final tuning. No Legendary Actions or Legendary Resistance.",
          "Ancient Mind. Advantage on saving throws against being Charmed or Frightened.",
          "Bound to the Fallen Lands. Thaumeryx remains physically bound to the Fallen Lands at this stage. His supernatural influence may extend farther than his physical presence.",
          "Partitioned Mind. Surface-level Detect Thoughts reveals Elias’s genuine public persona: concern for the PCs, the supposed Order, the next Node, or Alexander being dangerous. A successful deep probe can break through to fragmented Thaumeryx memories; it does not reveal the entire truth at once.",
          "Veil of Remembrance Powers (working). Memory, perception manipulation, suggestion and concealment of truth. Suggested at-will/frequent abilities: Detect Thoughts and Minor Illusion-style effects. Suggested limited abilities: Suggestion, Counterspell, Hypnotic Pattern, Major Image, Dimension Door and Modify Memory. Exact daily uses, spell save DC and spell attack modifier are not specified.",
          "Cloud Memory (proposal — not finalized). One creature Elias can see within 60 feet makes a Wisdom saving throw (DC unspecified). On failure it loses clear recollection of the previous several seconds and cannot take Reactions until the start of its next turn. Action cost and frequency remain unspecified. A stronger proposed use temporarily obscures why the creature regarded Elias as hostile; this needs final mechanical tuning."
        ].join("\n")
      }
    },
    {
      id: "fallen-alexander", title: "Alexander Elethar", aliases: ["alexander"],
      role: "Human Glory Paladin / apparent antagonist and protector", tags: ["STAT BLOCK REQUIRED", "Not Yet Finalized"],
      body: "Character established; combat stat block NOT YET FINALIZED. STAT BLOCK REQUIRED. Human Oath of Glory Paladin, former companion of the PCs, recurring apparent antagonist / protector. Sword and shield; extremely durable paladin tank. No finished CR, AC, HP, ability scores or attacks have been supplied.",
      gm: "Protector Bloodline (locked supernatural trait): exceptional resistance to supernatural control originating from Thaumeryx or the Eightfold Panoply. Resistant or immune to direct domination, forced loyalty, supernatural memory rewriting and imposed emotional suppression from those sources; the exact resistance-versus-immunity mechanics remain unspecified. This does NOT grant immunity to ordinary psychic damage, illusions, charms from unrelated sources, general mental magic, physical restraint or deception. Keep the protection narrowly tied to Thaumeryx. Design context: likely to fight the party before they understand him; intended to survive four roughly level-5 PCs without relying on plot armour. A finished combat block must be built deliberately."
    },
    ...[
      ["miravel", "Lady Miravel Thorne", "Crown of Concord"],
      ["cael", "Brother Cael Morren", "Mantle of Stillness"],
      ["sareth", "Sareth Vale", "Eye of Avarr"],
      ["darius", "General Darius Kelm", "Scepter of One Will"],
      ["seraphine", "Seraphine Voss", "Astral Aegis"],
      ["torren", "Torren Blackhand", "Hands of the Sovereign"],
      ["ilyra", "Ilyra Dawnmere", "Heart of Unity"]
    ].map(([id, title, item]) => ({
      id: "fallen-" + id, title, aliases: [title.replace(/^(Lady|Brother|General) /, "").toLowerCase()],
      role: "Panoply holder — " + item, tags: ["Panoply holder", "STAT BLOCK REQUIRED"],
      body: "Working NPC identity / concept. Combat stat block NOT YET CREATED. Final role, alignment and encounter difficulty remain flexible.",
      gm: "One of the seven surviving Panoply holders. Associated component: " + item + ". Identity and component supplied in the handover; no final combat mechanics supplied."
    }))
  ];
  const writes = [];
  for (const [path, meta] of docs) {
    if (!(path === "meta/campaign" || /^boards\/[^/]+$/.test(path))) continue;
    const id = path === "meta/campaign" ? "main" : path.split("/")[1];
    // Also follow the previously seeded campaign if the user renamed it.
    if (!["fallen lands", "order of the seven stars"].includes(normalize(meta.name)) && !docs.has("gmx/" + id + "/contentUpdates/fallen-lands-alessa-v1")) continue;
    const marker = "gmx/" + id + "/contentUpdates/" + version;
    if (docs.has(marker)) continue;
    const prefix = id === "main" ? "cards/" : path + "/cards/";
    const gmPrefix = id === "main" ? "gm/" : "gmx/" + id + "/gm/";
    const cards = [...docs].filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"));
    for (const entry of entries) {
      const names = [entry.title.toLowerCase(), ...entry.aliases];
      const matches = cards.filter(([p, c]) => c.kind === "npc" && (p === prefix + entry.id || names.includes(String(c.title || "").trim().toLowerCase())));
      if (matches.length > 1) continue; // Ambiguous existing records: do not guess.
      let cardPath, cardId;
      if (matches.length) {
        const [p, existing] = matches[0];
        cardPath = p; cardId = p.slice(prefix.length);
        // Preserve all authored fields and any existing block; attach supplied
        // mechanics only when no block exists. Full handover notes go to GM notes.
        if (entry.sb && !existing.sb) writes.push([p, { ...existing, sb: entry.sb }]);
      } else {
        cardId = entry.id;
        let n = 2;
        while (docs.has(prefix + cardId) || docs.has(gmPrefix + cardId)) cardId = entry.id + "-" + n++;
        cardPath = prefix + cardId;
        writes.push([cardPath, {
          id: cardId, kind: "npc", title: entry.title, role: entry.role, body: entry.body,
          tags: ["Fallen Lands", ...entry.tags], act: "", status: "planned", links: [], order: null,
          town: "", life: "Unknown", voice: "", wants: "", ...(entry.sb ? { sb: entry.sb } : {})
        }]);
      }
      const oldNotes = docs.get(gmPrefix + cardId) || {};
      const handover = "NPC stat-block handover — 12 October 2026\n" + entry.body + "\n\n" + entry.gm;
      writes.push([gmPrefix + cardId, { ...oldNotes, text: [oldNotes.text, handover].filter(Boolean).join("\n\n") }]);
    }
    writes.push([marker, { applied: true }]);
  }
  return writes;
}
