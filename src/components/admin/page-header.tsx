type PageHeaderProps = {
  kicker: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </p>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}