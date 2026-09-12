import { createHash, timingSafeEqual } from "crypto"
import { createSession, sessionCookieHeader } from "@/lib/auth"

export const dynamic = "force-dynamic"

function safeEqual(a: unknown, b: unknown): boolean {
  const hash = (value: unknown) =>
    createHash("sha256")
      .update(value == null ? "" : String(value))
      .digest()
  const left = hash(a)
  const right = hash(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null)
  const email = typeof raw?.email === "string" ? raw.email.trim() : ""
  const password = typeof raw?.password === "string" ? raw.password : ""

  const expectedEmail = process.env.ADMIN_EMAIL
  const expectedPassword = process.env.ADMIN_PASSWORD
  if (!expectedEmail || !expectedPassword) {
    return Response.json(
      { error: "Admin auth is not configured. Add ADMIN_EMAIL and ADMIN_PASSWORD." },
      { status: 500 },
    )
  }

  const emailOk = safeEqual(email, expectedEmail)
  const passwordOk = safeEqual(password, expectedPassword)
  if (!emailOk || !passwordOk) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = await createSession(expectedEmail)
  const response = Response.json({ ok: true })
  response.headers.append("Set-Cookie", sessionCookieHeader(token))
  return response
}