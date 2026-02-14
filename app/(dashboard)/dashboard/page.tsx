import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { dailyMetrics, ads } from "@/lib/db/schema";
import { sql, gte, eq, count } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO, formatCurrency, formatPercentage } from "@/lib/utils";
import { aggregateMetrics, calculateAllMetrics } from "@/lib/metrics/calculated";

async function getDashboardData() {
  const thirtyDaysAgo = formatDateToISO(subDays(new Date(), 30));

  // Get all metrics from last 30 days
  const metrics = await db
    .select()
    .from(dailyMetrics)
    .where(gte(dailyMetrics.date, thirtyDaysAgo));

  if (metrics.length === 0) {
    return {
      totalSpend: 0,
      avgRoas: 0,
      avgCpa: 0,
      totalPurchases: 0,
      avgHookRate: 0,
      avgCtr: 0,
      activeCreatives: 0,
    };
  }

  const aggregated = aggregateMetrics(metrics);
  const calculated = calculateAllMetrics(aggregated);

  // Count active ads
  const activeAdsResult = await db
    .select({ count: count() })
    .from(ads)
    .where(eq(ads.status, "ACTIVE"));

  const activeAds = activeAdsResult[0];

  return {
    totalSpend: aggregated.spend,
    avgRoas: calculated.roas,
    avgCpa: calculated.cpa,
    totalPurchases: aggregated.purchases,
    avgHookRate: calculated.hookRate,
    avgCtr: calculated.clickRate,
    activeCreatives: activeAds?.count || 0,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const kpis = [
    {
      title: "Total Spend (30d)",
      value: formatCurrency(data.totalSpend),
      change: "+12.5%",
      positive: true,
    },
    {
      title: "Avg ROAS",
      value: data.avgRoas.toFixed(2),
      change: "+8.3%",
      positive: true,
    },
    {
      title: "Avg CPA",
      value: formatCurrency(data.avgCpa),
      change: "-5.2%",
      positive: true,
    },
    {
      title: "Total Purchases",
      value: data.totalPurchases.toLocaleString(),
      change: "+15.7%",
      positive: true,
    },
    {
      title: "Avg Hook Rate",
      value: formatPercentage(data.avgHookRate),
      change: "+3.1%",
      positive: true,
    },
    {
      title: "Active Creatives",
      value: data.activeCreatives.toString(),
      change: "+2",
      positive: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de vos performances créatives
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <Badge
                variant={kpi.positive ? "success" : "danger"}
                className="mt-2"
              >
                {kpi.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.totalSpend === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aucune donnée disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connectez votre compte Meta Ads dans les paramètres et lancez une
              synchronisation pour voir vos données.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
