import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function FunnelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Full Funnel WoW</h1>
        <p className="text-muted-foreground">
          Week-over-week funnel performance analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Metrics</CardTitle>
          <CardDescription>Track every step from impression to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Complete funnel WoW table with trend analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
