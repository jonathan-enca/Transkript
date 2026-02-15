"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BenchmarkTargets() {
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hookRateTarget, setHookRateTarget] = useState("30");
  const [roasTarget, setRoasTarget] = useState("3");
  const [cpaMax, setCpaMax] = useState("30");
  const [currency, setCurrency] = useState("EUR");

  // Load current settings from account
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/benchmark-targets");
        if (response.ok) {
          const data = await response.json();
          setHookRateTarget(data.hookRateTarget?.toString() || "30");
          setRoasTarget(data.roasTarget?.toString() || "3");
          setCpaMax(data.cpaMax?.toString() || "30");
          setCurrency(data.currency || "EUR");
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/settings/benchmark-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hookRateTarget: parseFloat(hookRateTarget),
          roasTarget: parseFloat(roasTarget),
          cpaMax: parseFloat(cpaMax),
          currency,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage({
          type: "success",
          message: "✅ Paramètres enregistrés avec succès!",
        });
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      setSaveMessage({
        type: "error",
        message: error instanceof Error ? error.message : "❌ Impossible de sauvegarder",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmarks Cibles</CardTitle>
        <CardDescription>
          Définissez vos objectifs de performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hook-rate">Hook Rate Cible (%)</Label>
            <Input
              id="hook-rate"
              type="number"
              value={hookRateTarget}
              onChange={(e) => setHookRateTarget(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roas">ROAS Cible</Label>
            <Input
              id="roas"
              type="number"
              step="0.1"
              value={roasTarget}
              onChange={(e) => setRoasTarget(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpa">CPA Max (€)</Label>
            <Input
              id="cpa"
              type="number"
              value={cpaMax}
              onChange={(e) => setCpaMax(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {saveMessage && (
          <div
            className={`p-3 rounded-md text-sm ${
              saveMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {saveMessage.message}
          </div>
        )}
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
}
