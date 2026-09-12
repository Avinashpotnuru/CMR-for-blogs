"use client"

import { useEffect, useRef, useState } from "react"

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const ticking = useRef(false)

  useEffect(() => {
    const update = () => {
      ticking.current = false
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight
      setProgress(
        scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0,
      )
    }

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(update)
    }

    const raf = requestAnimationFrame(update)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-60">
      <div
        className="h-0.5 origin-left bg-accent transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
