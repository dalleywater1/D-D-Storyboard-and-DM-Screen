/* ===================== Save to / load from a private GitHub repo =====================
   Only in the downloaded / GitHub Pages copy (the online claude.ai copy can't
   reach GitHub). Saves the same "everything" file as Backup → Download
   everything, as storyboard-everything.json in a private repo you choose, using
   a fine-grained token that can only touch that repo. Every save is a commit, so
   GitHub keeps the history. The repo and token are kept in this browser only. */
const GH_FILE = "storyboard-everything.json", GH_KEY = "sb-gh";
const ghCfg = () => lsGet(GH_KEY, null);
const ghSet = c => { if (c) lsSet(GH_KEY, c); else { try { localStorage.removeItem(GH_KEY); } catch {} } };
async function ghApi(path, opt = {}) {
  const c = ghCfg(); if (!c) throw new Error("not connected");
  const res = await fetch("https://api.github.com" + path, { ...opt, headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + c.token, "X-GitHub-Api-Version": "2022-11-28", ...(opt.headers || {}) } });
  return res;
}
const ghWhy = async res => { let m = ""; try { m = (await res.json()).message || ""; } catch {} return res.status === 401 ? "GitHub didn't accept the token. It may have expired: make a new one." : res.status === 403 || res.status === 404 ? "The token can't reach that repo. Check the repo name, and that the token has Contents: Read and write for it." : res.status === 413 || res.status === 422 ? "GitHub refused the file (" + (m || "too large") + ")." : "GitHub said: " + (m || res.status); };
/* the saved file's current version on GitHub (null if there isn't one yet) */
async function ghRemote() {
  const c = ghCfg();
  const res = await ghApi(`/repos/${c.repo}/contents/${GH_FILE}`);
  if (res.status === 404) { const r2 = await ghApi(`/repos/${c.repo}`); if (r2.ok) return null; throw new Error(await ghWhy(r2)); }
  if (!res.ok) throw new Error(await ghWhy(res));
  const j = await res.json();
  let date = "";
  try { const cr = await ghApi(`/repos/${c.repo}/commits?path=${GH_FILE}&per_page=1`); if (cr.ok) { const [x] = await cr.json(); date = x?.commit?.committer?.date || ""; } } catch {}
  return { sha: j.sha, size: j.size, date };
}
const ghWhen = d => d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";

async function ghSave(force) {
  const c = ghCfg(), msg = $("#gh-msg"), btns = [$("#gh-save"), $("#gh-quick")].filter(Boolean);
  btns.forEach(b => b && (b.disabled = true));
  try {
    msg && (msg.textContent = "Checking GitHub…");
    const remote = await ghRemote();
    if (remote && remote.sha !== c.sha && !force) {
      if (msg) msg.innerHTML = `<span class="err">GitHub has a newer save${remote.date ? ` from ${esc(ghWhen(remote.date))}` : ""}, probably from another computer. Saving now replaces it (the old one stays in GitHub's history).</span>
        <div class="actions"><button type="button" class="btn small" data-gh="load">Load that save first</button><button type="button" class="btn small danger" data-gh="save-force">Save anyway</button></div>`;
      openSheet("#backup"); return;
    }
    const { data, missing } = await exportAll(t => msg && (msg.textContent = t));
    msg && (msg.textContent = "Sending to GitHub…");
    const body = { message: `Storyboard save: ${data.campaigns.length} campaign${data.campaigns.length === 1 ? "" : "s"}, ${new Date().toLocaleString()}`, content: toB64(JSON.stringify(data)) };
    if (remote) body.sha = remote.sha;
    const res = await ghApi(`/repos/${c.repo}/contents/${GH_FILE}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await ghWhy(res));
    const j = await res.json();
    ghSet({ ...ghCfg(), sha: j.content.sha, saved: new Date().toISOString() });
    toast(`Saved to GitHub${missing ? ` (${missing} picture${missing === 1 ? "" : "s"} couldn't be added)` : ""}`);
    ghRender(`<span class="ok">Saved ${data.campaigns.length} campaign${data.campaigns.length === 1 ? "" : "s"} to ${esc(c.repo)}.</span>`);
  } catch (e) {
    const t = e.message === "Failed to fetch" ? "Couldn't reach GitHub. Check your internet connection." : e.message;
    if (msg) msg.innerHTML = `<span class="err">${esc(t)}</span>`; else toast(t);
  } finally { btns.forEach(b => b && (b.disabled = false)); }
}
async function ghLoad() {
  const c = ghCfg(), msg = $("#gh-msg");
  try {
    msg.textContent = "Fetching from GitHub…";
    const remote = await ghRemote();
    if (!remote) { msg.innerHTML = `<span class="err">Nothing has been saved to ${esc(c.repo)} yet.</span>`; return; }
    const res = await ghApi(`/repos/${c.repo}/contents/${GH_FILE}`, { headers: { Accept: "application/vnd.github.raw+json" } });
    if (!res.ok) throw new Error(await ghWhy(res));
    const camps = campaignsIn(parseBackupText(await res.text()));
    if (!camps || !camps.length) { msg.innerHTML = `<span class="err">The save on GitHub has no campaigns in it.</span>`; return; }
    ghSet({ ...ghCfg(), sha: remote.sha });
    offerImport(camps, msg);
    msg.insertAdjacentHTML("afterbegin", `<p class="hint">Save from ${esc(ghWhen(remote.date) || "GitHub")}. Choose what to load:</p>`);
  } catch (e) { msg.innerHTML = `<span class="err">${esc(e.message === "Failed to fetch" ? "Couldn't reach GitHub. Check your internet connection." : e.message)}</span>`; }
}
async function ghConnect() {
  const repo = $("#gh-repo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, ""), token = $("#gh-token").value.trim(), msg = $("#gh-msg");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { msg.innerHTML = `<span class="err">Write the repo as your-name/repo-name.</span>`; return; }
  if (!token) { msg.innerHTML = `<span class="err">Paste the token from GitHub.</span>`; return; }
  msg.textContent = "Checking…";
  ghSet({ repo, token });
  try {
    const res = await ghApi(`/repos/${repo}`);
    if (!res.ok) throw new Error(await ghWhy(res));
    const r = await res.json();
    if (!r.private) { ghSet(null); msg.innerHTML = `<span class="err">${esc(repo)} is public, so anyone could read your campaigns and GM notes. Make it private on GitHub (Settings → Danger Zone → Change visibility), or use a private repo.</span>`; return; }
    if (r.permissions && r.permissions.push === false) { ghSet(null); msg.innerHTML = `<span class="err">The token can read ${esc(repo)} but not save to it. Give it Contents: Read and write.</span>`; return; }
    const remote = await ghRemote();
    ghRender(remote ? `<span class="ok">Connected.</span> There's already a save here from ${esc(ghWhen(remote.date))}. <button type="button" class="btn small" data-gh="load">Load it</button> or <button type="button" class="btn small" data-gh="save-force">replace it with this browser's campaigns</button>.`
      : `<span class="ok">Connected to ${esc(repo)}.</span> Click Save to GitHub to make the first save.`);
  } catch (e) { ghSet(null); msg.innerHTML = `<span class="err">${esc(e.message === "Failed to fetch" ? "Couldn't reach GitHub. Check your internet connection." : e.message)}</span>`; }
}
function ghSection() {
  const c = ghCfg();
  if (!c) return `<h3 class="section-title">GitHub (private repo)</h3>
    <p class="hint" style="margin:0">Save everything to a private GitHub repo, then load it on any computer. Each save is kept in the repo's history.</p>
    <details class="gh-help"><summary>How to set it up (about 3 minutes)</summary><ol>
      <li>On GitHub, make a new <b>private</b> repository, for example <i>dnd-campaign-saves</i>. Tick “Add a README”.</li>
      <li>Go to your picture (top right) → <b>Settings</b> → <b>Developer settings</b> → <b>Personal access tokens</b> → <b>Fine-grained tokens</b> → <b>Generate new token</b>.</li>
      <li>Name it <i>Storyboard</i>, pick an expiry, and under <b>Repository access</b> choose <b>Only select repositories</b> → your saves repo.</li>
      <li>Under <b>Permissions</b> → <b>Repository permissions</b>, set <b>Contents</b> to <b>Read and write</b>. Click <b>Generate token</b> and copy it.</li>
      <li>Paste the repo name and token below. They're kept in this browser only; do this once on each computer.</li></ol></details>
    <div class="mgrid"><label class="mf"><span>Repo</span><input id="gh-repo" placeholder="your-name/dnd-campaign-saves" autocomplete="off"></label>
      <label class="mf"><span>Token</span><input id="gh-token" type="password" placeholder="github_pat_…" autocomplete="off"></label></div>
    <div class="actions"><button type="button" class="btn primary" data-gh="connect">Connect</button></div>
    <div id="gh-msg" aria-live="polite"></div>`;
  return `<h3 class="section-title">GitHub (private repo)</h3>
    <p class="hint" style="margin:0">Connected to <b>${esc(c.repo)}</b>.${c.saved ? ` Last saved from this browser ${esc(ghWhen(c.saved))}.` : ""}</p>
    <div class="actions"><button type="button" class="btn primary" id="gh-save" data-gh="save">Save to GitHub</button><button type="button" class="btn" data-gh="load">Load from GitHub</button>
      <a class="btn ghost" href="https://github.com/${esc(c.repo)}/commits" target="_blank" rel="noopener">History</a><button type="button" class="btn ghost" data-gh="forget">Disconnect this browser</button></div>
    <div id="gh-msg" aria-live="polite"></div>`;
}
function ghRender(note) {
  const box = $("#gh-box"); if (!box) return;
  box.innerHTML = ghSection();
  if (note) $("#gh-msg").innerHTML = note;
  const q = $("#gh-quick"); if (q) q.hidden = !ghCfg();
}
if (window.__STANDALONE) {
  $("#file-msg").insertAdjacentHTML("afterend", `<div id="gh-box" class="gh-box"></div>`);
  $("#btn-backup").insertAdjacentHTML("beforebegin", `<button class="btn" id="gh-quick" data-gh="save" title="Save everything to your GitHub repo" hidden>Save to GitHub</button>`);
  ghRender();
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-gh]"); if (!b) return;
    const a = b.dataset.gh;
    if (a === "connect") ghConnect();
    if (a === "save") { if (b.id === "gh-quick") $("#gh-msg").textContent = ""; ghSave(false); }
    if (a === "save-force") ghSave(true);
    if (a === "load") ghLoad();
    if (a === "forget") { if (!b.classList.contains("armed")) { b.classList.add("armed"); b.textContent = "Click again to disconnect"; return; } ghSet(null); ghRender(`<span class="ok">Disconnected. Your campaigns in this browser are unchanged.</span>`); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && (e.target.id === "gh-token" || e.target.id === "gh-repo")) ghConnect(); });
  // on opening: say so if another computer has saved since this browser last saved or loaded
  setTimeout(async () => {
    const c = ghCfg(); if (!c || !navigator.onLine) return;
    try { const r = await ghRemote(); if (r && c.sha && r.sha !== c.sha) { toast(`There's a newer save on GitHub${r.date ? ` from ${ghWhen(r.date)}` : ""}. Open Backup → Load from GitHub to get it.`); const q = $("#gh-quick"); if (q) q.classList.add("gh-newer"); } } catch {}
  }, 2500);
}
