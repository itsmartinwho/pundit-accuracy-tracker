import { useQuery } from '@tanstack/react-query';
import { calculateSippAccuracy } from './predictionAnalysis';
import type { SIPP, SippDataset } from './sippData';

// The app runs from this one static file. It is written by scripts/refresh-data.mjs
// on a developer's machine; nothing is generated in the browser.
const DATA_URL = `${import.meta.env.BASE_URL}data/sippData.json`;

// Both the dashboard and the detail page show scores worked out here, from the
// predictions, so they always agree. Whatever averages the file carries are ignored.
const withScores = (sipp: SIPP): SIPP => {
  const { averageAccuracy, categoryAccuracy } = calculateSippAccuracy(sipp.predictions);
  return {
    ...sipp,
    averageAccuracy,
    categoryAccuracy: categoryAccuracy as SIPP['categoryAccuracy'],
  };
};

export async function loadSippDataset(): Promise<SippDataset> {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Could not load ${DATA_URL} (${response.status})`);
  }
  const data = (await response.json()) as SippDataset;
  if (!data || !data.meta || !Array.isArray(data.sipps)) {
    throw new Error(`${DATA_URL} is not in the expected shape`);
  }
  return { meta: data.meta, sipps: data.sipps.map(withScores) };
}

export const useSippDataset = () =>
  useQuery({
    queryKey: ['sipp-dataset'],
    queryFn: loadSippDataset,
    staleTime: Infinity,
  });
