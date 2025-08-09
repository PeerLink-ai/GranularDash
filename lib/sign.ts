import crypto from "crypto"

function b64url(input: Buffer | string) {
  const base = (input instanceof Buffer ? input : Buffer.from(input))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  return base
}

function b64urlJSON(obj: unknown) {
  return b64url(Buffer.from(JSON.stringify(obj)))
}

function fromB64url(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = 4 - (input.length % 4)
  if (pad !== 4) input = input + "=".repeat(pad)
  return Buffer.from(input, "base64")
}

export function signToken(payload: Record<string, unknown>, secret = process.env.JWT_SECRET || "dev-secret") {
  const header = { alg: "HS256", typ: "JWT" }
  const h = b64urlJSON(header)
  const p = b64urlJSON(payload)
  const data = `${h}.${p}`
  const sig = crypto.createHmac("sha256", secret).update(data).digest()
  return `${data}.${b64url(sig)}`
}

export function verifyToken(token: string, secret = process.env.JWT_SECRET || "dev-secret") {
  const parts = token.split(".")
  if (parts.length !== 3) return { valid: false, payload: null as any }
  const [h, p, s] = parts
  const data = `${h}.${p}`
  const expected = b64url(crypto.createHmac("sha256", secret).update(data).digest())
  if (crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) {
    const payload = JSON.parse(fromB64url(p).toString("utf8"))
    if (payload.exp && typeof payload.exp === "number" && Date.now() > payload.exp) {
      return { valid: false, payload: null as any }
    }
    return { valid: true, payload }
  }
  return { valid: false, payload: null as any }
}
