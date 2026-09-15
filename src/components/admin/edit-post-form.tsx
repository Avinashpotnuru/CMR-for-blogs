"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import type { CreatePostInput } from "@/lib/validation/post"
import { PostForm } from "@/components/admin/post-form"

type EditPostFormProps = {
  postId: string
  post: CreatePostInput
}

export function EditPostForm({ postId, post }: EditPostFormProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current)
      }
    }
  }, [])

  async function handleUpdate(values: CreatePostInput) {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (res.status === 401) {
      window.location.assign("/admin/login?next=" + encodeURIComponent(`/admin/posts/${postId}`))
    }

    if (!res.ok) {
      throw new Error("Failed to update post")
    }

    setSaved(true)
    redirectTimer.current = setTimeout(() => {
      router.push("/admin/posts")
    }, 800)
  }

  return (
    <div className="space-y-5">
      {saved && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <CheckCircle2 className="size-4" aria-hidden />
          Post updated successfully. Redirecting…
        </div>
      )}
      <PostForm
        defaultValues={post}
        submitLabel="Save changes"
        onSubmit={handleUpdate}
      />
    </div>
  )
}