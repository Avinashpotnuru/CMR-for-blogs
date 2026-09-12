import { z } from "zod"

export const BlogStatusSchema = z.enum(["draft", "published"])

export const CreatePostSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase, hyphenated (e.g. my-first-post)",
    ),
  excerpt: z.string().trim().min(1, "Excerpt is required").max(280),
  content: z.string().trim().min(1, "Content is required"),
  category: z.string().trim().min(1, "Category is required").max(60),
  status: BlogStatusSchema,
})

export const UpdatePostSchema = CreatePostSchema.partial()

export type BlogStatus = z.infer<typeof BlogStatusSchema>
export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>

export type Post = CreatePostInput & {
  _id: string
  createdAt: Date
  updatedAt: Date
}