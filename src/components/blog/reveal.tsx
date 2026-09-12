"use client"

import { useEffect, useRef, type ReactNode } from "react"

type RevealProps = {
  as?: "div" | "li"
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({
  as = "div",
  children,
  className,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    node.style.opacity = "0"
    node.style.transform = "translateY(12px)"
    node.style.willChange = "opacity, transform"

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          node.style.transition = `opacity 700ms ease-out ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
          node.style.opacity = "1"
          node.style.transform = "translateY(0)"
          observer.unobserve(node)
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [delay])

  if (as === "li") {
    return (
      <li ref={ref as React.Ref<HTMLLIElement>} className={className}>
        {children}
      </li>
    )
  }

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  )
}
