import { revalidatePath } from "next/cache"
import { rebuildTrend, refreshTrends } from "@/lib/trends"

export const dynamic = "force-dynamic"

function isAuthorized(request: Request): boolean {
  const secret = process.env.TRENDS_CRON_SECRET
  if (!secret) return true

  const bearer = request.headers.get("authorization")
  const query = new URL(request.url).searchParams.get("secret")
  return bearer === `Bearer ${secret}` || query === secret
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const rebuildSlug = url.searchParams.get("rebuild")

    if (rebuildSlug) {
      const result = await rebuildTrend(rebuildSlug)
      if (!result) {
        return Response.json(
          { error: "No auto-generated post found for that slug" },
          { status: 404 },
        )
      }
      revalidatePath("/blog", "layout")
      return Response.json(result)
    }

    const count = Math.min(
      12,
      Math.max(1, Number(url.searchParams.get("count")) || 6),
    )
    const result = await refreshTrends(count)
    revalidatePath("/blog", "layout")
    return Response.json(result)
  } catch (error) {
    return Response.json(
      {
        error: "Failed to refresh trends",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}