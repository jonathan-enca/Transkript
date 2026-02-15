import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TopCreativesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Creatives</h1>
        <p className="text-muted-foreground">
          Your best performing creatives ranked by ROAS, spend and conversions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Ranked by performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Full implementation with cards, table view and advanced filters
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
