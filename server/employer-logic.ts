import type { EmployerItem, EmployerDisplayLogic } from "@shared/schema";

// ---------------------------------------------------------------------------
// EMPLOYER DISPLAY ALGORITHM
// ---------------------------------------------------------------------------
// Decides which employers a respondent sees on the recognition step, based on
// their chosen career paths and the admin-configurable display logic.
//
// The selection runs in buckets so the result is a deliberate mix rather than
// just "the most popular employers":
//   - popular:     highest popularityScore
//   - client:      employers flagged isClient (so paying clients are surfaced)
//   - ranking:     highest rankingScore (e.g. editorial / reputation ranking)
//   - exploration: random long-tail picks for discovery + data diversity
//
// All bucket sizes and weights come from EmployerDisplayLogic so admins can
// retune behaviour without code changes.
// ---------------------------------------------------------------------------

export interface EmployerSelectionResult {
  shown: EmployerItem[];
  candidatesConsidered: number;
  logicVersion: number;
}

// Returns the career paths attached to an employer item. We support a single
// careerPath field plus an optional metadata.careerPaths array (an employer can
// be relevant to several paths).
function itemCareerPaths(item: EmployerItem): string[] {
  const fromMeta = (item.metadata?.careerPaths as string[] | undefined) ?? [];
  const list = [...fromMeta];
  if (item.careerPath) list.push(item.careerPath);
  return Array.from(new Set(list.map((p) => p.trim()).filter(Boolean)));
}

function matchesCareerPaths(item: EmployerItem, careerPaths: string[]): boolean {
  if (careerPaths.length === 0) return true;
  const itemPaths = itemCareerPaths(item).map((p) => p.toLowerCase());
  return careerPaths.some((cp) => itemPaths.includes(cp.toLowerCase()));
}

// A deterministic-ish base score for an employer used for ordering / fill.
function scoreItem(item: EmployerItem, logic: EmployerDisplayLogic): number {
  const w = logic.weights;
  const popularity = (item.popularityScore ?? 0) * w.popularity;
  const ranking = (item.rankingScore ?? 0) * w.ranking;
  const client = item.isClient ? w.clientBoost : 0;
  const tier = (item.priorityTier ?? 0) * w.priorityTierBoost;
  const exploration = Math.random() * 100 * w.exploration;
  return popularity + ranking + client + tier + exploration;
}

function takeTop(
  pool: EmployerItem[],
  count: number,
  scorer: (i: EmployerItem) => number,
  taken: Set<string>,
): EmployerItem[] {
  const result: EmployerItem[] = [];
  const sorted = [...pool]
    .filter((i) => !taken.has(i.id))
    .sort((a, b) => scorer(b) - scorer(a));
  for (const item of sorted) {
    if (result.length >= count) break;
    result.push(item);
    taken.add(item.id);
  }
  return result;
}

export function selectEmployers(
  allItems: EmployerItem[],
  careerPaths: string[],
  logic: EmployerDisplayLogic,
): EmployerSelectionResult {
  const active = allItems.filter((i) => i.active !== false);

  // 1. Restrict to matching career paths (unless disabled).
  let candidates = logic.onlyMatchingCareerPath
    ? active.filter((i) => matchesCareerPaths(i, careerPaths))
    : active.slice();

  const matchingCount = candidates.length;

  // 2. Fallback when there aren't enough matching employers.
  if (candidates.length < logic.totalEmployers && logic.fallback === "fill_from_all") {
    const extra = active.filter((i) => !candidates.includes(i));
    candidates = [...candidates, ...extra];
  }

  const taken = new Set<string>();
  const picked: EmployerItem[] = [];

  // 3. Popular bucket.
  picked.push(
    ...takeTop(candidates, logic.buckets.popular, (i) => i.popularityScore ?? 0, taken),
  );

  // 4. Client bucket (guarantee paying clients appear if configured).
  if (logic.guaranteeClients) {
    const clientPool = candidates.filter((i) => i.isClient);
    picked.push(
      ...takeTop(
        clientPool,
        logic.buckets.client,
        (i) => (i.priorityTier ?? 0) * 100 + (i.popularityScore ?? 0),
        taken,
      ),
    );
  } else {
    picked.push(
      ...takeTop(candidates, logic.buckets.client, (i) => scoreItem(i, logic), taken),
    );
  }

  // 5. Ranking bucket.
  picked.push(
    ...takeTop(candidates, logic.buckets.ranking, (i) => i.rankingScore ?? 0, taken),
  );

  // 6. Exploration bucket (random long tail).
  picked.push(
    ...takeTop(candidates, logic.buckets.exploration, () => Math.random(), taken),
  );

  // 7. Fill any remaining slots up to the total using overall score.
  if (picked.length < logic.totalEmployers) {
    picked.push(
      ...takeTop(
        candidates,
        logic.totalEmployers - picked.length,
        (i) => scoreItem(i, logic),
        taken,
      ),
    );
  }

  // 8. Cap to total and optionally shuffle the display order.
  let shown = picked.slice(0, logic.totalEmployers);
  if (logic.shuffle) {
    shown = shown
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  return {
    shown,
    candidatesConsidered: matchingCount,
    logicVersion: logic.version,
  };
}
