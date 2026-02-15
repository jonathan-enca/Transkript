import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function StaticAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Static Analysis</h1>
        <p className="text-muted-foreground">
          Performance analysis of static image creatives
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Static Creatives</CardTitle>
          <CardDescription>Image ads performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Dedicated view for static image creative analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
