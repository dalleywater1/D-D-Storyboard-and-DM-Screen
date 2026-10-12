/* ===================== Groups and multi-select on the Table =====================
   A group is a pane on the Table that holds cards: closed it's a small tile
   with a count, open it shows its cards as mini cards you can click to edit or
   drag back out. Cards remember their group in `group`; the groups themselves
   are module docs (gmx/<board>/groups) so they travel with campaign files.
   Select several cards with Shift/Ctrl/Cmd-click or by dragging a box on empty
   table, then move, group, re-act or archive them together. */
MOD_COLLS.push("groups");
S.picked = new Set(); S.gRename = null;
let gdrag = null, mdrag = null, band = null;
const G_CLOSED = { w: 280, h: 132 }, G_OPEN = { w: 560, h: 380 };
const groupsMap = () => (S.mod && S.mod.groups) || new Map();
const groupOf = c => (c && c.group && groupsMap().get(c.group)) || null;
const groupCards = g => [...S.cards.values()].filter(c => c.group === g.id && !c.archived)
  .sort((a, b) => (KINDS.findIndex(k => k.id === a.kind) - KINDS.findIndex(k => k.id === b.kind)) || String(a.title).localeCompare(String(b.title)));
function groupBox(g) {
  if (gdrag && gdrag.id === g.id && !gdrag.resize && gdrag.nx != null) return { ...gdrag.b, x: gdrag.nx, y: gdrag.ny };
  return g.open ? { x: g.x || 0, y: g.y || 0, w: g.ow || G_OPEN.w, h: g.oh || G_OPEN.h } : { x: g.x || 0, y: g.y || 0, w: G_CLOSED.w, h: G_CLOSED.h };
}
function topZAll() { return Math.max(topZ(), ...[...groupsMap().values()].map(g => (g.z || 0) + 1)); }

/* cards in a group leave the table (and don't leave gaps in the act columns) */
layoutCards = function () {
  const out = [];
  columns().forEach((col, ci) => {
    let y = 24;
    for (const c of col.cards) {
      if (groupOf(c)) continue;
      const placed = typeof c.x === "number" && typeof c.y === "number";
      const w = c.w || DEF_W, h = c.h || DEF_H;
      out.push({ c, x: placed ? c.x : 24 + ci * (DEF_W + 40), y: placed ? c.y : y, w, h, act: col.loose ? "" : col.name });
      if (!placed) y += h + 16;
    }
  });
  return out;
};

/* arrows to a grouped card go to its group; arrows inside one group are hidden */
const _gDrawWires = drawWires;
drawWires = function () {
  if (S.boxes) for (const c of S.cards.values()) { const g = groupOf(c); if (g && !c.archived) S.boxes.set(c.id, groupBox(g)); }
  _gDrawWires();
  const svg = document.getElementById("wires"); if (!svg || !S.boxes) return;
  const same = (a, b) => { const ga = S.cards.get(a)?.group, gb = S.cards.get(b)?.group; return !!ga && ga === gb && groupsMap().has(ga); };
  const flags = [];
  for (const c of S.cards.values()) {
    if (!S.boxes.get(c.id)) continue;
    for (const l of c.links || []) { if (!S.boxes.get(l.to)) continue; const f = same(c.id, l.to); flags.push(f); if (l.label) flags.push(f); }
  }
  let k = 0;
  for (const el of [...svg.querySelectorAll(":scope > path:not(.whit):not(#wire-temp), :scope > text")]) if (flags[k++]) el.remove();
  for (const el of [...svg.querySelectorAll(":scope > path.whit")]) {
    const l = S.cards.get(el.dataset.from)?.links?.[+el.dataset.n];
    if (l && same(el.dataset.from, l.to)) el.remove();
  }
};

function miniCard(c) {
  const k = KIND[c.kind] || KIND.lore, col = colorAttrs(c);
  const img = c.imageId && blobUrl(c.imageId) ? `<img src="${blobUrl(c.imageId)}" alt="" draggable="false" style="object-position:${imgPos(c)}">` : "";
  return `<div class="gcard ${col.cls} ${matches(c) ? "" : "dim"} ${S.picked.has(c.id) ? "picked" : ""}" data-gc="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc(c.title || "Untitled")}, open" style="--kc:var(--k-${k.id});${col.style}">
    ${img}<div class="gc-text"><span class="kind">${k.label}</span><span class="gc-title">${esc(c.title || "Untitled")}</span></div>
    ${S.canWrite ? `<button type="button" class="gc-out" data-gout="${esc(c.id)}" title="Take out of the group" aria-label="Take ${esc(c.title || "card")} out of the group">↥</button>` : ""}
  </div>`;
}
function groupHtml(g) {
  const cards = groupCards(g), b = groupBox(g), col = colorAttrs(g);
  const filtering = S.filter !== "all" || S.q || S.focusIds;
  const hits = filtering ? cards.filter(matches).length : cards.length;
  const dim = filtering && !hits;
  const kinds = [...new Set(cards.map(c => c.kind))].map(k => `<span class="g-dot" style="--kc:var(--k-${k})" title="${esc(KIND[k]?.plural || k)}"></span>`).join("");
  const renaming = S.gRename === g.id;
  const title = renaming
    ? `<input class="g-name" id="g-name-${esc(g.id)}" value="${esc(g.title || "")}" aria-label="Group name" maxlength="60">`
    : `<span class="g-title">${esc(g.title || "Group")}</span>`;
  const next = COLORS[(COLORS.indexOf(g.color || "") + 1) % COLORS.length];
  return `<section class="cgroup ${g.open ? "open" : ""} ${col.cls} ${dim ? "dim" : ""}" data-group="${esc(g.id)}" aria-label="Group ${esc(g.title || "")}"
      style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;z-index:${g.z || 0};${col.style}">
    <div class="g-bar" data-gbar>
      <button type="button" class="g-tog" data-gtoggle aria-expanded="${!!g.open}" aria-label="${g.open ? "Close" : "Open"} group">${g.open ? "▾" : "▸"}</button>
      ${title}
      <span class="g-count">${filtering && hits !== cards.length ? `${hits}/` : ""}${cards.length}</span>
      ${S.canWrite ? `<span class="g-tools">
        ${renaming ? "" : `<button type="button" class="g-btn" data-grename title="Rename" aria-label="Rename group">✎</button>`}
        <button type="button" class="g-btn g-sw" data-gcolor="${next}" style="${next ? `--nn:var(--c-${next})` : ""}" title="Change colour" aria-label="Change colour"></button>
        <button type="button" class="g-btn" data-gdel title="Ungroup: put the cards back on the table" aria-label="Ungroup">Ungroup</button>
      </span>` : ""}
    </div>
    ${g.open
      ? `<div class="g-body">${cards.length ? cards.map(miniCard).join("") : `<p class="hint g-empty">Drag cards here to add them.</p>`}</div>
         ${S.canWrite ? `<div class="grip" data-ggrip aria-hidden="true"></div>` : ""}`
      : `<button type="button" class="g-peek" data-gtoggle aria-label="Open group">
          <span class="g-kinds">${kinds}</span>
          <span class="g-names">${cards.slice(0, 5).map(c => esc(c.title || "Untitled")).join(" · ") || "Empty. Drag cards here."}${cards.length > 5 ? ` <b>+${cards.length - 5} more</b>` : ""}</span>
        </button>`}
  </section>`;
}

/* ----- add groups (and selection marks) to the Table ----- */
const _gRenderCanvas = renderCanvas;
renderCanvas = function () {
  if (drag || gdrag || mdrag || band) { if (drag) S.pending = true; return; }
  _gRenderCanvas();
  const canvas = $("#canvas"); if (!canvas || drag) return;
  const gs = [...groupsMap().values()];
  if (gs.length) {
    canvas.insertAdjacentHTML("beforeend", gs.map(groupHtml).join(""));
    let mx = parseFloat(canvas.style.width) || 0, my = parseFloat(canvas.style.height) || 0;
    for (const g of gs) { const b = groupBox(g); mx = Math.max(mx, b.x + b.w + 400); my = Math.max(my, b.y + b.h + 300); }
    canvas.style.width = mx + "px"; canvas.style.height = my + "px";
    $("#canvas-sizer").style.width = mx * S.zoom + "px"; $("#canvas-sizer").style.height = my * S.zoom + "px";
    const svg = document.getElementById("wires"); if (svg) { svg.setAttribute("width", mx); svg.setAttribute("height", my); }
  }
  for (const id of [...S.picked]) { const c = S.cards.get(id); if (!c || c.archived) S.picked.delete(id); }
  for (const el of canvas.querySelectorAll("[data-cc]")) el.classList.toggle("picked", S.picked.has(el.dataset.cc));
  if (S.gRename) { const inp = document.getElementById("g-name-" + S.gRename); if (inp) { inp.focus({ preventScroll: true }); inp.select(); } }
  pickBar();
};

/* ----- the selection bar and the New group popover ----- */
function ensureBars() {
  if (!$("#pick-bar")) $("#link-status").insertAdjacentHTML("afterend", `<div class="pick-bar" id="pick-bar" hidden></div>`);
  if (!$("#add-group")) $("#add-note").insertAdjacentHTML("beforebegin", `<button class="btn" id="add-group" title="A pane that holds cards, e.g. all your NPCs">+ Group</button>`);
}
function pickBar() {
  ensureBars();
  $("#add-group").hidden = !S.canWrite || !S.canGM;
  const bar = $("#pick-bar"), n = S.picked.size;
  if (!n || !S.canWrite) { bar.hidden = true; bar.innerHTML = ""; return; }
  const gs = [...groupsMap().values()];
  bar.hidden = false;
  bar.innerHTML = `<b>${n} card${n === 1 ? "" : "s"} selected</b>
    ${S.canGM ? `<button type="button" class="btn small primary" data-pick="group">Group them</button>` : ""}
    ${gs.length ? `<select id="pick-to-group" aria-label="Add the selected cards to a group"><option value="">Add to group…</option>${gs.map(g => `<option value="${esc(g.id)}">${esc(g.title || "Group")}</option>`).join("")}</select>` : ""}
    <select id="pick-to-act" aria-label="Move the selected cards to an act"><option value="">Move to act…</option>${S.meta.acts.map(a => `<option value="${esc(a.id)}">${esc(a.name || "Act")}</option>`).join("")}<option value="__loose">Loose ends</option></select>
    <button type="button" class="btn small" data-pick="archive">Archive</button>
    <span class="hint">Shift-click or drag a box to select more. Drag one to move them all.</span>
    <button type="button" class="btn small ghost" data-pick="clear">Clear selection</button>`;
}
function newGroupPop() {
  const n = S.picked.size;
  const opts = [["", "Nothing yet"], ...(n ? [["__picked", `The ${n} selected card${n === 1 ? "" : "s"}`]] : []),
    ...KINDS.map(k => { const m = [...S.cards.values()].filter(c => c.kind === k.id && !c.archived && !groupOf(c)).length; return [k.id, `All ${k.plural} not in a group (${m})`]; })];
  return `<div class="group-pop" id="group-pop" role="dialog" aria-label="New group">
    <label class="mf"><span>Name</span><input id="gp-name" placeholder="NPCs, Suspects, Letters…" maxlength="60"></label>
    <label class="mf"><span>Put in it</span><select id="gp-fill">${opts.map(([v, l]) => `<option value="${v}" ${v === (n ? "__picked" : "") ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
    <div class="actions"><button type="button" class="btn small" data-gp="cancel">Cancel</button><button type="button" class="btn small primary" data-gp="create">Create group</button></div>
  </div>`;
}
function openGroupPop() {
  closeGroupPop();
  $("#canvas-area .canvas-bar").insertAdjacentHTML("afterend", newGroupPop());
  const kindSel = $("#gp-fill"), name = $("#gp-name");
  kindSel.addEventListener("change", () => { const k = KIND[kindSel.value]; if (k && !name.value.trim()) name.value = k.plural; });
  name.focus();
}
function closeGroupPop() { $("#group-pop")?.remove(); }
/* the first free spot in view (scanning from the top left), so a new group doesn't land on anything */
function visibleSpot(w, h) {
  const sc = $("#canvas-scroll"), z = S.zoom;
  const vx = sc.scrollLeft / z, vy = sc.scrollTop / z, vw = sc.clientWidth / z, vh = sc.clientHeight / z;
  const boxes = [...(S.boxes ? [...S.boxes.entries()].filter(([id]) => !groupOf(S.cards.get(id))).map(([, b]) => b) : []), ...[...groupsMap().values()].map(groupBox),
    ...(S.canGM ? [...S.notes.values()].map(n => ({ x: n.x, y: n.y, w: n.w || 220, h: n.h || 180 })) : [])];
  const free = (x, y) => !boxes.some(b => x < b.x + b.w + 16 && b.x < x + w + 16 && y < b.y + b.h + 16 && b.y < y + h + 16);
  for (let y = snap(vy + 16); y + h <= vy + vh + h * 2; y += 24) for (let x = snap(vx + 16); x + w <= vx + Math.max(vw, w + 32); x += 24) if (free(x, y)) return { x, y };
  return { x: snap(vx + 16), y: snap(Math.max(...boxes.map(b => b.y + b.h), vy) + 24) };
}
function createGroup(title, ids, at) {
  const id = "g_" + uid(), spot = at || visibleSpot(G_CLOSED.w, G_CLOSED.h);
  putDoc("groups", id, { title: title || "Group", color: "", x: spot.x, y: spot.y, open: false, z: topZAll(), created: new Date().toISOString() }, false);
  for (const cid of ids) { const c = S.cards.get(cid); if (c) saveCardQuiet({ ...c, group: id, updated: new Date().toISOString() }); }
  S.picked.clear(); render();
  toast(`Group “${title || "Group"}” made${ids.length ? ` with ${ids.length} card${ids.length === 1 ? "" : "s"}` : ""}`);
  return id;
}
/* save without a render per card; the caller renders once */
function saveCardQuiet(c) {
  S.cards.set(c.id, c);
  if (S.db) R(P().cards + "/" + c.id).set(c).catch(handleWriteError);
}
function addToGroup(gid, ids) {
  const g = groupsMap().get(gid); if (!g) return;
  let n = 0;
  for (const id of ids) { const c = S.cards.get(id); if (c && c.group !== gid) { saveCardQuiet({ ...c, group: gid, updated: new Date().toISOString() }); n++; } }
  S.picked.clear(); render();
  if (n) toast(`${n === 1 ? `“${S.cards.get(ids[0])?.title || "Card"}”` : n + " cards"} added to “${g.title || "Group"}”`);
}
function takeOut(id, at) {
  const c = S.cards.get(id); if (!c) return;
  const g = groupOf(c), b = g ? groupBox(g) : { x: 40, y: 40, w: 0 };
  const spot = at || { x: snap(b.x + b.w + 24), y: snap(b.y) };
  saveCardQuiet({ ...c, group: "", x: spot.x, y: spot.y, z: topZAll(), updated: new Date().toISOString() });
  render();
}
function ungroup(gid) {
  const g = groupsMap().get(gid); if (!g) return;
  const cards = [...S.cards.values()].filter(c => c.group === gid);
  cards.forEach((c, i) => saveCardQuiet({ ...c, group: "", x: snap((g.x || 0) + (i % 4) * (DEF_W + 16)), y: snap((g.y || 0) + Math.floor(i / 4) * (DEF_H + 16)), updated: new Date().toISOString() }));
  delDoc("groups", gid);
  toast(`Ungrouped “${g.title || "Group"}”: ${cards.length} card${cards.length === 1 ? "" : "s"} back on the table`);
}
function saveGroup(gid, fields, rerender = true) { const g = groupsMap().get(gid); if (!g) return; putDoc("groups", gid, { ...g, ...fields }, rerender); }
function finishRename(save) {
  const id = S.gRename; if (!id) return;
  const inp = document.getElementById("g-name-" + id); S.gRename = null;
  if (save && inp) saveGroup(id, { title: inp.value.trim() || "Group" }); else render();
}

document.addEventListener("click", e => {
  if (e.target.closest("#add-group")) { $("#group-pop") ? closeGroupPop() : openGroupPop(); return; }
  const gp = e.target.closest("[data-gp]");
  if (gp) {
    if (gp.dataset.gp === "create") {
      const fill = $("#gp-fill").value, name = $("#gp-name").value.trim();
      const ids = fill === "__picked" ? [...S.picked] : fill ? [...S.cards.values()].filter(c => c.kind === fill && !c.archived && !groupOf(c)).map(c => c.id) : [];
      closeGroupPop(); createGroup(name || KIND[fill]?.plural || "Group", ids);
    } else closeGroupPop();
    return;
  }
  const pk = e.target.closest("[data-pick]");
  if (pk) {
    const ids = [...S.picked];
    if (pk.dataset.pick === "clear") { S.picked.clear(); render(); }
    if (pk.dataset.pick === "group") { S.picked = new Set(ids); openGroupPop(); }
    if (pk.dataset.pick === "archive") { for (const id of ids) { const c = S.cards.get(id); if (c) saveCardQuiet({ ...c, archived: true, archivedAt: new Date().toISOString(), updated: new Date().toISOString() }); } S.picked.clear(); render(); toast(`Archived ${ids.length} card${ids.length === 1 ? "" : "s"}. Find them under Archive.`); }
    return;
  }
  const gEl = e.target.closest("[data-group]"); if (!gEl) return;
  const gid = gEl.dataset.group, g = groupsMap().get(gid); if (!g) return;
  if (e.target.closest("[data-gtoggle]")) { if (S.canWrite) saveGroup(gid, { open: !g.open, z: topZAll() }); else { g.open = !g.open; render(); } return; }
  if (e.target.closest("[data-grename]")) { S.gRename = gid; render(); return; }
  const sw = e.target.closest("[data-gcolor]"); if (sw) { saveGroup(gid, { color: sw.dataset.gcolor }); return; }
  const del = e.target.closest("[data-gdel]");
  if (del) {
    if (groupCards(g).length && !del.classList.contains("armed")) {
      del.classList.add("armed"); del.textContent = "Ungroup?";
      setTimeout(() => { if (del.isConnected) { del.classList.remove("armed"); del.textContent = "Ungroup"; } }, 3000);
      return;
    }
    ungroup(gid); return;
  }
  const out = e.target.closest("[data-gout]"); if (out) { takeOut(out.dataset.gout); return; }
});
document.addEventListener("change", e => {
  if (e.target.id === "pick-to-group" && e.target.value) { addToGroup(e.target.value, [...S.picked]); return; }
  if (e.target.id === "pick-to-act" && e.target.value) {
    const act = e.target.value === "__loose" ? "" : e.target.value, ids = [...S.picked];
    for (const id of ids) { const c = S.cards.get(id); if (c) saveCardQuiet({ ...c, act, updated: new Date().toISOString() }); }
    S.picked.clear(); render(); toast(`Moved ${ids.length} card${ids.length === 1 ? "" : "s"} to ${act ? (S.meta.acts.find(a => a.id === act)?.name || "the act") : "Loose ends"}`);
  }
});
document.addEventListener("keydown", e => {
  if (e.target.matches?.(".g-name")) { if (e.key === "Enter") { e.preventDefault(); finishRename(true); } else if (e.key === "Escape") finishRename(false); return; }
  if (e.target.matches?.("#gp-name") && e.key === "Enter") { e.preventDefault(); $("[data-gp='create']")?.click(); return; }
  if (e.key === "Escape") { if ($("#group-pop")) { closeGroupPop(); return; } if (S.picked.size && S.tab === "board") { S.picked.clear(); render(); } }
  const gc = e.target.closest?.("[data-gc]");
  if (gc && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openEditor(gc.dataset.gc); }
});
document.addEventListener("focusout", e => { if (e.target.matches?.(".g-name")) setTimeout(() => { if (S.gRename && document.activeElement?.id !== "g-name-" + S.gRename) finishRename(true); }, 0); });

/* ----- pointer: move/resize groups, drag mini cards out, box-select, shift-click, move a selection ----- */
const cPoint = e => { const r = $("#canvas").getBoundingClientRect(); return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom }; };
const groupAt = (e, not) => document.elementsFromPoint(e.clientX, e.clientY).find(el => el.matches?.("[data-group]") && el.dataset.group !== not);
canvasEl.addEventListener("pointerdown", e => {
  if (e.button !== 0) return;
  const gEl = e.target.closest("[data-group]");
  if (gEl) {
    const g = groupsMap().get(gEl.dataset.group); if (!g) return;
    const gc = e.target.closest("[data-gc]");
    if (gc && !e.target.closest("button")) {
      e.preventDefault();
      mdrag = { id: gc.dataset.gc, gid: g.id, sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId, el: gc, shift: e.shiftKey || e.ctrlKey || e.metaKey };
      try { gc.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    if (!S.canWrite) return;
    const grip = e.target.closest("[data-ggrip]"), bar = e.target.closest("[data-gbar]");
    if (!grip && (!bar || e.target.closest("button, input"))) return;
    e.preventDefault();
    const b = groupBox(g), z = topZAll(); gEl.style.zIndex = z;
    gdrag = { id: g.id, el: gEl, resize: !!grip, sx: e.clientX, sy: e.clientY, b, z, moved: false, pid: e.pointerId };
    try { (grip || bar).setPointerCapture(e.pointerId); } catch {}
    return;
  }
  // a drag on empty table draws a selection box (mouse only, so touch can still scroll)
  if (e.pointerType === "mouse" && S.canWrite && !S.linkMode && (e.target === canvasEl || (e.target.closest("#wires") && !e.target.closest(".whit")))) {
    const p = cPoint(e);
    band = { x: p.x, y: p.y, el: null, add: e.shiftKey || e.ctrlKey || e.metaKey, pid: e.pointerId, moved: false };
    try { canvasEl.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  // dragging a selected card moves the whole selection
  if (drag && drag.type === "card" && !drag.resize && S.picked.has(drag.id) && S.picked.size > 1) {
    drag.others = [...S.picked].filter(id => id !== drag.id).map(id => {
      const el = canvasEl.querySelector(`[data-cc="${CSS.escape(id)}"]`), b = S.boxes?.get(id);
      return el && b ? { id, el, x: b.x, y: b.y } : null;
    }).filter(Boolean);
  }
});
canvasEl.addEventListener("pointermove", e => {
  if (drag && drag.others && drag.moved && !drag.resize) {
    const dx = (drag.nx ?? drag.x) - drag.x, dy = (drag.ny ?? drag.y) - drag.y;
    for (const o of drag.others) {
      o.nx = Math.max(0, o.x + dx); o.ny = Math.max(0, o.y + dy);
      o.el.style.left = o.nx + "px"; o.el.style.top = o.ny + "px";
      const b = S.boxes.get(o.id); if (b) { b.x = o.nx; b.y = o.ny; }
    }
    drawWires();
  }
  if (drag && drag.type === "card" && drag.moved && !drag.resize) {
    document.querySelectorAll(".cgroup.drop-target").forEach(el => el.classList.remove("drop-target"));
    groupAt(e)?.classList.add("drop-target");
  }
});
document.addEventListener("pointermove", e => {
  if (gdrag && e.pointerId === gdrag.pid) {
    const dx = (e.clientX - gdrag.sx) / S.zoom, dy = (e.clientY - gdrag.sy) / S.zoom;
    if (!gdrag.moved && Math.hypot(dx, dy) < 4) return;
    gdrag.moved = true; gdrag.el.classList.add("moving");
    if (gdrag.resize) {
      gdrag.nw = Math.min(1400, Math.max(300, snap(gdrag.b.w + dx))); gdrag.nh = Math.min(1400, Math.max(180, snap(gdrag.b.h + dy)));
      gdrag.el.style.width = gdrag.nw + "px"; gdrag.el.style.height = gdrag.nh + "px";
    } else {
      gdrag.nx = Math.max(0, snap(gdrag.b.x + dx)); gdrag.ny = Math.max(0, snap(gdrag.b.y + dy));
      gdrag.el.style.left = gdrag.nx + "px"; gdrag.el.style.top = gdrag.ny + "px";
      drawWires();
    }
    return;
  }
  if (mdrag && e.pointerId === mdrag.pid) {
    if (!mdrag.moved && Math.hypot(e.clientX - mdrag.sx, e.clientY - mdrag.sy) < 5) return;
    if (!S.canWrite) return;
    if (!mdrag.moved) {
      mdrag.moved = true;
      mdrag.ghost = document.createElement("div"); mdrag.ghost.className = "gc-ghost";
      mdrag.ghost.textContent = S.cards.get(mdrag.id)?.title || "Card"; document.body.appendChild(mdrag.ghost);
      mdrag.el.classList.add("lifted");
    }
    mdrag.ghost.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 8}px)`;
    document.querySelectorAll(".cgroup.drop-target").forEach(el => el.classList.remove("drop-target"));
    const over = groupAt(e); if (over && over.dataset.group !== mdrag.gid) over.classList.add("drop-target");
    return;
  }
  if (band && e.pointerId === band.pid) {
    const p = cPoint(e);
    if (!band.moved && Math.hypot(p.x - band.x, p.y - band.y) * S.zoom < 5) return;
    if (!band.moved) { band.moved = true; band.el = document.createElement("div"); band.el.className = "pick-band"; canvasEl.appendChild(band.el); }
    band.r = { x: Math.min(band.x, p.x), y: Math.min(band.y, p.y), w: Math.abs(p.x - band.x), h: Math.abs(p.y - band.y) };
    Object.assign(band.el.style, { left: band.r.x + "px", top: band.r.y + "px", width: band.r.w + "px", height: band.r.h + "px" });
  }
});
document.addEventListener("pointerup", e => endGroupPointer(e, false));
document.addEventListener("pointercancel", e => endGroupPointer(e, true));
function endGroupPointer(e, cancel) {
  if (gdrag && e.pointerId === gdrag.pid) {
    const d = gdrag; gdrag = null; d.el.classList.remove("moving");
    if (!d.moved || cancel) { if (d.moved) render(); else saveGroup(d.id, { z: d.z }, false); return; }
    if (d.resize) saveGroup(d.id, { ow: d.nw ?? d.b.w, oh: d.nh ?? d.b.h, z: d.z });
    else saveGroup(d.id, { x: d.nx ?? d.b.x, y: d.ny ?? d.b.y, z: d.z });
    return;
  }
  if (mdrag && e.pointerId === mdrag.pid) {
    const d = mdrag; mdrag = null; d.ghost?.remove(); d.el.classList.remove("lifted");
    document.querySelectorAll(".cgroup.drop-target").forEach(el => el.classList.remove("drop-target"));
    if (cancel) { render(); return; }
    if (!d.moved) {
      if (d.shift) { S.picked.has(d.id) ? S.picked.delete(d.id) : S.picked.add(d.id); render(); return; }
      openEditor(d.id); return;
    }
    const over = groupAt(e);
    if (over) { if (over.dataset.group !== d.gid) addToGroup(over.dataset.group, [d.id]); else render(); return; }
    const sc = $("#canvas-scroll").getBoundingClientRect();
    if (e.clientX >= sc.left && e.clientX <= sc.right && e.clientY >= sc.top && e.clientY <= sc.bottom) {
      const p = cPoint(e); takeOut(d.id, { x: snap(Math.max(0, p.x - 40)), y: snap(Math.max(0, p.y - 20)) });
    } else render();
    return;
  }
  if (band && e.pointerId === band.pid) {
    const b = band; band = null; b.el?.remove();
    if (cancel) return;
    if (!b.moved) { if (S.picked.size && !b.add) { S.picked.clear(); render(); } return; }
    if (!b.add) S.picked.clear();
    for (const [id, bx] of S.boxes || []) {
      const c = S.cards.get(id); if (!c || groupOf(c)) continue;
      if (bx.x < b.r.x + b.r.w && b.r.x < bx.x + bx.w && bx.y < b.r.y + b.r.h && b.r.y < bx.y + bx.h) S.picked.add(id);
    }
    render();
  }
}

/* a card click with Shift/Ctrl/Cmd selects it; dropping cards on a group adds them; a selection moves together */
const _gEndDrag = endDrag;
endDrag = function (e, cancelled) {
  document.querySelectorAll(".cgroup.drop-target").forEach(el => el.classList.remove("drop-target"));
  const d = drag;
  if (d && d.type === "card" && !d.readonly && !d.moved && !cancelled && e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
    d.el.classList.remove("moving"); drag = null;
    S.picked.has(d.id) ? S.picked.delete(d.id) : S.picked.add(d.id);
    d.el.classList.toggle("picked", S.picked.has(d.id)); pickBar();
    return;
  }
  if (d && d.type === "card" && d.moved && !d.resize && !cancelled && e && S.canGM) {
    const over = groupAt(e);
    if (over) {
      d.el.classList.remove("moving"); drag = null;
      const ids = [d.id, ...(d.others || []).map(o => o.id)];
      addToGroup(over.dataset.group, ids);
      return;
    }
  }
  const others = d && d.moved && !d.resize && !cancelled ? d.others : null;
  const r = _gEndDrag(e, cancelled);
  if (others) for (const o of others) if (o.nx != null) savePlacement(o.id, { x: o.nx, y: o.ny });
  return r;
};
