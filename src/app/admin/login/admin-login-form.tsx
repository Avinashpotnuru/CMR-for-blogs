"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
      }
      if (!response.ok) {
        setError(data.error ?? "Login failed")
        return
      }
      router.replace(next)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark flex min-h-svh flex-col bg-background text-foreground">
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors duration-150 hover:text-brand"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to journal
          </Link>

          <div className="mt-8">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand">
              Control room
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
              Sign in
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Only the journal’s editor has access. Enter your credentials to
              continue.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-9 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}