"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreatePostSchema, type CreatePostInput } from "@/lib/validation/post"
import { buttonVariants, Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type PostFormProps = {
  defaultValues?: Partial<CreatePostInput>
  submitLabel?: string
  submitBusyLabel?: string
  onSubmit: (values: CreatePostInput) => Promise<void>
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function PostForm({
  defaultValues,
  submitLabel = "Create post",
  submitBusyLabel = "Saving…",
  onSubmit,
}: PostFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(CreatePostSchema),
    defaultValues,
  })

  async function handleFormSubmit(values: CreatePostInput) {
    setSubmitError(null)
    try {
      await onSubmit(values)
    } catch {
      setSubmitError("Failed to save the post. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-7">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Title" required error={errors.title?.message}>
          <Input
            placeholder="My awesome post"
            aria-invalid={errors.title ? true : undefined}
            {...register("title")}
          />
        </Field>

        <Field label="Slug" required error={errors.slug?.message}>
          <Input
            placeholder="my-awesome-post"
            aria-invalid={errors.slug ? true : undefined}
            {...register("slug")}
          />
        </Field>

        <Field label="Category" required error={errors.category?.message}>
          <Input
            placeholder="General"
            aria-invalid={errors.category ? true : undefined}
            {...register("category")}
          />
        </Field>

        <Field label="Status" required error={errors.status?.message}>
          <div className="relative">
            <select
              data-slot="select"
              className={cn(
                "h-10 w-full appearance-none rounded-md border border-input bg-transparent pr-9 pl-3.5 text-base transition-[color,background-color,border-color,box-shadow] duration-150 outline-none hover:border-foreground/25 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:opacity-50 md:text-sm dark:border-input dark:bg-input/25 dark:hover:border-foreground/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
                errors.status && "text-foreground",
              )}
              aria-invalid={errors.status ? true : undefined}
              {...register("status")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </Field>
      </div>

      <Field label="Excerpt" required error={errors.excerpt?.message}>
        <Textarea
          rows={2}
          placeholder="Short summary shown in listings."
          aria-invalid={errors.excerpt ? true : undefined}
          {...register("excerpt")}
        />
      </Field>

      <Field label="Content" required error={errors.content?.message}>
        <Textarea
          rows={10}
          placeholder="Write your post content here…"
          aria-invalid={errors.content ? true : undefined}
          {...register("content")}
        />
      </Field>

      <div
        className={cn(
          "rounded-lg border px-4 py-3",
          submitError
            ? "border-destructive/25 bg-destructive/5"
            : "border-border bg-card",
        )}
      >
        {submitError ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            Published posts appear immediately on the public blog.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/admin/posts"
          className={buttonVariants({ variant: "ghost" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submitBusyLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}