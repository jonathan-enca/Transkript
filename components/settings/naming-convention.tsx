"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { NAMING_PRESETS, NamingConventionConfig } from "@/lib/naming-convention";

export function NamingConvention() {
  const [config, setConfig] = useState<NamingConventionConfig>(NAMING_PRESETS.default);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exampleName, setExampleName] = useState("UGC_TalkingHead_ProblemAware_20%OFF_Sarah_V1");

  useEffect(() => {
    // Load current config
    fetch("/api/settings/naming-convention")
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setConfig(data.config);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch("/api/settings/naming-convention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetChange = (presetKey: string) => {
    if (presetKey in NAMING_PRESETS) {
      setConfig(NAMING_PRESETS[presetKey as keyof typeof NAMING_PRESETS]);
    }
  };

  // Parse example name to show preview
  const parseExample = () => {
    const parts = exampleName.split(config.separator);
    const result: Record<string, string> = {};

    Object.entries(config.segments).forEach(([key, index]) => {
      if (index >= 0 && index < parts.length) {
        result[key] = parts[index];
      }
    });

    return result;
  };

  const parsedExample = parseExample();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Naming Convention</CardTitle>
        <CardDescription>
          Configurez comment extraire les tags depuis les noms de vos ads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset selector */}
        <div className="space-y-2">
          <Label>Modèle prédéfini</Label>
          <Select
            value={Object.keys(NAMING_PRESETS).find(
              key => JSON.stringify(NAMING_PRESETS[key as keyof typeof NAMING_PRESETS]) === JSON.stringify(config)
            ) || "custom"}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Par défaut</SelectItem>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="detailed">Détaillé</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pattern display */}
        <div className="space-y-2">
          <Label>Pattern</Label>
          <div className="p-3 bg-muted rounded-md font-mono text-sm">
            {config.pattern}
          </div>
        </div>

        {/* Separator */}
        <div className="space-y-2">
          <Label htmlFor="separator">Séparateur</Label>
          <Input
            id="separator"
            value={config.separator}
            onChange={(e) => setConfig({ ...config, separator: e.target.value })}
            placeholder="_"
            className="w-20 font-mono"
          />
        </div>

        {/* Example parsing */}
        <div className="space-y-3">
          <Label htmlFor="example">Test avec un nom d&apos;ad</Label>
          <Input
            id="example"
            value={exampleName}
            onChange={(e) => setExampleName(e.target.value)}
            placeholder="Entrez un nom d'ad exemple"
            className="font-mono"
          />

          {Object.keys(parsedExample).length > 0 && (
            <div className="p-4 bg-muted/50 rounded-md space-y-2">
              <div className="text-sm font-medium">Résultat du parsing :</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(parsedExample).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-muted-foreground capitalize">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save status */}
        {saveStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Configuration enregistrée ! Les tags seront extraits lors du prochain sync.
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors de l&apos;enregistrement. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfig(NAMING_PRESETS.default)}
          >
            Réinitialiser
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          💡 Les tags seront automatiquement extraits lors du prochain sync.
          Vous pouvez aussi ré-appliquer le parsing à toutes les ads existantes via le bouton ci-dessous.
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            fetch("/api/settings/naming-convention/reparse-all", { method: "POST" })
              .then(() => alert("Re-parsing lancé !"))
              .catch(() => alert("Erreur"));
          }}
        >
          Ré-appliquer à toutes les ads
        </Button>
      </CardContent>
    </Card>
  );
}
