import { type DeploymentDiagnostics } from '../../lib/deploymentDiagnostics'

export function DeploymentConfigError({
  diagnostics,
}: {
  diagnostics: DeploymentDiagnostics
}) {
  return (
    <main className="min-h-screen bg-green-950 px-5 py-10 text-cream-50">
      <section className="mx-auto max-w-xl rounded-3xl border border-gold-300/25 bg-green-900/80 p-6 shadow-wood">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-200">
          Deployment setup
        </p>
        <h1 className="mt-3 text-3xl font-black">
          {diagnostics.appName} needs Supabase configuration
        </h1>
        <p className="mt-4 leading-7 text-cream-100/78">
          The app is online, but the required Supabase environment variables
          are missing from this build. Add them in the hosting provider and
          redeploy.
        </p>
        <div className="mt-5 rounded-2xl border border-cream-100/10 bg-green-950/70 p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-gold-200">
            Missing variables
          </p>
          <ul className="mt-3 grid gap-2 text-sm font-bold text-cream-100">
            {diagnostics.missingEnvVars.map((envVar) => (
              <li key={envVar}>{envVar}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm text-cream-100/60">
          Build mode: {diagnostics.buildMode}
        </p>
      </section>
    </main>
  )
}
