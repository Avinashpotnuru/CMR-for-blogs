const encoder = new TextEncoder()

const SESSION_COOKIE = "admin_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function toBufferSource(value: Uint8Array): BufferSource {
  return value as BufferSource
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD
  return encoder.encode(secret ?? "mini-blog-local-secret")
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toBufferSource(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = ""
  for (const byte of input) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
  return atob(padded)
}

function base64UrlDecodeBytes(input: string): Uint8Array {
  const raw = base64UrlDecode(input)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export async function createSession(email: string): Promise<string> {
  const payload = JSON.stringify({
    email,
    exp: Date.now() + SESSION_TTL_MS,
  })
  const payloadB64 = base64UrlEncode(encoder.encode(payload))
  const key = await importKey()
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    toBufferSource(encoder.encode(payloadB64)),
  )
  return `${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`
}

export async function verifySession(
  token: string,
): Promise<{ email: string } | null> {
  const lastDot = token.lastIndexOf(".")
  if (lastDot === -1) return null

  const payload = token.slice(0, lastDot)
  const signature = token.slice(lastDot + 1)

  try {
    const key = await importKey()
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      toBufferSource(base64UrlDecodeBytes(signature)),
      toBufferSource(encoder.encode(payload)),
    )
    if (!valid) return null

    const data = JSON.parse(base64UrlDecode(payload)) as {
      email?: unknown
      exp?: unknown
    }
    if (typeof data.email !== "string" || data.email.length === 0) return null
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null

    return { email: data.email }
  } catch {
    return null
  }
}

export function sessionCookieHeader(token: string): string {
  const base = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  return process.env.VERCEL === "true" || process.env.VERCEL === "1" ? `${base}; Secure` : base
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}