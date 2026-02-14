import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(
  value: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get color class based on score (0-100)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Get background color class based on score (0-100)
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Get trend indicator emoji
 */
export function getTrendEmoji(trend: "scaling" | "holding" | "declining"): string {
  switch (trend) {
    case "scaling":
      return "🟢";
    case "holding":
      return "🟡";
    case "declining":
      return "🔴";
  }
}

/**
 * Get fatigue status
 */
export function getFatigueStatus(
  score: number
): "fresh" | "attention" | "fatigued" {
  if (score < 30) return "fresh";
  if (score < 60) return "attention";
  return "fatigued";
}

/**
 * Get fatigue color
 */
export function getFatigueColor(score: number): string {
  const status = getFatigueStatus(score);
  switch (status) {
    case "fresh":
      return "text-green-500";
    case "attention":
      return "text-yellow-500";
    case "fatigued":
      return "text-red-500";
  }
}
