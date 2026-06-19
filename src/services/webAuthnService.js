const STORAGE_KEY = "sf_webauthn_cred";
const IDB_NAME = "sf_secure";
const IDB_STORE = "keys";
const IDB_KEY_ID = "wrap_key";

function isSupported() {
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  );
}

export async function isWebAuthnAvailable() {
  if (!isSupported()) return false;
  return window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export function hasSavedCredential() {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function getSavedCredential() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function b64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromB64url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

//  Chave de cifragem não-extraível, persistida no IndexedDB 
// O AES-GCM key nunca é exposto ao JS (extractable:false); um getItem no
// localStorage não devolve mais o refresh token em claro.
function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
    tx.onsuccess = () => resolve(tx.result);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbSet(key, value) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(value, key);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getWrapKey(create) {
  let key = await idbGet(IDB_KEY_ID);
  if (!key && create) {
    key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false, // não-extraível
      ["encrypt", "decrypt"],
    );
    await idbSet(IDB_KEY_ID, key);
  }
  return key || null;
}

async function encrypt(plaintext) {
  const key = await getWrapKey(true);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return { ct: b64url(ct), iv: b64url(iv) };
}

async function decrypt(ctB64, ivB64) {
  const key = await getWrapKey(false);
  if (!key) throw new Error("Chave de segurança não encontrada neste dispositivo.");
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64url(ivB64) },
    key,
    fromB64url(ctB64),
  );
  return new TextDecoder().decode(pt);
}

export async function registerBiometric(userId, userName, refreshToken) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "StickFrame", id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  });

  // Refresh token cifrado com AES-GCM (chave não-extraível no IndexedDB)
  const { ct, iv } = await encrypt(refreshToken);
  const saved = {
    credentialId: b64url(credential.rawId),
    userId,
    userName,
    ct,
    iv,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return true;
}

export async function authenticateWithBiometric() {
  const saved = getSavedCredential();
  if (!saved || !saved.ct) throw new Error("Nenhuma biometria cadastrada neste dispositivo.");

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{
        id: fromB64url(saved.credentialId),
        type: "public-key",
        transports: ["internal"],
      }],
      userVerification: "required",
      timeout: 60000,
    },
  });

  if (!assertion) throw new Error("Autenticação cancelada.");
  // Só descriptografa após a verificação biométrica do autenticador
  return decrypt(saved.ct, saved.iv);
}

export function removeBiometric() {
  localStorage.removeItem(STORAGE_KEY);
}
