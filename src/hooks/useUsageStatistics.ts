import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReadUsageStatisticsDashboardInput } from '../domain/usageStatistics'
import { runtimeQueryKeys } from '../runtime/runtimeKeys'
import {
  emptyUsageStatisticsRuntimeSnapshot,
  loadUsageStatisticsRuntimeSnapshot,
} from '../runtime/usageStatisticsRuntime'

export function useUsageStatistics(input: ReadUsageStatisticsDashboardInput) {
  const [lastSuccessfulSnapshot, setLastSuccessfulSnapshot] = useState(emptyUsageStatisticsRuntimeSnapshot)
  const query = useQuery({
    queryKey: [...runtimeQueryKeys.usageStatistics, input],
    queryFn: async () => {
      const snapshot = await loadUsageStatisticsRuntimeSnapshot(input)
      setLastSuccessfulSnapshot(snapshot)
      return snapshot
    },
    placeholderData: keepPreviousData,
  })

  const snapshot = query.data ?? lastSuccessfulSnapshot
  const loading = query.isPending && snapshot === emptyUsageStatisticsRuntimeSnapshot

  async function reload() {
    await query.refetch()
  }

  return {
    dashboard: snapshot,
    loading,
    refreshing: query.isFetching && !loading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    reload,
  }
}
