const CREDENTIAL_KEY = "webauthn_credential_id";

export async function isWebAuthnAvailable() {
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function" &&
    (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  );
}

export function hasSavedCredential() {
  return !!localStorage.getItem(CREDENTIAL_KEY);
}

export function removeBiometric() {
  localStorage.removeItem(CREDENTIAL_KEY);
}

export function saveCredentialId(id) {
  localStorage.setItem(CREDENTIAL_KEY, id);
}
