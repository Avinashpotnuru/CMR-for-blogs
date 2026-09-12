"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Pencil,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  SelectIcon,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Post } from "@/lib/validation/post"

const PAGE_SIZE = 8

type SortKey = "title" | "category" | "status" | "created"
type SortState = { key: SortKey; dir: "asc" | "desc" }

type StatusFilter = "all" | "draft" | "published"

function StatusToggle({
  post,
  onChanged,
}: {
  post: Post
  onChanged: () => void
}) {
  const [published, setPublished] = useState(post.status === "published")
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function toggle() {
    if (busy) return
    const next = !published
    setBusy(true)
    setFailed(false)
    setPublished(next)

    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next ? "published" : "draft" }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      onChanged()
    } catch {
      setPublished(!next)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={published}
        aria-label={`${published ? "Move to draft" : "Publish"}: ${post.title}`}
        disabled={busy}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border outline-none transition-colors duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-wait disabled:opacity-60",
          published ? "border-success/40 bg-success/90" : "border-border bg-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 left-0.5 size-4 -translate-y-1/2 rounded-full bg-primary-foreground shadow-sm transition-transform duration-200 ease-out",
            published && "translate-x-5",
          )}
        />
      </button>
      <span className="font-mono text-xs text-muted-foreground">
        {published ? "published" : "draft"}
      </span>
      {failed && (
        <TriangleAlert className="size-3.5 shrink-0 text-destructive" aria-hidden />
      )}
    </div>
  )
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string
  column: SortKey
  sort: SortState
  onSort: (column: SortKey) => void
  className?: string
}) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown

  return (
    <th className={cn("px-4 py-3", className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1.5 text-left font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition-colors duration-150",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        <Icon
          className={cn("size-3", active ? "text-brand" : "text-muted-foreground/40")}
          aria-hidden
        />
      </button>
    </th>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4 md:p-5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-1/3 rounded-sm bg-muted" />
          <div className="h-4 w-24 rounded-sm bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="ml-auto h-4 w-16 rounded-sm bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function PostsTable() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [target, setTarget] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sort, setSort] = useState<SortState>({ key: "created", dir: "desc" })
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkError, setBulkError] = useState(false)

  async function fetchPosts(): Promise<Post[]> {
    const res = await fetch("/api/posts")
    if (!res.ok) throw new Error("Failed to fetch posts")
    const data = await res.json()
    return data.posts ?? []
  }

  useEffect(() => {
    let ignore = false
    fetchPosts()
      .then((data) => {
        if (ignore) return
        setPosts(data)
        setError(false)
      })
      .catch(() => {
        if (!ignore) setError(true)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  async function refreshPosts() {
    try {
      setPosts(await fetchPosts())
      setError(false)
    } catch {
      setError(true)
    }
  }

  async function confirmDelete() {
    if (!target) return
    setDeleting(true)
    setDeleteError(false)
    try {
      const res = await fetch(`/api/posts/${target._id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete post")
      setTarget(null)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(target._id)
        return next
      })
      await refreshPosts()
    } catch {
      setDeleteError(true)
    } finally {
      setDeleting(false)
    }
  }

  async function confirmBulkDelete() {
    if (selected.size === 0) return
    setBulkBusy(true)
    setBulkError(false)
    try {
      await Promise.all(
        [...selected].map(async (id) => {
          const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
          if (!res.ok) throw new Error("Failed to delete post")
        }),
      )
      setBulkDeleteOpen(false)
      setSelected(new Set())
      await refreshPosts()
    } catch {
      setBulkError(true)
    } finally {
      setBulkBusy(false)
    }
  }

  async function bulkSetStatus(status: "draft" | "published") {
    if (selected.size === 0) return
    setBulkBusy(true)
    setBulkError(false)
    try {
      await Promise.all(
        [...selected].map(async (id) => {
          const res = await fetch(`/api/posts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
          if (!res.ok) throw new Error("Failed to update status")
        }),
      )
      setSelected(new Set())
      await refreshPosts()
    } catch {
      setBulkError(true)
      await refreshPosts()
    } finally {
      setBulkBusy(false)
    }
  }

  const categories = useMemo(
    () =>
      Array.from(new Set(posts.map((post) => post.category))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [posts],
  )

  const statusCounts = useMemo(
    () => ({
      draft: posts.filter((post) => post.status === "draft").length,
      published: posts.filter((post) => post.status === "published").length,
    }),
    [posts],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) return false
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false
      }
      if (needle) {
        const haystack = `${post.title} ${post.slug}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    const dir = sort.dir === "asc" ? 1 : -1
    return list.sort((a, b) => {
      let cmp = 0
      switch (sort.key) {
        case "title":
          cmp = a.title.localeCompare(b.title)
          break
        case "category":
          cmp = a.category.localeCompare(b.category)
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        case "created":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return cmp * dir
    })
  }, [posts, query, statusFilter, categoryFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const pageIds = pageRows.map((post) => post._id)
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const somePageSelected =
    pageIds.some((id) => selected.has(id)) && !allPageSelected

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function handleSort(column: SortKey) {
    setSort((prev) =>
      prev.key === column
        ? { key: column, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key: column, dir: "asc" },
    )
  }

  function clearFilters() {
    setQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setPage(1)
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="size-4.5 text-destructive" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">Failed to load posts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The request could not be completed. Please try again.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshPosts()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-4.5 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">No posts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a draft or publish your first story.
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Create your first post
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-3 md:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[200px] flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Search title or slug…"
                aria-label="Search posts"
                className="h-9 w-full rounded-md border border-border bg-muted/40 pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none"
              />
            </label>

            <SelectRoot
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value ?? "all")
                setPage(1)
              }}
            >
              <SelectTrigger
                aria-label="Filter by category"
                className="min-w-[170px] justify-between"
              >
                <SelectValue>
                  {(value) => (value === "all" ? "All categories" : (value as string))}
                </SelectValue>
                <SelectIcon />
              </SelectTrigger>
              <SelectPopup>
                <SelectList>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectRoot>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSort({ key: "created", dir: "desc" })}
            >
              <ArrowUpDown className="size-3.5 text-brand" aria-hidden />
              Newest first
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
              {(
                [
                  ["all", "All", posts.length],
                  ["draft", "Draft", statusCounts.draft],
                  ["published", "Published", statusCounts.published],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(value)
                    setPage(1)
                  }}
                  className={cn(
                    "rounded-sm px-3 py-1 text-xs font-medium transition-colors duration-150",
                    statusFilter === value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={statusFilter === value}
                >
                  {label}
                  <span className="ml-1.5 font-mono text-[0.6875rem] text-muted-foreground">
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground" role="status">
              {filtered.length} post{filtered.length === 1 ? "" : "s"}
              {(statusFilter !== "all" ||
                categoryFilter !== "all" ||
                query.trim()) && (
                <>
                  {" "}
                  ·{" "}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-brand underline underline-offset-4 hover:text-foreground"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-brand/5 px-3 py-2 md:px-4">
            <p className="text-xs font-medium text-foreground">
              {selected.size} selected
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                disabled={bulkBusy}
                onClick={() => bulkSetStatus("published")}
              >
                Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={() => bulkSetStatus("draft")}
              >
                Move to draft
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkBusy}
                onClick={() => setBulkDeleteOpen(true)}
              >
                Delete
              </Button>
              {(bulkBusy || bulkError) && (
                <p
                  className={cn(
                    "text-xs",
                    bulkError ? "text-destructive" : "text-muted-foreground",
                  )}
                  role="alert"
                >
                  {bulkError
                    ? "Something went wrong — check the list."
                    : "Working…"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              Clear
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all visible posts"
                    checked={allPageSelected}
                    ref={(element) => {
                      if (element) element.indeterminate = somePageSelected
                    }}
                    onChange={togglePage}
                    className="size-4 cursor-pointer rounded-sm accent-[var(--brand)]"
                  />
                </th>
                <SortHeader
                  label="Title"
                  column="title"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Category"
                  column="category"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Status"
                  column="status"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Created"
                  column="created"
                  sort={sort}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 text-right font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No posts match your search
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a different keyword or clear the filters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  </td>
                </tr>
              ) : (
                pageRows.map((post) => (
                  <tr
                    key={post._id}
                    className={cn(
                      "transition-colors duration-150 hover:bg-muted/40",
                      selected.has(post._id) && "bg-brand/[0.04]",
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${post.title}`}
                        checked={selected.has(post._id)}
                        onChange={() => toggleRow(post._id)}
                        className="size-4 cursor-pointer rounded-sm accent-[var(--brand)]"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="leading-snug font-medium">
                        <Link
                          href={`/admin/posts/${post._id}`}
                          className="transition-colors duration-150 hover:text-brand"
                        >
                          {post.title}
                        </Link>
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        /blog/{post.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {post.category}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusToggle post={post} onChanged={refreshPosts} />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs tabular-nums whitespace-nowrap text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                      }).format(new Date(post.createdAt))}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/posts/${post._id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                          aria-label={`Edit ${post.title}`}
                        >
                          <Pencil aria-hidden />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          aria-label={`Delete ${post.title}`}
                          onClick={() => setTarget(post)}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <span className="px-2 font-mono text-xs tabular-nums text-muted-foreground">
              {safePage} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={safePage >= pageCount}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open && !deleting) setTarget(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “{target?.title}”? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-xs text-destructive">
              Failed to delete the post. Please try again.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => confirmDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !bulkBusy) setBulkDeleteOpen(false)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {selected.size} posts?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selected.size} selected posts?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkError && (
            <p role="alert" className="text-xs text-destructive">
              Failed to delete some posts. Please try again.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => confirmBulkDelete()}
              disabled={bulkBusy}
            >
              {bulkBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}