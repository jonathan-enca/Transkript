import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function DiagnosticPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnostic Center</h1>
        <p className="text-muted-foreground">
          Automated troubleshooting for performance issues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Diagnostics</CardTitle>
          <CardDescription>AI-powered issue detection and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Decision tree for diagnosing CPA spikes and performance drops
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
