import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        success: "bg-success/12 text-success dark:bg-success/15 dark:text-success",
        warning: "bg-warning/12 text-warning dark:bg-warning/15 dark:text-warning",
        info: "bg-info/12 text-info dark:bg-info/15 dark:text-info",
        destructive:
          "bg-destructive/12 text-destructive dark:bg-destructive/20 dark:text-destructive",
        accent: "bg-accent/12 text-brand dark:bg-accent/15 dark:text-brand",
        default: "bg-primary text-primary-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-1.5 py-0 text-[0.6875rem]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  dot = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />}
      {props.children}
    </span>
  )
}

export { Badge, badgeVariants }