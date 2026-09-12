"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, LayoutDashboard, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: Newspaper },
]

export function AdminMobileNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden lg:px-6">
      <Link
        href="/admin"
        className="font-heading text-base leading-none font-semibold tracking-tight"
      >
        Mini&nbsp;Blog
      </Link>

      <nav className="flex items-center gap-1" aria-label="Admin">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                isActive && "bg-accent/10 text-brand dark:bg-accent/15",
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon aria-hidden />
            </Link>
          )
        })}
        <Link
          href="/blog"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="View blog"
        >
          <Globe aria-hidden />
        </Link>
      </nav>
    </header>
  )
}