/* ===================== Hazard Runs =====================
   Multi-day crossings of a dangerous environment. Every environment runs on
   one engine: a strain score per character (0–5), a Food die and one lifeline
   die (usage dice that step down on a 1–2), four zones that set the DC and the
   weather die, a d12 hazard table, travel jobs and a camp procedure. Runs are
   saved per campaign (gmx/<board>/hazards), so they travel with backups and
   GitHub saves. Wrapped in its own block so a fault here can't stop the page. */
{ try {
MOD_COLLS.push("hazards");
MODULES.splice(MODULES.findIndex(m => m.id === "combats") + 1, 0, { id: "hazards", label: "Hazard Runs", gm: true, render: () => hzRender() });

const HZ_DC = [10, 12, 15, 18], HZ_WDIE = [4, 6, 8, 10], HZ_STEPS = [0, 4, 6, 8, 10, 12];
const HZ_WRANGE = ["1", "2", "3", "4", "5–6", "7–8", "9–10"];
const HZ_CAMP = { good: "Good camp", partial: "Partial camp", exposed: "Exposed" };
const HZ_FOOD_OUT = "No food: +1 strain at every camp, and no exhaustion recovery.";

/* ----- the environments -----
   zones: [name, note] ×4 · states: strain 3, 4, 5 as [name, effect] · weather: [name, strain, effect] for 1, 2, 3, 4, 5–6, 7–8, 9–10
   hazards: [name, text, mercy] for d12 1–12 · lasting: d6 table · wl: [table heading, button wording] */
const HZ_ENVS = [
{ id: "mountains", name: "Mountains", strain: "Chill", low: "Cold", life: "Fuel", lifeStart: 6, foodStart: 8,
  blurb: "Cold, hunger and bad footing. Above the treeline there's no wood, so every warm camp and every drink of melted snow costs fuel you carried up.",
  zones: [["Foothills", "Wood everywhere, so no Fuel roll. Foraging works."], ["Treeline", "Gather scrub (Survival vs DC) instead of rolling Fuel. Foraging works."],
    ["High pass", "Only what you carry, no foraging. Thin air: DC 12 CON save each morning or 1 exhaustion, until the party spends a rest day here."],
    ["Summit", "Only what you carry, no foraging. Thin air DC 15, and resting doesn't help you adapt."]],
  states: [["Numb", "Disadvantage on Dexterity checks and saves (avalanche saves are Dex)."], ["Hypothermic", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Freezing", "Gain 1 exhaustion now and roll for frostbite. Can't travel until warmed."]],
  gear: "Cold-weather gear cancels 1 Chill from weather each day. Getting wet adds 1.",
  weather: [["Clear", 0, "Advantage on the Guide check."], ["Grey", 0, ""], ["Wind", 1, ""], ["Snow", 1, "Guide check at disadvantage."],
    ["Blizzard", 2, "Guide at disadvantage, half progress."], ["Whiteout", 2, "Can't navigate: dig in and lose the day, or walk blind and roll two hazards."],
    ["The mountain's wrath", 3, "An automatic avalanche or rockfall."]],
  job: ["Anchor", "Ropes the party together. If someone falls, the Anchor makes an Athletics check vs zone DC to hold them."],
  hazards: [["Avalanche", "Everyone makes a DEX save vs zone DC or takes 4d10 bludgeoning and is buried. A buried character can't breathe until an ally digs them out (an action and a DC 12 Athletics check)."],
    ["Hidden crevasse", "The leader makes a DEX save or falls 30 ft. If the party is roped, the Anchor rolls Athletics to stop the fall."],
    ["Rockfall", "DEX save or 2d10 bludgeoning."],
    ["Ice ledge", "Each character rolls Acrobatics. On a failure they slide and drop gear: the Food or Fuel die goes down one size."],
    ["Snow glare", "Anyone without eye cover makes a CON save or is blinded until camp. Smart players carve slit goggles."],
    ["Followed", "Wolves, a winter wolf, or something bigger tracking the party."],
    ["Dead end", "Lose half a leg, or climb (Athletics vs DC, 1d10 fall damage on a failure)."],
    ["Thin ice", "Someone goes through: +2 Chill, and they're wet."],
    ["Abandoned camp", "Someone who didn't make it. Fuel die up one size, plus a clue or story hook.", 1],
    ["Cave", "Free shelter tonight, probably empty.", 1],
    ["Hot spring", "Everyone's Chill drops to 0 and each character removes 1 exhaustion.", 1],
    ["Game trail", "Food die up one size, or a shortcut worth half a leg.", 1]],
  campMain: "Fire and shelter. Fire: roll the Fuel die (free in the foothills). Shelter: Survival vs zone DC; a tent gives advantage and a cave succeeds automatically.",
  campExtra: "Water: above the treeline water is melted snow. With no fuel, each character chooses a DC 15 CON save (1 exhaustion on a failure) or eating snow (+1 Chill).",
  lifeOut: "No Fuel: no fire, so a partial camp at best, and no water above the treeline (see camp step 3).",
  lasting: { title: "Frostbite", rows: [["1–2", "Fingers", "Disadvantage on Sleight of Hand and on climbing checks."], ["3–4", "Toes", "Speed −5 ft."], ["5", "Nose or ears", "A scar with a story."], ["6", "Lucky", "No lasting damage."]],
    heal: "Heals after a week somewhere warm, or with Lesser Restoration." },
  magic: ["Tiny Hut (a ritual) gives a good camp without a fire. Don't ban it: the party still needs fuel to melt water, and the danger moves to the travel day.",
    "Goodberry or Create Food and Water replaces the Food roll. Create Food and Water also covers water.",
    "Mountain favored terrain (the 2014 ranger): the Guide check always succeeds, except in a whiteout.",
    "Cold resistance: ignore weather Chill."] },

{ id: "arctic", name: "Arctic", strain: "Chill", low: "Cold", life: "Fuel", lifeStart: 6, foodStart: 8,
  blurb: "Flat, white and endless. Less falling than the mountains, more getting lost, thin ice and a cold that never lets up, even on a clear day.",
  special: ["No cold-weather gear: +1 Chill every day, whatever the weather.", "The long night: in the deep white there's no sun, so the Guide has disadvantage unless the sky is clear (weather 1–2)."],
  zones: [["Taiga edge", "Stunted trees: no Fuel roll. Hunting and fishing work."], ["Open tundra", "Moss and dung for fuel: Survival vs DC instead of rolling Fuel. Game is scarce: Forager at disadvantage."],
    ["Sea ice", "Only what you carry. The Forager can ice-fish (Survival vs DC); a failure means going through (+2 Chill, wet)."],
    ["The deep white", "Only what you carry, no foraging. The long night: Guide at disadvantage unless the sky is clear."]],
  states: [["Frozen stiff", "Disadvantage on Strength and Dexterity checks."], ["Hypothermic", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Freezing", "Gain 1 exhaustion now and roll for frostbite. Can't travel until warmed."]],
  gear: "Cold-weather gear cancels 1 Chill from weather each day. Without it, +1 Chill every day. Falling through ice adds 2.",
  weather: [["Still and bright", 0, "Advantage on the Guide check. Glare: no eye cover means disadvantage on Perception."], ["Flat grey light", 0, "Snow and sky blur together: Scout at disadvantage."],
    ["Biting wind", 1, ""], ["Drifting snow", 1, "Guide at disadvantage; your tracks fill in behind you."], ["Ground blizzard", 2, "Guide at disadvantage, half progress."],
    ["Whiteout", 2, "Can't navigate: dig in and lose the day, or walk blind and roll two hazards."], ["Polar storm", 3, "Nobody travels today. Dig in where you stand and make camp."]],
  job: ["Ice-reader", "Walks ahead testing the ice with a spear (Nature or Survival vs zone DC). On a success, thin-ice and crevasse hazards today hit only the Ice-reader, who has advantage on the save."],
  hazards: [["Thin ice", "The ice cracks under the lead. DEX save or fall into freezing water: +3 Chill and wet. Allies pull them out with Athletics vs DC."],
    ["Snow-bridge crevasse", "The leader makes a DEX save or falls 40 ft (4d6). Roped allies make Athletics to hold."],
    ["Pressure ridge", "A wall of broken ice blocks the way. Climb (Athletics vs DC, 1d10 on a failure) or detour and lose half a leg."],
    ["Big hunter", "A polar bear, a remorhaz, or something worse has been following your smell."],
    ["Snow blindness", "Anyone without eye cover makes a CON save or is blinded until camp."],
    ["Walking in circles", "You've crossed your own trail. Lose a leg."],
    ["Frozen gear", "Waterskins and lamp oil freeze solid. Fuel die down one size to thaw everything, or nobody drinks today (DC 12 CON save or 1 exhaustion)."],
    ["The pack", "Wolves or winter wolves shadow the party, waiting for someone to fall behind. Anyone at Chill 4 or more is the target."],
    ["Seal hole", "Someone who spends the evening hunting (Survival vs DC) moves the Food die up one size.", 1],
    ["Snow house", "An abandoned snow house. Free shelter tonight.", 1],
    ["Hunters' cache", "Supplies under a cairn. Fuel die up one size. Taking it may have consequences.", 1],
    ["Aurora", "A clear night under the lights. Each character removes 1 Chill, and the Guide has advantage tomorrow.", 1]],
  campMain: "Fire and shelter. Fire: roll the Fuel die (free at the taiga edge). Shelter: Survival vs zone DC; a tent gives advantage, and building a snow house takes the Forager's evening but always works.",
  campExtra: "Water is melted snow. With no fuel, each character chooses a DC 15 CON save (1 exhaustion on a failure) or eating snow (+1 Chill).",
  lifeOut: "No Fuel: no fire, so a partial camp at best, and no water (see camp step 3).",
  lasting: { title: "Frostbite", rows: [["1–2", "Fingers", "Disadvantage on Sleight of Hand and on climbing checks."], ["3–4", "Toes", "Speed −5 ft."], ["5", "Face", "A frost-white scar."], ["6", "Lucky", "No lasting damage."]],
    heal: "Heals after a week somewhere warm, or with Lesser Restoration." },
  magic: ["Tiny Hut beats the cold but not the thirst: you still need fuel to melt water.", "Continual Flame gives light, not heat. It doesn't count as a fire.",
    "Cold resistance: ignore weather Chill (but not the no-gear Chill).", "Goodberry or Create Food and Water replaces the Food roll."] },

{ id: "desert", name: "Desert", strain: "Heat", low: "Hot", life: "Water", lifeStart: 6, foodStart: 8,
  blurb: "Water is the clock. Travel by night to beat the sun, and get lost in the dark instead.",
  special: ["Night march: halve the weather's Heat (round down), but the Guide has disadvantage unless you can see the stars (weather 1–3)."],
  zones: [["Scrubland", "Wells and seeps: the Forager can look for water instead of food (Water die up one size on a success)."], ["Dunes", "Soft sand: half progress on any day the Guide fails. Forager at disadvantage."],
    ["Salt flats", "No shade anywhere: a partial camp at best unless you carry a tent. No foraging."], ["The deep sands", "Nothing lives here: +1 Heat every day, whatever the weather. No foraging."]],
  states: [["Heat-addled", "Disadvantage on Wisdom checks and saves. Mirages: the Guide has disadvantage."], ["Heatstroke", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Collapsing", "Gain 1 exhaustion now and roll for sunscars. Can't travel until cooled and given water."]],
  gear: "Desert robes and head cover cancel 1 Heat from weather each day. Medium or heavy armour adds 1 Heat a day.",
  weather: [["Overcast", 0, "Advantage on the Guide check."], ["Hot", 0, ""], ["Scorching", 1, ""], ["Hot wind", 1, "Dust in the air: Guide at disadvantage."],
    ["Furnace day", 2, "Half progress, unless you march by night."], ["Sandstorm", 2, "Can't navigate: shelter and lose the day, or walk blind and roll two hazards."],
    ["Killing heat", 3, "Everyone drinks double: the Water die drops one size at once."]],
  job: ["Water-finder", "Reads the land for seeps, wells and water-holding plants (Survival or Nature vs zone DC). On a success, roll the Water die at camp with advantage."],
  hazards: [["Sandstorm", "A wall of sand rolls in. Everyone makes a CON save or is blinded until it passes, and today's progress is lost."],
    ["Quicksand", "The lead sinks to the waist. Athletics vs DC to get out; each failure sinks deeper. A rope gives allies advantage to pull."],
    ["Flash flood", "A dry gully becomes a river in minutes. DEX save or 3d10 bludgeoning and swept away; the Food die drops one size."],
    ["Under the sand", "Giant scorpions, a sand-dwelling worm, or a buried hunter."],
    ["Mirage", "An oasis on the horizon that isn't there. Unless someone passes a DC 15 Insight check, lose half a leg chasing it."],
    ["A beast collapses", "A camel or horse goes down in the heat. Its load is lost: Food or Water die down one size."],
    ["Raiders", "Riders on the dune line. They want water more than gold."],
    ["Dry well", "The waterhole on the map is dust. If you were counting on it, Water die down one size."],
    ["Ruins", "Half-buried columns throw real shade. A good camp tonight without a tent.", 1],
    ["Caravan", "Traders. Water die up one size for a fair price, or news.", 1],
    ["Oasis", "Real water, real shade. Everyone's Heat drops to 0, and the Water die returns to its starting size.", 1],
    ["Desert rain", "A rare storm passes over. Water die up one size, and the dunes bloom.", 1]],
  campMain: "Shade and water. Shade: a tent or ruins, or rig cover in the open (Survival vs zone DC). Water: roll the Water die.",
  campExtra: "Nights are freezing: without a blanket or a fire, nobody gets a good camp.",
  lifeOut: "No Water: nobody gets a good camp, and each character makes a DC 15 CON save at every camp or gains 1 exhaustion.",
  lasting: { title: "Sunscars", rows: [["1–2", "Cracked lungs", "Disadvantage on CON checks to keep running or hold your breath."], ["3–4", "Sun-blistered skin", "Speed −5 ft in medium or heavy armour."], ["5", "Burnt face", "A scar and a permanent squint."], ["6", "Lucky", "No lasting harm."]],
    heal: "Heals after a week in shade with water, or with Lesser Restoration." },
  magic: ["Create Food and Water covers the Water die for a day. Let it: the danger moves to storms, raiders and getting lost.",
    "Tiny Hut keeps out the sun: it counts as shade.", "Goodberry is food, not water.", "Fire resistance: ignore weather Heat."] },

{ id: "swamp", name: "Swamp", strain: "Rot", low: "Damp", life: "Dry kit", lifeStart: 6, foodStart: 8,
  blurb: "Nothing here kills you fast. Wet feet, leeches, fever and paths that vanish under the water kill you slowly.",
  special: ["Disease: some hazards make a character Exposed. At camp, someone treats each Exposed character (Medicine vs zone DC). On a failure the disease takes hold: +2 Rot, plus a DMG disease such as sewer plague if you like."],
  zones: [["Fen edge", "Firm paths and dry wood: no Dry kit roll. Foraging works."], ["Reed marsh", "Wet wood: Survival vs DC to light a fire, or roll the Dry kit."],
    ["Black bog", "Everything is wet: roll the Dry kit for any fire. Leeches: +1 Rot a day for anyone wading (no boat or raft)."],
    ["The drowned heart", "As the black bog, and the Guide has disadvantage: lights in the mist lie."]],
  states: [["Sodden", "Disadvantage on Constitution saves, so disease and poison hit harder."], ["Fevered", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Rotting", "Gain 1 exhaustion now and roll for lasting rot. Can't travel until dried out and treated."]],
  gear: "Oiled boots and a waxed cloak cancel 1 Rot from weather each day. Falling in or wading neck-deep adds 1.",
  weather: [["Dry spell", 0, "Advantage on the Guide check."], ["Mist", 0, "Scout at disadvantage."], ["Drizzle", 1, ""], ["Steam heat", 1, "Biting insects: no short rests in the open."],
    ["Downpour", 2, "The water rises: half progress."], ["Fog bank", 2, "Can't navigate: wait it out and lose the day, or walk blind and roll two hazards."],
    ["The flood", 3, "The paths are gone: no progress without a boat, and an automatic sinking-mud hazard."]],
  job: ["Prober", "Walks first, testing the ground with a pole (Survival vs zone DC). On a success, the party ignores sinking-mud and deep-water hazards today."],
  hazards: [["Sinking mud", "The lead sinks to the chest. Athletics vs DC each round; three failures and they go under. A rope or pole gives allies advantage to pull."],
    ["Leeches", "Everyone who waded today: +1 Rot. Burn them off at camp, or take +1 more."],
    ["Bad water", "Anyone who drank unboiled water is Exposed."],
    ["Something in the reeds", "Crocodiles, a giant frog, or lizardfolk hunters."],
    ["Will-o'-wisps", "Lights in the mist. The Guide makes a WIS save vs DC or leads the party off the path: lose a leg."],
    ["Rotten log bridge", "It holds one at a time. DEX save each or fall into deep water (+2 Rot, and the Dry kit drops one size)."],
    ["Insect swarm", "A cloud of biting flies. Everyone +1 Rot; anyone at Rot 3 or more is also Exposed."],
    ["Lost causeway", "The path ends in open water. Lose half a leg, or wade on (+1 Rot each)."],
    ["Dry hummock", "A rise of solid ground. A good camp tonight without a roll.", 1],
    ["Herb patch", "Bog myrtle and willow bark. Dry kit up one size, and one character is no longer Exposed.", 1],
    ["Stilt-house hermit", "A strange old trapper. Trade, shelter, or a warning.", 1],
    ["Fish and fowl", "The marsh gives. Food die up one size.", 1]],
  campMain: "Dry ground and fire. Dry ground: Survival vs zone DC; a hammock or raft gives advantage. Fire: roll the Dry kit (free at the fen edge).",
  campExtra: "Disease: treat each Exposed character (Medicine vs zone DC). On a failure the disease takes hold: +2 Rot.",
  lifeOut: "No Dry kit: fires need Survival vs DC 18, and wet clothes never dry, so good camps become partial.",
  lasting: { title: "Lasting rot", rows: [["1–2", "Lingering fever", "Disadvantage on CON saves until cured."], ["3–4", "Trench foot", "Speed −5 ft."], ["5", "Leech scars", "An ugly story."], ["6", "Lucky", "You dry out clean."]],
    heal: "Heals after a week somewhere dry, or with Lesser Restoration." },
  magic: ["Purify Food and Drink stops bad water: nobody becomes Exposed from drinking.", "Lesser Restoration ends a disease that took hold. It doesn't remove Rot.",
    "Tiny Hut is dry inside: a good camp without a fire.", "Water Walk turns the bog into a road: sinking mud and deep water simply don't apply."] },

{ id: "jungle", name: "Jungle", strain: "Fever", low: "Sweating", life: "Remedies", lifeStart: 6, foodStart: 10,
  blurb: "Green walls, heat that never breaks, and things that bite. Food is easy to find. Progress is not: you cut every step.",
  special: ["Disease: some hazards make a character Exposed. At camp, someone treats each Exposed character (Medicine vs zone DC, advantage while the Remedies die isn't empty). On a failure the disease takes hold: +2 Fever."],
  zones: [["Forest edge", "Game trails, fruit and fresh water: Forager at advantage."], ["Deep jungle", "Dense growth: half progress unless the Cutter succeeds."],
    ["Canopy dark", "No sky to steer by: Guide at disadvantage. Dense growth as above."], ["The green heart", "As the canopy dark, and the hazard die is a d10 here: fewer mercies."]],
  hazDie: [12, 12, 12, 10],
  states: [["Feverish", "Disadvantage on initiative and on Wisdom (Perception) checks."], ["Fever-wracked", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Delirious", "Gain 1 exhaustion now and roll for lasting fever. Can't travel until treated."]],
  gear: "Netting and insect salve cancel 1 Fever from weather each day. Medium or heavy armour adds 1 Fever a day.",
  weather: [["Cool morning", 0, "Advantage on the Guide check."], ["Humid", 0, ""], ["Steaming", 1, ""], ["Insect bloom", 1, "Scout at disadvantage."],
    ["Monsoon rain", 2, "Rivers rise: half progress."], ["Green fog", 2, "Can't navigate: wait and lose the day, or walk blind and roll two hazards."],
    ["The great storm", 3, "Trees come down: an automatic deadfall hazard, and no river can be crossed today."]],
  job: ["Cutter", "Hacks the path with a machete or axe (Athletics vs zone DC). On a success, dense growth doesn't halve progress. On a failure, half progress and the Cutter takes +1 Fever."],
  hazards: [["River crossing", "Fast brown water. Athletics vs DC each or swept downstream (2d6 bludgeoning) and lose something: Food or Remedies die down one size."],
    ["Deadfall", "A rotten giant of a tree comes down. DEX save or 4d10 bludgeoning."],
    ["Snake in the litter", "A bite from below: CON save vs DC or poisoned until camp and +1 Fever."],
    ["Big predator", "A jaguar, a giant ape or a dinosaur. It hunts the slowest."],
    ["Thorns and razorvine", "Cut through (everyone takes 1d6 slashing) or go round and lose half a leg."],
    ["Fever swarm", "Mosquitoes. Everyone +1 Fever; anyone without netting is also Exposed."],
    ["Monkeys", "A troop raids the packs at dawn. Food die down one size, unless the Scout succeeded today."],
    ["Strangling vines", "A plant that grabs back: an assassin vine, or worse."],
    ["Fruit grove", "Food die up one size.", 1],
    ["Fever bark", "Someone who knows plants (Nature or Medicine vs DC) finds medicine: Remedies die up one size.", 1],
    ["Overgrown ruins", "Stone walls and a dry floor: a good camp without a roll, and something to explore.", 1],
    ["Local guides", "Hunters offer to lead you for a day: the Guide succeeds automatically tomorrow.", 1]],
  campMain: "Hammocks and medicine. Shelter: hang hammocks off the ground (Survival vs zone DC; a tarp gives advantage). Medicine: roll the Remedies die to dose everyone.",
  campExtra: "Disease: treat each Exposed character (Medicine vs zone DC). On a failure the disease takes hold: +2 Fever.",
  lifeOut: "No Remedies: a partial camp at best, and disease treatment is at disadvantage.",
  lasting: { title: "Lasting fever", rows: [["1–2", "Recurring fever", "Once per adventure the DM can give you a Feverish day out of nowhere."], ["3–4", "Jungle rot", "Speed −5 ft."], ["5", "Bite scars", "A map of every insect that found you."], ["6", "Lucky", "It burns out clean."]],
    heal: "Heals after a week of rest out of the jungle, or with Lesser Restoration." },
  magic: ["Purify Food and Drink: no fevers from bad water.", "Lesser Restoration ends a disease that took hold. It doesn't remove Fever.",
    "Speak with Animals or Speak with Plants: ask the way, and the Guide succeeds for the day.", "Pass without Trace lets the party slip past a big predator: reroll that hazard."] },

{ id: "underdark", name: "Underdark", strain: "Dread", low: "Uneasy", life: "Light", lifeStart: 8, foodStart: 6, wl: ["The deep's mood", "the deep's mood"],
  blurb: "Lightless, airless and full of eyes. Here the clock is your lamp oil, and the strain is in the mind.",
  special: ["Darkvision lets you move without light. It doesn't comfort: camps still need light, and the dark still adds Dread."],
  zones: [["Upper caves", "Surface creatures still pass: foraging works (fungus, cave fish)."], ["The twisting deep", "No sky to steer by: the Guide has disadvantage without a map or a local guide."],
    ["Lightless vaults", "Sound carries for miles: a failed Scout check means a second hazard."], ["The maw", "Wild magic in the stone. Each morning, a DC 12 WIS save or +1 Dread. Teleportation and divination misfire."]],
  states: [["Shaken", "Disadvantage on Wisdom saves. Shadows move at the edge of the light."], ["Unravelling", "Gain 1 exhaustion at each camp while still at 4 or more: nobody really sleeps."],
    ["Breaking", "Gain 1 exhaustion now and roll on the scars table (or the DMG's madness tables). Can't go on until someone talks them down (Persuasion or Medicine vs DC)."]],
  gear: "A map of these tunnels, or a local guide, cancels 1 Dread each day. Walking in total darkness adds 1.",
  weather: [["Still air", 0, "You can hear water: advantage on the Guide check."], ["Dripping silence", 0, ""], ["Distant drums", 1, ""], ["Bad air", 1, "Flames burn low: Guide at disadvantage."],
    ["Tremors", 2, "The tunnels shift: half progress."], ["A storm of wild magic", 2, "The tunnels lie: wait and lose the day, or walk blind and roll two hazards."],
    ["The deep wakes", 3, "An automatic cave-in, or something huge passes close by."]],
  job: ["Lightkeeper", "Trims wicks, shades lamps and rations oil (Survival or tinker's tools vs zone DC). On a success, roll the Light die at camp with advantage."],
  hazards: [["Cave-in", "DEX save vs DC or 4d10 bludgeoning and pinned. The way back may be gone."],
    ["Chasm", "A rope bridge, a ledge or a leap. Athletics vs DC; a failure falls 1d4 × 10 ft."],
    ["Gas pocket", "Bad air pools in a dip. CON save or poisoned until camp. An open flame here explodes (3d6 fire)."],
    ["Slavers", "A drow or duergar patrol who'd love new stock."],
    ["It wasn't stone", "An ooze on the floor or a darkmantle on the ceiling."],
    ["Lights out", "A gust, a drip, a fall. Light die down one size, and everyone +1 Dread."],
    ["Whispers", "Something speaks in a voice you know. WIS save vs DC each or +1 Dread."],
    ["Dead end", "Back the way you came: lose a leg."],
    ["Fungus forest", "Food die up one size. Nature vs DC to avoid the poisonous ones (CON save or poisoned on a failure).", 1],
    ["Glowing crystals", "Free light: Light die up one size.", 1],
    ["Myconid circle", "Strange, peaceful hosts. A good camp, and everyone's Dread drops to 0.", 1],
    ["Underground lake", "Fresh water and blind fish: Food die up one size. A boat could save a leg.", 1]],
  campMain: "Light and a defensible spot. Light: roll the Light die. Shelter: find a spot with one way in (Survival vs zone DC).",
  campExtra: "Watches: anyone at Dread 3 or more who stands watch alone makes a WIS save vs zone DC or takes +1 Dread.",
  lifeOut: "No Light: never a good camp, everyone takes +1 Dread at every camp, and characters without darkvision have disadvantage on everything.",
  lasting: { title: "Scars of the dark", rows: [["1–2", "Fear of the dark", "Disadvantage on Wisdom saves while not in bright light."], ["3–4", "Nightmares", "No long-rest benefit unless you sleep by a light."], ["5", "The whisper", "Once per session the DM may whisper you a lie."], ["6", "Came through", "No lasting harm."]],
    heal: "Fades after a month above ground, or with Greater Restoration." },
  magic: ["Continual Flame and Daylight solve light. Let them: the danger moves to hazards and Dread.", "A song or a calming spell at camp (Calm Emotions, a bard's performance): −1 Dread for everyone, once per camp.",
    "Darkvision moves; it doesn't comfort.", "Create Food and Water replaces the Food roll."] },

{ id: "sea", name: "Open sea", strain: "Brine", low: "Salt-stung", life: "Fresh water", lifeStart: 6, foodStart: 8, wl: ["Sea and sky", "the sea and sky"],
  blurb: "A small boat or a lost ship. The sea gives you nothing to drink, and the sky decides how far you get.",
  special: ["Long rests only on a good night. Without them a crew fades by day three, so keep the mercies on the table."],
  zones: [["Coastal waters", "Birds, fish and rain-filled rock pools: foraging (fishing) works."], ["Open sea", "Fishing only: Forager at disadvantage."],
    ["Deep ocean", "Nothing to steer by but the stars: Guide at disadvantage without navigator's tools."], ["The far reach", "Uncharted water and strange currents: every Guide failure also rolls a hazard."]],
  states: [["Sun-cracked", "Disadvantage on Strength checks and saves: rowing, swimming and hauling."], ["Brine-sick", "Gain 1 exhaustion at each night while still at 4 or more."],
    ["Delirious", "Gain 1 exhaustion now and roll for sea-scars. This is when people drink seawater."]],
  gear: "An awning or sail for shade cancels 1 Brine from weather each day. Getting soaked through (storm, overboard) adds 1.",
  weather: [["Fair wind", 0, "Advantage on the Guide check, and an extra half leg."], ["Steady breeze", 0, ""], ["Glaring calm", 1, "No wind: half progress unless you row (push hard)."],
    ["Choppy", 1, "Seasickness: CON save or poisoned until night."], ["Squall", 2, "The Helmsman makes a check vs DC or the stores get soaked: Food die down one size."],
    ["Fog", 2, "Can't navigate: drift and lose the day, or row blind and roll two hazards."], ["Storm", 3, "An automatic hazard: capsize, leak or reef."]],
  job: ["Helmsman", "Handles the boat (water vehicles or Athletics vs zone DC). On a success, squalls cost no supplies and a capsize becomes a near miss."],
  hazards: [["Capsize", "A rogue wave rolls the boat. Everyone makes a STR save or loses their grip; Food and Fresh water dice each drop one size."],
    ["Leak", "The seams open. Someone bails all day (no job for them), or the Food die drops one size."],
    ["Fins", "Sharks, or a sea serpent, circling."],
    ["Reef", "Breakers ahead. The Helmsman checks vs DC or the hull is holed (as Leak, and half progress)."],
    ["Overboard", "Someone goes in. +2 Brine, and Athletics vs DC to get back, or a line from the boat."],
    ["Waterspout", "A spinning column of water bears down. DEX save or 3d10 bludgeoning."],
    ["A sail on the horizon", "Pirates, or sahuagin beneath them."],
    ["Doldrums", "A dead calm. No progress today unless everyone rows (push hard)."],
    ["Flotsam", "A wreck's floating cargo. Fresh water die up one size, and a clue.", 1],
    ["Rain squall", "Sweet rain. Catch it: Fresh water die up one size.", 1],
    ["Island", "Land! A good night, Brine drops to 0, and fresh water.", 1],
    ["Fish school", "Food die up one size.", 1]],
  campMain: "There's no camp at sea, only nightfall. Shade and water: rig an awning (Survival or water vehicles vs zone DC) and roll the Fresh water die.",
  campExtra: "Seawater: anyone who drinks it to save the Fresh water die takes +2 Brine.",
  lifeOut: "No Fresh water: nobody gets a good night, and each character makes a DC 15 CON save every night or gains 1 exhaustion.",
  lasting: { title: "Sea-scars", rows: [["1–2", "Salt sores", "Speed −5 ft until healed."], ["3–4", "Sun-blind", "Disadvantage on Perception checks in bright light."], ["5", "Weathered", "You look ten years older."], ["6", "Lucky", "No lasting harm."]],
    heal: "Heals after a week ashore, or with Lesser Restoration." },
  magic: ["Create Food and Water ends the water clock for a day.", "Water Breathing turns a capsize from deadly to annoying.",
    "Tiny Hut is immobile: on a moving boat, the boat sails out of it.", "Gust of Wind or Control Water can turn a glaring calm (3) into a steady breeze (2) for the day."] },

{ id: "ashlands", name: "Ashlands", strain: "Ash", low: "Coughing", life: "Filters", lifeStart: 6, foodStart: 8,
  blurb: "A land still on fire. The air itself is the enemy, so the lifeline is clean breath: wet cloths, masks and filters that clog by the day.",
  special: ["Water is scarce: rations here include water, so the Food die is food and water together."],
  zones: [["Cinder slopes", "Old ash and new grass: some forage, and no Filters roll."], ["Ash plains", "Grey to the horizon. No foraging."],
    ["Lava fields", "Cooling crust over glowing rock: +1 Ash every day, whatever the weather."], ["The caldera", "Fumes and fire: +1 Ash every day, and roll the Filters die twice at camp."]],
  states: [["Choking", "Disadvantage on Constitution checks, and you can't take the Dash action."], ["Burnt lungs", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Suffocating", "Gain 1 exhaustion now and roll for ash-scars. Can't travel until in clean air."]],
  gear: "A wet cloth or mask cancels 1 Ash from weather each day, while the Filters die isn't empty. A salamander-leather cloak cancels 1 more.",
  weather: [["Clean wind", 0, "The fumes blow away: advantage on the Guide check."], ["Haze", 0, ""], ["Ashfall", 1, ""], ["Sulphur wind", 1, "Eyes stream: Guide at disadvantage."],
    ["Tremors", 2, "Fissures open: half progress."], ["Black cloud", 2, "Can't navigate: shelter and lose the day, or walk blind and roll two hazards."],
    ["Eruption", 3, "An automatic burning-surge or crust-break hazard."]],
  job: ["Firewatcher", "Reads the ground's heat and the wind (Nature or Survival vs zone DC). On a success, the party has advantage on saves against gas, surge and crust hazards today."],
  hazards: [["Burning surge", "A cloud of burning ash rolls downhill. DEX save vs DC or 6d6 fire, half on a success. Cover behind rock gives advantage."],
    ["Crust break", "The ground was a thin skin over lava. DEX save or 3d10 fire."],
    ["Toxic vent", "Invisible gas pools in a hollow. CON save or poisoned until camp and +1 Ash."],
    ["Fire creatures", "Magmins, salamanders, or a fire elemental."],
    ["Fissure", "A crack opens. Athletics or Acrobatics vs DC to jump; a failure falls 20 ft (2d6) into the heat."],
    ["Ash blindness", "Grit in the eyes: CON save or blinded until camp, unless you wear goggles."],
    ["Acid rain", "Rain turns the ash to sludge. Everyone takes 1d6 acid, and the Filters die drops one size."],
    ["Obsidian field", "Glass-sharp ground. Lose half a leg going round, or everyone takes 1d6 slashing."],
    ["Obsidian cave", "Sealed from the fumes: a good camp tonight without a roll.", 1],
    ["Hot spring", "Clean enough to bathe: Ash drops to 0, and each character removes 1 exhaustion.", 1],
    ["Abandoned forge", "Masks and spare filters on the racks: Filters die up one size.", 1],
    ["Fire-lilies", "Flowers that grow in ash. Food die up one size, or everyone removes 1 Ash.", 1]],
  campMain: "Clean air and cool ground. Clean air: soak the cloths and roll the Filters die (free on the cinder slopes). Shelter: a lee from wind and heat (Survival vs zone DC).",
  campExtra: "Hot ground: in the lava fields and the caldera, anyone without a bedroll takes +1 Ash.",
  lifeOut: "No Filters: gear no longer cancels Ash, and nobody gets a good camp.",
  lasting: { title: "Ash-scars", rows: [["1–2", "Ash lung", "Disadvantage on CON saves against poison and gas."], ["3–4", "Burnt hands", "Disadvantage on Sleight of Hand and thieves' tools."], ["5", "Smoke voice", "A rasp nobody forgets."], ["6", "Lucky", "No lasting harm."]],
    heal: "Heals after a week of clean air, or with Lesser Restoration." },
  magic: ["Fire resistance halves fire damage, but not Ash: it's the air.", "Tiny Hut keeps out the fumes: clean air for a camp without a Filters roll.",
    "Protection from Poison stops one gas hazard.", "Create Food and Water replaces the Food roll."] },

{ id: "blight", name: "Blighted wood", strain: "Taint", low: "Uneasy", life: "Wards", lifeStart: 6, foodStart: 8, wl: ["The wood's mood", "the wood's mood"],
  blurb: "A forest that's wrong. The trees remember, the water is foul, and the land itself wants you to stay.",
  special: ["Blood calls the wood: anyone who drops to 0 hit points here takes +2 Taint.", "Death saves are at disadvantage in the heart of rot."],
  zones: [["Wood's edge", "Ordinary forest: foraging works, and no Wards roll."], ["The grey wood", "Foul water: foraged food and water need a Medicine check vs DC or +1 Taint to whoever eats it."],
    ["The weeping trees", "The land shifts: a failed Guide check also loses a leg already walked."], ["The heart of rot", "Each morning, a WIS save vs DC or +1 Taint. Death saves at disadvantage."]],
  states: [["Marked", "Disadvantage on Charisma checks and saves. The wood knows your name."], ["Hollowing", "Gain 1 exhaustion at each camp while still at 4 or more."],
    ["Claimed", "Gain 1 exhaustion now and roll for lasting taint. You can't leave the wood willingly until Remove Curse or a fresh ward frees you."]],
  gear: "A holy symbol or blessed charm worn openly cancels 1 Taint from the wood's mood each day.",
  weather: [["Birdsong", 0, "The wood sleeps: advantage on the Guide check."], ["Grey quiet", 0, ""], ["Whispering leaves", 1, ""], ["Creeping mist", 1, "Guide at disadvantage."],
    ["Weeping trees", 2, "Black sap rains down: half progress."], ["The paths move", 2, "Can't navigate: wait and lose the day, or walk blind and roll two hazards."],
    ["The wood wakes", 3, "An automatic hazard: the dead, or the trees themselves."]],
  job: ["Warden", "Keeps the wards: salt lines, chants and charms (Religion or Arcana vs zone DC). On a success, roll the Wards die at camp with advantage, and the night watch can't be surprised."],
  hazards: [["Grasping roots", "The ground takes hold. STR save or restrained, taking 2d6 bludgeoning each round until freed."],
    ["The restless dead", "Zombies, ghouls, or a wight that remembers this road."],
    ["Foul spring", "Water that looks clean. Anyone who drinks makes a CON save or is poisoned and takes +1 Taint."],
    ["The wood closes", "The trees close the path behind you. Lose a leg already walked."],
    ["Voices of the lost", "Someone calls for help in a dead friend's voice. WIS save each or +1 Taint; failing by 5 or more means wandering off alone."],
    ["Grey mould", "Rot gets into the packs. Food die down one size."],
    ["Hunted", "Blighted wolves, needle blights or worse, with the patience of the wood."],
    ["The hanging tree", "A tree of old executions. CHA save vs DC or +1 Taint, and a story hook for anyone who looks closer."],
    ["Forgotten shrine", "It still holds. A good camp, and everyone removes 1 Taint.", 1],
    ["Blessed spring", "Clean water and old salt: Wards die up one size.", 1],
    ["A living hermit", "Someone survived here. The Guide succeeds automatically tomorrow; they know the safe paths.", 1],
    ["Clearing of light", "Real sunlight through a gap in the canopy. Everyone removes 2 Taint.", 1]],
  campMain: "Wards and fire. Wards: roll the Wards die to circle the camp in salt and charms (free at the wood's edge). Fire: the dead wood burns badly (Survival vs zone DC).",
  campExtra: "Dreams: anyone at Taint 3 or more dreams of the wood. A WIS save vs zone DC, or no long-rest benefit tonight.",
  lifeOut: "No Wards: never a good camp, and roll a hazard every night while the party sleeps.",
  lasting: { title: "Lasting taint", rows: [["1–2", "Grey streak", "Animals fear you: disadvantage on Animal Handling."], ["3–4", "Hollow sleep", "You need two extra hours for a long rest."], ["5", "The wood's voice", "Now and then, the wood speaks through you."], ["6", "Lucky", "You walk out clean."]],
    heal: "Lifted by Remove Curse, Greater Restoration, or a holy rite at a temple." },
  magic: ["Remove Curse or Greater Restoration sets one character's Taint to 0.", "Protection from Evil and Good: no Taint from the dead or the voices while it lasts.",
    "Hallow on a camp spot: a good camp every time you return to it.", "Light spells don't help. Real sunlight does: a Daylight spell counts as a clearing of light, once per run."] },
];

const HZ_CORE = [
  ["Strain", "Each character has a strain score from 0 to 5, named for the place: Chill, Heat, Rot, Dread… At 3 the environment's penalty starts, at 4 they gain exhaustion at every camp, and at 5 they gain 1 exhaustion at once and roll on the lasting-injury table."],
  ["Supply dice", "The party shares a Food die and one lifeline die (Fuel, Water, Light…). Roll the die you use at camp: on a 1–2 it drops a size, d12 → d10 → d8 → d6 → d4 → empty. Finds and purchases move it up a size."],
  ["Zones", "Each environment has four zones that get worse as you go: DC 10, 12, 15 and 18 for every check, and a weather die of d4, d6, d8 and d10. Higher weather rolls are worse."],
  ["The day", "1. Morning: roll the weather. 2. Travel: each character does their job. 3. Roll one hazard. 4. Night: make camp. Cover a dull day with a single weather roll."],
  ["Jobs", "Guide (Survival, Nature or navigator's tools): a success covers one leg, a failure means lost, no progress. Scout (Perception or Investigation): a success rolls two hazards and the party picks one. Forager (Survival or Nature, where the zone allows): a success moves the Food die up a size. Each environment adds a fourth job."],
  ["Standing orders", "Jobs stay until a player changes them, so nobody re-declares every morning. A job nobody takes fails automatically."],
  ["Pushing hard", "Everyone takes +1 strain and makes a DC 10 CON save or gains 1 exhaustion. A Guide success then covers two legs."],
  ["Camp", "The environment says what makes a good camp. Good camp: strain drops to 0. Partial: −1. Exposed: +1. Then eat (no food = +1 strain), do the environment's extra step, anyone at 4 or more gains 1 exhaustion, and only a good, fed camp lets a long rest remove one."],
  ["Gear", "The right gear cancels 1 point of weather strain per day. Each environment names it, and most name something that adds strain too."],
  ["Spells", "Let them work. When Tiny Hut, Goodberry or Create Food and Water solve the camp, the pressure moves to the travel day: navigation, hazards, and the strain each place keeps. For a harder table, a food or water spell moves a supply die up one size instead of replacing it."],
  ["Knobs", "Brutal: start the lifeline die at d4. Gentle: start it at d8 or higher. Lower every DC by 2 for a party below about level 5. 4–8 travel days is the sweet spot."],
];
const HZ_SOURCES = [
  ["Usage dice that step down on a 1–2: The Black Hack.", ""],
  ["Jobs as standing orders, and a job nobody takes failing: The Alexandrian's hexcrawl watch actions", "https://thealexandrian.net/wordpress/46116/roleplaying-games/5e-hexcrawl-part-3-watch-actions"],
  ["Empty roles fail automatically; pace and danger ratings: Giffyglyph's Darker Dungeons journeys", "https://giffyglyph.com/darkerdungeons/grimoire/4.0.0/en/making_a_journey.html"],
  ["Darkness as a travel cost (night march, long night, the Underdark): The Angry GM's tension on the road", "https://theangrygm.com/tension-on-the-road"],
  ["Two skills per job so one Wisdom character doesn't do everything; polluted air; blighted regions: Badooga's environment guidelines on GM Binder", "https://www.gmbinder.com/share/-MEVza9zokR5wbbwbs5c"],
  ["Taint and the land that keeps you lost: Level Up's corrupted regions", "https://a5e.tools/node/5490"],
  ["Crews fading by day three without long rests: an EN World sea-travel thread", "https://www.enworld.org/goto/post?id=9073235"],
  ["Goodberry and Create Food and Water trivialising supplies: EN World and Tribality", "https://www.enworld.org/goto/post?id=6723400"],
];

/* ----- state & helpers ----- */
S.hz = Object.assign({ view: "runs", env: "mountains" }, lsGet("sb-hz", {}));
const hzKeepUi = () => lsSet("sb-hz", { view: S.hz.view, env: S.hz.env });
const hzEnv = id => HZ_ENVS.find(e => e.id === id) || HZ_ENVS[0];
const hzWl = env => env.wl || ["Weather", "the weather"];
const hzRuns = () => [...((S.mod && S.mod.hazards) || new Map()).values()].filter(d => d && d.env)
  .sort((a, b) => (a.status === "done") - (b.status === "done") || String(b.created || "").localeCompare(String(a.created || "")));
const hzRoll = n => 1 + Math.floor(Math.random() * n);
const hzDieName = n => (int(n) ? "d" + int(n) : "empty");
const hzStep = (n, dir) => HZ_STEPS[clamp(Math.max(0, HZ_STEPS.indexOf(int(n))) + dir, 0, HZ_STEPS.length - 1)];
const hzWRow = r => (r <= 4 ? r - 1 : r <= 6 ? 4 : r <= 8 ? 5 : 6);
const hzState = (env, v) => (v >= 5 ? env.states[2] : v >= 4 ? env.states[1] : v >= 3 ? env.states[0] : null);
const hzJobs = env => [["", "No job"], ["guide", "Guide"], ["scout", "Scout"], ["forager", "Forager"], ["env", env.job[0]]];
const hzHazDie = (env, z) => (env.hazDie && env.hazDie[z]) || 12;
const hzWho = p => (p && String(p.name || "").trim()) || "Someone";
function hzLog(r, t) { r.log = [{ d: int(r.day) || 1, t }, ...(Array.isArray(r.log) ? r.log : [])].slice(0, 120); }
function hzPut(r) { r.updated = new Date().toISOString(); putDoc("hazards", r.id, r); }
function hzExh(p, v, out) {
  const before = int(p.exh); p.exh = clamp(int(v), 0, 6);
  if (before < 6 && p.exh === 6) out.push(`${hzWho(p)} reaches exhaustion 6 and dies`);
}
function hzSetStrain(env, p, v, out) {
  const before = int(p.strain); p.strain = clamp(int(v), 0, 5);
  if (before < 5 && p.strain === 5) { out.push(`${hzWho(p)} is ${env.states[2][0].toLowerCase()}: +1 exhaustion, roll ${env.lasting.title.toLowerCase()}`); hzExh(p, int(p.exh) + 1, out); }
}
const hzAct = fn => d => {
  if (!S.canWrite) return;
  const r = docCopy("hazards", d.id); if (!r || !r.env) return;
  r.last = r.last && typeof r.last === "object" ? r.last : {};
  r.party = Array.isArray(r.party) ? r.party : [];
  fn(r, hzEnv(r.env), d);
};

/* ----- the page ----- */
function hzRender() {
  try {
    const envs = S.hz.view === "envs";
    const bar = `<div class="hz-bar"><h2>Hazard Runs</h2>
      <span class="seg" role="group" aria-label="View"><button type="button" data-do="hz-view" data-v="runs" aria-pressed="${!envs}">Runs</button><button type="button" data-do="hz-view" data-v="envs" aria-pressed="${envs}">Environments</button></span></div>`;
    return `<div class="hz">${bar}${envs ? hzEnvsView() : hzRunsView()}</div>`;
  } catch (err) {
    console.error("Hazard Runs", err);
    return `<div class="mempty-detail"><h2>Hazard Runs hit a snag</h2><p>${esc(err && err.message)}</p></div>`;
  }
}
function hzRunsView() {
  const runs = hzRuns();
  if (!runs.length) return `<div class="mempty-detail"><h2>No hazard runs yet</h2>
    <p>A run tracks a party crossing somewhere dangerous: the day, the zone, supply dice, each character's strain and exhaustion, and a log of every roll. Pick where they're going.</p>
    ${S.canWrite ? `<div class="hz-start">${HZ_ENVS.map(e => `<button type="button" class="btn${e.id === S.hz.env ? " primary" : ""}" data-do="hz-new" data-env="${e.id}">${esc(e.name)}</button>`).join("")}</div>` : ""}</div>`;
  const sel = pickSel("hazards", runs, runs[0].id), r = S.mod.hazards.get(sel);
  const items = runs.map(x => {
    const e = hzEnv(x.env), legs = Math.max(1, int(x.legs) || 1);
    return { id: x.id, title: x.name || "Untitled run", sub: `${e.name} · day ${int(x.day) || 1} · ${e.zones[clamp(int(x.zone), 0, 3)][0]}`,
      badge: x.status === "done" ? pill("done", "muted") : pill(`${clamp(int(x.legsDone), 0, legs)}/${legs}`, "played") };
  });
  return `<div class="mod">${listPane({ mod: "hazards", title: "Runs", items, sel, newDo: "hz-new", newLabel: "+ Run", empty: "No runs yet." })}${r ? hzRunDetail(r) : ""}</div>`;
}
function hzPips(kind, id, n, cur, max, label) {
  let h = "";
  for (let v = 1; v <= max; v++) h += `<button type="button" class="hz-pip ${kind} s${v}${v <= cur ? " on" : ""}" data-do="hz-${kind}" data-id="${esc(id)}" data-n="${n}" data-v="${v}" aria-label="${esc(label)} ${v}" aria-pressed="${v <= cur}" ${S.canWrite ? "" : "disabled"}></button>`;
  return h;
}
function hzRunDetail(r) {
  const env = hzEnv(r.env), m = "hazards", i = r.id, W = S.canWrite, wl = hzWl(env);
  const z = clamp(int(r.zone), 0, 3), legs = Math.max(1, int(r.legs) || 1), done = clamp(int(r.legsDone), 0, legs), day = int(r.day) || 1;
  const last = r.last && typeof r.last === "object" ? r.last : {}, party = Array.isArray(r.party) ? r.party : [];
  const idA = `data-id="${esc(i)}"`;

  const zones = env.zones.map(([name], k) => `<button type="button" class="hz-zone" data-do="hz-zone" ${idA} data-z="${k}" aria-pressed="${k === z}" ${W ? "" : "disabled"}><b>${esc(name)}</b><span>DC ${HZ_DC[k]} · d${HZ_WDIE[k]}</span></button>`).join("");

  const dieBox = (key, label) => {
    const n = int(r[key]), lr = last.dice && last.dice[key];
    return `<div class="hz-die${n ? "" : " empty"}"><span class="lbl">${esc(label)} die</span><span class="size">${hzDieName(n)}</span>
      ${W ? `<div class="actions"><button type="button" class="btn small" data-do="hz-die" ${idA} data-k="${key}" data-op="roll" ${n ? "" : "disabled"}>Roll</button><button type="button" class="btn small" data-do="hz-die" ${idA} data-k="${key}" data-op="adv" title="Roll twice and keep the higher" ${n ? "" : "disabled"}>With advantage</button><button type="button" class="icon-btn" data-do="hz-die" ${idA} data-k="${key}" data-op="down" aria-label="${esc(label)} die down a size">−</button><button type="button" class="icon-btn" data-do="hz-die" ${idA} data-k="${key}" data-op="up" aria-label="${esc(label)} die up a size">+</button></div>` : ""}
      ${lr ? `<span class="hz-roll">Last roll: ${lr.b != null ? `${lr.a} and ${lr.b}, kept ${lr.v}` : lr.v}${lr.to !== lr.from ? ` · dropped to ${hzDieName(lr.to)}` : " · holds"}</span>` : ""}
      ${n ? "" : `<span class="hint">${esc(key === "food" ? HZ_FOOD_OUT : env.lifeOut)}</span>`}</div>`;
  };

  let wOut = "";
  if (last.weather) {
    const lw = last.weather, w = env.weather[lw.row] || env.weather[0];
    wOut = `<div class="hz-out${w[1] >= 2 ? " bad" : w[1] === 0 ? " good" : ""}"><span class="hz-roll">${esc(wl[0])} · d${lw.die} rolled ${lw.roll}</span>
      <span class="t">${esc(w[0])}${w[1] ? ` · +${w[1]} ${esc(env.strain)}` : ""}</span>${w[2] ? `<span>${esc(w[2])}</span>` : ""}
      ${w[1] && party.length ? (lw.applied ? `<span class="hint">Given to the party.</span>` : W ? `<div><button type="button" class="btn small" data-do="hz-apply" ${idA}>Give everyone +${w[1]} ${esc(env.strain)} (gear cancels 1)</button></div>` : "") : ""}</div>`;
  }
  const hz = Array.isArray(last.hazards) ? last.hazards : [];
  const hOut = hz.length ? `${hz.length > 1 ? `<p class="hint">The Scout found two. The party picks one:</p>` : ""}${hz.map(h => {
    const x = env.hazards[clamp(int(h.roll), 1, 12) - 1];
    return `<div class="hz-out${x[2] ? " good" : " bad"}"><span class="hz-roll">Hazard · d${h.die} rolled ${h.roll}</span><span class="t">${esc(x[0])}${x[2] ? " " + pill("mercy", "mercy") : ""}</span><span>${esc(x[1])}</span></div>`;
  }).join("")}` : "";

  const jobs = hzJobs(env).slice(1).map(([k, l]) => {
    const who = party.filter(p => p.job === k).map(hzWho);
    return `<span class="${who.length ? "" : "miss"}">${esc(l)}: ${who.length ? esc(who.join(", ")) : "nobody (fails)"}</span>`;
  }).join("");

  const members = party.map((p, n) => {
    const s = clamp(int(p.strain), 0, 5), x = clamp(int(p.exh), 0, 6), st = hzState(env, s);
    return `<div class="hz-member${s >= 4 || x >= 6 ? " bad" : s >= 3 ? " warn" : ""}" id="hzm-${esc(p.id || "n" + n)}">
      <div class="hz-mname">${fInput(m, i, `party.${n}.name`, null, { aria: "Character name", ph: "Name" })}</div>
      <div class="hz-mjob">${fSelect(m, i, `party.${n}.job`, null, hzJobs(env), { aria: `${hzWho(p)}'s job` })}</div>
      <div class="hz-track"><span class="hz-tl">${esc(env.strain)} <b>${s}</b> <em class="${st ? "st" : ""}">${esc(st ? st[0] : env.low)}</em></span><span class="hz-pips">${hzPips("strain", i, n, s, 5, `${hzWho(p)}'s ${env.strain}`)}</span></div>
      <div class="hz-track"><span class="hz-tl">Exhaustion <b>${x}</b>${x >= 6 ? ` <em class="st">dead</em>` : ""}</span><span class="hz-pips">${hzPips("exh", i, n, x, 6, `${hzWho(p)}'s exhaustion`)}</span></div>
      <label class="chk">${fCheck(m, i, `party.${n}.gear`, `${hzWho(p)} has the right gear`)} Gear</label>
      ${W ? `<button type="button" class="icon-btn hz-mdel" data-do="hz-member-del" ${idA} data-n="${n}" aria-label="Remove ${esc(hzWho(p))}" title="Remove from this run">×</button>` : ""}
      <div class="hz-mnote">${fInput(m, i, `party.${n}.note`, null, { aria: `${hzWho(p)}: injuries and notes`, ph: "Injuries, Exposed, notes" })}</div>
    </div>`;
  }).join("");

  const log = (Array.isArray(r.log) ? r.log : []).map(e => `<li><span>Day ${int(e.d) || 1}</span><div>${esc(e.t)}</div></li>`).join("");

  return `<section class="mdetail hz-run" aria-label="Hazard run">
    <div class="row-between"><span class="hint">${esc(env.name)} · ${esc(env.strain)} and ${esc(env.life)}</span><button type="button" class="btn ghost small" data-do="hz-env" data-env="${env.id}">${esc(env.name)} rules</button></div>
    ${fInput(m, i, "name", "Run", { cls: "big", ph: "Crossing the Frostspine" })}
    <div class="mgrid">${fSelect(m, i, "env", "Environment", HZ_ENVS.map(e => [e.id, e.name]))}${fSelect(m, i, "status", "Status", [["active", "Under way"], ["done", "Finished"]])}</div>

    <div class="msec"><h3>Where they are</h3>
      <div class="hz-zones" role="group" aria-label="Zone">${zones}</div>
      <p class="hint">${esc(env.zones[z][1])}</p>
      <div class="mgrid">${fInput(m, i, "day", "Day", { type: "number", min: 1 })}${fInput(m, i, "legsDone", "Legs walked", { type: "number", min: 0 })}${fInput(m, i, "legs", "Legs in the route", { type: "number", min: 1 })}</div>
      <div class="progress" aria-hidden="true"><span style="width:${Math.round(done / legs * 100)}%"></span></div>
      ${W ? `<div class="actions"><button type="button" class="btn small" data-do="hz-leg" ${idA} data-n="1">+1 leg</button><button type="button" class="btn small" data-do="hz-leg" ${idA} data-n="-1">−1 leg</button></div>` : ""}
    </div>

    <div class="msec"><h3>Supplies</h3><div class="hz-supplies">${dieBox("food", "Food")}${dieBox("life", env.life)}</div></div>

    <div class="msec"><h3>Day ${day}</h3>
      ${W ? `<div class="actions"><button type="button" class="btn" data-do="hz-weather" ${idA}>Roll ${esc(wl[1])} (d${HZ_WDIE[z]})</button><button type="button" class="btn" data-do="hz-hazard" ${idA} data-n="1">Roll a hazard (d${hzHazDie(env, z)})</button><button type="button" class="btn" data-do="hz-hazard" ${idA} data-n="2" title="Roll two hazards; the party picks one">Scout succeeded: roll two</button><button type="button" class="btn" data-do="hz-push" ${idA}>Push hard</button></div>` : ""}
      ${wOut}${hOut}
      <div class="hz-jobs" aria-label="Who does which job">${jobs}</div>
      <p class="hint"><b>${esc(env.job[0])}:</b> ${esc(env.job[1])}</p>
    </div>

    <div class="msec"><h3>Camp</h3>
      <p class="hint">${esc(env.campMain)}</p>
      <div class="actions"><span class="seg" role="group" aria-label="Camp quality">${Object.entries(HZ_CAMP).map(([q, l]) => `<button type="button" data-do="hz-camp" ${idA} data-v="${q}" aria-pressed="${(r.camp || "good") === q}">${l}</button>`).join("")}</span>
        <label class="chk">${fCheck(m, i, "fed", "Everyone ate")} Everyone ate</label>
        ${W ? `<button type="button" class="btn primary small" data-do="hz-resolve" ${idA}>Resolve camp</button><button type="button" class="btn small" data-do="hz-day" ${idA}>Next day →</button>` : ""}</div>
      <p class="hint">Good camp: ${esc(env.strain)} to 0 · partial: −1 · exposed: +1 · no food: +1 · then 4 or more gains 1 exhaustion · a good, fed camp removes 1 exhaustion.</p>
      <p class="hint"><b>Also:</b> ${esc(env.campExtra)}</p>
    </div>

    <div class="msec"><h3>Party <span class="hint">${party.length} character${party.length === 1 ? "" : "s"}</span></h3>
      <div class="hz-legend"><span><b>0–2 ${esc(env.low)}</b>: no effect yet.</span>${env.states.map((s, k) => `<span><b>${k + 3} ${esc(s[0])}</b>: ${esc(s[1])}</span>`).join("")}<span><b>Gear:</b> ${esc(env.gear)}</span></div>
      <div class="hz-party">${members || `<p class="hint">Nobody on this run yet.</p>`}</div>
      ${W ? `<div class="hz-add"><input type="text" id="hz-new-name" placeholder="Add a character" aria-label="New character's name"><button type="button" class="btn" data-do="hz-member-add" ${idA}>Add</button>${guildParty().length ? `<button type="button" class="btn ghost" data-do="hz-party-fill" ${idA}>Add the guild party</button>` : ""}</div>` : ""}
    </div>

    <div class="msec"><h3>Log</h3><ol class="hz-log">${log || `<li><span></span><div class="hint">Nothing yet.</div></li>`}</ol></div>
    ${fArea(m, i, "notes", "GM notes", { rows: fitRows(r.notes, 3), ph: "Route, landmarks, who's chasing them" })}
    <div class="md-foot"><span class="spacer"></span>${delBtn("hz", i, "Delete run", "hz-del")}</div>
  </section>`;
}

function hzEnvsView() {
  const env = hzEnv(S.hz.env), wl = hzWl(env);
  const chips = `<div class="hz-envs" role="group" aria-label="Environment">${HZ_ENVS.map(e => `<button type="button" class="chip" data-do="hz-env" data-env="${e.id}" aria-pressed="${e.id === env.id}">${esc(e.name)}</button>`).join("")}</div>`;
  const core = `<details class="hz-fold" open><summary>How every run works</summary><div class="hz-core">${HZ_CORE.map(([t, x]) => `<div><b>${esc(t)}</b>${esc(x)}</div>`).join("")}</div></details>`;
  const head = `<div class="hz-head"><h2>${esc(env.name)}</h2><p>${esc(env.blurb)}</p>
    <div class="hz-facts"><span>Strain: <b>${esc(env.strain)}</b></span><span>Lifeline: <b>${esc(env.life)}</b>, starts at d${env.lifeStart}</span><span>Food starts at d${env.foodStart}</span><span>Fourth job: <b>${esc(env.job[0])}</b></span></div>
    ${env.special ? `<ul class="hz-src">${env.special.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
    ${S.canWrite ? `<div><button type="button" class="btn primary" data-do="hz-new" data-env="${env.id}">Start a ${esc(env.name.toLowerCase())} run</button></div>` : ""}</div>`;
  const card = (t, body) => `<section class="hz-card"><h3>${t}</h3>${body}</section>`;
  const zones = card("Zones", `<div class="hz-tw"><table class="rt"><thead><tr><th>Zone</th><th class="num">DC</th><th>${esc(wl[0])}</th><th>Special</th></tr></thead><tbody>${env.zones.map(([n, x], k) => `<tr><td><b>${esc(n)}</b></td><td class="n">${HZ_DC[k]}</td><td class="n">d${HZ_WDIE[k]}</td><td>${esc(x)}</td></tr>`).join("")}</tbody></table></div>`);
  const strain = card(esc(env.strain), `<div class="hz-tw"><table class="rt"><tbody><tr><td class="r">0–2</td><td><b>${esc(env.low)}</b></td><td>No effect yet. Describe it.</td></tr>${env.states.map((s, k) => `<tr><td class="r">${k + 3}</td><td><b>${esc(s[0])}</b></td><td>${esc(s[1])}</td></tr>`).join("")}</tbody></table></div><p class="hint">${esc(env.gear)}</p>`);
  const weather = card(esc(wl[0]), `<div class="hz-tw"><table class="rt"><thead><tr><th>Roll</th><th>Result</th><th class="num">${esc(env.strain)}</th><th>Effect</th></tr></thead><tbody>${env.weather.map((w, k) => `<tr><td class="r">${HZ_WRANGE[k]}</td><td><b>${esc(w[0])}</b></td><td class="n">${w[1] ? "+" + w[1] : "—"}</td><td>${esc(w[2] || "No effect.")}</td></tr>`).join("")}</tbody></table></div><p class="hint">Roll the zone's die: d4, d6, d8 or d10.</p>`);
  const jobs = card("Jobs", `<ul><li><b>Guide</b> (Survival, Nature or navigator's tools vs zone DC): a success covers one leg. A failure means lost, no progress.</li><li><b>Scout</b> (Perception or Investigation): a success rolls two hazards and the party picks one.</li><li><b>Forager</b> (Survival or Nature, where the zone allows it): a success moves the Food die up one size.</li><li><b>${esc(env.job[0])}</b>: ${esc(env.job[1])}</li></ul><p class="hint">Pushing hard: everyone takes +1 ${esc(env.strain)} and makes a DC 10 CON save or gains 1 exhaustion; a Guide success covers two legs. A job nobody takes fails.</p>`);
  const hazards = card(`Hazards (d${hzHazDie(env, 0)})`, `<div class="hz-tw"><table class="rt"><tbody>${env.hazards.map((h, k) => `<tr><td class="r">${k + 1}</td><td><b>${esc(h[0])}</b>${h[2] ? " " + pill("mercy", "mercy") : ""}<br>${esc(h[1])}</td></tr>`).join("")}</tbody></table></div>${env.hazDie ? `<p class="hint">In ${esc(env.zones[3][0].toLowerCase())}, roll a d${env.hazDie[3]} instead.</p>` : ""}`);
  const camp = card("Camp, in this order", `<ol><li>${esc(env.campMain)} Both: a good camp (${esc(env.strain)} to 0). One: partial (−1). Neither: exposed (+1).</li><li>Eat: roll the Food die. No food: +1 ${esc(env.strain)}.</li><li>${esc(env.campExtra)}</li><li>Anyone at ${esc(env.strain)} 4 or more gains 1 exhaustion.</li><li>Only a good, fed camp lets a long rest remove exhaustion.</li></ol><p class="hint"><b>When the ${esc(env.life)} die runs out:</b> ${esc(env.lifeOut.replace(/^No [^:]+: /, ""))}</p><p class="hint"><b>When the Food die runs out:</b> +1 ${esc(env.strain)} at every camp, and no exhaustion recovery.</p>`);
  const lasting = card(`${esc(env.lasting.title)} (d6, at ${esc(env.strain)} 5)`, `<div class="hz-tw"><table class="rt"><tbody>${env.lasting.rows.map(([rg, n, x]) => `<tr><td class="r">${esc(rg)}</td><td><b>${esc(n)}</b></td><td>${esc(x)}</td></tr>`).join("")}</tbody></table></div><p class="hint">${esc(env.lasting.heal)}</p>`);
  const magic = card("Magic and class features", `<ul>${env.magic.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`);
  const sources = `<details class="hz-fold"><summary>Design notes and sources</summary><ul class="hz-src">${HZ_SOURCES.map(([t, u]) => `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>` : esc(t)}</li>`).join("")}</ul><p class="hint">Reddit blocks automated tools, so these come from other forums, blogs and supplements.</p></details>`;
  return `${chips}${core}${head}<div class="hz-grid">${zones}${strain}${weather}${jobs}${hazards}${camp}${lasting}${magic}</div>${sources}`;
}

/* ----- tab count: runs under way ----- */
const _hzTabCount = tabCount;
tabCount = function (id) { return id === "hazards" ? hzRuns().filter(x => x.status !== "done").length : _hzTabCount(id); };

/* ----- actions ----- */
Object.assign(ACTIONS, {
  "hz-view": d => { S.hz.view = d.v === "envs" ? "envs" : "runs"; hzKeepUi(); renderModule(); },
  "hz-env": d => { S.hz.env = hzEnv(d.env).id; S.hz.view = "envs"; hzKeepUi(); renderModule(); window.scrollTo?.({ top: 0 }); },
  "hz-new": d => {
    if (!S.canWrite) return;
    const env = hzEnv(d.env || S.hz.env), id = "hz_" + uid(), now = new Date().toISOString();
    const party = guildParty().map(p => ({ id: uid(), name: String(p.char || p.player || ""), strain: 0, exh: 0, gear: true, job: "", note: "" }));
    S.hz.view = "runs"; S.hz.env = env.id; hzKeepUi(); S.sel.hazards = id;
    putDoc("hazards", id, { name: `${env.name} crossing`, env: env.id, status: "active", zone: 0, day: 1, legs: 6, legsDone: 0, food: env.foodStart, life: env.lifeStart,
      party, camp: "good", fed: true, last: {}, notes: "", created: now, updated: now,
      log: [{ d: 1, t: `Run started in ${env.zones[0][0].toLowerCase()}. Food ${hzDieName(env.foodStart)}, ${env.life} ${hzDieName(env.lifeStart)}.` }] });
    focusField("hazards", id, "name");
  },
  "hz-del": d => { S.confirm = null; delDoc("hazards", d.id); S.sel.hazards = null; toast("Run deleted"); },
  "hz-zone": hzAct((r, env, d) => {
    const z = clamp(int(d.z), 0, 3); if (z === int(r.zone)) return;
    r.zone = z; hzLog(r, `Into ${env.zones[z][0].toLowerCase()}: DC ${HZ_DC[z]}, ${hzWl(env)[1]} on a d${HZ_WDIE[z]}.`); hzPut(r);
  }),
  "hz-leg": hzAct((r, env, d) => {
    const legs = Math.max(1, int(r.legs) || 1), before = clamp(int(r.legsDone), 0, legs);
    r.legsDone = clamp(before + int(d.n), 0, legs); if (r.legsDone === before) return;
    hzLog(r, r.legsDone === legs ? `Leg ${r.legsDone} of ${legs}: they made it across.` : `Leg ${r.legsDone} of ${legs}.`);
    if (r.legsDone === legs) toast("They made it across");
    hzPut(r);
  }),
  "hz-day": hzAct(r => { r.day = (int(r.day) || 1) + 1; r.last = {}; r.fed = true; hzLog(r, `Morning of day ${r.day}.`); hzPut(r); }),
  "hz-die": hzAct((r, env, d) => {
    const k = d.k === "food" ? "food" : "life", label = k === "food" ? "Food" : env.life, n = int(r[k]);
    if (d.op === "up" || d.op === "down") {
      const to = hzStep(n, d.op === "up" ? 1 : -1); if (to === n) return;
      r[k] = to; hzLog(r, `${label} die ${d.op === "up" ? "up" : "down"} to ${hzDieName(to)}.`); hzPut(r); return;
    }
    if (!n) { toast(`The ${label} die is empty`); return; }
    const a = hzRoll(n), b = d.op === "adv" ? hzRoll(n) : null, v = b == null ? a : Math.max(a, b);
    const to = v <= 2 ? hzStep(n, -1) : n;
    r[k] = to; r.last.dice = { ...(r.last.dice || {}), [k]: { a, b, v, from: n, to } };
    hzLog(r, `${label} d${n} rolled ${b != null ? `${a} and ${b}, kept ${v}` : v}: ${to !== n ? `drops to ${hzDieName(to)}` : "holds"}.${to === 0 ? " " + (k === "food" ? HZ_FOOD_OUT : env.lifeOut) : ""}`);
    if (to === 0) toast(`The ${label} die is empty`);
    hzPut(r);
  }),
  "hz-weather": hzAct((r, env) => {
    const z = clamp(int(r.zone), 0, 3), die = HZ_WDIE[z], roll = hzRoll(die), row = hzWRow(roll), w = env.weather[row];
    r.last.weather = { roll, die, row, applied: false };
    hzLog(r, `${hzWl(env)[0]} (d${die}) ${roll}: ${w[0]}${w[1] ? `, +${w[1]} ${env.strain}` : ""}.${w[2] ? " " + w[2] : ""}`);
    hzPut(r);
  }),
  "hz-apply": hzAct((r, env) => {
    const lw = r.last.weather; if (!lw || lw.applied) return;
    const w = env.weather[lw.row], out = [];
    for (const p of r.party) { const add = Math.max(0, w[1] - (p.gear ? 1 : 0)); if (add) hzSetStrain(env, p, int(p.strain) + add, out); }
    lw.applied = true;
    hzLog(r, `${w[0]}: +${w[1]} ${env.strain} each, 1 less with gear.${out.length ? " " + out.join(". ") + "." : ""}`);
    hzPut(r);
  }),
  "hz-hazard": hzAct((r, env, d) => {
    const z = clamp(int(r.zone), 0, 3), die = hzHazDie(env, z), n = int(d.n) === 2 ? 2 : 1;
    const rolls = Array.from({ length: n }, () => ({ roll: hzRoll(die), die }));
    r.last.hazards = rolls;
    hzLog(r, `${n === 2 ? "Scout's two hazards" : "Hazard"} (d${die}): ${rolls.map(h => `${h.roll} ${env.hazards[h.roll - 1][0]}`).join(" or ")}.`);
    hzPut(r);
  }),
  "hz-push": hzAct((r, env) => {
    const out = []; for (const p of r.party) hzSetStrain(env, p, int(p.strain) + 1, out);
    hzLog(r, `Pushing hard: +1 ${env.strain} each. Everyone makes a DC 10 CON save or gains 1 exhaustion. A Guide success covers two legs.${out.length ? " " + out.join(". ") + "." : ""}`);
    hzPut(r);
  }),
  "hz-camp": hzAct((r, env, d) => { if (!HZ_CAMP[d.v] || r.camp === d.v) return; r.camp = d.v; hzPut(r); }),
  "hz-resolve": hzAct((r, env) => {
    const q = HZ_CAMP[r.camp] ? r.camp : "good", fed = r.fed !== false, out = [];
    for (const p of r.party) {
      const s0 = int(p.strain);
      let s = q === "good" ? 0 : q === "partial" ? s0 - 1 : s0 + 1;
      if (!fed) s += 1;
      hzSetStrain(env, p, s, out);
      if (int(p.strain) >= 4) { out.push(`${hzWho(p)} gains 1 exhaustion (${env.strain} ${p.strain})`); hzExh(p, int(p.exh) + 1, out); }
      else if (q === "good" && fed && int(p.exh) > 0 && int(p.exh) < 6) { hzExh(p, int(p.exh) - 1, out); out.push(`${hzWho(p)} recovers 1 exhaustion`); }
    }
    hzLog(r, `Camp: ${HZ_CAMP[q].toLowerCase()}${fed ? "" : ", nobody ate"}. ${out.length ? out.join(". ") + "." : "No exhaustion changes."}`);
    hzPut(r);
  }),
  "hz-strain": hzAct((r, env, d) => {
    const p = r.party[int(d.n)]; if (!p) return;
    const v = int(d.v), out = []; hzSetStrain(env, p, int(p.strain) === v ? v - 1 : v, out);
    if (out.length) hzLog(r, out.join(". ") + ".");
    hzPut(r);
  }),
  "hz-exh": hzAct((r, env, d) => {
    const p = r.party[int(d.n)]; if (!p) return;
    const v = int(d.v), out = []; hzExh(p, int(p.exh) === v ? v - 1 : v, out);
    if (out.length) hzLog(r, out.join(". ") + ".");
    hzPut(r);
  }),
  "hz-member-add": hzAct(r => {
    const inp = document.getElementById("hz-new-name"), name = (inp?.value || "").trim();
    if (!name) { inp?.focus(); return; }
    r.party.push({ id: uid(), name, strain: 0, exh: 0, gear: true, job: "", note: "" });
    if (inp) inp.value = "";
    hzPut(r); setTimeout(() => document.getElementById("hz-new-name")?.focus(), 30);
  }),
  "hz-party-fill": hzAct(r => {
    const have = new Set(r.party.map(p => hzWho(p).toLowerCase()));
    const add = guildParty().map(p => String(p.char || p.player || "")).filter(nm => nm && !have.has(nm.toLowerCase()));
    if (!add.length) { toast("The guild party is already on this run"); return; }
    for (const name of add) r.party.push({ id: uid(), name, strain: 0, exh: 0, gear: true, job: "", note: "" });
    hzPut(r); toast(`Added ${add.length} character${add.length === 1 ? "" : "s"}`);
  }),
  "hz-member-del": hzAct((r, env, d) => {
    const n = int(d.n), p = r.party[n]; if (!p) return;
    r.party.splice(n, 1); hzPut(r); toast(`Removed ${hzWho(p)}`);
  }),
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target && e.target.id === "hz-new-name") { e.preventDefault(); document.querySelector('[data-do="hz-member-add"]')?.click(); }
});
} catch (err) { console.error("Hazard Runs tab failed to load", err); } }
