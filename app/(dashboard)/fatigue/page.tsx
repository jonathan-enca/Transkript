import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { ads, dailyMetrics } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { formatDateToISO, formatCurrency, getFatigueColor, getFatigueStatus } from "@/lib/utils";
import { calculateFatigueScore } from "@/lib/metrics/calculated";

interface AdWithFatigue {
  id: string;
  name: string;
  campaignName: string;
  status: string;
  fatigueScore: number;
  spend: number;
}

async function getAdsWithFatigue(): Promise<AdWithFatigue[]> {
  const allAds = await db.select().from(ads).where(eq(ads.status, "ACTIVE"));

  const adsWithFatigue: AdWithFatigue[] = [];

  for (const ad of allAds) {
    const sevenDaysAgo = formatDateToISO(subDays(new Date(), 7));
    const fourteenDaysAgo = formatDateToISO(subDays(new Date(), 14));

    const last7Days = await db
      .select()
      .from(dailyMetrics)
      .where(and(eq(dailyMetrics.adId, ad.id), gte(dailyMetrics.date, sevenDaysAgo)))
      ;

    const allMetrics = await db
      .select()
      .from(dailyMetrics)
      .where(
        and(
          eq(dailyMetrics.adId, ad.id),
          gte(dailyMetrics.date, fourteenDaysAgo)
        )
      )
      ;

    const previous7Days = allMetrics.filter((m) => m.date < sevenDaysAgo);

    if (last7Days.length === 0) continue;

    const fatigueScore = calculateFatigueScore(last7Days, previous7Days);
    const totalSpend = last7Days.reduce((sum, m) => sum + m.spend, 0);

    adsWithFatigue.push({
      id: ad.id,
      name: ad.name,
      campaignName: ad.campaignName,
      status: ad.status,
      fatigueScore,
      spend: totalSpend,
    });
  }

  return adsWithFatigue.sort((a, b) => b.fatigueScore - a.fatigueScore);
}

export default async function FatiguePage() {
  const adsWithFatigue = await getAdsWithFatigue();

  const fresh = adsWithFatigue.filter((a) => getFatigueStatus(a.fatigueScore) === "fresh");
  const attention = adsWithFatigue.filter((a) => getFatigueStatus(a.fatigueScore) === "attention");
  const fatigued = adsWithFatigue.filter((a) => getFatigueStatus(a.fatigueScore) === "fatigued");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fatigue Detection</h1>
        <p className="text-muted-foreground">
          Identifiez les créatives qui montrent des signes de fatigue
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fresh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{fresh.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Créatives performantes sans fatigue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{attention.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Début de fatigue détecté
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fatigued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{fatigued.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Créatives fatiguées, action requise
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les créatives actives</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creative</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Spend (7d)</TableHead>
                <TableHead>Fatigue Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adsWithFatigue.map((ad) => {
                const status = getFatigueStatus(ad.fatigueScore);
                return (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ad.campaignName}
                    </TableCell>
                    <TableCell>{formatCurrency(ad.spend)}</TableCell>
                    <TableCell>
                      <span className={getFatigueColor(ad.fatigueScore)}>
                        {Math.round(ad.fatigueScore)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === "fresh"
                            ? "success"
                            : status === "attention"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {adsWithFatigue.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune créative active trouvée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
