import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminMobileNav } from "@/components/admin/mobile-nav"

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark flex min-h-svh bg-background text-foreground">
      <AdminSidebar className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}