"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, LayoutDashboard, LogOut, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: Newspaper },
]

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/70 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="font-heading text-lg leading-none font-semibold tracking-tight">
          Mini&nbsp;Blog
        </span>
        <span className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Editorial
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent/10 text-brand dark:bg-accent/15"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              {isActive && (
                <span
                  className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                  aria-hidden
                />
              )}
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <Link
          href="/blog"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground"
        >
          <Globe className="size-4" aria-hidden />
          View blog
        </Link>
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Link>
      </div>
    </aside>
  )
}