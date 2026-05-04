import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'
import { DeploymentConfigError } from '../components/common/DeploymentConfigError'
import { AuthProvider } from '../features/auth/AuthContext'
import { getDeploymentDiagnostics } from '../lib/deploymentDiagnostics'

export function AppProviders({ children }: PropsWithChildren) {
  const [deploymentDiagnostics] = useState(() => getDeploymentDiagnostics())
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  if (!deploymentDiagnostics.isConfigured) {
    return <DeploymentConfigError diagnostics={deploymentDiagnostics} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
