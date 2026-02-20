import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Application configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Database</p>
              <p>PostgreSQL via Prisma ORM</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cache</p>
              <p>Redis (optional — gracefully skipped if unavailable)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adding a new provider</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Create <code className="bg-muted px-1 rounded">lib/providers/yourkey.adapter.ts</code> implementing <code className="bg-muted px-1 rounded">ProviderAdapter</code>
            </li>
            <li>
              Register it in <code className="bg-muted px-1 rounded">lib/providers/registry.ts</code>:
              <pre className="bg-muted rounded p-2 mt-1 text-xs overflow-x-auto">{"adapters.set('yourkey', () => new YourProvider())"}</pre>
            </li>
            <li>
              Add the provider record to DB (via seed or Prisma Studio):
              <pre className="bg-muted rounded p-2 mt-1 text-xs overflow-x-auto">{'key: "yourkey", name: "Your Provider", enabled: true'}</pre>
            </li>
            <li>
              Run sync: <code className="bg-muted px-1 rounded">npm run sync:provider yourkey</code>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Useful commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            {[
              ['Start DB + Redis', 'docker-compose up -d'],
              ['Run migrations', 'npm run db:migrate'],
              ['Seed providers', 'npm run db:seed'],
              ['Open Prisma Studio', 'npm run db:studio'],
              ['Sync one provider', 'npm run sync:provider emag'],
              ['Sync all enabled', 'npm run sync:all'],
              ['Start dev server', 'npm run dev'],
            ].map(([label, cmd]) => (
              <div key={cmd} className="flex items-center gap-4">
                <span className="text-muted-foreground w-44 font-sans text-xs">{label}</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{cmd}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
