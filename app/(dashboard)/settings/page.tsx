import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetaSync } from "@/components/settings/meta-sync";
import { NamingConvention } from "@/components/settings/naming-convention";
import { DatabaseManagement } from "@/components/settings/database-management";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configurez votre compte Meta Ads et vos préférences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <MetaSync />

        <DatabaseManagement />

        <NamingConvention />

        <Card>
          <CardHeader>
            <CardTitle>Benchmarks Cibles</CardTitle>
            <CardDescription>
              Définissez vos objectifs de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hook Rate Cible (%)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  defaultValue={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ROAS Cible</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  defaultValue={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">CPA Max (€)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  defaultValue={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Devise</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>EUR</option>
                  <option>USD</option>
                  <option>GBP</option>
                </select>
              </div>
            </div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>
              Testez l&apos;application avec des données fictives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/seed-demo" method="POST">
              <Button type="submit">Générer données de démo</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
