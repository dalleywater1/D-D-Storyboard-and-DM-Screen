// Additive campaign content, recovered from Corvin - Dnd Brainstorming.
// Returns writes without mutating existing documents. The runtime commits them
// together with the migration marker, so a failed save can safely be retried.
function fallenLandsUpdate(docs) {
  const version = "fallen-lands-alessa-v1";
  const globalMarker = "contentUpdates/" + version;
  const normalize = s => String(s || "").trim().toLowerCase().replace(/^the /, "");
  const campaigns = [...docs].filter(([path, d]) =>
    (path === "meta/campaign" || /^boards\/[^/]+$/.test(path)) &&
    ["fallen lands", "order of the seven stars"].includes(normalize(d.name)));
  const writes = [];
  let initialBoard = null;
  if (!campaigns.length && !docs.has(globalMarker)) {
    // Never reuse an occupied campaign ID or rename the user's main campaign.
    let id = "fallen-lands", n = 2;
    while ([...docs.keys()].some(k => k === "boards/" + id || k.startsWith("boards/" + id + "/") || k.startsWith("gmx/" + id + "/"))) id = "fallen-lands-" + n++;
    const meta = { name: "Fallen Lands", acts: [], created: "2026-10-12T00:00:00.000Z" };
    campaigns.push(["boards/" + id, meta]);
    writes.push(["boards/" + id, meta]);
    if (docs.size === 0) initialBoard = id;
  }
  const card = {
    id: "fallen-alessa", kind: "npc", title: "Alessa", act: "", status: "planned",
    tags: ["Fallen Lands", "Tavern", "Session 1"], links: [], order: 0,
    role: "Tavern keeper / barmaid", town: "", attitude: "Friendly", life: "Alive",
    body: "Dark-skinned woman in her mid 40s to early 50s, with loose dark dreadlocks and simple tan-and-white linen clothing with a plain working apron. Attractive, confident and strong-featured. Personable and warm when she wants to be, sharp-tongued, dryly funny and quick to anger. She runs the tavern and knows most villagers by name. One PC keeps trying to woo her; she shuts him down with a frying pan or wooden spoon.",
    voice: "Warm welcome, dry humour, no patience for fools. ‘You can flirt after you’ve paid your tab.’ ‘Eat first. Bleed later.’ ‘You adventurer types always think you’re charming.’ ‘Last warning.’",
    wants: "",
    sb: {
      size: "Medium", type: "Humanoid", al: "Lawful Neutral", ac: 16, hp: 136, hd: "16d8 + 64", sp: "30 ft.",
      ab: [12, 16, 18, 14, 16, 18], cr: "8", sv: "Dex +6, Wis +6, Cha +7",
      sk: "Deception +10, Insight +9, Perception +6, Persuasion +7, Sleight of Hand +6",
      re: "Psychic", se: "Passive Perception 16", la: "Common plus two others", im: "", ci: "", vu: "", g: "", l: "",
      tr: [
        "Innkeeper’s Eye. Alessa can’t be surprised while conscious. After speaking with a creature for at least 1 minute, she gains Advantage on Wisdom (Insight) checks against that creature for the next 24 hours.",
        "Voice of the Seven Stars. Alessa has Advantage on saving throws against being Charmed or Frightened. Cult allies within 20 feet of her who can hear her have Advantage on saving throws against being Charmed or Frightened.",
        "Hidden in Plain Sight. If combat begins while Alessa has not openly revealed herself as hostile, she has Advantage on her Initiative roll. Until she attacks, casts an obviously hostile effect, or otherwise reveals herself, creatures that regarded her as friendly have Disadvantage on their first attack roll against her.",
        "Keeper of Secrets. Magic that attempts to read Alessa’s surface thoughts encounters mundane tavern concerns unless the effect successfully probes deeper. On a successful deep probe, the caster senses an unnatural mental barrier and may glimpse fragmented images of seven lights, Elias, or silent instructions rather than receiving her complete thoughts. This is not immunity to Detect Thoughts.",
        "Spellcasting. Charisma (spell save DC 15, +7 to hit); no material components required. At will: Thaumaturgy, Message, Minor Illusion. 3/day each: Command, Detect Thoughts, Disguise Self. 2/day each: Hold Person, Suggestion, Silence. 1/day: Clairvoyance."
      ].join("\n"),
      a: [
        "Multiattack. Alessa makes three attacks, using Cast-Iron Pan, Hidden Knife, or Starfire Bolt in any combination.",
        "Cast-Iron Pan. Melee Attack Roll: +7, reach 5 ft. Hit: 8 (1d8 + 4) Bludgeoning damage plus 7 (2d6) Psychic damage. If Alessa chooses, the Bludgeoning damage can be nonlethal. If the target is Charmed by Alessa or regarded her as friendly when combat began, the attack deals an additional 7 (2d6) Psychic damage.",
        "Hidden Knife. Melee or Ranged Attack Roll: +6, reach 5 ft. or range 20/60 ft. Hit: 6 (1d6 + 3) Piercing damage plus 7 (2d6) Psychic damage.",
        "Starfire Bolt. Ranged Spell Attack: +7, range 90 ft. Hit: 18 (4d6 + 4) Psychic damage. The target can’t take Reactions until the start of its next turn.",
        "Voice of Command (Recharge 5–6). Up to three creatures of Alessa’s choice within 30 feet that can hear her must make a DC 15 Wisdom saving throw. On a failure, choose one effect for each target: Kneel — falls Prone and Speed becomes 0 until the start of Alessa’s next turn. Leave — immediately uses its Reaction, if available, to move up to its Speed away from Alessa by the safest available route. Silence — cannot speak or provide Verbal components until the end of its next turn. Stay — Charmed by Alessa until the end of its next turn and cannot willingly move farther away from her. On a success, the creature is immune to Alessa’s Voice of Command until the start of her next turn."
      ].join("\n"),
      b: [
        "A Word in the Right Ear. One allied creature within 30 feet that can hear Alessa can immediately move up to half its Speed without provoking Opportunity Attacks.",
        "Friendly Smile (3/Day). One creature Alessa can see within 30 feet must succeed on a DC 15 Wisdom saving throw or be Charmed by her for 1 minute. It repeats the saving throw whenever it takes damage. While Charmed this way, it regards Alessa as a trusted acquaintance and has Disadvantage on Wisdom (Insight) checks against her."
      ].join("\n"),
      r: "Mind Your Manners. When a creature within 5 feet misses Alessa with an attack, insults her, grabs her, or otherwise gives her an excuse, Alessa makes one Cast-Iron Pan attack against it. On a hit, it must also succeed on a DC 15 Strength saving throw or be pushed 10 feet. Outside actual combat, she can deal just 1 point of Bludgeoning damage as a comic reprimand."
    }
  };
  const secret = "Alessa, Voice of the Seven Stars — CR 8 cult leader (3,900 XP; PB +3). She is an embedded loyalist of Elias and one of the Voices. Running the tavern gives her easy access to newcomers: every stranger eventually eats, drinks, sleeps, boasts or asks directions. She identifies, watches, recruits, isolates and controls newcomers; quietly passes intelligence into Elias’s organisation; reinforces his version of events and the false narrative around Alexander and the Order of the Seven Stars. In Session 1 she can interrupt suspicious conversations and redirect the party toward the planted story. Play her as amusing, grounded and plausibly ordinary, with slightly too much loyalty to village order; her betrayal should be clear only in hindsight. In a fight she knows the exits, hiding places, loose floorboards and weapons behind the bar. Use Voice of Command to split the party, A Word in the Right Ear to position operatives, then reveal the pan. Keep her magic subtle. Homebrew stat block preserved from the campaign discussion; it has not been independently rebalanced.";
  for (const [path] of campaigns) {
    const id = path === "meta/campaign" ? "main" : path.split("/")[1];
    const marker = "gmx/" + id + "/contentUpdates/" + version;
    if (docs.has(marker)) continue;
    const cards = id === "main" ? "cards/" : path + "/cards/";
    const gm = id === "main" ? "gm/" : "gmx/" + id + "/gm/";
    const plot = "gmx/" + id + "/plot/";
    const inCollection = (p, prefix) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/");
    const existingNpc = [...docs].some(([p, d]) => inCollection(p, cards) && (p === cards + card.id || (d.kind === "npc" && /^alessa(?:\s*[,—–-].*)?$/i.test(String(d.title || "").trim()))));
    if (!existingNpc && !docs.has(gm + card.id)) {
      writes.push([cards + card.id, card], [gm + card.id, { text: secret }]);
    }
    const threadId = "fallen-order-seven-stars";
    const existingPlot = [...docs].some(([p, d]) => inCollection(p, plot) && (p === plot + threadId || normalize(d.title) === "order of the seven stars"));
    if (!existingPlot) writes.push([plot + threadId, {
      title: "The Order of the Seven Stars", kind: "main", status: "active", order: 0,
      summary: "", stages: [], ifIgnored: "",
      truth: "Main campaign thread. Alessa is one of the Voices, embedded in village life as the tavern keeper. Her access to newcomers makes the tavern an intelligence and recruitment point for Elias. She watches the party and quietly supports his false narrative around Alexander and the Order. Keep her public persona warm, sharp-tongued and believable; her allegiance belongs behind the DM screen."
    }]);
    writes.push([marker, { applied: true }]);
  }
  if (!docs.has(globalMarker)) writes.push([globalMarker, { applied: true }]);
  return { writes, initialBoard };
}
