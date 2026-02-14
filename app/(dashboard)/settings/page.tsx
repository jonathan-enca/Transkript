import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <Card>
          <CardHeader>
            <CardTitle>Meta Ad Account</CardTitle>
            <CardDescription>
              Connectez votre compte Meta pour synchroniser vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Statut</div>
                <div className="text-sm text-muted-foreground">
                  Non connecté
                </div>
              </div>
              <Button>Connecter</Button>
            </div>
          </CardContent>
        </Card>

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
            <CardTitle>Synchronisation</CardTitle>
            <CardDescription>
              Gérez la synchronisation de vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Dernière synchronisation</div>
                <div className="text-sm text-muted-foreground">
                  Jamais
                </div>
              </div>
              <Button variant="outline">Synchroniser maintenant</Button>
            </div>
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
