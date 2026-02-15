import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget Pacing</h1>
        <p className="text-muted-foreground">
          Track if you&apos;re on pace to hit your monthly spend targets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Pacing</CardTitle>
          <CardDescription>Current vs target spend with projections</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Pacing tracker with daily breakdown and alerts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
