import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide transition-colors border",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0B113A]/10 text-[#0B113A]",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-50 text-emerald-700 border-emerald-100",
        warning: "border-transparent bg-amber-50 text-amber-700 border-amber-100",
        info: "border-transparent bg-blue-50 text-blue-700 border-blue-100",
        purple: "border-transparent bg-purple-50 text-purple-700 border-purple-100",
        slate: "border-transparent bg-slate-100 text-slate-600 border-slate-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
