export const typography = {
  pageTitle: 'text-2xl font-bold leading-tight tracking-normal text-card-foreground',
  pageDescription: 'text-sm font-normal leading-6 text-muted-foreground',
  sectionTitle: 'text-lg font-semibold leading-6 tracking-normal text-card-foreground',
  sectionDescription: 'text-xs font-normal leading-5 text-muted-foreground',
  cardTitle: 'text-base font-semibold leading-6 text-card-foreground',
  shellTitle: 'text-base font-semibold leading-5 tracking-normal text-card-foreground',
  navLabel: 'text-sm font-medium leading-5 tracking-normal',
  listTitle: 'text-[13px] font-semibold leading-5 text-foreground',
  listMeta: 'text-[11px] font-normal leading-4 text-muted-foreground',
  body: 'text-sm font-normal leading-6 text-foreground',
  mutedBody: 'text-sm font-normal leading-6 text-muted-foreground',
  tableHead: 'text-sm font-medium text-muted-foreground',
  tableCell: 'text-sm font-normal text-card-foreground',
  tableNumber: 'font-mono tabular-nums text-sm font-medium text-card-foreground',
  metricPrimary:
    'font-mono tabular-nums text-[clamp(2rem,3vw,2.75rem)] font-bold leading-none tracking-normal text-card-foreground',
  metricSecondary: 'font-mono tabular-nums text-sm font-semibold text-card-foreground',
  codeSmall: 'font-mono text-[11px] font-normal text-muted-foreground',
  badgeText: 'text-[11px] font-medium',
  controlText: 'text-[12px] font-medium',
} as const

export type TypographyRole = keyof typeof typography
