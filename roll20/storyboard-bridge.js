// Storyboard Bridge for Roll20 — v1.1 (NPC details and stat blocks)
// Moves cards between your campaign storyboard page and Roll20.
// Needs a Roll20 Pro subscription (Mod / API scripts).
//
// Install: Game Settings > Mod (API) Scripts > New Script > paste this > Save.
//
// Commands (GM only, typed in Roll20 chat):
//   !storyboard import   Reads the code pasted into the GM Notes of the
//                        "Storyboard Import" handout and creates/updates
//                        handouts (scenes, places, items, lore) and
//                        characters (NPCs). Running it again updates the
//                        same entries instead of making duplicates.
//   !storyboard export   Writes a code into the "Storyboard Export" handout
//                        with any text you changed in Roll20, ready to paste
//                        back into the storyboard page.
//   !storyboard help     Shows this list.
//
// New entries are hidden from players. Share them from the journal when you
// want players to see them; GM notes always stay GM-only.

on('ready', () => {
  'use strict';

  const IMPORT_NAME = 'Storyboard Import';
  const EXPORT_NAME = 'Storyboard Export';
  const KIND_LABEL = { scene: 'Scene', npc: 'NPC', location: 'Place', town: 'Town', item: 'Item', lore: 'Lore' };

  if (!state.StoryboardBridge) state.StoryboardBridge = { map: {}, meta: {}, acts: [], campaign: '' };
  const S = state.StoryboardBridge;

  // ---------- base64 + UTF-8 (the Mod sandbox has no atob/btoa) ----------
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const b64ToBytes = (s) => {
    s = s.replace(/[^A-Za-z0-9+/]/g, '');
    const out = [];
    let buf = 0, bits = 0;
    for (const ch of s) {
      buf = (buf << 6) | ALPHA.indexOf(ch);
      bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 0xff); }
    }
    return out;
  };
  const bytesToB64 = (bytes) => {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      out += ALPHA[(n >> 18) & 63] + ALPHA[(n >> 12) & 63] +
        (i + 1 < bytes.length ? ALPHA[(n >> 6) & 63] : '=') +
        (i + 2 < bytes.length ? ALPHA[n & 63] : '=');
    }
    return out;
  };
  const utf8Decode = (bytes) => {
    let s = '';
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i++];
      let cp;
      if (b < 0x80) cp = b;
      else if (b < 0xe0) cp = ((b & 31) << 6) | (bytes[i++] & 63);
      else if (b < 0xf0) cp = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
      else cp = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
      s += String.fromCodePoint(cp);
    }
    return s;
  };
  const utf8Encode = (str) => {
    const out = [];
    for (const ch of str) {
      const cp = ch.codePointAt(0);
      if (cp < 0x80) out.push(cp);
      else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
      else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    }
    return out;
  };

  // ---------- text helpers ----------
  const maybeUrlDecode = (s) => {
    if (s && /%3C|%20/i.test(s) && !/</.test(s)) { try { return decodeURIComponent(s); } catch (e) { /* keep */ } }
    return s || '';
  };
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const toHtml = (t) => String(t || '').trim() === '' ? '' :
    String(t).trim().split(/\n{2,}/).map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
  const fromHtml = (h) => maybeUrlDecode(h)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n').trim();
  const codeFrom = (h) => maybeUrlDecode(h).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').replace(/\s+/g, '');

  const whisper = (m) => sendChat('Storyboard', '/w gm ' + m, null, { noarchive: true });
  const readField = (obj, field) => new Promise((res) => obj.get(field, (v) => res(v || '')));

  const ensureHandout = (name, gmText) => {
    let h = findObjs({ type: 'handout', name })[0];
    if (!h) {
      h = createObj('handout', { name, inplayerjournals: '', archived: false });
      h.set('notes', '<p>Used by the Storyboard Bridge script. GM notes hold the transfer code.</p>');
      if (gmText !== undefined) h.set('gmnotes', gmText);
    }
    return h;
  };

  const actName = (id) => (S.acts.find((a) => a.id === id) || {}).name || '';
  const labelFor = (c) => {
    const act = actName(c.act);
    const kind = c.kind && c.kind !== 'scene' && c.kind !== 'npc' ? '[' + (KIND_LABEL[c.kind] || c.kind) + '] ' : '';
    return (act ? act + ' · ' : '') + kind + (c.title || 'Untitled');
  };

  // ---------- NPC details and stat block, written below the description ----------
  const MARK = '[Storyboard details]';
  const ABN = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const modOf = v => { const n = Math.floor(((parseInt(v, 10) || 10) - 10) / 2); return (n >= 0 ? '+' : '') + n; };
  const entries = t => String(t || '').split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^([^.:]{1,60})[.:]\s+(.*)$/);
    return m ? '<p><b><i>' + esc(m[1].replace(/\*/g, '')) + '.</i></b> ' + esc(m[2].replace(/\*/g, '')) + '</p>' : '<p>' + esc(l.replace(/\*/g, '')) + '</p>';
  }).join('');
  const npcExtra = c => {
    const info = [['Role', c.role], ['Attitude', c.attitude], ['Status', c.life], ['Voice', c.voice], ['Wants & fears', c.wants]]
      .filter(x => x[1]).map(x => '<p><b>' + x[0] + ':</b> ' + esc(x[1]) + '</p>').join('');
    const sb = c.sb;
    let block = '';
    if (sb) {
      const line = (k, v) => v ? '<b>' + k + '</b> ' + esc(v) + '<br>' : '';
      block = '<h3>' + esc(c.title || 'NPC') + '</h3><p><i>' + esc([sb.size, sb.type].filter(Boolean).join(' ')) + (sb.al ? ', ' + esc(sb.al) : '') + '</i></p>' +
        '<p>' + line('AC', String(sb.ac || '')) + line('HP', String(sb.hp || '') + (sb.hd ? ' (' + sb.hd + ')' : '')) + line('Speed', sb.sp) + '</p>' +
        '<table><tr>' + ABN.map(a => '<th>' + a + '</th>').join('') + '</tr><tr>' +
        ABN.map((a, k) => '<td>' + ((sb.ab || [])[k] || 10) + ' (' + modOf((sb.ab || [])[k]) + ')</td>').join('') + '</tr></table>' +
        '<p>' + line('Saving Throws', sb.sv) + line('Skills', sb.sk) + line('Resistances', sb.re) + line('Immunities', [sb.im, sb.ci].filter(Boolean).join('; ')) +
        line('Gear', sb.g) + line('Senses', sb.se) + line('Languages', sb.la) + line('CR', String(sb.cr || '')) + '</p>' +
        [['tr', 'Traits'], ['a', 'Actions'], ['b', 'Bonus Actions'], ['r', 'Reactions'], ['l', 'Legendary Actions']]
          .filter(x => String(sb[x[0]] || '').trim()).map(x => '<h4>' + x[1] + '</h4>' + entries(sb[x[0]])).join('');
    }
    if (!info && !block) return '';
    return '<hr><p><b>' + MARK + '</b></p>' + info + block;
  };

  // ---------- import ----------
  const importCards = (data) => {
    S.acts = Array.isArray(data.acts) ? data.acts : [];
    S.campaign = data.campaign || S.campaign;
    const queue = (data.cards || []).slice();
    let created = 0, updated = 0;
    const step = () => {
      if (!queue.length) {
        whisper('Storyboard import done: ' + created + ' new, ' + updated + ' updated.');
        return;
      }
      const c = queue.shift();
      const isNpc = c.kind === 'npc';
      const type = isNpc ? 'character' : 'handout';
      let obj = S.map[c.id] ? getObj(S.map[c.id].type, S.map[c.id].id) : null;
      if (obj && S.map[c.id].type !== type) { obj = null; }
      if (!obj) {
        obj = createObj(type, { name: labelFor(c), inplayerjournals: '', archived: c.status === 'cut' });
        created++;
      } else {
        obj.set({ name: labelFor(c), archived: c.status === 'cut' });
        updated++;
      }
      const body = toHtml(c.body);
      const tags = (c.tags || []).length ? '<p><em>Tags: ' + esc(c.tags.join(', ')) + '</em></p>' : '';
      if (isNpc) obj.set({ bio: body + tags + npcExtra(c), gmnotes: toHtml(c.gm) });
      else obj.set({ notes: body + tags, gmnotes: toHtml(c.gm) });
      S.map[c.id] = { type, id: obj.id };
      S.meta[c.id] = { kind: c.kind, title: c.title, act: c.act, status: c.status, tags: c.tags || [], order: c.order };
      setTimeout(step, 0);
    };
    step();
  };

  const runImport = () => {
    const h = ensureHandout(IMPORT_NAME, '');
    h.get('gmnotes', (g) => {
      const code = codeFrom(g);
      if (!code) {
        whisper('Paste the Roll20 code from your storyboard into the GM Notes of the "' + IMPORT_NAME + '" handout, then run !storyboard import again.');
        return;
      }
      let data;
      try { data = JSON.parse(utf8Decode(b64ToBytes(code))); } catch (e) {
        whisper('That code could not be read. Copy it again from the storyboard and replace everything in the GM Notes.');
        return;
      }
      if (!data || !Array.isArray(data.cards)) { whisper('That code has no cards in it.'); return; }
      importCards(data);
    });
  };

  // ---------- export ----------
  const runExport = async () => {
    const ids = Object.keys(S.map);
    if (!ids.length) { whisper('Nothing to export yet. Run !storyboard import first.'); return; }
    const cards = [];
    for (const cid of ids) {
      const ref = S.map[cid];
      const obj = getObj(ref.type, ref.id);
      if (!obj) continue;
      const m = S.meta[cid] || {};
      const body = fromHtml(await readField(obj, ref.type === 'character' ? 'bio' : 'notes')).split(MARK)[0].replace(/\n*-*\s*$/, '').replace(/\n*Tags:[^\n]*$/, '').trim();
      const gm = fromHtml(await readField(obj, 'gmnotes'));
      let title = obj.get('name');
      const act = actName(m.act);
      if (act && title.indexOf(act + ' · ') === 0) title = title.slice(act.length + 3);
      title = title.replace(/^\[[^\]]+\]\s*/, '');
      cards.push({ id: cid, kind: m.kind, title, body, gm, act: m.act || '', status: obj.get('archived') ? 'cut' : (m.status === 'cut' ? 'planned' : m.status), tags: m.tags || [], order: m.order });
    }
    const json = JSON.stringify({ v: 1, source: 'roll20', campaign: S.campaign, acts: S.acts, cards });
    const code = bytesToB64(utf8Encode(json));
    const h = ensureHandout(EXPORT_NAME);
    h.set('gmnotes', '<p>' + code + '</p>');
    whisper('Export ready: ' + cards.length + ' cards. Open the "' + EXPORT_NAME + '" handout, copy everything in its GM Notes, and paste it into the storyboard under Roll20 > Bring changes back.');
  };

  on('chat:message', (msg) => {
    if (msg.type !== 'api' || !/^!storyboard\b/i.test(msg.content)) return;
    if (!playerIsGM(msg.playerid)) return;
    const cmd = (msg.content.split(/\s+/)[1] || 'help').toLowerCase();
    if (cmd === 'import') runImport();
    else if (cmd === 'export') runExport();
    else whisper('Commands: !storyboard import · !storyboard export');
  });

  ensureHandout(IMPORT_NAME, '');
  log('Storyboard Bridge ready.');
});
