import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"
import type { CreatePostInput } from "@/lib/validation/post"
import { PageHeader } from "@/components/admin/page-header"
import { EditPostForm } from "@/components/admin/edit-post-form"

export const metadata: Metadata = {
  title: "Edit Post",
}

export const dynamic = "force-dynamic"

type BlogPostDoc = CreatePostInput & {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let objectId: ObjectId
  try {
    objectId = new ObjectId(id)
  } catch {
    notFound()
  }

  const collection = await getCollection<BlogPostDoc>("blogs")
  const post = await collection.findOne({ _id: objectId })
  if (!post) {
    notFound()
  }

  const values: CreatePostInput = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    status: post.status,
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Edit"
        title="Edit post"
        description="Update the content below and save your changes."
      />

      <EditPostForm postId={id} post={values} />
    </div>
  )
}