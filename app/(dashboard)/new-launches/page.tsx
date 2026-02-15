import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function NewLaunchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Launches</h1>
        <p className="text-muted-foreground">
          Recently launched creatives and their early performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Launches</CardTitle>
          <CardDescription>Creatives launched in the last 7-30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Track new creative performance with early signals
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
