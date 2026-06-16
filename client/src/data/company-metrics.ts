// Deterministic, demo-only employer metrics derived purely from a company's
// position in the "Most Sought After Employers" ranking. Higher-ranked
// companies (#1) get stronger Brand Awareness, Brand Strength and a gentler
// Consideration Funnel drop-off; lower-ranked companies fall off more steeply.

import { rankCompanies, type RankedCompany } from "./demo-employers";

// Canonical, unfiltered ranking of all companies. Used as the stable rank for
// every company regardless of the filters applied on the list page.
export const CANONICAL_RANKING: RankedCompany[] = rankCompanies();

const N = CANONICAL_RANKING.length;

const rankByName = new Map<string, number>(
  CANONICAL_RANKING.map((c, i) => [c.name, i + 1])
);

export function getCompanyRank(name: string): number {
  return rankByName.get(name) ?? N;
}

export function hasCompany(name: string): boolean {
  return rankByName.has(name);
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

// 0 for the best-ranked company, 1 for the worst-ranked company.
function rankT(rank: number): number {
  if (N <= 1) return 0;
  return (rank - 1) / (N - 1);
}

// Brand Awareness: % of students who recognise the brand. Top brands sit near
// 100% and taper gradually; the tail drops toward ~12%.
export function computeAwareness(rank: number): number {
  const t = rankT(rank);
  return Math.round(100 - 86 * Math.pow(t, 1.35));
}

// Brand Strength: 0–10 score. Best brand ~10.0, worst ~2.2.
export function computeStrength(rank: number): number {
  const t = rankT(rank);
  return round1(10 - 7.8 * Math.pow(t, 1.2));
}

export interface FunnelStage {
  stage: string;
  value: number;
}

// Consideration Funnel: percentage of all students remaining at each stage.
// Retention between stages is high for top brands (gentle slope) and low for
// weaker brands (steep drop-off), with the final "1st preference" stage always
// the sharpest decline.
export function computeFunnel(rank: number): FunnelStage[] {
  const q = 1 - rankT(rank); // 1 = best, 0 = worst
  const recognise = computeAwareness(rank);
  const s2 = recognise * (0.84 + 0.11 * q);
  const s3 = s2 * (0.84 + 0.11 * q);
  const s4 = s3 * (0.76 + 0.16 * q);
  const s5 = s4 * (0.28 + 0.36 * q);
  return [
    { stage: "All students", value: 100 },
    { stage: "Recognise brand", value: round1(recognise) },
    { stage: "Rank top 25", value: round1(s2) },
    { stage: "Rank top 10", value: round1(s3) },
    { stage: "Rank top 5", value: round1(s4) },
    { stage: "1st preference", value: round1(s5) },
  ];
}

export interface MetricBar {
  name: string;
  rank: number;
  value: number;
}

// All companies' awareness/strength in rank order (already descending, since
// both metrics are monotonic in rank). Used to render the full bar charts.
export const AWARENESS_BARS: MetricBar[] = CANONICAL_RANKING.map((c, i) => ({
  name: c.name,
  rank: i + 1,
  value: computeAwareness(i + 1),
}));

export const STRENGTH_BARS: MetricBar[] = CANONICAL_RANKING.map((c, i) => ({
  name: c.name,
  rank: i + 1,
  value: computeStrength(i + 1),
}));

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const AWARENESS_AVG = round1(average(AWARENESS_BARS.map((b) => b.value)));
export const STRENGTH_AVG = round1(average(STRENGTH_BARS.map((b) => b.value)));
