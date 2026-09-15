"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import type { CreatePostInput } from "@/lib/validation/post"
import { PostForm } from "@/components/admin/post-form"

export function NewPostForm() {
  const router = useRouter()
  const [created, setCreated] = useState(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current)
      }
    }
  }, [])

  async function handleCreate(values: CreatePostInput) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (res.status === 401) {
      window.location.assign("/admin/login?next=" + encodeURIComponent("/admin/posts/new"))
    }

    if (!res.ok) {
      throw new Error("Failed to create post")
    }

    setCreated(true)
    redirectTimer.current = setTimeout(() => {
      router.push("/admin/posts")
    }, 800)
  }

  return (
    <div className="space-y-5">
      {created && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <CheckCircle2 className="size-4" aria-hidden />
          Post created successfully. Redirecting…
        </div>
      )}
      <PostForm onSubmit={handleCreate} />
    </div>
  )
}