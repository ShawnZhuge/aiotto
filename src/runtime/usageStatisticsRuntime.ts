import {
  emptyUsageStatisticsDashboard,
  readCodexSessionUsageDashboardWithFallback,
  type ReadUsageStatisticsDashboardInput,
  type UsageStatisticsDashboardSnapshot,
} from '../domain/usageStatistics'

export type UsageStatisticsRuntimeSnapshot = UsageStatisticsDashboardSnapshot

export type LoadUsageStatisticsRuntimeSnapshotDeps = {
  readDashboard?: (input: ReadUsageStatisticsDashboardInput) => Promise<UsageStatisticsDashboardSnapshot>
}

export const emptyUsageStatisticsRuntimeSnapshot = emptyUsageStatisticsDashboard

export async function loadUsageStatisticsRuntimeSnapshot(
  input: ReadUsageStatisticsDashboardInput,
  deps: LoadUsageStatisticsRuntimeSnapshotDeps = {},
): Promise<UsageStatisticsRuntimeSnapshot> {
  return (deps.readDashboard ?? readCodexSessionUsageDashboardWithFallback)(input)
}
