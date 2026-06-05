const STORAGE_KEY = "sf_webauthn_cred";

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

  const saved = {
    credentialId: b64url(credential.rawId),
    userId,
    userName,
    refreshToken,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return true;
}

export async function authenticateWithBiometric() {
  const saved = getSavedCredential();
  if (!saved) throw new Error("Nenhuma biometria cadastrada neste dispositivo.");

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
  return saved.refreshToken;
}

export function removeBiometric() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveCredentialId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}
