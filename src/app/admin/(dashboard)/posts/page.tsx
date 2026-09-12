import Link from "next/link"
import { FilePlus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/page-header"
import { PostsTable } from "@/components/admin/posts-table"

export default function AdminPostsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Management"
        title="Posts"
        description="All blog posts in your mini CMS."
        action={
          <Link href="/admin/posts/new" className={buttonVariants()}>
            <FilePlus aria-hidden />
            New post
          </Link>
        }
      />

      <PostsTable />
    </div>
  )
}