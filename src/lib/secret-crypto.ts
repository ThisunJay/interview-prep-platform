import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET ?? process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("SESSION_SECRET is required to encrypt secrets");
  }
  return createHash("sha256").update(secret).digest();
}

/** Encrypt a secret for DB storage. Format: iv:tag:ciphertext (base64). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/** Decrypt a secret previously stored with encryptSecret. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
