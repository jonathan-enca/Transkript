"use client";

import { useState } from "react";
import { CreativeWithMetrics } from "@/app/(dashboard)/leaderboard/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatPercentage,
  getTrendEmoji,
  getScoreColor,
} from "@/lib/utils";
import { Grid, List, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type SortKey = keyof CreativeWithMetrics;
type ViewMode = "cards" | "table";

interface CreativeLeaderboardProps {
  creatives: CreativeWithMetrics[];
}

export function CreativeLeaderboard({ creatives }: CreativeLeaderboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedCreatives = [...creatives].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {creatives.length} créatives
        </div>
      </div>

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCreatives.map((creative) => (
            <Link key={creative.id} href={`/creative/${creative.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative">
                  {creative.thumbnailUrl || creative.imageUrl ? (
                    <Image
                      src={creative.thumbnailUrl || creative.imageUrl || ""}
                      alt={creative.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No preview
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold truncate">{creative.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {creative.format}
                      </Badge>
                      <Badge
                        variant={
                          creative.status === "ACTIVE" ? "success" : "secondary"
                        }
                        className="text-xs"
                      >
                        {creative.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Spend</div>
                      <div className="font-semibold">
                        {formatCurrency(creative.spend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">ROAS</div>
                      <div className={`font-semibold ${getScoreColor(creative.roas * 20)}`}>
                        {creative.roas.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Hook Rate
                      </div>
                      <div className="font-semibold">
                        {formatPercentage(creative.hookRate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">CPA</div>
                      <div className="font-semibold">
                        {formatCurrency(creative.cpa)}
                      </div>
                    </div>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Trend</span>
                    <span className="text-sm">
                      {getTrendEmoji(creative.spendTrend)}{" "}
                      {creative.spendTrend}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creative</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("spend")}>
                  <div className="flex items-center gap-1">
                    Spend <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("hookRate")}>
                  <div className="flex items-center gap-1">
                    Hook Rate <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("holdRate")}>
                  <div className="flex items-center gap-1">
                    Hold Rate <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("clickRate")}>
                  <div className="flex items-center gap-1">
                    CTR <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("cpa")}>
                  <div className="flex items-center gap-1">
                    CPA <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("roas")}>
                  <div className="flex items-center gap-1">
                    ROAS <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCreatives.map((creative) => (
                <TableRow key={creative.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/creative/${creative.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded relative overflow-hidden flex-shrink-0">
                          {creative.thumbnailUrl || creative.imageUrl ? (
                            <Image
                              src={creative.thumbnailUrl || creative.imageUrl || ""}
                              alt={creative.name}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-medium truncate max-w-xs">
                            {creative.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {creative.format}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(creative.spend)}
                  </TableCell>
                  <TableCell>{formatPercentage(creative.hookRate)}</TableCell>
                  <TableCell>{formatPercentage(creative.holdRate)}</TableCell>
                  <TableCell>{formatPercentage(creative.clickRate)}</TableCell>
                  <TableCell>{formatCurrency(creative.cpa)}</TableCell>
                  <TableCell className={getScoreColor(creative.roas * 20)}>
                    {creative.roas.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {getTrendEmoji(creative.spendTrend)}
                      <span className="text-xs">{creative.spendTrend}</span>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {creatives.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucune créative trouvée. Synchronisez vos données Meta Ads pour commencer.
          </p>
        </Card>
      )}
    </div>
  );
}
