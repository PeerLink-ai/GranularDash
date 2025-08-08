import crypto from "crypto"

const SECRET_SOURCE =
  process.env.STACK_SECRET_SERVER_KEY ||
  process.env.JWT_SECRET ||
  "fallback-secret-key-change-me"

function getKeyAndIv() {
  // Derive a 32-byte key via scrypt, generate a random 12-byte IV
  const key = crypto.scryptSync(SECRET_SOURCE, "agent-salt", 32)
  const iv = crypto.randomBytes(12) // recommended for AES-GCM
  return { key, iv }
}

export function encryptSecret(plain: string | null | undefined): string | null {
  if (!plain) return null
  const { key, iv } = getKeyAndIv()
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = {
    v: 1,
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  }
  return JSON.stringify(payload)
}

// Included for completeness; not used in this flow.
export function decryptSecret(encryptedJson: string | null | undefined): string | null {
  if (!encryptedJson) return null
  try {
    const payload = JSON.parse(encryptedJson) as {
      v: number
      iv: string
      data: string
      tag: string
    }
    const key = crypto.scryptSync(SECRET_SOURCE, "agent-salt", 32)
    const iv = Buffer.from(payload.iv, "base64")
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64")),
      decipher.final(),
    ])
    return decrypted.toString("utf8")
  } catch {
    return null
  }
}
