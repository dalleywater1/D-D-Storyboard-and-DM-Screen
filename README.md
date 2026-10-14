# Campaign Storyboard

A campaign planner for D&D 5e (2024 rules) in a single web page. Open it in any browser, online or offline. No account, no server.

**Use it:** https://dalleywater1.github.io/D-D-Storyboard-and-DM-Screen/
(or download `index.html` and double-click it)

## What's in it

- **Storyboard**: acts, scene/NPC/place/town/item/lore cards on a free-form table you can drag and resize, pictures, colours, sticky notes. Link cards with + Link or by dragging a card's link dot, and use Show links to see only what a card connects to. Archive cards you're done with and bring them back any time. Put cards in **groups** (say, all your NPCs in one pane you open when you need them), and select several cards at once with Shift-click or by dragging a box to move, group, re-act or archive them together.
- **Sessions**: strong start, the cards you plan to use, secrets & clues, prep notes, recap.
- **Meta Plot**: premise, the big secret, and storyline threads with stages and progress.
- **NPCs** and **Towns**: role, town, attitude, voice, secrets; who lives where. NPCs get a portrait, an editable stat block (start from any Bestiary creature) and weapons with attacks worked out for you and Attack/Damage roll buttons, and can be added to an encounter or dropped on the DM Screen.
- **Combats**: encounter builder with the 2024 XP budgets, an initiative tracker with HP and conditions, a dice roller, the active monster's actions, bonus actions and reactions shown under it on its turn, and a ▸ on every monster to open its full stat block in place, where attack bonuses, damage dice and saves roll with a click.
- **Bestiary**: 341 SRD creatures with full stat blocks, plus your own **homebrew** creatures (start blank or from a copy of any SRD creature). Add them to an encounter or drop them on the DM Screen.
- **Reference**: spells, magic items, conditions, equipment, feats, weapon mastery and more.
- **DM Screen**: rules panels plus your own (Encounter, Monster, Day counter for expiring potions, Dice roller, Notes). Drag panels anywhere, resize them, colour them.
- **Several campaigns**, each with its own everything. Switch from the menu at the top.
- **Roll20 bridge**: a Mod script (`roll20/storyboard-bridge.js`, needs Roll20 Pro) that turns cards into handouts and characters. NPC stat blocks go into the character's Bio. Scripts can't upload pictures, so download a portrait from the NPC page and drag it onto the character's avatar.

## Where your data lives

Everything you make is saved in **your browser** on the computer you use it on. Nothing is uploaded anywhere.

- To move or share a campaign: **Backup → Download this campaign**, then **Load a file** in the other copy. You choose whether it's added as a new campaign or updates one with the same name.
- To move everything at once: **Backup → Download everything**.
- Clearing your browser's site data deletes what's saved, so download a backup now and then.
- **Save to GitHub**: in Backup, connect a *private* GitHub repo with a fine-grained token (Contents: Read and write on that repo only). Then Save to GitHub / Load from GitHub moves everything between computers, and each save is kept in the repo's history. The site warns you before replacing a newer save made on another computer. The repo name and token stay in the browser you enter them in.

## Fallen Lands campaign content

The standalone page includes Alessa's campaign-discussion CR 8 homebrew stat
block, tavern role, and GM-only Voice/intelligence notes, plus **The Order of
the Seven Stars** as a main Meta Plot thread. The update adds missing entries
once to campaigns named Fallen Lands or The Order of the Seven Stars (with
or without a leading "The"). Otherwise it creates a separate Fallen Lands
campaign. Existing entries, later edits and intentional deletions are retained.
Select Fallen Lands from the campaign menu if another campaign is open.

The supplied NPC handover also adds Brenna Stonepath (usable, approximate CR 5),
Elias Vane / Thaumeryx Avarr (working CR 9, 1/8 Panoply), Alexander Elethar
(stat block required), and the seven surviving Panoply holders (no invented
stats). Elias's unresolved spell uses and Cloud Memory mechanics are labelled;
he has no Legendary Actions or Legendary Resistance. Alexander's narrowly
scoped Protector Bloodline is recorded in his GM notes.

This second update runs once even in browsers that already received Alessa.
It retains existing NPC IDs, authored descriptions and stat blocks, fills a
missing block when supplied, and appends handover context to GM notes. It also
follows an already seeded campaign if it has been renamed.

The earlier populated Fallen Lands HTML/backup remains unavailable. Sessions,
the wider metaplot and endgame branches are not reconstructed. Existing browser
data remains in place; load the earlier backup through the existing Backup
workflow to carry that material forward.

The content update is saved atomically before the board opens; failed writes
leave existing data intact and retry next opening. No changes were made to the
Roll20 bridge, backup format, encounter tools or DM Screen.

## Hushed (Fallen Lands)

The Bestiary of The Order of the Seven Stars (or the seeded Fallen Lands campaign, in a browser without it) gains seven homebrew **Hushed**: Drone (CR 1/2), Staccato (CR 1), Presto (CR 1), Bass (CR 2, enlarging bruiser with Resonant Expansion), Discord (CR 2, psychic mage; replaced the Dissonance), Crescendo (CR 3) and Conductor (CR 4), all with Psychic Death Pulse (CR in d8s), each with the shared traits The Night Measure, Empty Mind, Mission Focus and No Self-Preservation, their combat role and the shared Hushed lore. Combats gains the **Stormhollow House Composition** (1 Conductor, 1 Crescendo, 2 Bass, 2 Staccato, 1 Discord) with the mission notes; at the table the first Hushed attack happened at the house provided to the PCs, not The Broken Lantern, and the encounter, Session 1, the scene card and GM notes record that. Runs once per campaign; later edits and deletions are kept, and an older homebrew creature with the same name is replaced in place.

## Session 1: The Red Cloaks

The full plan for Session 1 (morning in Stormhollow, quick NPC responses, the rooms and diaries, the watch bell, the tavern assault, aftermath, the choice and the chase into the mountains, plus the optional Brenna introduction) is added to Session 1 of The Order of the Seven Stars, dated 13 October 2026. An existing Session 1 keeps its title and text; the opener, clues and plan are added below what's there, and the Stormhollow NPC and town cards are linked. Runs once.

## Building from source

The October 12 network update adds the Three Lights, seven proposed civilian
Voice identities, both Shadows, and the Concordance cipher as Meta Plot threads.
Alessa is now the Second Light; her homebrew mechanics are retained.
Darius Horn is distinct from General Darius Kelm. New Voice covers are explicitly
labelled custom, pending canon approval.

The subsequent Stormhollow handover links nine NPCs to a real Stormhollow town
record: the Three Lights, Bill, Ted, Charlie, Elaya von Forness, Father Thomas
and Hesta Varn. Full supplied backgrounds, item concepts and the consent theme
are in GM notes. No family names or unfinished combat statistics were invented.
Hesta has the supplied working mechanics; Darius, Elaya and Thomas retain
unfinished combat concepts. Alessa's ability labels now say Light instead of
Voice, without changing their effects. Morgan's full Adult Green Dragon block
is checked against SRD 5.2.1 p.294, including recharge, initiative and legendary
uses, and is collapsed behind a GM reveal control by default. Humanoid-guise
mechanics remain unspecified. Earlier replaced blocks are retained in the GM
document's priorStatBlocks array and as GM-note text for the existing backup format.
This update runs once per campaign and preserves IDs, pictures, links and prior
notes, including later edits/deletions after the update has run.

Validation: all four content migration suites and built-script syntax checks
pass. Local Edge checks confirm nine town residents, working town filtering,
Morgan's collapsed/revealed block, Hesta's mechanics, unfinished Thomas, and
persistence after reload, with no page errors. Fresh campaigns have 28 NPCs,
one town and three Meta Plot threads.
Live Roll20 integration was not exercised; its code is unchanged.

`index.html` is built from the files in `src/`:

```
python3 src/build.py
```

## Credits

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

SRD data was converted from the [5e-bits/5e-database](https://github.com/5e-bits/5e-database) project (MIT licence).

Morgan's corrected statistics include material from the System Reference
Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at
https://www.dndbeyond.com/srd, licensed under the Creative Commons Attribution
4.0 International License, https://creativecommons.org/licenses/by/4.0/legalcode.
The block's formatting is adapted to this site's NPC fields.
