import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RuntimeInitializer } from './RuntimeInitializer'
import { aiottoQueryClient } from './queryClient'

export function RuntimeProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={aiottoQueryClient}>
      <RuntimeInitializer />
      {children}
    </QueryClientProvider>
  )
}
