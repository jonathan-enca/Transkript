import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function DailyPulsePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Pulse</h1>
        <p className="text-muted-foreground">
          Your daily media buying snapshot with actionable recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Overview</CardTitle>
          <CardDescription>Yesterday&apos;s performance and recommended actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Daily scorecard, funnel and automated recommendations
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
