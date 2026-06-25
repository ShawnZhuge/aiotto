import type { HTMLAttributes } from 'react'
import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'

export function PageTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn(typography.pageTitle, className)} {...props} />
}

export function PageDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(typography.pageDescription, className)} {...props} />
}

export function SectionTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn(typography.sectionTitle, className)} {...props} />
}

export function SectionDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn(typography.sectionDescription, className)} {...props} />
}

export function MetricValue({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(typography.metricPrimary, className)} {...props} />
}

export function CodeText({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <code className={cn(typography.codeSmall, className)} {...props} />
}
