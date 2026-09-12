const LIST_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })
const FULL_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "long" })

const DAY = 86_400_000

export function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 225))
  return `${minutes} min read`
}

export function padIndex(value: number): string {
  return String(value).padStart(2, "0")
}

export function formatListDate(date: Date): string {
  const diff = Date.now() - date.getTime()

  if (diff >= 0 && diff < DAY) return "today"
  if (diff >= DAY && diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`

  return LIST_DATE.format(date)
}

export function formatArticleDate(date: Date): string {
  return FULL_DATE.format(date)
}
