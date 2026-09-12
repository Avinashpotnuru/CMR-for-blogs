import Link from "next/link"
import { SiteHeader } from "@/components/blog/site-header"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />

      {children}

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <p className="flex items-center gap-3 text-label font-medium text-foreground">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-[0.4rem] bg-foreground"
                  aria-hidden
                >
                  <span className="flex w-4 flex-col items-center gap-[3px]">
                    <span className="h-px w-full bg-background" />
                    <span className="h-px w-full bg-background" />
                    <span className="mt-[1px] size-1 rounded-full bg-brand" />
                  </span>
                </span>
                Mini Blog
              </p>
              <p className="mt-4 max-w-[26ch] text-sm leading-relaxed text-muted-foreground">
                Field notes on development, design, and the web — written the
                long, patient way.
              </p>
            </div>

            <nav
              aria-label="Footer"
              className="sm:col-span-1 sm:px-4"
            >
              <p className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                Explore
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-brand"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-brand"
                  >
                    The Journal
                  </Link>
                </li>
                <li>
                  <a
                    href="#top"
                    className="text-foreground underline decoration-foreground/20 underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-brand"
                  >
                    Back to top
                  </a>
                </li>
              </ul>
            </nav>

            <div className="sm:col-span-1 sm:text-right">
              <p className="text-label uppercase tracking-[0.25em] text-muted-foreground">
                Author
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A blog by{" "}
                <a
                  href="https://avinashpotnuruportfolio.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-200 ease-out hover:text-brand hover:decoration-brand"
                >
                  Avinash Potnuru
                </a>
              </p>
              <p className="mt-2 text-label text-muted-foreground">
                © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}