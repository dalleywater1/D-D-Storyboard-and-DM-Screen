# Campaign Storyboard

A campaign planner for D&D 5e (2024 rules) in a single web page. Open it in any browser, online or offline. No account, no server.

**Use it:** https://dalleywater1.github.io/D-D-Storyboard-and-DM-Screen/
(or download `index.html` and double-click it)

## What's in it

- **Storyboard**: acts, scene/NPC/place/town/item/lore cards on a free-form table you can drag and resize, pictures, colours, sticky notes. Link cards with + Link or by dragging a card's link dot, and use Show links to see only what a card connects to. Archive cards you're done with and bring them back any time.
- **Sessions**: strong start, the cards you plan to use, secrets & clues, prep notes, recap.
- **Meta Plot**: premise, the big secret, and storyline threads with stages and progress.
- **NPCs** and **Towns**: role, town, attitude, voice, secrets; who lives where. NPCs get a portrait, an editable stat block (start from any Bestiary creature) and weapons with attacks worked out for you and Attack/Damage roll buttons, and can be added to an encounter or dropped on the DM Screen.
- **Combats**: encounter builder with the 2024 XP budgets, and an initiative tracker with HP and conditions.
- **Bestiary**: 341 creatures with full stat blocks. Add them to an encounter or drop them on the DM Screen.
- **Reference**: spells, magic items, conditions, equipment, feats, weapon mastery and more.
- **DM Screen**: rules panels plus your own (Encounter, Monster, Day counter for expiring potions, Dice roller, Notes). Drag panels anywhere, resize them, colour them.
- **Several campaigns**, each with its own everything. Switch from the menu at the top.
- **Roll20 bridge**: a Mod script (`roll20/storyboard-bridge.js`, needs Roll20 Pro) that turns cards into handouts and characters. NPC stat blocks go into the character's Bio. Scripts can't upload pictures, so download a portrait from the NPC page and drag it onto the character's avatar.

## Where your data lives

Everything you make is saved in **your browser** on the computer you use it on. Nothing is uploaded anywhere.

- To move or share a campaign: **Backup → Download this campaign**, then **Load a file** in the other copy. You choose whether it's added as a new campaign or updates one with the same name.
- To move everything at once: **Backup → Download everything**.
- Clearing your browser's site data deletes what's saved, so download a backup now and then.

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

## Building from source

The October 12 network update adds the Three Lights, seven proposed civilian
Voice identities, both Shadows, and the Concordance cipher as Meta Plot threads.
Alessa is now the Second Light; her old homebrew ability names are retained.
Darius Horn is distinct from General Darius Kelm. New Voice covers are explicitly
labelled custom, pending canon approval. Morgan uses the bundled Adult Green
Dragon block unchanged; its missing recharge and legendary-use limits are
flagged in his GM notes, alongside the custom humanoid-guise lore. This is not
claimed to be a verified complete 2024 stat block. The migration preserves prior
notes, IDs, images, links and existing stat blocks and runs once per campaign.

Validation: all three content migration suites and built-script syntax checks
pass. A local Edge browser smoke test opens the seeded Fallen Lands campaign
with all 22 NPC cards and three Meta Plot threads, with no page errors.
Live Roll20 integration was not exercised; its code is unchanged.

`index.html` is built from the files in `src/`:

```
python3 src/build.py
```

## Credits

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

SRD data was converted from the [5e-bits/5e-database](https://github.com/5e-bits/5e-database) project (MIT licence).
