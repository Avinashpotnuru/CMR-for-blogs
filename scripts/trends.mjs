const base = process.env.BLOG_URL || "http://localhost:3000"
const secret = process.env.TRENDS_CRON_SECRET || ""
const count = process.env.TRENDS_COUNT || "6"
const rebuild = process.env.TRENDS_REBUILD || ""

const url = new URL("/api/trends/refresh", base)
if (rebuild) {
  url.searchParams.set("rebuild", rebuild)
} else {
  url.searchParams.set("count", count)
}
if (secret) url.searchParams.set("secret", secret)

const res = await fetch(url)
const body = await res.json()

console.log(res.ok ? "OK" : `HTTP ${res.status}`)
console.log(JSON.stringify(body, null, 2))

if (!res.ok) process.exit(1)