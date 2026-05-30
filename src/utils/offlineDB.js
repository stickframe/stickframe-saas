import { openDB } from "idb";

const DB_NAME    = "sf-offline";
const DB_VERSION = 1;
const STORE      = "diario-pendente";

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "localId", autoIncrement: true });
      }
    },
  });
}

export async function salvarDiarioOffline(obraId, registro) {
  const db = await getDB();
  return db.add(STORE, { obraId, registro, timestamp: Date.now() });
}

export async function getPendentesDiario() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function deletarPendente(localId) {
  const db = await getDB();
  return db.delete(STORE, localId);
}

export async function contarPendentes() {
  const db = await getDB();
  return db.count(STORE);
}
