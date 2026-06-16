import { useQuery } from "@tanstack/react-query";
import type { SurveyPageDef, SurveyQuestion } from "@shared/schema";

interface ActiveSurveyConfig {
  id: number;
  name: string;
  version: string;
  pages: SurveyPageDef[];
}

/**
 * Fetches the active survey config from the backend and provides helper
 * accessors so Survey.tsx can read titles, labels, and options from the DB
 * instead of hardcoded strings.
 *
 * All helpers accept a `fallback` argument so the survey still renders
 * instantly while the config loads, and continues to work if the network
 * is unavailable.
 *
 * The DB is the source of truth for copy.  When the agent changes a label
 * or heading here (in the fallback strings) it should also update the DB
 * config via migrate-config-labels.ts so both stay in sync.
 */
export function useSurveyConfig() {
  const { data } = useQuery<ActiveSurveyConfig>({
    queryKey: ["/api/survey/active"],
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const pageIndex = new Map<string, SurveyPageDef>();
  if (data?.pages) {
    for (const p of data.pages) {
      if (p.kind) pageIndex.set(p.kind, p);
    }
  }

  function getPage(kind: string): SurveyPageDef | undefined {
    return pageIndex.get(kind);
  }

  function getQ(kind: string, qId: string): SurveyQuestion | undefined {
    return getPage(kind)?.questions.find((q) => q.id === qId);
  }

  return {
    /** True once the config has been fetched at least once. */
    isReady: !!data,

    /** Set of page `kind`s that are marked hidden in the active config. */
    hiddenKinds(): Set<string> {
      const s = new Set<string>();
      if (data?.pages) {
        for (const p of data.pages) {
          if (p.hidden && p.kind) s.add(p.kind);
        }
      }
      return s;
    },

    /** Page title — shown as the step heading in the live survey. */
    pageTitle(kind: string, fallback: string): string {
      return getPage(kind)?.title ?? fallback;
    },

    /** Page subtitle — optional sub-heading below the step heading. */
    pageSubtitle(kind: string, fallback?: string): string | undefined {
      return getPage(kind)?.subtitle ?? fallback;
    },

    /** Label for a specific question on a page. */
    questionLabel(kind: string, qId: string, fallback: string): string {
      return getQ(kind, qId)?.label ?? fallback;
    },

    /**
     * Static option labels for a dropdown/select question.
     * Returns [] if not configured — callers should fall back to a
     * hardcoded list when the array is empty.
     */
    questionOptions(kind: string, qId: string): string[] {
      const q = getQ(kind, qId);
      if (!q?.options?.length) return [];
      return q.options.map((o) => o.label);
    },
  };
}
