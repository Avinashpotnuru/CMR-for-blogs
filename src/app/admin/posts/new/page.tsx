import { PageHeader } from "@/components/admin/page-header"
import { NewPostForm } from "@/components/admin/new-post-form"

export default function AdminNewPostPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Write"
        title="New post"
        description="Craft your next blog post."
      />

      <NewPostForm />
    </div>
  )
}