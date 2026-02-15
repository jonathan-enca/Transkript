"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Database, Trash2, CheckCircle2, XCircle } from "lucide-react";

export function DatabaseManagement() {
  const [migrating, setMigrating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearResult, setClearResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch("/api/migrate", { method: "POST" });
      const data = await res.json();
      setMigrateResult(data);
    } catch (error) {
      setMigrateResult({
        success: false,
        message: error instanceof Error ? error.message : "Migration failed"
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les données de démo ? Cette action est irréversible.")) {
      return;
    }

    setClearing(true);
    setClearResult(null);
    try {
      const res = await fetch("/api/clear-demo", { method: "POST" });
      const data = await res.json();
      setClearResult(data);

      // Refresh page after clearing
      if (data.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setClearResult({
        success: false,
        message: error instanceof Error ? error.message : "Clear failed"
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>
          Gérez les migrations et les données de votre base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Migrate Button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Run Migrations</p>
              <p className="text-sm text-muted-foreground">
                Créer toutes les tables manquantes (sync_log, concepts, etc.)
              </p>
            </div>
            <Button
              onClick={handleMigrate}
              disabled={migrating}
              variant="outline"
            >
              {migrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migration...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Migrate
                </>
              )}
            </Button>
          </div>
          {migrateResult && (
            <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${
              migrateResult.success
                ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
                : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
            }`}>
              {migrateResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{migrateResult.message}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-4" />

        {/* Clear Demo Data Button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear Demo Data</p>
              <p className="text-sm text-muted-foreground">
                Supprimer toutes les données de démo de la base
              </p>
            </div>
            <Button
              onClick={handleClear}
              disabled={clearing}
              variant="destructive"
            >
              {clearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </>
              )}
            </Button>
          </div>
          {clearResult && (
            <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${
              clearResult.success
                ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
                : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
            }`}>
              {clearResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{clearResult.message}</span>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium mb-1">💡 Usage:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Cliquez &quot;Migrate&quot; pour créer les tables manquantes</li>
            <li>Cliquez &quot;Clear All&quot; pour vider les données de démo</li>
            <li>Ensuite, lancez une synchronisation Meta pour charger les vraies données</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
