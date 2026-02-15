import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ConceptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Concept Detail</h1>
        <p className="text-muted-foreground">
          Deep dive into concept performance and variant analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Concept: {id}</CardTitle>
          <CardDescription>All variants and their comparative performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Variant analysis, insights and recommendations
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
