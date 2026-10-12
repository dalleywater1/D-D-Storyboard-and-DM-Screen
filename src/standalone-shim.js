// Standalone runtime: stands in for the claude.ai page services so the
// storyboard runs from a plain file. Everything is kept in this browser's
// IndexedDB (cards and notes as documents, pictures as blobs).
(function () {
  "use strict";
  const DB_NAME = "campaign-storyboard";
  const store = new Map();     // path -> document body
  const blobUrls = new Map();  // picture id -> object URL
  const listeners = new Set();
  let idb = null;

  const rid = n => {
    const a = new Uint8Array(Math.ceil(n / 2));
    crypto.getRandomValues(a);
    return [...a].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, n);
  };
  const clone = v => JSON.parse(JSON.stringify(v));
  const segs = p => p.split("/").length;

  function open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("docs"); r.result.createObjectStore("blobs"); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function readAll(name) {
    return new Promise((res, rej) => {
      const out = [];
      const c = idb.transaction(name, "readonly").objectStore(name).openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out.push([cur.key, cur.value]); cur.continue(); } else res(out); };
      c.onerror = () => rej(c.error);
    });
  }
  function write(name, fn) {
    if (!idb) return Promise.resolve();
    return new Promise((res, rej) => {
      const t = idb.transaction(name, "readwrite");
      fn(t.objectStore(name));
      t.oncomplete = () => res();
      t.onerror = () => rej({ code: "unavailable", message: String(t.error) });
      t.onabort = () => rej({ code: t.error && t.error.name === "QuotaExceededError" ? "quota_exceeded" : "unavailable", message: String(t.error) });
    });
  }

  const ready = (async () => {
    try {
      idb = await open();
      for (const [k, v] of await readAll("docs")) store.set(k, v);
      for (const [k, v] of await readAll("blobs")) blobUrls.set(k, URL.createObjectURL(v));
    } catch (e) {
      idb = null;
      window.__NO_PERSIST = true;
    }
  })();

  let queued = false;
  function changed() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; for (const f of [...listeners]) { try { f(); } catch (e) { console.error(e); } } });
  }
  const meta = { fromCache: false, hasPendingWrites: false };
  function snapDoc(path) {
    const has = store.has(path);
    const body = has ? Object.freeze(clone(store.get(path))) : undefined;
    return { id: path.split("/").pop(), exists: has, data: () => body, metadata: meta };
  }
  function snapQuery(path) {
    const n = segs(path) + 1;
    const docs = [...store.keys()].filter(k => k.startsWith(path + "/") && segs(k) === n).sort().map(snapDoc);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: meta };
  }
  function merge(a, b) {
    const o = { ...a };
    for (const [k, v] of Object.entries(b)) {
      if (v && typeof v === "object" && !Array.isArray(v) && o[k] && typeof o[k] === "object" && !Array.isArray(o[k])) o[k] = merge(o[k], v);
      else o[k] = v;
    }
    return o;
  }
  function watch(compute, keyOf, next) {
    let last;
    const f = () => { const s = compute(); const key = keyOf(s); if (key !== last) { last = key; next(s); } };
    listeners.add(f);
    setTimeout(f, 0);
    return () => listeners.delete(f);
  }
  function docRef(path) {
    return {
      id: path.split("/").pop(), path,
      async get() { return snapDoc(path); },
      async set(v) { const body = clone(v); store.set(path, body); changed(); await write("docs", s => s.put(body, path)); },
      async update(v) {
        if (!store.has(path)) throw { code: "invalid_argument", message: "That entry no longer exists." };
        const body = merge(store.get(path), clone(v)); store.set(path, body); changed();
        await write("docs", s => s.put(body, path));
      },
      async delete() { store.delete(path); changed(); await write("docs", s => s.delete(path)); },
      async acquire() { return { acquired: true }; },
      onSnapshot(next) { return watch(() => snapDoc(path), s => JSON.stringify([s.exists, s.data()]), next); },
      collection(sub) { return colRef(path + "/" + sub); },
    };
  }
  function colRef(path) {
    const ref = {
      path,
      doc(id) { return docRef(path + "/" + (id || rid(20))); },
      async add(v) { const r = docRef(path + "/" + rid(20)); await r.set(v); return r; },
      async get() { return snapQuery(path); },
      onSnapshot(next) { return watch(() => snapQuery(path), q => JSON.stringify(q.docs.map(d => [d.id, d.data()])), next); },
      where() { return ref; }, orderBy() { return ref; }, limit() { return ref; },
    };
    return ref;
  }
  const db = { doc: docRef, collection: colRef };

  const assets = {
    async upload(blob) {
      if (!(blob instanceof Blob)) throw { code: "invalid_request", message: "Not a file." };
      const id = rid(32);
      await write("blobs", s => s.put(blob, id));
      blobUrls.set(id, URL.createObjectURL(blob));
      return { id, url: blobUrls.get(id), sizeBytes: blob.size, contentType: blob.type };
    },
    async delete(id) {
      const u = blobUrls.get(id); if (u) URL.revokeObjectURL(u);
      blobUrls.delete(id);
      await write("blobs", s => s.delete(id));
    },
    async list() { return { assets: [...blobUrls.keys()].map(id => ({ id, url: blobUrls.get(id) })), usage: {} }; },
  };
  window.__blobUrl = id => blobUrls.get(id) || (window.__sbForceLocal || (typeof S !== "undefined" && S.local) ? "" : "/_blob/" + id);

  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.json$/i.test(filename) ? "application/json" : "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },
  };

  const user = {
    isOwner: async () => true, canEdit: async () => true, can: async () => true,
    id: async () => "local", me: async () => ({ id: "local", name: "", email: null }),
    profiles: async () => ({}),
  };

  const services = { db, assets, downloads, user };
  window.__sbLocal = { use: async name => { await ready; return services[name] || null; } };
})();
