import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/button'

type PageErrorBoundaryProps = {
  children: ReactNode
  onRetry?: () => void
}

type PageErrorBoundaryState = {
  error: Error | null
  info: ErrorInfo | null
}

const sensitivePatterns = [
  /authorization/gi,
  /cookie/gi,
  /token/gi,
  /refresh/gi,
  /secret/gi,
  /snapshots?/gi,
  /\/Users\/[^\s]+/g,
]

function redactDiagnostic(value: string): string {
  return sensitivePatterns.reduce((current, pattern) => current.replace(pattern, '[redacted]'), value)
}

export class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = {
    error: null,
    info: null,
  }

  static getDerivedStateFromError(error: Error) {
    return {
      error,
      info: null,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info })
  }

  retry = () => {
    this.props.onRetry?.()
    this.setState({ error: null, info: null })
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    const diagnostic = redactDiagnostic(
      [this.state.error.message, this.state.info?.componentStack ?? ''].filter(Boolean).join('\n'),
    )

    return (
      <section
        aria-label="页面渲染失败"
        className="m-4 aiotto-radius-card border border-destructive/30 bg-destructive/5 p-4 text-sm"
        role="alert"
      >
        <div className="space-y-2">
          <p className="text-base font-semibold text-foreground">页面渲染失败</p>
          <p className="text-muted-foreground">Aiotto 已拦截这个页面错误，下面只显示脱敏诊断摘要。</p>
          <pre className="max-h-40 overflow-auto aiotto-radius-inset bg-background p-3 text-xs text-muted-foreground">
            {diagnostic}
          </pre>
          <Button onClick={this.retry} variant="outline">
            重试
          </Button>
        </div>
      </section>
    )
  }
}
