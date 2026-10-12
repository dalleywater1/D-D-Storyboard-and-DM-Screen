/* ---------- moving everything between copies ----------
   "Download everything" writes every campaign (cards, GM notes, sticky notes,
   tab data and pictures) into one file. Restoring it creates or updates the
   same campaigns, matching by id, so restoring twice never duplicates. */
function safeId(s) { return String(s ?? "").replace(/[^\w.~:@+-]/g, "_").slice(0, 120) || uid(); }
function dataUrlToBlob(u) {
  const [head, b64] = u.split(",");
  const bin = atob(b64);
  return new Blob([Uint8Array.from(bin, ch => ch.charCodeAt(0))], { type: head.slice(5).split(";")[0] });
}
async function readColl(path) { const snap = await S.db.collection(path).get(); return snap.docs.map(d => ({ ...structuredClone(d.data()), id: d.id })); }
async function readDoc(path) { const s = await S.db.doc(path).get(); return s.exists ? structuredClone(s.data()) : null; }
async function exportCampaigns(boards, progress) {
  flushAll(); await flushNotes();
  const out = { v: 2, source: "everything", kind: boards.length === 1 ? "campaign" : "all", exported: new Date().toISOString(), campaigns: [] };
  const images = new Map(); let missing = 0;
  for (const b of boards) {
    progress?.(`Reading “${b.name}”…`);
    const p = P(b.id);
    const meta = (await readDoc(p.meta)) || { name: b.name, acts: [] };
    const cards = await readColl(p.cards);
    const gm = S.canGM ? await readColl(p.gm) : [];
    const notes = S.canGM ? await readColl(p.notes) : [];
    const modules = {};
    if (S.canGM) for (const coll of MOD_COLLS) modules[coll] = await readColl(MP(coll, b.id));
    for (const c of cards) {
      if (!c.imageId) continue;
      if (!images.has(c.imageId)) images.set(c.imageId, await imageToDataUrl(c.imageId));
      if (images.get(c.imageId)) c.image = images.get(c.imageId); else missing++;
    }
    out.campaigns.push({ id: b.id, name: meta.name || b.name, created: meta.created || "", acts: Array.isArray(meta.acts) ? meta.acts : [],
      cards, gm: gm.map(g => ({ id: g.id, text: g.text || "" })), notes, modules });
  }
  return { data: out, missing };
}
const exportAll = progress => exportCampaigns(allBoards(), progress);
/* Write one campaign from a file into campaign `b` (an existing id to update it, or a new id). */
async function restoreCampaign(camp, b, msgEl, uploaded) {
  const p = P(b);
  msgEl.textContent = `Loading “${camp.name || "campaign"}”…`;
  const existing = await readDoc(p.meta);
  const acts = (Array.isArray(camp.acts) ? camp.acts : []).filter(a => a && a.id).map(a => ({ id: safeId(a.id), name: String(a.name || "Act") }));
  const have = new Set(acts.map(a => a.id));
  for (const a of existing?.acts || []) if (!have.has(a.id)) acts.push(a);
  const localMainUsed = b === "main" && existing && (await readColl(p.cards)).length > 0;
  const meta = { name: localMainUsed ? (existing.name || camp.name) : (camp.name || "Campaign"), acts };
  if (b !== "main") meta.created = existing?.created || new Date().toISOString();
  await W(S.db.doc(p.meta).set(meta));
  let n = 0;
  for (const raw of camp.cards || []) {
    if (!raw || !raw.id) continue;
    const c = { ...raw, id: safeId(raw.id) }; delete c.image; delete c.gm;
    if (typeof raw.image === "string" && raw.image.startsWith("data:image/") && S.assets) {
      if (!uploaded.has(raw.image)) { try { uploaded.set(raw.image, (await S.assets.upload(dataUrlToBlob(raw.image))).id); } catch { uploaded.set(raw.image, ""); } }
      c.imageId = uploaded.get(raw.image);
    } else if (raw.image === undefined && c.imageId && !blobUrl(c.imageId)) c.imageId = "";
    await W(S.db.doc(p.cards + "/" + c.id).set(c)); n++;
    if (n % 10 === 0) msgEl.textContent = `Loading… ${n} cards`;
  }
  if (S.canGM) {
    for (const g of camp.gm || []) if (g && g.id) await W(S.db.doc(p.gm + "/" + safeId(g.id)).set({ text: String(g.text || "") }));
    for (const nt of camp.notes || []) if (nt && nt.id) await W(S.db.doc(p.notes + "/" + safeId(nt.id)).set({ ...nt, id: safeId(nt.id) }));
    for (const coll of MOD_COLLS) for (const d of camp.modules?.[coll] || []) if (d && d.id) await W(S.db.doc(MP(coll, b) + "/" + safeId(d.id)).set({ ...d, id: safeId(d.id) }));
  }
  if (b === "main") S.mainName = meta.name;
  else if (!S.boardList.some(x => x.id === b)) S.boardList = [...S.boardList, { id: b, name: meta.name, created: meta.created }];
  return n;
}
async function restoreAll(data, msgEl) {
  if (!S.db) throw new Error("no store");
  if (!S.canWrite) { msgEl.innerHTML = `<span class="err">You can't change this storyboard.</span>`; return; }
  flushAll(); await flushNotes();
  const uploaded = new Map(); let cardsN = 0, campN = 0;
  for (const camp of data.campaigns || []) {
    if (!camp || !camp.id) continue;
    cardsN += await restoreCampaign(camp, camp.id === "main" ? "main" : safeId(camp.id), msgEl, uploaded); campN++;
  }
  attachBoard(S.board); renderBoards();
  msgEl.innerHTML = `<span class="ok">Loaded ${campN} campaign${campN === 1 ? "" : "s"} with ${cardsN} card${cardsN === 1 ? "" : "s"}. Switch between them with the campaign menu at the top.</span>`;
}
function parseBackupText(text) {
  const t = text.trim();
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf("{"), z = t.lastIndexOf("}");
  if (a >= 0 && z > a) return JSON.parse(t.slice(a, z + 1));
  throw new Error("not a backup");
}
/* Older single-campaign backups become the same shape as campaign files. */
function campaignsIn(data) {
  if (data && data.source === "everything" && Array.isArray(data.campaigns)) return data.campaigns.filter(c => c && c.id);
  if (data && Array.isArray(data.cards)) return [{
    id: "file-" + uid(), name: data.campaign || "Imported campaign", acts: data.acts || [],
    cards: data.cards.map(c => { const x = { ...c }; delete x.gm; return x; }),
    gm: data.cards.filter(c => typeof c.gm === "string" && c.gm).map(c => ({ id: c.id, text: c.gm })),
    notes: data.notes || [], modules: data.modules || {}, legacy: true,
  }];
  return null;
}
function localCampaign(id) { return id === "main" ? { id: "main", name: S.mainName || "My Campaign" } : S.boardList.find(b => b.id === id); }
function offerImport(camps, msgEl) {
  S.pendingImport = { camps, msgEl };
  const rows = camps.map((c, n) => {
    const local0 = !c.legacy && localCampaign(c.id === "main" ? "main" : safeId(c.id));
    const local = local0 && (local0.id === S.board ? S.meta.name : local0.name) === c.name ? local0 : null;
    const pics = (c.cards || []).filter(x => x.image).length, tabs = MOD_COLLS.reduce((s, k) => s + (c.modules?.[k]?.length || 0), 0);
    return `<div class="imp-row"><div><b>${esc(c.name || "Campaign")}</b><br><span class="hint">${(c.cards || []).length} cards${pics ? ` · ${pics} pictures` : ""}${(c.notes || []).length ? ` · ${c.notes.length} notes` : ""}${tabs ? ` · ${tabs} tab entries` : ""}</span></div>
      <div class="actions"><button type="button" class="btn primary small" data-do="imp-new" data-n="${n}">Add as new campaign</button>${local ? `<button type="button" class="btn small" data-do="imp-update" data-n="${n}">Update “${esc(local.name)}”</button>` : ""}</div></div>`;
  }).join("");
  msgEl.innerHTML = `<div class="imp">${rows}${camps.length > 1 ? `<div class="actions"><button type="button" class="btn" data-do="imp-all">Load all ${camps.length}, updating any that are already here</button></div>` : ""}</div>`;
}
async function handleCampaignFile(file, msgEl) {
  let data;
  try { data = parseBackupText(await file.text()); }
  catch { msgEl.innerHTML = `<span class="err">That file isn't a storyboard campaign or backup. (The Roll20 script holds no campaign data.)</span>`; return; }
  const camps = campaignsIn(data);
  if (!camps || !camps.length) { msgEl.innerHTML = `<span class="err">That file has no campaigns in it.</span>`; return; }
  if (!S.db) { msgEl.innerHTML = `<span class="err">Saving isn't available here, so a campaign can't be loaded.</span>`; return; }
  offerImport(camps, msgEl);
}
Object.assign(ACTIONS, {
  "imp-new": async d => {
    const pi = S.pendingImport; if (!pi) return;
    const camp = pi.camps[Number(d.n)], id = uid();
    try {
      const n = await restoreCampaign({ ...camp, name: allBoards().some(b => b.name === camp.name) ? `${camp.name} (loaded)` : camp.name }, id, pi.msgEl, new Map());
      pi.msgEl.innerHTML = `<span class="ok">Added “${esc(camp.name)}” with ${n} card${n === 1 ? "" : "s"}. It's open now.</span>`;
      toast(`Added “${camp.name}” as a new campaign`);
      await switchBoard(id); renderBoards();
    } catch (e) { handleWriteError(e); }
  },
  "imp-update": async d => {
    const pi = S.pendingImport; if (!pi) return;
    const camp = pi.camps[Number(d.n)], id = camp.id === "main" ? "main" : safeId(camp.id);
    try {
      const n = await restoreCampaign(camp, id, pi.msgEl, new Map());
      pi.msgEl.innerHTML = `<span class="ok">Updated “${esc(camp.name)}” (${n} card${n === 1 ? "" : "s"}).</span>`;
      if (S.board === id) attachBoard(id); else await switchBoard(id);
      renderBoards();
    } catch (e) { handleWriteError(e); }
  },
  "imp-all": async () => { const pi = S.pendingImport; if (!pi) return; try { await restoreAll({ campaigns: pi.camps }, pi.msgEl); } catch (e) { handleWriteError(e); } },
});
async function downloadCampaign(btn) {
  const label = btn.textContent; btn.disabled = true;
  try {
    const b = allBoards().find(x => x.id === S.board) || { id: S.board, name: S.meta.name };
    const { data, missing } = await exportCampaigns([{ ...b, name: S.meta.name || b.name }], t => btn.textContent = t);
    btn.textContent = "Saving…";
    const slug = (S.meta.name || "campaign").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "campaign";
    await download(`${slug}.campaign.json`, JSON.stringify(data));
    if (missing) toast(`${missing} picture${missing === 1 ? "" : "s"} couldn't be added.`);
  } catch { toast("Couldn't read the campaign just now. Try again in a moment."); }
  finally { btn.disabled = false; btn.textContent = label; }
}
$("#dl-json").onclick = () => downloadCampaign($("#dl-json"));
$("#bd-download").onclick = () => downloadCampaign($("#bd-download"));
$("#dl-all").onclick = async () => {
  const b = $("#dl-all"), label = b.textContent; b.disabled = true;
  try {
    const { data, missing } = await exportAll(t => b.textContent = t);
    b.textContent = "Saving…";
    await download(`storyboard-everything-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data));
    if (missing) toast(`${missing} picture${missing === 1 ? "" : "s"} couldn't be added.`);
  } catch (e) { toast("Couldn't read everything just now. Try again in a moment."); }
  finally { b.disabled = false; b.textContent = label; }
};
for (const [inp, msg] of [["#file-in", "#file-msg"], ["#bd-file", "#bd-file-msg"]]) {
  $(inp).onchange = async e => { const f = e.target.files[0]; if (f) await handleCampaignFile(f, $(msg)); e.target.value = ""; };
}
