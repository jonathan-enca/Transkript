import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ConceptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Concept Performance</h1>
        <p className="text-muted-foreground">
          Performance analysis grouped by creative concept
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Concepts</CardTitle>
          <CardDescription>Automatically grouped by similarity and naming convention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Concept-level analysis with variant comparison
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
