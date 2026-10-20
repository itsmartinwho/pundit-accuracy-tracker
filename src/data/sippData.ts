import { formatDate } from "@/lib/utils";

export type PredictionCategory = 'economy' | 'politics' | 'technology' | 'foreign-policy' | 'social-trends';

export interface SIPP {
  id: string;
  name: string;
  photoUrl: string;
  shortBio: string;
  averageAccuracy: number;
  categoryAccuracy: {
    economy: number;
    politics: number;
    technology: number;
    foreign_policy: number;
    social_trends: number;
  };
  patternAnalysis: string;
  predictions: Prediction[];
}

export interface Prediction {
  id: string;
  dateStated: string;
  predictedOutcome: string;
  category: PredictionCategory;
  timeframe: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  actualOutcome?: string;
  accuracyRating?: number;
  normalizedScore?: number;
  analysisExplanation?: string;
  /** Where the prediction was made. Only in refreshed data. */
  source?: string;
  /** Where the outcome was reported. Only in refreshed data. */
  outcomeSource?: string;
}

/**
 * Where the data in public/data/sippData.json came from.
 * "synthetic": made up from templates and random numbers (the demo data).
 * "sourced": found by a model with web search, by scripts/refresh-data.mjs.
 */
export interface DatasetMeta {
  kind: 'synthetic' | 'sourced';
  generatedAt: string;
  model?: string;
}

export interface SippDataset {
  meta: DatasetMeta;
  sipps: SIPP[];
}

// Helper functions for formatting and color logic
export const formatNumber = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return 'N/A';
  }
  return num.toFixed(1);
};

export { formatDate };

export const getAccuracyColor = (accuracy: number): string => {
  if (accuracy < 1.7) return 'accuracy-low';
  if (accuracy < 2.3) return 'accuracy-medium';
  return 'accuracy-high';
};

export const getCategoryColor = (category: PredictionCategory): string => {
  switch(category) {
    case 'economy': return 'category-economy';
    case 'politics': return 'category-politics';
    case 'technology': return 'category-technology';
    case 'foreign-policy': return 'category-foreign-policy';
    case 'social-trends': return 'category-social-trends';
    default: return 'category-economy';
  }
};
