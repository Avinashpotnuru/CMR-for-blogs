import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Fragment, type CSSProperties, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { ObjectId } from "mongodb"
import { cn } from "@/lib/utils"
import { getCollection } from "@/lib/mongodb"
import type { CreatePostInput } from "@/lib/validation/post"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { SplitReveal } from "@/components/blog/split-reveal"
import { formatArticleDate, padIndex, readingTime } from "@/lib/format"

export const dynamic = "force-dynamic"

type BlogPostDoc = CreatePostInput & {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
  source?: string
  sourceUrl?: string
  sourcePublishedAt?: Date
}

type BlogPostPageParams = {
  params: Promise<{ slug: string }>
}

type ContentBlock =
  | { kind: "note"; text: string }
  | { kind: "kicker"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string }

const HEADING_RE = /^[A-Z][A-Z0-9 .&'’()!?,:\-]{4,}$/

function parseBlocks(content: string): ContentBlock[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block): ContentBlock => {
      const lines = block.split("\n").map((line) => line.trim())
      if (lines.length === 1) {
        const line = lines[0]
        if (line.startsWith("DRAFT")) return { kind: "note", text: line }
        if (line.startsWith("FIELD BRIEF")) return { kind: "kicker", text: line }
        if (HEADING_RE.test(line)) return { kind: "heading", text: line }
        return { kind: "paragraph", text: line }
      }
      if (lines.every((line) => line.startsWith("• ") || line === "•")) {
        return {
          kind: "list",
          items: lines.map((line) => line.replace(/^•\s?/, "")),
        }
      }
      return { kind: "paragraph", text: lines.join("\n") }
    })
}

function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function linkifyDash(text: string): ReactNode {
  const match = text.match(/^(.*?)\s+—\s+(https?:\/\/\S+)$/)
  if (!match) return text
  return (
    <>
      {match[1]} —{" "}
      <a
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-brand underline decoration-brand/30 underline-offset-4 transition-colors duration-150 hover:decoration-brand"
      >
        {match[2]}
      </a>
    </>
  )
}

async function getCollectionRef() {
  return getCollection<BlogPostDoc>("blogs")
}

async function getPublishedPost(slug: string) {
  const collection = await getCollectionRef()
  return collection.findOne({ slug, status: "published" })
}

async function getNeighbors(slug: string) {
  const collection = await getCollectionRef()
  const posts = await collection
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .toArray()

  const index = posts.findIndex((post) => post.slug === slug)
  if (index === -1) return { older: null, newer: null, index: -1 }

  return {
    older: posts[index + 1] ?? null,
    newer: posts[index - 1] ?? null,
    index,
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageParams): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)

  if (!post) {
    return { title: "Post Not Found" }
  }

  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageParams) {
  const { slug } = await params
  const post = await getPublishedPost(slug)

  if (!post) {
    notFound()
  }

  const { older, newer, index } = await getNeighbors(slug)
  const blocks = parseBlocks(post.content)
  const wordCount = countWords(post.content)
  const titleWords = post.title.split(" ")
  const leadIndex = blocks.findIndex(
    (block) => block.kind === "paragraph" && block.text.trim() !== post.title,
  )
  const lead =
    leadIndex !== -1 && blocks[leadIndex].kind === "paragraph"
      ? blocks[leadIndex].text
      : ""
  const showDropCap =
    lead.length > 160 && /^[a-zA-Z]/.test(lead.trim())

  return (
    <>
      <ReadingProgress />

      <article className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 md:pt-16 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-label text-muted-foreground transition-colors duration-200 ease-out hover:text-brand"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to journal
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 space-y-10">
              <div>
                <p className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                  The journal
                </p>
                <p className="mt-3 font-heading text-2xl tracking-tight text-foreground">
                  Mini Blog
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Field notes, briefs &amp; long reads — updated as the story
                  moves.
                </p>
              </div>

              <dl className="space-y-6 border-l border-border pl-5">
                <div>
                  <dt className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                    Filed under
                  </dt>
                  <dd className="mt-1.5 text-label text-brand">
                    {post.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                    Word count
                  </dt>
                  <dd className="mt-1.5 text-label text-foreground">
                    {wordCount.toLocaleString("en-US")}
                  </dd>
                </div>
                <div>
                  <dt className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                    Reads in
                  </dt>
                  <dd className="mt-1.5 text-label text-foreground">
                    {readingTime(post.content)}
                  </dd>
                </div>
                <div>
                  <dt className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                    Published
                  </dt>
                  <dd className="mt-1.5 text-label text-foreground">
                    {formatArticleDate(post.createdAt)}
                  </dd>
                </div>
                {post.source ? (
                  <div>
                    <dt className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                      Source
                    </dt>
                    <dd className="mt-1.5">
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1 text-label text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-200 hover:text-brand"
                      >
                        {post.source}
                        <ArrowUpRight
                          className="size-3 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-label text-muted-foreground transition-colors duration-200 ease-out hover:text-brand"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                All posts
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-7 lg:col-start-4">
            <header className="relative overflow-hidden">
              <div
                className="hero-glow pointer-events-none absolute -top-44 right-[-22%] h-[44vw] max-h-[460px] w-[58vw] max-w-[580px]"
                aria-hidden
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                  <p className="text-label text-brand">{post.category}</p>
                </div>

                <h1 className="mt-6 text-balance font-heading text-[clamp(2.4rem,5.5vw,4rem)] leading-[1.02] font-medium tracking-[-0.02em]">
                  <SplitReveal>
                    {titleWords.map((word, wordIndex) => (
                      <Fragment key={wordIndex}>
                        {wordIndex > 0 && " "}
                        <span
                          className="sw"
                          style={{ "--i": wordIndex } as CSSProperties}
                        >
                          {word}
                        </span>
                      </Fragment>
                    ))}
                  </SplitReveal>
                </h1>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-label text-muted-foreground">
                  <span className="hidden font-mono text-foreground lg:inline">
                    № {padIndex(index + 1)}
                  </span>
                  <span>{formatArticleDate(post.createdAt)}</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span>{wordCount.toLocaleString("en-US")} words</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span>{readingTime(post.content)}</span>
                  <span className="ml-auto hidden items-center gap-1.5 font-mono text-muted-foreground/60 sm:flex">
                    /blog/{post.slug}
                  </span>
                </div>
              </div>
            </header>

            <blockquote className="mt-12 border-l-2 border-brand/70 pl-6">
              <p className="font-heading text-2xl italic leading-snug text-foreground/85 md:text-[1.72rem]">
                {post.excerpt}
              </p>
            </blockquote>

            <section
              aria-label="Article body"
              className="mt-14 max-w-[64ch]"
            >
              {blocks.map((block, blockIndex) => {
                switch (block.kind) {
                  case "note":
                    return (
                      <p
                        key={blockIndex}
                        className="font-mono text-sm italic leading-relaxed text-muted-foreground"
                      >
                        {block.text}
                      </p>
                    )

                  case "kicker":
                    return (
                      <p
                        key={blockIndex}
                        className="mt-10 flex items-center gap-2 text-label text-brand"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-brand"
                          aria-hidden
                        />
                        {block.text}
                      </p>
                    )

                  case "heading":
                    return (
                      <div
                        key={blockIndex}
                        className="mt-14 flex items-center gap-3"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-brand"
                          aria-hidden
                        />
                        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-foreground">
                          {block.text}
                        </h2>
                        <span className="h-px flex-1 bg-border" aria-hidden />
                      </div>
                    )

                  case "list": {
                    const isLead = blockIndex === leadIndex
                    return (
                      <ul
                        key={blockIndex}
                        className={cn(
                          "space-y-3",
                          isLead ? "mt-10" : "mt-8",
                        )}
                      >
                        {block.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex gap-3 text-[1.05rem] leading-7 text-foreground/90"
                          >
                            <span
                              className="mt-[0.62em] size-1 shrink-0 rounded-full bg-brand/70"
                              aria-hidden
                            />
                            <span className="min-w-0">
                              {linkifyDash(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )
                  }

                  case "paragraph": {
                    if (block.text.trim() === post.title) return null
                    const isLead = blockIndex === leadIndex
                    return (
                      <p
                        key={blockIndex}
                        className={cn(
                          "mt-8 whitespace-pre-wrap text-[1.05rem] leading-[1.95] text-foreground/90",
                          isLead &&
                            "text-lg leading-9 text-foreground md:text-[1.15rem]",
                          isLead && showDropCap && "drop-cap",
                        )}
                      >
                        {linkifyDash(block.text)}
                      </p>
                    )
                  }
                }
              })}

              <div
                aria-hidden
                className="mt-16 flex items-center justify-center gap-3 font-mono text-[11px] tracking-[0.35em] text-muted-foreground/60"
              >
                <span>*</span>
                <span>*</span>
                <span>*</span>
              </div>
            </section>
          </div>
        </div>

        {(older || newer) && (
          <nav
            aria-label="Post navigation"
            className="mb-20 mt-20 border-t border-border"
          >
            <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {older ? (
                <Link
                  href={`/blog/${older.slug}`}
                  className="group flex flex-col gap-2.5 p-6 transition-colors duration-200 ease-out hover:bg-muted sm:p-8"
                >
                  <span className="text-label text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground">
                    ← Older post
                  </span>
                  <span className="text-balance font-heading text-xl leading-snug font-medium tracking-tight transition-colors duration-200 ease-out group-hover:text-brand md:text-2xl">
                    {older.title}
                  </span>
                </Link>
              ) : null}

              {newer ? (
                <Link
                  href={`/blog/${newer.slug}`}
                  className="group flex flex-col justify-end gap-2.5 p-6 text-left transition-colors duration-200 ease-out hover:bg-muted sm:items-end sm:p-8"
                >
                  <span className="text-label text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground">
                    Newer post{" "}
                    <ArrowUpRight className="inline size-3.5" aria-hidden />
                  </span>
                  <span className="text-balance font-heading text-xl leading-snug font-medium tracking-tight transition-colors duration-200 ease-out group-hover:text-brand sm:text-right md:text-2xl">
                    {newer.title}
                  </span>
                </Link>
              ) : null}
            </div>
          </nav>
        )}
      </article>
    </>
  )
}