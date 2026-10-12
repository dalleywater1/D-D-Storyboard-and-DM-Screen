import json, sys
src = sys.argv[1]
L = lambda f: json.load(open(src + '/' + f))
def j(x): return x if isinstance(x, str) else "\n\n".join(x) if isinstance(x, list) else ""
def D(o): return j(o.get('description') or o.get('desc') or "")
mons = []
for m in L('5e-SRD-Monsters.json'):
    a0 = (m.get('armor_class') or [{}])[0]
    sp = ", ".join((k + " " if k != "walk" else "") + str(v) for k, v in (m.get('speed') or {}).items() if not isinstance(v, bool))
    saves, skills = [], []
    for p in m.get('proficiencies', []):
        n, v = p['proficiency']['name'], p['value']
        if n.startswith('Saving Throw: '): saves.append(f"{n[14:].title()} {v:+d}")
        elif n.startswith('Skill: '): skills.append(f"{n[7:]} {v:+d}")
    names = lambda lst: ", ".join(x if isinstance(x, str) else x.get('name', '') for x in lst)
    senses = ", ".join(k.replace('_', ' ').title() + " " + str(v) for k, v in (m.get('senses') or {}).items())
    def cast(a):
        sc = a.get('spellcasting')
        if not sc or not sc.get('spells'): return ""
        groups = {}
        for sp in sc['spells']:
            u = sp.get('usage') or {}
            key = "At will" if u.get('type') == 'at will' else (f"{u.get('times', 1)}/day each" if u.get('type') == 'per day' else (u.get('type') or 'Spells').capitalize())
            groups.setdefault(key, []).append(sp['name'])
        return "\n" + "\n".join(f"**{k}:** {', '.join(v)}" for k, v in groups.items())
    blk = lambda k: [[a['name'], D(a) + cast(a)] for a in m.get(k) or []]
    crv = m.get('challenge_rating', 0)
    cr = {0.125: "1/8", 0.25: "1/4", 0.5: "1/2"}.get(crv, str(int(crv)) if crv == int(crv) else str(crv))
    mons.append({"i": m['index'], "n": m['name'], "sz": m.get('size', ''), "t": m.get('type', ''), "al": m.get('alignment', ''),
        "ac": a0.get('value', ''), "hp": m.get('hit_points', 0), "hd": m.get('hit_points_roll') or m.get('hit_dice', ''),
        "sp": sp, "ab": [m.get(k, 10) for k in ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')],
        "sv": ", ".join(saves), "sk": ", ".join(skills), "vu": names(m.get('damage_vulnerabilities', [])), "re": names(m.get('damage_resistances', [])),
        "im": names(m.get('damage_immunities', [])), "ci": names(m.get('condition_immunities', [])), "se": senses, "la": m.get('languages', ''),
        "cr": cr, "xp": m.get('xp', 0), "pb": m.get('proficiency_bonus', 2), "tr": blk('special_abilities'), "a": blk('actions'), "b": blk('bonus_actions'),
        "r": blk('reactions'), "l": blk('legendary_actions'), "g": m.get('gear', '')})
spells = [{"n": s['name'], "lv": s.get('level', 0), "sc": (s.get('school') or {}).get('name', ''), "ct": s.get('casting_time', ''), "rg": s.get('range', ''),
    "co": ", ".join(s.get('components', [])) + (f" ({s['material']})" if s.get('material') else ""), "du": s.get('duration', ''), "cn": bool(s.get('concentration')),
    "ri": bool(s.get('ritual')), "d": D(s), "h": j(s.get('higher_level', [])), "cl": ", ".join(c['name'] for c in s.get('classes', []))} for s in L('5e-SRD-Spells.json')]
items = [{"n": it['name'], "ra": (it.get('rarity') or {}).get('name', ''), "ca": (it.get('equipment_category') or {}).get('name', ''), "at": bool(it.get('attunement')), "d": D(it)} for it in L('5e-SRD-Magic-Items.json')]
simple = lambda f, extra=None: [{"n": x['name'], **({"ty": x.get('type', '')} if extra else {}), "d": D(x)} for x in L(f)]
eq = []
for e in L('5e-SRD-Equipment.json'):
    bits = []
    c = e.get('cost')
    if c: bits.append(f"{c.get('quantity')} {c.get('unit')}")
    if e.get('weight') is not None: bits.append(f"{e['weight']} lb.")
    dmg = e.get('damage')
    if dmg: bits.append(f"{dmg.get('damage_dice', '')} {(dmg.get('damage_type') or {}).get('name', '')}".strip())
    acx = e.get('armor_class')
    if acx: bits.append(f"AC {acx.get('base')}" + (" + Dex" if acx.get('dex_bonus') else "") + (f" (max {acx['max_bonus']})" if acx.get('max_bonus') else ""))
    if e.get('str_minimum'): bits.append(f"Str {e['str_minimum']}")
    if e.get('stealth_disadvantage'): bits.append("Stealth disadvantage")
    pr = ", ".join(p['name'] for p in e.get('properties', []) or [])
    if pr: bits.append(pr)
    if e.get('mastery'): bits.append("Mastery: " + e['mastery'].get('name', ''))
    cats = e.get('equipment_categories') or []
    eq.append({"n": e['name'], "ca": cats[0].get('name', '') if cats else "", "s": " · ".join(bits), "d": D(e)})
data = {"monsters": mons, "spells": spells, "items": items, "conditions": simple('5e-SRD-Conditions.json'), "feats": simple('5e-SRD-Feats.json', True),
        "mastery": simple('5e-SRD-Weapon-Mastery-Properties.json'), "wprops": simple('5e-SRD-Weapon-Properties.json'), "poisons": simple('5e-SRD-Poisons.json', True), "equipment": eq}
s = json.dumps(data, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
open('/home/claude/srd/srd-data.js', 'w').write('const SRD = ' + s + ';\n')
empty = {k: sum(1 for x in v if not (x.get('d') or x.get('a') or x.get('s'))) for k, v in data.items()}
print({k: len(v) for k, v in data.items()}, len(s) // 1024, 'KB', 'empty:', empty)
