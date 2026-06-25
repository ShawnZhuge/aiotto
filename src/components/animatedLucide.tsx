import type {
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
} from 'react'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { IconHandle } from '@animateicons/react'
import {
  AArrowDownIcon as AnimatedArrowDownIcon,
  AArrowUpIcon as AnimatedArrowUpIcon,
  ActivityIcon as AnimatedActivityIcon,
  BellRingIcon as AnimatedBellIcon,
  BlocksIcon as AnimatedPuzzleIcon,
  BookmarkIcon as AnimatedBookmarkIcon,
  ChartLineIcon as AnimatedChartLineIcon,
  CircleCheckIcon as AnimatedCheckCircleIcon,
  ChevronDownIcon as AnimatedChevronDownIcon,
  ChevronRightIcon as AnimatedChevronRightIcon,
  ChevronUpIcon as AnimatedChevronUpIcon,
  CircleCheckBigIcon as AnimatedCircleCheckIcon,
  ClipboardIcon as AnimatedClipboardIcon,
  CopyIcon as AnimatedCopyIcon,
  DashboardIcon as AnimatedDashboardIcon,
  DownloadIcon as AnimatedDownloadIcon,
  EyeIcon as AnimatedEyeIcon,
  EyeOffIcon as AnimatedEyeOffIcon,
  ExternalLinkIcon as AnimatedExternalLinkIcon,
  FolderIcon as AnimatedArchiveIcon,
  FolderOpenIcon as AnimatedFolderOpenIcon,
  GlobeIcon as AnimatedLanguagesIcon,
  HeadsetIcon as AnimatedFeedbackIcon,
  InfoIcon as AnimatedInfoIcon,
  KeyRoundIcon as AnimatedKeyRoundIcon,
  LayoutGridIcon as AnimatedLayoutGridIcon,
  LayoutListIcon as AnimatedListIcon,
  LoaderCircleIcon as AnimatedLoaderCircleIcon,
  LoaderCircleIcon as AnimatedRefreshIcon,
  LoaderIcon as AnimatedLoaderIcon,
  LockIcon as AnimatedLockIcon,
  MapPinIcon as AnimatedPinIcon,
  MenuIcon as AnimatedMenuIcon,
  MessageCircleIcon as AnimatedMessageSquareIcon,
  MoveDiagonal2Icon as AnimatedMoveIcon,
  MoonIcon as AnimatedMoonIcon,
  PauseIcon as AnimatedPauseIcon,
  PlayIcon as AnimatedPlayIcon,
  PlusIcon as AnimatedPlusIcon,
  SearchIcon as AnimatedSearchIcon,
  SettingsIcon as AnimatedSettingsIcon,
  ShieldCheckIcon as AnimatedShieldIcon,
  SlidersHorizontalIcon as AnimatedSlidersHorizontalIcon,
  SparklesIcon as AnimatedSparklesIcon,
  SquareArrowOutUpRightIcon as AnimatedSquareArrowOutUpRightIcon,
  SunIcon as AnimatedSunIcon,
  TerminalIcon as AnimatedRuntimeDiagnosticsIcon,
  Trash2Icon as AnimatedTrash2Icon,
  TriangleAlertIcon as AnimatedAlertTriangleIcon,
  UnlinkIcon as AnimatedPinOffIcon,
  UploadIcon as AnimatedUploadIcon,
  UserCheckIcon as AnimatedUserCheckIcon,
  UsersIcon as AnimatedUsersIcon,
  WebhookIcon as AnimatedRouteIcon,
  XIcon as AnimatedXIcon,
  ZapIcon as AnimatedZapIcon,
} from '@animateicons/react/lucide'

import { cn } from '@/lib/utils'

export type AnimatedLucideIconComponent = ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & {
    size?: number
    duration?: number
    isAnimated?: boolean
    color?: string
    className?: string
  } & RefAttributes<IconHandle>
>

function runIconAnimation(action: (() => void) | undefined) {
  try {
    action?.()
  } catch {
    // AnimateIcons can reject start/stop calls during fast React unmounts.
  }
}

export function AnimatedIcon(props: {
  icon: AnimatedLucideIconComponent
  className?: string
  size?: number
  duration?: number
  animate?: boolean
  hoverAnimate?: boolean
  focusAnimate?: boolean
}) {
  const {
    icon: Icon,
    className,
    size = 16,
    duration = 0.9,
    animate = false,
    hoverAnimate = true,
    focusAnimate = true,
  } = props
  const hostRef = useRef<HTMLSpanElement>(null)
  const iconRef = useRef<IconHandle>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const handle = iconRef.current

    if (prefersReducedMotion) {
      runIconAnimation(() => handle?.stopAnimation())
      return
    }

    if (animate) {
      runIconAnimation(() => handle?.startAnimation())
      return () => {
        runIconAnimation(() => handle?.stopAnimation())
      }
    }

    runIconAnimation(() => handle?.stopAnimation())
  }, [animate, prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion || animate || (!hoverAnimate && !focusAnimate)) {
      return
    }

    const host = hostRef.current
    const trigger = host?.closest('button,[role="button"],[role="switch"]')
    if (!trigger) {
      return
    }

    const start = () => runIconAnimation(() => iconRef.current?.startAnimation())
    const stop = () => runIconAnimation(() => iconRef.current?.stopAnimation())

    if (hoverAnimate) {
      trigger.addEventListener('pointerenter', start)
      trigger.addEventListener('pointerleave', stop)
    }
    if (focusAnimate) {
      trigger.addEventListener('focus', start)
      trigger.addEventListener('blur', stop)
    }

    return () => {
      if (hoverAnimate) {
        trigger.removeEventListener('pointerenter', start)
        trigger.removeEventListener('pointerleave', stop)
      }
      if (focusAnimate) {
        trigger.removeEventListener('focus', start)
        trigger.removeEventListener('blur', stop)
      }
    }
  }, [animate, focusAnimate, hoverAnimate, prefersReducedMotion])

  return (
    <span
      ref={hostRef}
      className={cn('aiotto-animated-icon pointer-events-none', className)}
      data-aiotto-animate={animate ? 'true' : 'false'}
      data-aiotto-hover-animate={hoverAnimate ? 'true' : 'false'}
      data-aiotto-focus-animate={focusAnimate ? 'true' : 'false'}
      aria-hidden="true"
    >
      <Icon ref={iconRef} color="currentColor" duration={duration} size={size} />
    </span>
  )
}

export {
  AnimatedActivityIcon,
  AnimatedAlertTriangleIcon,
  AnimatedArchiveIcon,
  AnimatedArrowDownIcon,
  AnimatedArrowUpIcon,
  AnimatedBellIcon,
  AnimatedBookmarkIcon,
  AnimatedChartLineIcon,
  AnimatedCheckCircleIcon,
  AnimatedChevronDownIcon,
  AnimatedChevronRightIcon,
  AnimatedChevronUpIcon,
  AnimatedCircleCheckIcon,
  AnimatedClipboardIcon,
  AnimatedCopyIcon,
  AnimatedDashboardIcon,
  AnimatedDownloadIcon,
  AnimatedExternalLinkIcon,
  AnimatedEyeIcon,
  AnimatedEyeOffIcon,
  AnimatedFeedbackIcon,
  AnimatedFolderOpenIcon,
  AnimatedInfoIcon,
  AnimatedKeyRoundIcon,
  AnimatedLanguagesIcon,
  AnimatedLayoutGridIcon,
  AnimatedListIcon,
  AnimatedLoaderCircleIcon,
  AnimatedLoaderIcon,
  AnimatedLockIcon,
  AnimatedMenuIcon,
  AnimatedMessageSquareIcon,
  AnimatedMoonIcon,
  AnimatedMoveIcon,
  AnimatedPinIcon,
  AnimatedPinOffIcon,
  AnimatedPlusIcon,
  AnimatedPuzzleIcon,
  AnimatedRefreshIcon,
  AnimatedRouteIcon,
  AnimatedRuntimeDiagnosticsIcon,
  AnimatedSearchIcon,
  AnimatedSettingsIcon,
  AnimatedShieldIcon,
  AnimatedSlidersHorizontalIcon,
  AnimatedSparklesIcon,
  AnimatedSquareArrowOutUpRightIcon,
  AnimatedSunIcon,
  AnimatedTrash2Icon,
  AnimatedUploadIcon,
  AnimatedUserCheckIcon,
  AnimatedUsersIcon,
  AnimatedXIcon,
  AnimatedZapIcon,
  AnimatedPauseIcon,
  AnimatedPlayIcon,
}
