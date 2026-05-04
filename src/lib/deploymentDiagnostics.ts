import { appInfo } from './appInfo'
import { validateEnv } from './env'

export type DeploymentDiagnostics = {
  appName: string
  buildMode: string
  isConfigured: boolean
  missingEnvVars: string[]
}

export function getDeploymentDiagnostics(): DeploymentDiagnostics {
  const envStatus = validateEnv()

  return {
    appName: appInfo.appName,
    buildMode: appInfo.buildMode,
    isConfigured: envStatus.isValid,
    missingEnvVars: envStatus.missing,
  }
}
