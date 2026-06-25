import { QueryClient } from '@tanstack/react-query'

export function createAiottoQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export const aiottoQueryClient = createAiottoQueryClient()
