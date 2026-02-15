import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creative Comparison</h1>
        <p className="text-muted-foreground">
          Side-by-side comparison of selected creatives
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compare Creatives</CardTitle>
          <CardDescription>Select up to 4 creatives to compare</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Direct comparison tool for A/B testing insights
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
