"use client"

import { useEffect, useRef, type ReactNode } from "react"

export function SplitReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (
      !("requestAnimationFrame" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    const raf = requestAnimationFrame(() => node.classList.add("is-ready"))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <span ref={ref} className="split-reveal">
        {children}
      </span>
      <noscript>
        <style>{".split-reveal .sw{transform:none!important}"}</style>
      </noscript>
    </>
  )
}