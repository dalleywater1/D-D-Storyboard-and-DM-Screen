/* ===================== Archive =====================
   Cards you're done with (a letter that's been read, a dead NPC, a finished
   scene) can be archived: they leave the Table, Columns, NPC and Town lists,
   keep all their text, pictures, links and GM notes, and can be brought back. */
function setArchived(id, on) {
  const c = S.cards.get(id); if (!c) return;
  const nc = { ...c, archived: on, updated: new Date().toISOString() };
  if (on) nc.archivedAt = new Date().toISOString(); else delete nc.archivedAt;
  saveCard(nc);
  toast(on ? `Archived “${c.title || "card"}”. Find it under Archive.` : `“${c.title || "card"}” is back on the board`);
}
function renderArchive() {
  const wrap = $("#archive-wrap");
  const list = [...S.cards.values()].filter(c => c.archived && matches(c))
    .sort((a, b) => String(b.archivedAt || "").localeCompare(String(a.archivedAt || "")));
  const total = [...S.cards.values()].filter(c => c.archived).length;
  if (!total) {
    wrap.innerHTML = `<div class="empty"><h2>Nothing archived</h2><p>When a card has done its job, like a letter the players have read or an NPC who's left the story, open it and choose <b>Archive</b>. It leaves the board but keeps everything, and you can bring it back from here.</p></div>`;
    return;
  }
  const actName = id => S.meta.acts.find(a => a.id === id)?.name || "Loose ends";
  wrap.innerHTML = `<p class="hint">${total} archived card${total === 1 ? "" : "s"}. Click one to read or edit it. They keep their links, pictures and GM notes.</p>
    ${list.length ? `<div class="archive-grid">${list.map(c => `<div class="arch-item">
      ${cardHtml(c).replace('draggable="true"', 'draggable="false"')}
      <div class="arch-foot"><span class="hint">${esc(actName(c.act))}${c.archivedAt ? ` · archived ${fmtDate(c.archivedAt.slice(0, 10))}` : ""}</span>
        ${S.canWrite ? `<button type="button" class="btn small" data-unarchive="${esc(c.id)}">Bring back</button>` : ""}</div>
    </div>`).join("")}</div>` : `<p class="hint">No archived card matches the search or filter.</p>`}`;
}
$("#ed-archive").onclick = () => {
  const id = S.editing?.id; if (!id) return;
  const on = !S.cards.get(id)?.archived;
  closeSheets(); setArchived(id, on);
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-unarchive]");
  if (b) { e.stopPropagation(); setArchived(b.dataset.unarchive, false); }
}, true);
