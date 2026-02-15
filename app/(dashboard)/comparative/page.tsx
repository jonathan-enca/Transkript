import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ComparativePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comparative Analysis</h1>
        <p className="text-muted-foreground">
          Compare performance across tags, formats and creative elements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tag Comparison</CardTitle>
          <CardDescription>Compare metrics across different segments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Compare UGC vs Branded, Hooks, Offers and more
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
