"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  account_status: number;
}

interface SyncStatus {
  loading: boolean;
  success: boolean | null;
  message: string;
  data?: {
    ads: {
      inserted: number;
      updated: number;
      skipped?: number;
      total: number;
      errors?: Array<{ adId: string; error: string }>;
    };
    metrics: {
      inserted: number;
      updated: number;
      skipped?: number;
      total: number;
      errors?: Array<{ adId: string; error: string }>;
    };
  };
}

export function MetaSync() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    loading: false,
    success: null,
    message: "",
  });

  // Load ad accounts when user is authenticated
  useEffect(() => {
    if (session) {
      loadAccounts();
    }
  }, [session]);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch("/api/meta/accounts");
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id);
        }
      } else {
        console.error("Failed to load accounts:", data.error);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSync = async () => {
    if (!selectedAccount) {
      alert("Veuillez sélectionner un compte publicitaire");
      return;
    }

    setSyncStatus({
      loading: true,
      success: null,
      message: "Synchronisation en cours...",
    });

    try {
      const response = await fetch("/api/meta/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adAccountId: selectedAccount,
          daysBack: 30,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          loading: false,
          success: true,
          message: "✅ Synchronisation réussie !",
          data: data.data,
        });
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          message: `❌ Erreur: ${data.error}`,
        });
      }
    } catch (error) {
      setSyncStatus({
        loading: false,
        success: false,
        message: `❌ Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      });
    }
  };

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Ad Account</CardTitle>
          <CardDescription>
            Connectez-vous pour synchroniser vos données Meta Ads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vous devez être connecté avec Facebook pour accéder à vos comptes publicitaires.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meta Ad Account</CardTitle>
          <CardDescription>
            Sélectionnez le compte publicitaire à synchroniser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccounts ? (
            <p>Chargement des comptes...</p>
          ) : accounts.length === 0 ? (
            <div>
              <p className="text-muted-foreground mb-4">
                Aucun compte publicitaire trouvé. Assurez-vous d&apos;avoir les permissions nécessaires.
              </p>
              <Button onClick={loadAccounts} variant="outline">
                Recharger
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Compte publicitaire</label>
                <select
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.account_id}) - {account.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">
                  {accounts.length} compte(s) disponible(s)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synchronisation</CardTitle>
          <CardDescription>
            Récupérez vos campagnes et métriques des 30 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {syncStatus.loading
                  ? "Synchronisation en cours..."
                  : syncStatus.success === true
                  ? "Dernière synchronisation"
                  : syncStatus.success === false
                  ? "Erreur"
                  : "Prêt à synchroniser"}
              </div>
              <div className="text-sm text-muted-foreground">
                {syncStatus.message || "Cliquez sur le bouton pour lancer la synchronisation"}
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncStatus.loading || accounts.length === 0}
            >
              {syncStatus.loading ? "Synchronisation..." : "Synchroniser maintenant"}
            </Button>
          </div>

          {syncStatus.data && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold">Résultat de la synchronisation :</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Annonces</div>
                  <div className="text-muted-foreground">
                    {syncStatus.data.ads.inserted} nouvelles, {syncStatus.data.ads.updated} mises à jour
                    {syncStatus.data.ads.skipped ? `, ${syncStatus.data.ads.skipped} ignorées` : ""}
                    <br />
                    Total : {syncStatus.data.ads.total}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Métriques</div>
                  <div className="text-muted-foreground">
                    {syncStatus.data.metrics.inserted} nouvelles, {syncStatus.data.metrics.updated} mises à jour
                    {syncStatus.data.metrics.skipped ? `, ${syncStatus.data.metrics.skipped} ignorées` : ""}
                    <br />
                    Total : {syncStatus.data.metrics.total}
                  </div>
                </div>
              </div>

              {syncStatus.data.ads.errors && syncStatus.data.ads.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="font-medium text-red-800 dark:text-red-200 mb-2">
                    ⚠️ Erreurs de synchronisation des annonces ({syncStatus.data.ads.errors.length})
                  </div>
                  <div className="space-y-1 text-xs text-red-700 dark:text-red-300 max-h-40 overflow-y-auto">
                    {syncStatus.data.ads.errors.slice(0, 5).map((err, i) => (
                      <div key={i}>
                        Ad {err.adId}: {err.error}
                      </div>
                    ))}
                    {syncStatus.data.ads.errors.length > 5 && (
                      <div className="text-red-600 dark:text-red-400 font-medium">
                        ... et {syncStatus.data.ads.errors.length - 5} autres erreurs
                      </div>
                    )}
                  </div>
                </div>
              )}

              {syncStatus.data.metrics.errors && syncStatus.data.metrics.errors.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                  <div className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                    ⚠️ Erreurs de synchronisation des métriques ({syncStatus.data.metrics.errors.length})
                  </div>
                  <div className="space-y-1 text-xs text-orange-700 dark:text-orange-300 max-h-40 overflow-y-auto">
                    {syncStatus.data.metrics.errors.slice(0, 5).map((err, i) => (
                      <div key={i}>
                        Ad {err.adId}: {err.error}
                      </div>
                    ))}
                    {syncStatus.data.metrics.errors.length > 5 && (
                      <div className="text-orange-600 dark:text-orange-400 font-medium">
                        ... et {syncStatus.data.metrics.errors.length - 5} autres erreurs
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
