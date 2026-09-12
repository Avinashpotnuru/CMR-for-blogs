import { clearSessionCookieHeader } from "@/lib/auth"

export async function GET(request: Request) {
  const loginUrl = new URL("/admin/login", request.url).toString()
  return new Response(null, {
    status: 303,
    headers: {
      Location: loginUrl,
      "Set-Cookie": clearSessionCookieHeader(),
    },
  })
}

export async function POST(request: Request) {
  return GET(request)
}