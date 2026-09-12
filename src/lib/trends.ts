import { ObjectId, type Collection } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import type { CreatePostInput } from "@/lib/validation/post"

export type CommunityComment = {
  text: string
  by: string
  points: number
}

export type TrendItem = {
  title: string
  source: string
  sourceUrl: string
  category: string
  summary: string
  publishedAt?: string
  points?: number
  comments?: number
  community?: CommunityComment[]
  related?: string[]
  discussionUrl?: string
}

type BlogPostDoc = CreatePostInput & {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
  source?: string
  sourceUrl?: string
  sourcePublishedAt?: string
}

type RefreshResult = {
  ok: boolean
  added: { title: string; slug: string; source: string }[]
  skipped: string[]
  sources: { hackerNews: boolean; googleTrends: boolean }
}

const FETCH_TIMEOUT_MS = 12_000
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0"

const CATEGORY_RULES: { regex: RegExp; category: string }[] = [
  { regex: /javascript|react|vue|svelte|node|npm|typescript|frontend/i, category: "Web Development" },
  { regex: /python|django|flask|pandas|pypi/i, category: "Python" },
  { regex: /rust|async rust|ferrous/i, category: "Rust" },
  { regex: /database|sql|postgres|mongo|mysql|cockroach|query/i, category: "Databases" },
  { regex: /security|exploit|breach|vulnerab|cve|ransom|zero[- ]day/i, category: "Security" },
  { regex: /css|html|design|ui|typography|font|a11y|accessib/i, category: "Design" },
  { regex: /cloud|aws|kubernetes|docker|serverless|infra/i, category: "Cloud & DevOps" },
  { regex: /\bai\b|llm|openai|anthropic|gpt|claude|gemini|generative|machine learning/i, category: "AI" },
]

const CONTEXT_BY_CATEGORY: Record<string, string> = {
  "Web Development":
    "Frontend and web tooling has been moving fast, in no small part because the platform keeps absorbing work that used to require libraries. Teams keep re-evaluating what a framework must be and what should simply ship in the browser.",
  Python:
    "Python keeps expanding from scripting into heavier application work, and the community has been pushing on packaging, performance, and tooling. Stories here usually reflect either a practical win for working developers or a shift in how Python projects are put together.",
  Rust:
    "Rust has been moving out of systems programming into tools, libraries, and application backends. Its safety story makes it the first choice anywhere memory bugs are expensive, and momentum depends on lowering the barrier to entry.",
  Databases:
    "The database space is being reshaped by cost, scale, and a hunger for simpler defaults. A strong story here usually means engineering teams are questioning heavyweight architecture and betting on leaner, more focused data systems.",
  Security:
    "Security stories rarely stay academic for long — a vulnerability gets used quickly, so the useful response is practical and fast. The thread to follow is what to check first and how to reduce exposure.",
  Design:
    "Design coverage here leans into craft: typography, layout systems, accessibility, and the seams between design and code. Reads tend to be opinionated about taste, performance, and whether a trend actually improves the experience.",
  "Cloud & DevOps":
    "Cloud and infrastructure coverage is where cost, scale, and drift problems concentrate. Strong stories usually reflect operators simplifying, cutting spend, or hardening pipelines — something with a measurable before and after.",
  AI:
    "AI news moves on model releases, research breakthroughs, and the comparisons around them. The community spends its energy on what these systems do well, where they fail, and what they mean for software work.",
  Trending:
    "Trending queries spike around a specific moment — an event, a release, or a conversation happening right now. The interest is volatile, so the useful angle is why people are searching and what the data points to.",
  Technology:
    "Front-page technology stories tend to be about new capabilities, clever engineering, and contrarian takes on established tools. The signal to follow is whether the idea holds up in everyday use.",
}

const WHY_BY_CATEGORY: Record<string, string> = {
  "Web Development":
    "If this reads like a shift in how frontends are built, it is worth writing through: the cost of a big stack is easier to cut than it used to be, and teams that move early tend to set the terms.",
  Python:
    "The practical question is whether this makes daily Python work meaningfully better or just trends on a slower release path. Either way it reflects where the ecosystem is spending its energy.",
  Rust:
    "Adoption stories here are usually about more than the language itself — they signal where reliability problems are becoming expensive enough to justify the migration cost.",
  Databases:
    "The interesting part is rarely the tool itself and usually the workload it wins. Capture what it replaces and what it costs to switch.",
  Security:
    "Act fast — any notable finding tends to be weaponized quickly. The practical value is in clear guidance on exposure and remediation, not commentary.",
  Design:
    "Design trends earn or lose credibility on the seam between the mockup and the shipped product. Focus on what is actually better to use, not what looks new.",
  "Cloud & DevOps":
    "The angle is usually money and reliability: what stays up, what stops fattening the bill, and what the operator no longer has to babysit.",
  AI:
    "The noise is heavy, so the signal is specificity: what it actually does, what it costs, and the concrete job a real user hands it. Avoid the comparison-game rabbit hole.",
  Trending:
    "Search spikes are a snapshot, not a verdict. The useful post explains the moment, then checks whether the interest survives a day or two.",
  Technology:
    "The durable question is whether the idea survives contact with real workloads: first impressions are cheap, maintenance costs are not.",
}

function contextFor(category: string): string {
  return CONTEXT_BY_CATEGORY[category] ?? CONTEXT_BY_CATEGORY.Technology
}

function whyFor(category: string): string {
  return WHY_BY_CATEGORY[category] ?? WHY_BY_CATEGORY.Technology
}

function pickCategory(title: string, fallback: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(title)) return rule.category
  }
  return fallback
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Bad response ${res.status} for ${url}`)
  return res.json()
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/xml, text/xml, text/plain, */*",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Bad response ${res.status} for ${url}`)
  return res.text()
}

async function poolMap<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    results.push(...(await Promise.all(chunk.map(fn))))
  }
  return results
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeEntities(input: string): string {
  return input
    .replace(/&#(?:x[a-fA-F0-9]{1,6}|[0-9]{1,7});/g, (match) =>
      String.fromCharCode(
        match.startsWith("&#x")
          ? parseInt(match.slice(3, -1), 16)
          : Number(match.slice(2, -1)),
      ),
    )
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim()
}

function decodeXml(input: string): string {
  return input
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\[\+\d+\]/g, "")
    .trim()
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}

function excerptOf(summary: string): string {
  return summary.slice(0, 240)
}

function formatWhen(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

type HnStory = {
  id?: number
  type?: string
  title?: string
  url?: string
  score?: number
  descendants?: number
  text?: string
  time?: number
  kids?: number[]
}

type HnComment = {
  type?: string
  by?: string
  text?: string
  score?: number
  deleted?: boolean
  dead?: boolean
}

function commentExcerpt(text: string, max = 320): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const cut = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf(": "),
    slice.lastIndexOf("\n"),
  )
  if (cut > 160) return `${slice.slice(0, cut + 1).trim()} …`
  const space = slice.lastIndexOf(" ")
  return space > 160 ? `${slice.slice(0, space).trim()} …` : `${slice.trim()}…`
}

async function fetchCommunity(kids: number[]): Promise<CommunityComment[]> {
  if (kids.length === 0) return []
  const fetched = await poolMap(kids.slice(0, 8), 8, async (kidId) => {
    try {
      const kid = (await fetchJson(
        `https://hacker-news.firebaseio.com/v0/item/${kidId}.json`,
      )) as HnComment
      const text = kid.text?.trim()
      if (kid.deleted || kid.dead || !text || !kid.by) return null
      const clean = decodeEntities(stripHtml(text))
      if (clean.length < 40) return null
      return { text: commentExcerpt(clean), by: kid.by, points: kid.score ?? 0 }
    } catch {
      return null
    }
  })

  return fetched
    .filter((comment): comment is CommunityComment => comment !== null)
    .sort((a, b) => b.points - a.points)
    .slice(0, 4)
}

async function storyToTrendItem(item: HnStory): Promise<TrendItem> {
  const title = item.title!.trim()
  const summary = item.text?.trim()
    ? truncate(decodeEntities(stripHtml(item.text)), 280)
    : `“${title}” is trending on Hacker News with ${item.score ?? 0} points and ${item.descendants ?? 0} comments.`

  return {
    title,
    source: "Hacker News",
    sourceUrl: item.url!,
    category: pickCategory(title, "Technology"),
    summary,
    publishedAt: item.time
      ? new Date(item.time * 1000).toISOString()
      : undefined,
    points: item.score,
    comments: item.descendants,
    community: await fetchCommunity(item.kids ?? []),
    discussionUrl: item.id
      ? `https://news.ycombinator.com/item?id=${item.id}`
      : undefined,
  }
}

async function fetchHackerNews(count: number): Promise<TrendItem[]> {
  const ids = (await fetchJson(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  )) as number[]

  const stories = await poolMap(ids.slice(0, 90), 12, async (id) => {
    try {
      return (await fetchJson(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      )) as HnStory
    } catch {
      return null
    }
  })

  const valid = stories
    .filter(
      (item): item is HnStory =>
        item !== null &&
        item.type === "story" &&
        Boolean(item.title) &&
        Boolean(item.url),
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, count)

  return Promise.all(valid.map(storyToTrendItem))
}

async function findHnTrendItem(
  sourceUrl: string,
  sourceTitle: string,
): Promise<TrendItem | undefined> {
  const ids = (await fetchJson(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  )) as number[]

  const stories = await poolMap(ids.slice(0, 90), 12, async (id) => {
    try {
      return (await fetchJson(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      )) as HnStory
    } catch {
      return null
    }
  })

  const match = stories.find(
    (item) =>
      item !== null &&
      (item.url === sourceUrl || item.title?.trim() === sourceTitle),
  )

  return match ? storyToTrendItem(match) : undefined
}

function extractTag(block: string, tag: string): string | undefined {
  const escaped = tag.replace(/\//g, "\\/").replace(/\./g, "\\.")
  const match = block.match(
    new RegExp(`<${escaped}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${escaped}>`),
  )
  return match?.[1].trim()
}

async function fetchGoogleTrends(count: number): Promise<TrendItem[]> {
  const xml = await fetchText("https://trends.google.com/trending/rss?geo=US")
  const items: TrendItem[] = []

  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1]
    const title = extractTag(block, "title")
    if (!title) continue

    const link = extractTag(block, "link")
    const publishedAt = extractTag(block, "pubDate")
    const snippet =
      extractTag(block, "ht:news_item_snippet") ??
      extractTag(block, "ht:news_item_title")
    const related = [
      ...block.matchAll(
        /<ht:news_item_title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/ht:news_item_title>/g,
      ),
    ]
      .map((item) => decodeXml(item[1]))
      .filter(Boolean)
      .slice(0, 3)

    items.push({
      title: decodeXml(title),
      source: "Google Trends",
      sourceUrl: link ? decodeXml(link) : "https://trends.google.com/",
      category: pickCategory(title, "Trending"),
      summary: excerptOf(decodeXml(snippet ?? title)),
      publishedAt,
      related,
    })
  }

  return items.slice(0, count)
}

function hnBrief(item: TrendItem, publishedAt: string): string {
  const lines: string[] = [
    `DRAFT — auto-brief generated from ${item.source} · ${formatWhen(publishedAt)}. Review and rewrite before publishing.`,
    "",
    `FIELD BRIEF · ${item.category}`,
    "",
    item.title,
    "",
    "THE STORY",
    "",
    `“${item.title}” is on the front page of Hacker News right now — ${item.points ?? "dozens of"} points and ${item.comments ?? 0} comments at last count${item.publishedAt ? `, first surfacing ${formatWhen(item.publishedAt)}` : ""}.`,
    "",
    contextFor(item.category),
    "",
    "THE SIGNAL",
    "",
    `• ${item.points ?? "n/a"} points on Hacker News`,
    `• ${item.comments ?? 0} comments in the thread`,
    `• Category: ${item.category}`,
    "",
    "WHY IT MATTERS",
    whyFor(item.category),
    "",
  ]

  const community = item.community ?? []
  if (community.length > 0) {
    lines.push("WHAT THE COMMUNITY IS SAYING")
    lines.push("")
    for (const comment of community) {
      lines.push(`• “${comment.text}” — ${comment.by} (${comment.points} pts)`)
    }
    lines.push("")
  }

  lines.push("WHERE TO GO NEXT")
  lines.push("")
  if (item.discussionUrl) {
    lines.push(`• Open the Hacker News thread — ${item.discussionUrl}`)
  }
  lines.push(`• Original article — ${item.sourceUrl}`)
  lines.push("")
  lines.push("OPEN QUESTIONS FOR THE POST")
  lines.push("")
  lines.push("• What happened, and who moved first?")
  lines.push("• Does it change the day-to-day work of the people it affects?")
  lines.push("• What would a skeptic say — where is the claim thin?")
  lines.push("• If this becomes durable, what is the second-order effect?")
  lines.push("")
  lines.push(
    "Rewrite this brief in your own voice, verify the details against the source, and then publish.",
  )

  return lines.join("\n")
}

function gtBrief(item: TrendItem, publishedAt: string): string {
  const lines: string[] = [
    `DRAFT — auto-brief generated from ${item.source} · ${formatWhen(publishedAt)}. Review and rewrite before publishing.`,
    "",
    `FIELD BRIEF · ${item.category}`,
    "",
    item.title,
    "",
    "THE SURGE",
    `“${item.title}” is climbing the US search chart right now, first registered ${formatWhen(publishedAt)}.`,
    "",
    contextFor(item.category),
    "",
    "WHY IT MATTERS",
    whyFor(item.category),
    "",
    "WHAT PEOPLE ARE READING",
  ]

  const reads = (item.related ?? []).filter(Boolean)
  lines.push(`• ${reads[0] ?? item.summary}`)
  for (const read of reads.slice(1)) {
    lines.push(`• ${read}`)
  }
  lines.push("")
  lines.push("QUESTIONS FOR THIS POST")
  lines.push("")
  lines.push("• What actually triggered the spike?")
  lines.push("• Is the interest an event or a durable shift?")
  lines.push("• Who is searching, and what are they trying to solve?")
  lines.push("")
  lines.push("SOURCES")
  lines.push(`• Trending query — ${item.sourceUrl}`)
  lines.push("")

  return lines.join("\n")
}

function draftContent(item: TrendItem, publishedAt: string): string {
  return item.source === "Hacker News"
    ? hnBrief(item, publishedAt)
    : gtBrief(item, publishedAt)
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "")
  return slug || "trending-topic"
}

async function uniqueSlug(
  collection: Collection<BlogPostDoc>,
  base: string,
  attempt = 0,
): Promise<string> {
  const slug = attempt === 0 ? base : `${base}-${attempt}`
  const exists = await collection.findOne({ slug })
  if (!exists) return slug
  if (attempt > 40) return `${base}-${Date.now().toString(36)}`
  return uniqueSlug(collection, base, attempt + 1)
}

export async function refreshTrends(count = 6): Promise<RefreshResult> {
  const collection = await getCollection<BlogPostDoc>("blogs")

  const [hackerNewsItems, googleTrendsItems] = await Promise.all([
    fetchHackerNews(count).catch(() => [] as TrendItem[]),
    fetchGoogleTrends(count).catch(() => [] as TrendItem[]),
  ])

  const hnCount = Math.min(hackerNewsItems.length, Math.ceil(count * 0.6))
  const ordered = [
    ...hackerNewsItems.slice(0, hnCount),
    ...googleTrendsItems.slice(0, Math.max(0, count - hnCount)),
  ]

  const added: RefreshResult["added"] = []
  const skipped: string[] = []

  for (const item of ordered) {
    if (added.length >= count) break

    const existing = await collection.findOne({
      $or: [{ sourceUrl: item.sourceUrl }, { title: item.title }],
    })
    if (existing) {
      skipped.push(`${item.title} (${item.source})`)
      continue
    }

    const now = new Date()
    const publishedAt = item.publishedAt ?? now.toISOString()
    const slug = await uniqueSlug(collection, slugify(item.title))

    const doc: BlogPostDoc = {
      _id: new ObjectId(),
      title: item.title.slice(0, 120),
      slug,
      excerpt: excerptOf(item.summary),
      content: draftContent(item, publishedAt),
      category: item.category,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      source: item.source,
      sourceUrl: item.sourceUrl,
      sourcePublishedAt: publishedAt,
    }

    await collection.insertOne(doc)
    added.push({ title: doc.title, slug, source: item.source })
  }

  return {
    ok: true,
    added,
    skipped,
    sources: {
      hackerNews: hackerNewsItems.length > 0,
      googleTrends: googleTrendsItems.length > 0,
    },
  }
}

export async function rebuildTrend(
  slug: string,
): Promise<{ ok: boolean; title?: string; source?: string } | null> {
  const collection = await getCollection<BlogPostDoc>("blogs")
  const existing = await collection.findOne({ slug })
  if (!existing?.source) return null

  let item: TrendItem | undefined
  if (existing.source === "Hacker News") {
    item = await findHnTrendItem(existing.sourceUrl ?? "", existing.title)
  } else {
    item = (await fetchGoogleTrends(100)).find(
      (trend) =>
        trend.sourceUrl === existing.sourceUrl ||
        trend.title === existing.title,
    )
  }

  if (!item) return null

  const publishedAt =
    existing.sourcePublishedAt ?? existing.createdAt.toISOString()

  await collection.updateOne(
    { _id: existing._id },
    {
      $set: {
        excerpt: excerptOf(item.summary),
        content: draftContent(item, publishedAt),
        category: item.category,
        updatedAt: new Date(),
      },
    },
  )

  return { ok: true, title: existing.title, source: item.source }
}