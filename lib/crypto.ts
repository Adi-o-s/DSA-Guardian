import "server-only";
// Symmetric encryption for secrets stored at rest (the LEETCODE_SESSION cookie).
// Uses NaCl secretbox (XSalsa20-Poly1305). The key comes from ENCRYPTION_KEY,
// a base64-encoded 32-byte value: generate with `openssl rand -base64 32`.
import nacl from "tweetnacl";
import { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } from "tweetnacl-util";

function key(): Uint8Array {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const k = decodeBase64(raw);
  if (k.length !== nacl.secretbox.keyLength) {
    throw new Error(
      `ENCRYPTION_KEY must be ${nacl.secretbox.keyLength} bytes (base64); got ${k.length}`
    );
  }
  return k;
}

/** Encrypt plaintext → "nonceB64:cipherB64". Empty string stays empty. */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(decodeUTF8(plaintext), nonce, key());
  return `${encodeBase64(nonce)}:${encodeBase64(box)}`;
}

/** Decrypt "nonceB64:cipherB64" → plaintext. Empty/invalid → empty string. */
export function decryptSecret(encrypted: string): string {
  if (!encrypted) return "";
  const [nonceB64, cipherB64] = encrypted.split(":");
  if (!nonceB64 || !cipherB64) return "";
  const opened = nacl.secretbox.open(
    decodeBase64(cipherB64),
    decodeBase64(nonceB64),
    key()
  );
  return opened ? encodeUTF8(opened) : "";
}
