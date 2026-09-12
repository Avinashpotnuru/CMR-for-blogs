"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

const NAV_LINK =
  "relative py-1 text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100"

export function SiteHeader() {
  const ref = useRef<HTMLElement | null>(null)
  const scrolled = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let raf = 0

    const update = () => {
      raf = 0
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      )
      const active = window.scrollY / max > 0.25
      if (active !== scrolled.current) {
        scrolled.current = active
        node.classList.toggle("is-scrolled", active)
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <header
      ref={ref}
      className="site-header sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-md motion-safe:animate-rise"
    >
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="group flex items-center gap-2.5 font-heading text-xl font-medium tracking-tight text-foreground"
        >
          <span
            className="size-1.5 rounded-full bg-brand transition-transform duration-500 ease-out group-hover:scale-150"
            aria-hidden
          />
          Mini&nbsp;Blog
        </Link>

        <div className="flex items-center gap-7 text-label">
          <Link
            href="/blog"
            className={`${NAV_LINK} text-foreground after:scale-x-100`}
          >
            Journal
          </Link>
          <Link href="/admin" className={NAV_LINK}>
            Admin
          </Link>
        </div>
      </nav>
    </header>
  )
}