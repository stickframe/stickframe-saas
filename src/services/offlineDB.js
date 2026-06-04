import { openDB } from "idb";

const DB_NAME = "stickframe-offline";
const DB_VERSION = 2;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("diario-pendente", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("plantas-cache")) {
        const store = db.createObjectStore("plantas-cache", { keyPath: "id" });
        store.createIndex("obraId", "obraId");
      }
    },
  });
}

export async function cachePlanta({ id, obraId, nome, revisao, url, storagePath }) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("fetch failed");
    const buffer = await response.arrayBuffer();
    const db = await getDB();
    await db.put("plantas-cache", { id, obraId, nome, revisao, storagePath, buffer, cachedAt: Date.now() });
    return true;
  } catch { return false; }
}

export async function getPlantaOffline(id) {
  const db = await getDB();
  const item = await db.get("plantas-cache", id);
  if (!item) return null;
  const mime = item.storagePath?.match(/\.pdf$/i) ? "application/pdf" : "image/jpeg";
  return URL.createObjectURL(new Blob([item.buffer], { type: mime }));
}

export async function getPlantasDaObra(obraId) {
  const db = await getDB();
  return db.getAllFromIndex("plantas-cache", "obraId", obraId);
}

export async function removerCachePlanta(id) {
  const db = await getDB();
  await db.delete("plantas-cache", id);
}
