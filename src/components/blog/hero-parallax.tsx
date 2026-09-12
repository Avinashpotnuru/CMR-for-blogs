"use client"

import { useEffect, useRef, type ReactNode } from "react"

export function HeroParallax({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const hero = heroRef.current
    const layer = layerRef.current
    if (!hero || !layer) return

    if (!("matchMedia" in window) || !("requestAnimationFrame" in window)) return
    const desktop = window.matchMedia("(min-width: 768px)")
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    let willChange = false

    const apply = () => {
      raf = 0
      const rect = hero.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) return

      const progress = Math.min(1, Math.max(0, -rect.top / rect.height))
      layer.style.transform = `translate3d(0, ${progress * -44}px, 0)`
      layer.style.opacity = String(1 - progress * 0.55)

      if (progress > 0 && !willChange) {
        layer.style.willChange = "transform, opacity"
        willChange = true
      }
    }

    const onScroll = () => {
      if (desktop.matches && !raf) raf = requestAnimationFrame(apply)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      layer.style.transform = ""
      layer.style.opacity = ""
      layer.style.willChange = ""
    }
  }, [])

  return (
    <div ref={heroRef} className={className}>
      <div ref={layerRef}>{children}</div>
    </div>
  )
}