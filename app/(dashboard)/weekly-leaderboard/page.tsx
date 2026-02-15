import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function WeeklyLeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Leaderboard</h1>
        <p className="text-muted-foreground">
          Auto-generated weekly performance report with winners and trends
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Week&apos;s Winners</CardTitle>
          <CardDescription>Top performers from the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Automated weekly performance digest
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
