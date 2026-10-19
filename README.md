# Campaign Storyboard

A campaign planner for D&D 5e (2024 rules) in a single web page. Open it in any browser, online or offline. No account, no server.

**Use it:** https://dalleywater1.github.io/D-D-Storyboard-and-DM-Screen/
(or download `index.html` and double-click it)

## What's in it

- **Storyboard**: acts, scene/NPC/place/town/item/lore cards on a free-form table you can drag and resize, pictures, colours, sticky notes. Link cards with + Link or by dragging a card's link dot, and use Show links to see only what a card connects to. Archive cards you're done with and bring them back any time. Put cards in **groups** (say, all your NPCs in one pane you open when you need them), and select several cards at once with Shift-click or by dragging a box to move, group, re-act or archive them together.
- **Sessions**: strong start, the cards you plan to use, secrets & clues, prep notes, recap.
- **Meta Plot**: premise, the big secret, and storyline threads with stages and progress.
- **Timeline**: your world's history as events and eras, each event with what people believe and (GM only) what really happened, a switch to hide it from the players' view, linked storyboard cards, an overview strip with a Now marker, and a players' view for screen sharing.
- **NPCs** and **Towns**: role, town, attitude, voice, secrets; who lives where. NPCs get a portrait, an editable stat block (start from any Bestiary creature) and weapons with attacks worked out for you and Attack/Damage roll buttons, and can be added to an encounter or dropped on the DM Screen.
- **Combats**: encounter builder with the 2024 XP budgets, an *At a glance* bar on the right with the plan, expandable party cards (class, AC, HP, PP and your notes on their abilities) and a card per monster type (stats, traits, actions, reactions, every copy's HP and conditions, the current turn highlighted), an initiative tracker with HP and conditions, a dice roller, the active monster's actions, bonus actions and reactions shown under it on its turn, and a ▸ on every monster to open its full stat block in place, where attack bonuses, damage dice and saves roll with a click.
- **Bestiary**: 341 SRD creatures with full stat blocks, plus your own **homebrew** creatures (start blank or from a copy of any SRD creature). Add them to an encounter or drop them on the DM Screen.
- **Reference**: spells, magic items, conditions, equipment, feats, weapon mastery and more.
- **DM Screen**: rules panels plus your own (Encounter, Monster, Day counter for expiring potions, Dice roller, Notes). Drag panels anywhere, resize them, colour them. The **Guild Tracker** is made of sections you add, remove, rename and reorder: the party, Experience (XP each character has, a log of awards, split encounter XP, next level and a level-up flag), the current adventure, checklists, tracks, counters and notes. **Quick Lookup** searches the SRD plus your own homebrew creatures and Item cards.
- **Several campaigns**, each with its own everything. Switch from the menu at the top.
- **Roll20 bridge**: a Mod script (`roll20/storyboard-bridge.js`, needs Roll20 Pro) that turns cards into handouts and characters. NPC stat blocks go into the character's Bio. Scripts can't upload pictures, so download a portrait from the NPC page and drag it onto the character's avatar.

## Where your data lives

Everything you make is saved in **your browser** on the computer you use it on. Nothing is uploaded anywhere.

- To move or share a campaign: **Backup → Download this campaign**, then **Load a file** in the other copy. You choose whether it's added as a new campaign or updates one with the same name.
- To move everything at once: **Backup → Download everything**.
- Clearing your browser's site data deletes what's saved, so download a backup now and then.
- **Magic Items** tab: the 262 SRD 5.2 magic items built in, plus items you make or import from other books, each tagged with its book and page. Filter by book, rarity, type and attunement. Like the Bestiary, any item can be added to an encounter's loot, dropped on the DM Screen, or made into a storyboard card. Import a book's items (JSON or CSV) from the tab, or a whole homebrew file from Backup → Import homebrew; they're stored in your campaign, not in this repo. Keep text from published books in your private saves.
- **Import homebrew** (Backup): one JSON file can carry magic items, Bestiary creatures with full stat blocks, and storyboard cards (NPCs, places, lore). Importing the same file again updates what it added; cards you made yourself are never overwritten. The format is described at the top of `src/homebrew-import.js`.
- **Save to GitHub**: in Backup, connect a *private* GitHub repo with a fine-grained token (Contents: Read and write on that repo only). Then Save to GitHub / Load from GitHub moves everything between computers, and each save is kept in the repo's history. The site warns you before replacing a newer save made on another computer. The repo name and token stay in the browser you enter them in.

## Building from source

`index.html` is built from the files in `src/`:

```
python3 src/build.py
```

## Credits

This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

SRD data was converted from the [5e-bits/5e-database](https://github.com/5e-bits/5e-database) project (MIT licence).

