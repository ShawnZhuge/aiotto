import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "aiotto-motion-control aiotto-radius-button inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[background-color,border-color,color,box-shadow,opacity] duration-200 ease-[var(--ease-precision)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        selected:
          "border border-primary/30 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground hover:shadow-md",
        selectedSoft:
          "border border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:text-primary hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md",
        toolbar:
          "border border-border/65 bg-background/70 text-card-foreground shadow-sm backdrop-blur hover:border-primary/25 hover:bg-accent/70 hover:text-foreground hover:shadow-md",
        soft:
          "border border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/15 hover:shadow-md",
        tool:
          "border border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground hover:shadow-none",
        dangerTool:
          "border border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-destructive/10 hover:text-destructive hover:shadow-none",
        dangerSoft:
          "border border-destructive/20 bg-destructive/10 text-destructive shadow-sm hover:bg-destructive/15 hover:shadow-md",
        ghost: "shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-none",
        link: "text-primary shadow-none underline-offset-4 hover:underline hover:shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
