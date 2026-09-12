import type { Metadata } from "next"
import Link from "next/link"
import { Fragment, type CSSProperties } from "react"
import { ArrowUpRight } from "lucide-react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import type { CreatePostInput } from "@/lib/validation/post"
import { Reveal } from "@/components/blog/reveal"
import { HeroParallax } from "@/components/blog/hero-parallax"
import { SplitReveal } from "@/components/blog/split-reveal"
import { formatListDate, padIndex, readingTime } from "@/lib/format"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "The Journal",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    title: "The Journal | Mini Blog",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Journal | Mini Blog",
    description: SITE_DESCRIPTION,
  },
}

export const revalidate = 300

const HERO_TITLE: { word: string; accent?: boolean }[] = [
  { word: "Notes" },
  { word: "from" },
  { word: "the" },
  { word: "craft" },
  { word: "of" },
  { word: "building" },
  { word: "for", accent: true },
  { word: "the", accent: true },
  { word: "web.", accent: true },
]

const TICKER = [
  "Development",
  "Design",
  "Typography",
  "Databases",
  "Performance",
  "Editorial",
  "The Craft",
  "Notes",
]

function TickerStrip() {
  return (
    <div
      aria-hidden
      className="overflow-hidden whitespace-nowrap border-b border-border py-3.5 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="inline-flex w-max motion-safe:animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {TICKER.map((item) => (
              <span key={item} className="flex items-center">
                <span className="text-label px-5 text-muted-foreground">
                  {item}
                </span>
                <span className="text-label text-brand" aria-hidden>
                  *
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

type BlogPostDoc = CreatePostInput & {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

export default async function BlogPage() {
  const collection = await getCollection<BlogPostDoc>("blogs")
  const posts = await collection
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .toArray()

  const [featured, ...rest] = posts

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      <HeroParallax className="relative overflow-hidden border-b border-border pb-12 pt-14 md:pb-16 md:pt-20">
        <div
          aria-hidden
          className="hero-glow pointer-events-none absolute -top-10 right-[-6%] h-[62vw] max-h-[640px] w-[62vw] max-w-[640px]"
        />
        <div
          aria-hidden
          className="hero-glow-blue pointer-events-none absolute top-[38%] left-[-14%] h-[54vw] max-h-[560px] w-[54vw] max-w-[560px]"
        />
        <div className="motion-safe:animate-rise flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden />
          <p className="text-label text-brand">The Journal</p>
        </div>

        <h1 className="mt-6 max-w-[16ch] text-balance font-heading text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.92] font-medium tracking-[-0.03em]">
          <SplitReveal>
            {HERO_TITLE.map((item, index) => (
              <Fragment key={index}>
                {index > 0 && " "}
                <span
                  className={`sw${item.accent ? " is-accent" : ""}`}
                  style={{ "--i": index } as CSSProperties}
                >
                  {item.word}
                </span>
              </Fragment>
            ))}
          </SplitReveal>
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground motion-safe:animate-rise [animation-delay:180ms] md:text-lg">
          Field notes on development, design, and the long, patient work of
          shipping things on the internet — written down before they fade.
        </p>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-border pt-4 motion-safe:animate-rise [animation-delay:260ms]">
          <div className="flex items-center gap-3">
            <span
              className="relative block h-10 w-px overflow-hidden bg-border/60"
              aria-hidden
            >
              <span className="absolute inset-x-0 h-3 bg-brand motion-safe:animate-scroll-line" />
            </span>
            <span className="text-label text-muted-foreground">Scroll</span>
          </div>
          <p className="text-label text-muted-foreground">
            {posts.length} published {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </HeroParallax>

      <TickerStrip />

      {!featured ? (
        <section className="py-24 text-center">
          <h2 className="text-balance font-heading text-4xl font-medium tracking-tight md:text-5xl">
            Nothing written yet.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            The journal opens with the first published post. Until then, the
            page stays deliberately quiet.
          </p>
          <Link
            href="/admin/posts/new"
            className="mt-9 inline-flex items-center gap-1.5 text-label text-foreground transition-colors duration-200 ease-out hover:text-brand"
          >
            Start writing <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      ) : (
        <>
          <Reveal className="border-b border-border py-12 md:py-16">
            <article className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-6">
                <div className="flex items-center gap-3">
                  <p className="text-label text-brand">Featured</p>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>

                <h2 className="mt-6 text-balance font-heading text-4xl font-medium leading-[1.05] tracking-tight md:text-[3.25rem]">
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="bg-[linear-gradient(to_right,var(--brand),var(--brand))] bg-[length:0%_0.075em] bg-[position:0_92%] bg-no-repeat transition-[background-size] duration-300 ease-out hover:bg-[length:100%_0.075em]"
                  >
                    {featured.title}
                  </Link>
                </h2>

                <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-muted-foreground line-clamp-3">
                  {featured.excerpt}
                </p>

                <p className="mt-6 text-label text-muted-foreground">
                  {featured.category} · {readingTime(featured.content)}
                </p>
              </div>

              <div className="flex flex-col justify-between gap-10 lg:col-span-5 lg:col-start-8">
                <p
                  className="font-heading text-7xl font-medium tracking-tight text-muted-foreground/40 md:text-8xl"
                  aria-hidden
                >
                  № 01
                </p>

                <Link
                  href={`/blog/${featured.slug}`}
                  className="group flex items-center justify-between gap-6 border-t border-border pt-5"
                >
                  <span className="text-label text-foreground transition-colors duration-200 ease-out group-hover:text-brand">
                    Read the story
                  </span>
                  <ArrowUpRight
                    className="size-5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1"
                    aria-hidden
                  />
                </Link>
              </div>
            </article>
          </Reveal>

          {rest.length > 0 && (
            <section aria-label="All posts" className="pb-24">
              <ul>
                {rest.map((post, index) => (
                  <Reveal
                    as="li"
                    key={post._id.toString()}
                    delay={Math.min(index * 60, 240)}
                    className="group border-b border-border py-9"
                  >
                    <article className="grid gap-x-8 gap-y-4 md:grid-cols-12 md:items-start">
                      <div className="md:col-span-3">
                        <p
                          className="font-heading text-2xl font-medium tracking-tight text-muted-foreground/40 md:text-3xl"
                          aria-hidden
                        >
                          {padIndex(index + 2)}
                        </p>
                        <p className="mt-2 text-label text-muted-foreground">
                          {post.category}
                        </p>
                      </div>

                      <div className="md:col-span-6">
                        <h2 className="text-balance font-heading text-2xl font-medium leading-snug tracking-tight md:text-[1.75rem]">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="transition-colors duration-200 ease-out group-hover:text-brand"
                          >
                            {post.title}
                          </Link>
                        </h2>
                        <p className="mt-3 max-w-[65ch] text-[0.9375rem] leading-relaxed text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-end justify-between gap-6 md:col-span-3 md:flex-col md:items-end md:gap-10 md:pt-1.5">
                        <time
                          dateTime={post.createdAt.toISOString()}
                          className="text-label text-muted-foreground"
                        >
                          {formatListDate(post.createdAt)}
                        </time>
                        <Link
                          href={`/blog/${post.slug}`}
                          aria-label={`Read ${post.title}`}
                          className="inline-flex items-center gap-1.5 text-label text-foreground transition-colors duration-200 ease-out group-hover:text-brand"
                        >
                          Read
                          <ArrowUpRight
                            className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            aria-hidden
                          />
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}