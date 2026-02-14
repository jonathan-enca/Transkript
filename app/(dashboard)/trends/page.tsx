import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrendsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trends & Patterns</h1>
        <p className="text-muted-foreground">
          Analysez les tendances de performance de votre compte
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Video</span>
                <span className="font-bold">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Image</span>
                <span className="font-bold">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Carousel</span>
                <span className="font-bold">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durée vidéo optimale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>&lt;15s</span>
                <span className="font-bold">ROAS: 2.8</span>
              </div>
              <div className="flex items-center justify-between">
                <span>15-30s</span>
                <span className="font-bold text-green-500">ROAS: 3.5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>30-60s</span>
                <span className="font-bold">ROAS: 2.1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>&gt;60s</span>
                <span className="font-bold">ROAS: 1.8</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hook Rate moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">28.5%</div>
            <p className="text-sm text-muted-foreground mt-1">
              En progression de +3.2% ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durée de vie moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12 jours</div>
            <p className="text-sm text-muted-foreground mt-1">
              Avant apparition de fatigue
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance par jour de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Graphique à venir - Nécessite implémentation avec Recharts
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
