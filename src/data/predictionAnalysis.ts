import { Prediction, PredictionCategory } from './sippData';

// How a pundit's scores are worked out from their predictions.
// The ratings themselves (1 to 3) are in the data; this file only averages them
// and looks for patterns. See the README, "How scoring works".

export interface BiasPattern {
  type: string;
  description: string;
  frequency: number; // 0-1 representing percentage of predictions showing this bias
}

/**
 * Analyzes a set of predictions to identify bias patterns in a SIPP's predictions
 */
export const analyzePatterns = (predictions: Prediction[]): BiasPattern[] => {
  const verifiedPredictions = predictions.filter(p => 
    p.verificationStatus === 'verified' && typeof p.accuracyRating === 'number'
  );
  
  if (verifiedPredictions.length < 3) {
    return [];
  }
  
  const patterns: BiasPattern[] = [];
  const totalVerified = verifiedPredictions.length;
  
  // Check for optimism bias (consistently overestimating positive outcomes)
  const optimisticPredictions = verifiedPredictions.filter(p => 
    p.accuracyRating && p.accuracyRating < 2 && (
      p.predictedOutcome.toLowerCase().includes("increase") ||
      p.predictedOutcome.toLowerCase().includes("improve") ||
      p.predictedOutcome.toLowerCase().includes("success")
    )
  );
  
  if (optimisticPredictions.length > 0) {
    patterns.push({
      type: "Optimism Bias",
      description: "Tendency to overestimate positive outcomes and underestimate challenges",
      frequency: parseFloat((optimisticPredictions.length / totalVerified).toFixed(2))
    });
  }
  
  // Check for pessimism bias (consistently overestimating negative outcomes)
  const pessimisticPredictions = verifiedPredictions.filter(p => 
    p.accuracyRating && p.accuracyRating < 2 && (
      p.predictedOutcome.toLowerCase().includes("decrease") ||
      p.predictedOutcome.toLowerCase().includes("decline") ||
      p.predictedOutcome.toLowerCase().includes("fail")
    )
  );
  
  if (pessimisticPredictions.length > 0) {
    patterns.push({
      type: "Pessimism Bias",
      description: "Tendency to overestimate negative outcomes and underestimate opportunities",
      frequency: parseFloat((pessimisticPredictions.length / totalVerified).toFixed(2))
    });
  }
  
  // Check for timing issues (predictions that are directionally correct but off on timing)
  const timingIssuePredictions = verifiedPredictions.filter(p => 
    p.accuracyRating && p.accuracyRating === 2 && 
    (p.actualOutcome?.toLowerCase().includes("timing was off") ||
     p.actualOutcome?.toLowerCase().includes("happened later") ||
     p.actualOutcome?.toLowerCase().includes("happened earlier"))
  );
  
  if (timingIssuePredictions.length > 0) {
    patterns.push({
      type: "Timing Misjudgment",
      description: "Correctly predicts outcomes but consistently misjudges timing",
      frequency: parseFloat((timingIssuePredictions.length / totalVerified).toFixed(2))
    });
  }
  
  // Check for category-specific patterns
  const categoryCounters: Record<PredictionCategory, number> = {
    'economy': 0,
    'politics': 0,
    'technology': 0,
    'foreign-policy': 0,
    'social-trends': 0
  };
  
  const categoryAccuracySums: Record<PredictionCategory, number> = {
    'economy': 0,
    'politics': 0,
    'technology': 0,
    'foreign-policy': 0,
    'social-trends': 0
  };
  
  // Count predictions and sum accuracies by category
  verifiedPredictions.forEach(p => {
    if (p.accuracyRating) {
      categoryCounters[p.category] = (categoryCounters[p.category] || 0) + 1;
      categoryAccuracySums[p.category] = (categoryAccuracySums[p.category] || 0) + p.accuracyRating;
    }
  });
  
  // Find best and worst categories
  let bestCategory: PredictionCategory | null = null;
  let worstCategory: PredictionCategory | null = null;
  let bestAverage = 0;
  let worstAverage = 3;
  
  Object.keys(categoryCounters).forEach(cat => {
    const category = cat as PredictionCategory;
    const count = categoryCounters[category];
    
    if (count >= 2) { // Only consider categories with at least 2 predictions
      const average = categoryAccuracySums[category] / count;
      
      if (average > bestAverage) {
        bestAverage = average;
        bestCategory = category;
      }
      
      if (average < worstAverage) {
        worstAverage = average;
        worstCategory = category;
      }
    }
  });
  
  if (bestCategory) {
    patterns.push({
      type: "Strength",
      description: `Demonstrates highest prediction accuracy in ${bestCategory.replace('-', ' ')} topics`,
      frequency: parseFloat((categoryCounters[bestCategory] / totalVerified).toFixed(2))
    });
  }
  
  if (worstCategory) {
    patterns.push({
      type: "Weakness",
      description: `Demonstrates lowest prediction accuracy in ${worstCategory.replace('-', ' ')} topics`,
      frequency: parseFloat((categoryCounters[worstCategory] / totalVerified).toFixed(2))
    });
  }
  
  return patterns;
};

/**
 * Calculates overall accuracy metrics for a SIPP based on their verified predictions
 */
export const calculateSippAccuracy = (predictions: Prediction[]): {
  averageAccuracy: number,
  categoryAccuracy: Record<string, number>,
  patterns: BiasPattern[],
  strongestCategory: PredictionCategory | null,
  weakestCategory: PredictionCategory | null
} => {
  const verifiedPredictions = predictions.filter(p => 
    p.verificationStatus === 'verified' && typeof p.accuracyRating === 'number' && !isNaN(p.accuracyRating)
  );
  
  
  // With no verified predictions there is nothing to average; callers should not show these
  if (verifiedPredictions.length === 0) {
    return {
      averageAccuracy: 2.0,
      categoryAccuracy: {
        economy: 2.0,
        politics: 2.0,
        technology: 2.0,
        foreign_policy: 2.0,
        social_trends: 2.0
      },
      patterns: [],
      strongestCategory: null,
      weakestCategory: null
    };
  }
  
  // Overall average of the verified ratings
  const totalAccuracy = verifiedPredictions.reduce((sum, p) => {
    if (typeof p.accuracyRating !== 'number' || isNaN(p.accuracyRating)) {
      return sum;
    }
    return sum + p.accuracyRating;
  }, 0);
  
  const averageAccuracy = parseFloat((totalAccuracy / verifiedPredictions.length).toFixed(2));
  
  // Initialize category arrays
  const categories = {
    economy: [] as number[],
    politics: [] as number[],
    technology: [] as number[],
    foreign_policy: [] as number[],
    social_trends: [] as number[]
  };
  
  // Group predictions by category
  verifiedPredictions.forEach(p => {
    if (typeof p.accuracyRating === 'number' && !isNaN(p.accuracyRating)) {
      const categoryKey = p.category.replace('-', '_') as keyof typeof categories;
      if (categories[categoryKey]) {
        categories[categoryKey].push(p.accuracyRating);
      }
    }
  });
  
  const categoryAccuracy: Record<string, number> = {};
  let strongestCategory: PredictionCategory | null = null;
  let weakestCategory: PredictionCategory | null = null;
  let highestAccuracy = 0;
  let lowestAccuracy = 3;
  
  // Calculate category averages and find strongest/weakest
  Object.keys(categories).forEach(cat => {
    const scores = categories[cat as keyof typeof categories];
    
    if (scores.length > 0) {
      const sum = scores.reduce((a, b) => a + b, 0);
      const average = parseFloat((sum / scores.length).toFixed(2));
      categoryAccuracy[cat] = average;
      
      
      // Track strongest and weakest categories
      if (average > highestAccuracy) {
        highestAccuracy = average;
        strongestCategory = cat.replace('_', '-') as PredictionCategory;
      }
      
      if (average < lowestAccuracy) {
        lowestAccuracy = average;
        weakestCategory = cat.replace('_', '-') as PredictionCategory;
      }
    } else {
      // No predictions in this category - use overall average instead of defaulting to 2.0
      categoryAccuracy[cat] = averageAccuracy;
    }
  });
  
  // Analyze patterns
  const patterns = analyzePatterns(predictions);
  
  return {
    averageAccuracy,
    categoryAccuracy,
    patterns,
    strongestCategory,
    weakestCategory
  };
};
