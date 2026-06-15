// ===========================================================================
// SURVEY PREVIEW (respondent-facing, read-only)
// ===========================================================================
// Renders a survey config the way a respondent would see it, but purely for
// preview. It is config-driven: it reads `SurveyPageDef` / `SurveyQuestion`
// from the editor's live state (or a saved config) and renders each question
// type with the survey's visual styling (the #96D2C0 accent, centered layout).
//
// IMPORTANT: nothing here saves a response. All interaction is local component
// state and is thrown away. Every entry point shows a "Preview only" banner.
// ===========================================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { StepIndicator } from "@/components/StepIndicator";
import type { SurveyPageDef, SurveyQuestion, Taxonomy } from "@shared/schema";

const ACCENT = "#96D2C0";

function PreviewBanner() {
  return (
    <div
      className="flex items-center justify-center gap-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium py-1.5 px-3"
      data-testid="banner-preview-only"
    >
      <Eye className="w-3.5 h-3.5" />
      Preview only — responses are not saved
    </div>
  );
}

// Resolve the options a question would show. Static options come straight from
// the question; taxonomy-backed ones are pulled from the matching taxonomy (or
// shown as a friendly placeholder if none is bound yet).
function resolveOptions(q: SurveyQuestion, taxonomies: Taxonomy[]): { label: string; value: string }[] {
  if (q.optionsSource === "static") {
    return (q.options ?? []).map((o) => ({ label: o.label, value: o.value }));
  }
  if (q.optionsSource === "taxonomy") {
    const tax = taxonomies.find((t) => t.id === q.taxonomyId);
    const items = (tax?.items as Array<Record<string, unknown>> | undefined) ?? [];
    if (items.length === 0) {
      return [
        { label: "Example option A", value: "a" },
        { label: "Example option B", value: "b" },
        { label: "Example option C", value: "c" },
      ];
    }
    return items.slice(0, 12).map((it, i) => ({
      label: String(it.displayName ?? it.employerName ?? it.label ?? it.name ?? `Item ${i + 1}`),
      value: String(it.id ?? i),
    }));
  }
  return [];
}

function QuestionPreview({ q, taxonomies }: { q: SurveyQuestion; taxonomies: Taxonomy[] }) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const options = resolveOptions(q, taxonomies);

  function toggle(value: string, single: boolean) {
    setSelected((prev) => {
      if (single) return [value];
      return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    });
  }

  const header = (
    <div className="text-center space-y-1">
      <p className="text-xl md:text-2xl font-medium text-slate-700">
        {q.label || "(untitled question)"}
        {q.required && <span className="text-red-500"> *</span>}
      </p>
      {q.helperText && <p className="text-sm text-slate-500">{q.helperText}</p>}
    </div>
  );

  let body: React.ReactNode = null;

  switch (q.type) {
    case "text":
    case "email":
      body = (
        <Input
          type={q.type === "email" ? "email" : "text"}
          placeholder={q.type === "email" ? "you@example.com" : "Type your answer…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="max-w-md mx-auto"
          data-testid={`preview-input-${q.id}`}
        />
      );
      break;

    case "single_select":
      body = (
        <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
          {options.map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value, true)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  active ? "border-transparent text-slate-900" : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
                style={active ? { backgroundColor: ACCENT } : undefined}
                data-testid={`preview-option-${q.id}-${o.value}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;

    case "multi_select":
    case "tagbox":
      body = (
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
          {options.map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value, false)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  active ? "border-transparent text-slate-900" : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
                style={active ? { backgroundColor: ACCENT } : undefined}
                data-testid={`preview-tag-${q.id}-${o.value}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;

    case "drag_rank":
    case "final_reorder":
      body = (
        <div className="space-y-2 max-w-md mx-auto">
          {(options.length ? options : [{ label: "Item 1", value: "1" }, { label: "Item 2", value: "2" }]).map((o, i) => (
            <div
              key={o.value}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white"
              data-testid={`preview-rank-${q.id}-${o.value}`}
            >
              <span className="text-slate-400 text-sm font-mono">{i + 1}</span>
              <span className="text-slate-700">{o.label}</span>
              <span className="ml-auto text-slate-300 text-xs">⋮⋮ drag</span>
            </div>
          ))}
        </div>
      );
      break;

    case "employer_grid":
      body = (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {options.map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggle(o.value, false)}
                className={`px-3 py-4 rounded-xl border text-sm font-medium transition-colors ${
                  active ? "border-transparent text-slate-900" : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
                style={active ? { backgroundColor: ACCENT } : undefined}
                data-testid={`preview-grid-${q.id}-${o.value}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;

    case "pairwise": {
      const a = options[0]?.label ?? "Employer A";
      const b = options[1]?.label ?? "Employer B";
      const comparisons = Number(q.config?.comparisons ?? 0);
      body = (
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {[a, b].map((name, i) => (
              <button
                key={i}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center hover:border-slate-300 transition-colors"
                data-testid={`preview-pairwise-${q.id}-${i}`}
              >
                <span className="text-lg md:text-2xl font-bold text-slate-800">{name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            {comparisons > 0 && <Badge variant="outline">{comparisons} comparisons</Badge>}
            {q.config?.allowSkip ? <Badge variant="outline">skip allowed</Badge> : null}
            {q.config?.algorithm ? <Badge variant="outline">{String(q.config.algorithm)}</Badge> : null}
          </div>
        </div>
      );
      break;
    }

    case "hidden":
      // Used here as a static content block.
      body = (
        <div className="max-w-xl mx-auto text-center text-slate-500 text-sm">
          {q.config?.content ? null : <Badge variant="outline">hidden field</Badge>}
        </div>
      );
      break;

    default:
      body = (
        <div className="text-center text-slate-400 text-sm">
          <Badge variant="outline">{q.type}</Badge> — no preview renderer
        </div>
      );
  }

  return (
    <div className="space-y-4" data-testid={`preview-question-${q.id}`}>
      {header}
      {body}
    </div>
  );
}

// Render a single page (title, subtitle, all its questions).
export function PagePreview({ page, taxonomies }: { page: SurveyPageDef; taxonomies: Taxonomy[] }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        {page.kind && (
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{page.kind}</Badge>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{page.title || "(untitled page)"}</h2>
        {page.subtitle && <p className="text-base text-slate-500 max-w-lg mx-auto">{page.subtitle}</p>}
      </div>
      <div className="space-y-10">
        {(page.questions ?? []).length === 0 && (
          <p className="text-center text-slate-400 text-sm">This page has no questions yet.</p>
        )}
        {(page.questions ?? []).map((q) => (
          <QuestionPreview key={q.id} q={q} taxonomies={taxonomies} />
        ))}
      </div>
    </div>
  );
}

// Single-page preview wrapper with the banner (used in the editor side panel).
export function SinglePagePreview({ page, taxonomies }: { page: SurveyPageDef; taxonomies: Taxonomy[] }) {
  return (
    <div className="space-y-4">
      <PreviewBanner />
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <PagePreview page={page} taxonomies={taxonomies} />
      </div>
    </div>
  );
}

// Full-survey preview with page navigation (used in the modal and the route).
export function SurveyPreview({
  pages,
  taxonomies,
  startIndex = 0,
}: {
  pages: SurveyPageDef[];
  taxonomies: Taxonomy[];
  startIndex?: number;
}) {
  const [idx, setIdx] = useState(Math.min(startIndex, Math.max(0, pages.length - 1)));

  if (pages.length === 0) {
    return (
      <div className="space-y-4">
        <PreviewBanner />
        <p className="text-center text-slate-400 py-12">This survey has no pages yet.</p>
      </div>
    );
  }

  const page = pages[idx];
  const isLast = idx === pages.length - 1;

  return (
    <div className="space-y-6">
      <PreviewBanner />
      <div className="flex flex-col items-center">
        <StepIndicator currentStep={idx} totalSteps={pages.length} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 min-h-[320px]">
        <PagePreview page={page} taxonomies={taxonomies} />
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          data-testid="button-preview-back"
        >
          Back
        </Button>
        <span className="text-sm text-slate-400" data-testid="text-preview-progress">
          Page {idx + 1} of {pages.length}
        </span>
        <Button
          onClick={() => setIdx((i) => Math.min(pages.length - 1, i + 1))}
          disabled={isLast}
          className="text-slate-900 font-bold"
          style={{ backgroundColor: ACCENT }}
          data-testid="button-preview-next"
        >
          {isLast ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
