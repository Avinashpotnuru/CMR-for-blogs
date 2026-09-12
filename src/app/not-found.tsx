import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand">
        404 — Not found
      </p>
      <h1 className="mt-4 font-heading text-5xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        The page you are looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/blog"
        className="mt-8 inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors duration-150 hover:text-brand"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to journal
      </Link>
    </div>
  )
}