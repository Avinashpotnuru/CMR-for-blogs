import { ObjectId, type WithId } from "mongodb"
import { revalidatePath } from "next/cache"
import { getCollection } from "@/lib/mongodb"
import {
  BlogStatusSchema,
  CreatePostSchema,
  type CreatePostInput,
} from "@/lib/validation/post"

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

export async function GET(request: Request) {
  try {
    const statusQuery = new URL(request.url).searchParams.get("status")
    const statusResult = BlogStatusSchema.safeParse(statusQuery)
    const filter = statusResult.success ? { status: statusResult.data } : {}

    const collection = await getCollection<BlogPostDoc>("blogs")
    const posts = await collection.find(filter).sort({ createdAt: -1 }).toArray()

    return Response.json({ posts: posts.map(toPost) })
  } catch {
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null)

    const result = CreatePostSchema.safeParse(raw ?? {})
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

    const collection = await getCollection<BlogPostDoc>("blogs")

    const existing = await collection.findOne({ slug: result.data.slug })
    if (existing) {
      return Response.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      )
    }

    const now = new Date()
    const doc: BlogPostDoc = {
      ...result.data,
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
    }

    await collection.insertOne(doc)

    revalidatePath("/blog", "layout")

    return Response.json({ post: toPost(doc) }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create post" }, { status: 500 })
  }
}