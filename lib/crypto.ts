import crypto from "crypto"

export function generateApiKey(): string {
  return `gd_${crypto.randomBytes(32).toString("hex")}`
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex")
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))
}
