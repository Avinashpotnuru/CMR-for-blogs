import { ObjectId, type WithId } from "mongodb"
import { revalidatePath } from "next/cache"
import { getCollection } from "@/lib/mongodb"
import { UpdatePostSchema, type CreatePostInput } from "@/lib/validation/post"

export const dynamic = "force-dynamic"

type BlogPostDoc = CreatePostInput & {
  _id: ObjectId
  createdAt: Date
  updatedAt: Date
}

function toPost(doc: WithId<BlogPostDoc>) {
  return {
    ...doc,
    _id: doc._id.toString(),
  }
}

function parseId(id: string) {
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const objectId = parseId(id)
  const collection = await getCollection<BlogPostDoc>("blogs")

  if (!objectId) {
    return Response.json({ error: "Invalid post id" }, { status: 400 })
  }

  const post = await collection.findOne({ _id: objectId })
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 })
  }

  return Response.json({ post: toPost(post) })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const objectId = parseId(id)
  const collection = await getCollection<BlogPostDoc>("blogs")

  if (!objectId) {
    return Response.json({ error: "Invalid post id" }, { status: 400 })
  }

  const raw = await request.json().catch(() => null)
  const result = UpdatePostSchema.safeParse(raw ?? {})
  if (!result.success) {
    return Response.json(
      {
        error: "Validation failed",
        issues: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  const updates = result.data
  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "No fields provided to update" },
      { status: 400 },
    )
  }

  const updated = await collection.findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )

  if (!updated) {
    return Response.json({ error: "Post not found" }, { status: 404 })
  }

  revalidatePath("/blog", "layout")

  return Response.json({ post: toPost(updated) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const objectId = parseId(id)
  const collection = await getCollection<BlogPostDoc>("blogs")

  if (!objectId) {
    return Response.json({ error: "Invalid post id" }, { status: 400 })
  }

  const result = await collection.deleteOne({ _id: objectId })
  if (result.deletedCount === 0) {
    return Response.json({ error: "Post not found" }, { status: 404 })
  }

  revalidatePath("/blog", "layout")

  return Response.json({ success: true })
}