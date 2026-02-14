"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCurrency,
  formatPercentage,
  getTrendEmoji,
  getScoreColor,
  getScoreBgColor,
} from "@/lib/utils";
import { Ad, DailyMetric } from "@/lib/db/schema";
import { CalculatedMetrics } from "@/lib/metrics/calculated";
import { ScoreDiagnostic } from "@/lib/metrics/scoring";
import Image from "next/image";
import { format } from "date-fns";
import { Play } from "lucide-react";

interface CreativeDeepDiveProps {
  data: {
    ad: Ad;
    metrics: DailyMetric[];
    aggregated: DailyMetric;
    calculated: CalculatedMetrics;
    diagnostic: ScoreDiagnostic | null;
  };
}

export function CreativeDeepDive({ data }: CreativeDeepDiveProps) {
  const { ad, metrics, aggregated, calculated, diagnostic } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ad.name}</h1>
        <p className="text-muted-foreground">{ad.campaignName}</p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Creative Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Creative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
                {ad.videoUrl ? (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                ) : ad.imageUrl || ad.thumbnailUrl ? (
                  <Image
                    src={ad.imageUrl || ad.thumbnailUrl || ""}
                    alt={ad.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No preview
                  </div>
                )}
              </div>

              {/* Ad Copy */}
              {ad.headline && (
                <div>
                  <div className="text-sm font-medium mb-1">Headline</div>
                  <div className="text-sm text-muted-foreground">
                    {ad.headline}
                  </div>
                </div>
              )}

              {ad.body && (
                <div>
                  <div className="text-sm font-medium mb-1">Body</div>
                  <div className="text-sm text-muted-foreground">{ad.body}</div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format</span>
                  <Badge variant="outline">{ad.format}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={ad.status === "ACTIVE" ? "success" : "secondary"}
                  >
                    {ad.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(ad.createdTime, "MMM dd, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="funnel">Funnel</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(aggregated.spend)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">ROAS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {calculated.roas.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CPA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(calculated.cpa)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Purchases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {aggregated.purchases}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {metrics.slice(-7).reverse().map((metric) => (
                      <div
                        key={metric.date}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="text-sm font-medium">
                          {format(new Date(metric.date), "MMM dd")}
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            Spend: {formatCurrency(metric.spend)}
                          </span>
                          <span>
                            Purchases: {metric.purchases}
                          </span>
                          <span>
                            ROAS: {metric.purchaseRoas.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Funnel Tab */}
            <TabsContent value="funnel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <FunnelStep
                      label="Impressions"
                      value={aggregated.impressions}
                      percentage={100}
                    />
                    <FunnelStep
                      label="3s Views"
                      value={aggregated.video3sViews}
                      percentage={calculated.hookRate}
                    />
                    <FunnelStep
                      label="15s Views"
                      value={aggregated.video15sViews}
                      percentage={calculated.holdRate}
                    />
                    <FunnelStep
                      label="Outbound Clicks"
                      value={aggregated.outboundClicks}
                      percentage={calculated.clickRate}
                    />
                    <FunnelStep
                      label="Purchases"
                      value={aggregated.purchases}
                      percentage={calculated.conversionRate}
                    />
                  </div>
                </CardContent>
              </Card>

              {ad.format === "video" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Video Retention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <RetentionBar
                        label="25%"
                        value={calculated.dropOff25}
                      />
                      <RetentionBar
                        label="50%"
                        value={calculated.dropOff50}
                      />
                      <RetentionBar
                        label="75%"
                        value={calculated.dropOff75}
                      />
                      <RetentionBar
                        label="100%"
                        value={calculated.dropOff100}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Scores Tab */}
            <TabsContent value="scores" className="space-y-4">
              {diagnostic ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ScoreCard
                      title="Hook Score"
                      score={diagnostic.scores.hookScore}
                      description="Capacité à capter l'attention"
                    />
                    <ScoreCard
                      title="Watch Score"
                      score={diagnostic.scores.watchScore}
                      description="Capacité à retenir l'attention"
                    />
                    <ScoreCard
                      title="Click Score"
                      score={diagnostic.scores.clickScore}
                      description="Capacité à générer du clic"
                    />
                    <ScoreCard
                      title="Convert Score"
                      score={diagnostic.scores.convertScore}
                      description="Capacité à convertir"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Diagnostic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="font-medium mb-2">Analyse</div>
                        <p className="text-sm text-muted-foreground">
                          {diagnostic.diagnosis}
                        </p>
                      </div>
                      <div>
                        <div className="font-medium mb-2">Recommandation</div>
                        <p className="text-sm text-muted-foreground">
                          {diagnostic.recommendation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Pas assez de données pour calculer les scores. Lancez une
                      synchronisation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value.toLocaleString()} ({formatPercentage(percentage)})
        </span>
      </div>
      <div className="h-8 bg-muted rounded-lg overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RetentionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{formatPercentage(value)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  description,
}: {
  title: string;
  score: number;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <div className="text-sm font-medium">{title}</div>
          <div className="flex items-baseline gap-2">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {Math.round(score)}
            </div>
            <div className="text-muted-foreground">/100</div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreBgColor(score)} transition-all`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
