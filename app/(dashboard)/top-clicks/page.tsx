import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TopClicksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Clicks</h1>
        <p className="text-muted-foreground">
          Creatives with highest CTR and link click performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Click Performance</CardTitle>
          <CardDescription>Ranked by CTR and outbound clicks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Identify creatives that drive the most traffic
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
