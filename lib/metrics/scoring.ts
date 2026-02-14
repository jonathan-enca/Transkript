/**
 * Scoring system for creative performance
 * Scores creatives on a 0-100 scale based on percentile benchmarks
 */

import { Benchmark } from "@/lib/db/schema";
import { CalculatedMetrics } from "./calculated";

export interface CreativeScores {
  hookScore: number; // 0-100
  watchScore: number; // 0-100
  clickScore: number; // 0-100
  convertScore: number; // 0-100
  overallScore: number; // Average of all scores
}

export interface ScoreDiagnostic {
  scores: CreativeScores;
  diagnosis: string;
  recommendation: string;
  status: "winner" | "good" | "average" | "poor";
}

/**
 * Map a value to a 0-100 score based on percentile benchmarks
 */
export function mapToScore(
  value: number,
  benchmarks: Pick<Benchmark, "p10" | "p25" | "p50" | "p75" | "p90">
): number {
  const { p10, p25, p50, p75, p90 } = benchmarks;

  if (value >= p90) {
    // Map p90-infinity to 90-100
    const excess = value - p90;
    const range = p90 * 0.2; // Assume top end is 20% above p90
    const normalizedExcess = Math.min(excess / range, 1);
    return 90 + normalizedExcess * 10;
  }

  if (value >= p75) {
    // Map p75-p90 to 70-89
    const progress = (value - p75) / (p90 - p75);
    return 70 + progress * 19;
  }

  if (value >= p50) {
    // Map p50-p75 to 50-69
    const progress = (value - p50) / (p75 - p50);
    return 50 + progress * 19;
  }

  if (value >= p25) {
    // Map p25-p50 to 30-49
    const progress = (value - p25) / (p50 - p25);
    return 30 + progress * 19;
  }

  if (value >= p10) {
    // Map p10-p25 to 10-29
    const progress = (value - p10) / (p25 - p10);
    return 10 + progress * 19;
  }

  // Below p10: map to 0-9
  if (p10 > 0) {
    const progress = Math.min(value / p10, 1);
    return progress * 9;
  }

  return 0;
}

/**
 * Calculate all scores for a creative based on its metrics and benchmarks
 */
export function calculateScores(
  metrics: CalculatedMetrics,
  benchmarks: {
    hookRate: Benchmark;
    holdRate: Benchmark;
    clickRate: Benchmark;
    roas: Benchmark;
  }
): CreativeScores {
  const hookScore = mapToScore(metrics.hookRate, benchmarks.hookRate);
  const watchScore = mapToScore(metrics.holdRate, benchmarks.holdRate);
  const clickScore = mapToScore(metrics.clickRate, benchmarks.clickRate);
  const convertScore = mapToScore(metrics.roas, benchmarks.roas);

  const overallScore = (hookScore + watchScore + clickScore + convertScore) / 4;

  return {
    hookScore,
    watchScore,
    clickScore,
    convertScore,
    overallScore,
  };
}

/**
 * Get diagnostic and recommendations based on score pattern
 */
export function getDiagnostic(scores: CreativeScores): ScoreDiagnostic {
  const { hookScore, watchScore, clickScore, convertScore, overallScore } =
    scores;

  // Determine overall status
  let status: "winner" | "good" | "average" | "poor";
  if (overallScore >= 80) status = "winner";
  else if (overallScore >= 60) status = "good";
  else if (overallScore >= 40) status = "average";
  else status = "poor";

  // Pattern-based diagnostics
  const isHigh = (score: number) => score >= 70;
  const isMid = (score: number) => score >= 40 && score < 70;
  const isLow = (score: number) => score < 40;

  // All high
  if (
    isHigh(hookScore) &&
    isHigh(watchScore) &&
    isHigh(clickScore) &&
    isHigh(convertScore)
  ) {
    return {
      scores,
      diagnosis:
        "🏆 Winner! Cette créative performe sur toute la ligne.",
      recommendation:
        "Scaler cette créative et créer des variantes avec des hooks similaires.",
      status: "winner",
    };
  }

  // Hook low, others high
  if (
    isLow(hookScore) &&
    (isHigh(watchScore) || isMid(watchScore)) &&
    (isHigh(clickScore) || isMid(clickScore))
  ) {
    return {
      scores,
      diagnosis:
        "Le contenu de cette ad est excellent mais le hook ne capte pas assez d'attention.",
      recommendation:
        "Tester de nouveaux openings/thumbnails plus disruptifs. Le reste du contenu fonctionne bien.",
      status: overallScore >= 60 ? "good" : "average",
    };
  }

  // Hook high, watch low
  if (isHigh(hookScore) && isLow(watchScore)) {
    return {
      scores,
      diagnosis: "Le hook attire mais le contenu ne retient pas.",
      recommendation:
        "Le body de la vidéo doit être retravaillé. Garder le hook mais améliorer la suite.",
      status: overallScore >= 60 ? "good" : "average",
    };
  }

  // Hook + watch high, click low
  if (isHigh(hookScore) && isHigh(watchScore) && isLow(clickScore)) {
    return {
      scores,
      diagnosis: "La vidéo engage mais ne pousse pas à l'action.",
      recommendation:
        "Revoir le CTA et l'offre. Tester des CTA plus forts ou des offres différentes.",
      status: overallScore >= 60 ? "good" : "average",
    };
  }

  // Hook + watch + click high, convert low
  if (
    isHigh(hookScore) &&
    isHigh(watchScore) &&
    isHigh(clickScore) &&
    isLow(convertScore)
  ) {
    return {
      scores,
      diagnosis: "Le trafic est qualifié mais ne convertit pas.",
      recommendation:
        "Problème probable sur la landing page ou l'offre. Vérifier le parcours post-clic.",
      status: overallScore >= 60 ? "good" : "average",
    };
  }

  // All low
  if (
    isLow(hookScore) &&
    isLow(watchScore) &&
    isLow(clickScore) &&
    isLow(convertScore)
  ) {
    return {
      scores,
      diagnosis:
        "Cette créative sous-performe sur tous les indicateurs.",
      recommendation:
        "Repenser complètement le concept créatif. Analyser les winners du compte pour s'inspirer.",
      status: "poor",
    };
  }

  // Convert high but others low/mid (mismatch)
  if (isHigh(convertScore) && (isLow(hookScore) || isLow(watchScore))) {
    return {
      scores,
      diagnosis:
        "Cette créative convertit bien le peu de trafic qu'elle génère.",
      recommendation:
        "Améliorer le hook et la rétention pour scaler. Le message/offre est solide.",
      status: overallScore >= 60 ? "good" : "average",
    };
  }

  // Default: mixed performance
  return {
    scores,
    diagnosis:
      "Performance mixte. Certains aspects fonctionnent mieux que d'autres.",
    recommendation:
      "Analyser les scores individuels et prioriser l'amélioration des points faibles.",
    status: overallScore >= 60 ? "good" : "average",
  };
}
