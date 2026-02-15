import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaign Manager</h1>
        <p className="text-muted-foreground">
          Manage and monitor all your campaigns and adsets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Full campaign structure with drilldown</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            🚧 Coming soon - Campaign/AdSet/Ad hierarchy with inline editing
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
