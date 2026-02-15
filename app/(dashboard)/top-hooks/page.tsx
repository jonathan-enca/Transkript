import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function TopHooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Hooks</h1>
        <p className="text-muted-foreground">
          Best performing hooks ranked by hook rate and engagement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hook Performance</CardTitle>
          <CardDescription>Ranked by 3-second view rate</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Analyze which hooks capture attention best
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
