import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TopConvertersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Converters</h1>
        <p className="text-muted-foreground">
          Creatives with best conversion rate and ROAS, including hidden gems
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Champions</CardTitle>
          <CardDescription>Ranked by purchase conversion and ROAS</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Find your best converters and underrated performers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
