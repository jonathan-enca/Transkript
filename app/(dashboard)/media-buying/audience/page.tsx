import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AudiencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audience Insights</h1>
        <p className="text-muted-foreground">
          Demographic breakdown and placement performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audience Breakdown</CardTitle>
          <CardDescription>Age, gender and placement analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Age×Gender heatmaps and placement comparisons
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
