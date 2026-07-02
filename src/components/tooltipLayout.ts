export type TooltipSide = 'top' | 'bottom'
type TooltipAnchorRect = Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>
type TooltipMeasuredRect = Pick<DOMRect, 'height' | 'width'>

export type TooltipPosition = {
  left: number
  maxWidth: number
  side: TooltipSide
  top: number
}

const TOOLTIP_OFFSET = 8
const TOOLTIP_VIEWPORT_MARGIN = 12
const TOOLTIP_MAX_WIDTH = 360
const TOOLTIP_FALLBACK_WIDTH = 160
const TOOLTIP_FALLBACK_HEIGHT = 34

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

export function computeTooltipLayout({
  margin = TOOLTIP_VIEWPORT_MARGIN,
  offset = TOOLTIP_OFFSET,
  preferredSide,
  tooltipRect,
  triggerRect,
  viewportHeight,
  viewportWidth,
}: {
  margin?: number
  offset?: number
  preferredSide: TooltipSide
  tooltipRect: TooltipMeasuredRect
  triggerRect: TooltipAnchorRect
  viewportHeight: number
  viewportWidth: number
}): TooltipPosition {
  const availableWidth = Math.max(80, viewportWidth - margin * 2)
  const maxWidth = Math.min(TOOLTIP_MAX_WIDTH, availableWidth)
  const width = Math.min(tooltipRect.width || TOOLTIP_FALLBACK_WIDTH, maxWidth)
  const height = tooltipRect.height || TOOLTIP_FALLBACK_HEIGHT
  const triggerCenterX = triggerRect.left + triggerRect.width / 2
  const left = clamp(triggerCenterX - width / 2, margin, viewportWidth - margin - width)
  const topSideTop = triggerRect.top - offset - height
  const bottomSideTop = triggerRect.bottom + offset
  const canShowAbove = topSideTop >= margin
  const canShowBelow = bottomSideTop + height <= viewportHeight - margin
  let resolvedSide = preferredSide

  if (preferredSide === 'top' && !canShowAbove) {
    resolvedSide = 'bottom'
  }

  if (preferredSide === 'bottom' && !canShowBelow && canShowAbove) {
    resolvedSide = 'top'
  }

  const unconstrainedTop = resolvedSide === 'top' ? topSideTop : bottomSideTop
  const top = clamp(unconstrainedTop, margin, viewportHeight - margin - height)
  return {
    left,
    maxWidth,
    side: resolvedSide,
    top,
  }
}
