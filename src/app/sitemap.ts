import type { MetadataRoute } from "next"
import { getCollection } from "@/lib/mongodb"
import { SITE_URL } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ]

  try {
    const collection = await getCollection("blogs")
    const posts = (await collection
      .find(
        { status: "published" },
        { projection: { slug: 1, createdAt: 1, updatedAt: 1, _id: 0 } },
      )
      .sort({ createdAt: -1 })
      .toArray()) as unknown as {
      slug: string
      createdAt: Date
      updatedAt?: Date
    }[]

    for (const post of posts) {
      routes.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ?? post.createdAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  } catch {
    // DB unreachable during build — serve base routes only.
  }

  return routes
}