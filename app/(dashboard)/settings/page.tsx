import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetaSync } from "@/components/settings/meta-sync";
import { NamingConvention } from "@/components/settings/naming-convention";
import { BenchmarkTargets } from "@/components/settings/benchmark-targets";

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

        <NamingConvention />

        <BenchmarkTargets />

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
