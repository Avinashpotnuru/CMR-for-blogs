import type { Metadata } from "next"
import Link from "next/link"
import { FileText, FilePlus2, Send } from "lucide-react"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/page-header"
import type { CreatePostInput } from "@/lib/validation/post"

export const metadata: Metadata = {
  title: "Dashboard",
}

export const dynamic = "force-dynamic"

type BlogPostDoc = CreatePostInput & {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

const statCards = (values: number[]) => [
  {
    label: "Total posts",
    icon: FileText,
    value: values[0],
    note: "All entries in the journal",
  },
  {
    label: "Published",
    icon: Send,
    value: values[1],
    note: "Live on the blog",
  },
  {
    label: "Drafts",
    icon: FilePlus2,
    value: values[2],
    note: "Awaiting publication",
  },
]

export default async function AdminDashboardPage() {
  const collection = await getCollection<BlogPostDoc>("blogs")

  const [total, published, drafts] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ status: "published" }),
    collection.countDocuments({ status: "draft" }),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Overview"
        title="Dashboard"
        description="Welcome back. Here is your blog at a glance."
        action={
          <Link href="/admin/posts/new" className={buttonVariants()}>
            New post
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards([total, published, drafts]).map(
          ({ label, icon: Icon, value, note }) => (
            <div
              key={label}
              className="group rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-foreground/20 md:p-6"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <Icon
                  className="size-4 text-muted-foreground/60 transition-colors duration-150 group-hover:text-brand"
                  aria-hidden
                />
              </div>
              <p className="mt-4 font-heading text-4xl leading-none font-semibold tracking-tight tabular-nums md:text-5xl">
                {value}
              </p>
              <p className="mt-3 font-mono text-[0.6875rem] text-muted-foreground/80">
                {note}
              </p>
            </div>
          ),
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-6 md:p-7">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent" aria-hidden />
          <h2 className="font-medium">Get started</h2>
        </div>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Create and manage your blog posts from the Posts section. Published
          posts appear on the public blog immediately.
        </p>
        <div className="mt-5">
          <Link
            href="/admin/posts"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Manage posts
          </Link>
        </div>
      </div>
    </div>
  )
}