// ===========================================================================
// SURVEY PREVIEW (respondent-facing, read-only)
// ===========================================================================
// Renders a survey config the way a respondent would see it, but purely for
// preview. It is config-driven: it reads `SurveyPageDef` / `SurveyQuestion`
// from the editor's live state (or a saved config) and renders each question
// type with the EXACT visual styling used in the live survey
// (client/src/pages/Survey.tsx) — same Prosple mint primary, same fonts,
// same card/grid/pill/button markup — so the preview matches what respondents
// actually see.
//
// IMPORTANT: nothing here saves a response. All interaction is local component
// state and is thrown away. Every entry point shows a "Preview only" banner.
// ===========================================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import { StepIndicator } from "@/components/StepIndicator";
import { cn } from "@/lib/utils";
import headerImage from "@assets/Screenshot_2026-01-22_at_3.04.34_pm_1769054676986.png";
import type { SurveyPageDef, SurveyQuestion, Taxonomy } from "@shared/schema";

// --- Company logo (mirrors CompanyLogo in Survey.tsx, favicon-guess only) ---
function getCompanyLogoUrl(companyName: string): string {
  const guessedDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `https://www.google.com/s2/favicons?domain=${guessedDomain}&sz=128`;
}

function CompanyLogo({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const [hasError, setHasError] = useState(false);
  const sizeClasses = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-12 h-12" };
  const textSizeClasses = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200`}
    >
      {!hasError ? (
        <img
          src={getCompanyLogoUrl(name)}
          alt={`${name} logo`}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`${textSizeClasses[size]} font-bold text-slate-500`}>{initials}</span>
      )}
    </div>
  );
}

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

// The centered prompt heading used by the live survey's selection steps.
function BigPrompt({ q }: { q: SurveyQuestion }) {
  return (
    <div className="text-center mb-8">
      <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
        {q.label || "(untitled question)"}
        {q.required && <span className="text-red-500"> *</span>}
      </p>
      {q.helperText && <p className="text-sm text-slate-500 mt-2">{q.helperText}</p>}
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
  const [open, setOpen] = useState(false);
  const options = resolveOptions(q, taxonomies);

  function toggle(value: string, single: boolean) {
    setSelected((prev) => {
      if (single) return [value];
      return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
    });
  }

  switch (q.type) {
    // --- Text / email field (mirrors step 0/1 form rows) ---
    case "text":
    case "email":
      return (
        <div className="max-w-xl mx-auto space-y-2" data-testid={`preview-question-${q.id}`}>
          <label className="text-sm font-medium text-slate-700">
            {q.label || "(untitled question)"}
            {q.required && <span className="text-red-500"> *</span>}
          </label>
          <input
            type={q.type === "email" ? "email" : "text"}
            placeholder={q.type === "email" ? "your.email@example.com" : "Type your answer..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
            data-testid={`preview-input-${q.id}`}
          />
          {q.helperText && <p className="text-xs text-slate-500">{q.helperText}</p>}
        </div>
      );

    // --- Single select (mirrors the gender dropdown in step 0) ---
    case "single_select": {
      const selectedLabel = options.find((o) => o.value === selected[0])?.label;
      return (
        <div className="max-w-xl mx-auto space-y-2" data-testid={`preview-question-${q.id}`}>
          <label className="text-sm font-medium text-slate-700">
            {q.label || "(untitled question)"}
            {q.required && <span className="text-red-500"> *</span>}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "w-full p-3 pr-3 border-2 rounded-xl text-left transition-colors bg-white flex items-center justify-between text-slate-900",
                open ? "border-primary" : "border-slate-200",
              )}
              data-testid={`preview-select-${q.id}`}
            >
              <span className={selectedLabel ? "" : "text-slate-400"}>{selectedLabel || "Select an option"}</span>
              <ChevronDown
                className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", open && "rotate-180")}
              />
            </button>
            {open && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
                {options.map((o) => (
                  <div
                    key={o.value}
                    onClick={() => {
                      toggle(o.value, true);
                      setOpen(false);
                    }}
                    className={cn(
                      "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
                      selected[0] === o.value ? "bg-primary/10 text-slate-900" : "text-slate-700",
                    )}
                    data-testid={`preview-option-${q.id}-${o.value}`}
                  >
                    {o.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          {q.helperText && <p className="text-xs text-slate-500">{q.helperText}</p>}
        </div>
      );
    }

    // --- Multi-select / tagbox / career path (mirrors step 2 searchable box) ---
    case "multi_select":
    case "tagbox": {
      const selectedOpts = options.filter((o) => selected.includes(o.value));
      const unselectedOpts = options.filter((o) => !selected.includes(o.value));
      return (
        <div className="space-y-6" data-testid={`preview-question-${q.id}`}>
          <BigPrompt q={q} />
          <div className="max-w-2xl mx-auto w-full relative">
            <div
              className={cn(
                "min-h-[56px] w-full p-2 bg-white border-2 rounded-2xl flex flex-wrap gap-2 items-center transition-all duration-200",
                open || selectedOpts.length ? "border-primary shadow-lg" : "border-slate-200 shadow-sm",
              )}
            >
              <div className="flex items-center pl-2">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              {selectedOpts.map((o) => (
                <div
                  key={o.value}
                  className="bg-primary/10 text-primary-foreground border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold"
                >
                  <span className="text-slate-900">{o.label}</span>
                  <button
                    onClick={() => toggle(o.value, false)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    data-testid={`preview-pill-remove-${q.id}-${o.value}`}
                  >
                    <span className="text-slate-600 text-xs leading-none">✕</span>
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder={selectedOpts.length === 0 ? "Search..." : ""}
                onFocus={() => setOpen(true)}
                readOnly
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none py-2 px-2 text-slate-900 placeholder:text-slate-400"
                data-testid={`preview-search-${q.id}`}
              />
            </div>
            {open && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl max-h-[320px] overflow-y-auto z-50">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Options
                  </div>
                  {unselectedOpts.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No more options</div>
                  )}
                  {unselectedOpts.map((o) => (
                    <div
                      key={o.value}
                      onClick={() => toggle(o.value, false)}
                      className="cursor-pointer rounded-xl p-3 flex items-center justify-between transition-colors hover:bg-slate-50"
                      data-testid={`preview-option-${q.id}-${o.value}`}
                    >
                      <span className="text-sm font-medium text-slate-600">{o.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // --- Employer recognition grid (mirrors step 4) ---
    case "employer_grid":
      return (
        <div className="space-y-6" data-testid={`preview-question-${q.id}`}>
          <BigPrompt q={q} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto w-full">
            {options.map((o) => {
              const isSelected = selected.includes(o.value);
              return (
                <div
                  key={o.value}
                  onClick={() => toggle(o.value, false)}
                  className={cn(
                    "cursor-pointer rounded-lg p-3 border transition-all duration-200 flex items-center gap-3 select-none",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:bg-secondary/50",
                  )}
                  data-testid={`preview-grid-${q.id}-${o.value}`}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                      isSelected ? "border-primary bg-primary text-slate-900" : "border-muted-foreground/50",
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <CompanyLogo name={o.label} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "text-sm font-bold leading-tight truncate",
                        isSelected ? "text-slate-900" : "text-foreground",
                      )}
                    >
                      {o.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    // --- Drag rank / final reorder (mirrors step 3) ---
    case "drag_rank":
    case "final_reorder": {
      const items = options.length ? options : [
        { label: "Item 1", value: "1" },
        { label: "Item 2", value: "2" },
        { label: "Item 3", value: "3" },
      ];
      return (
        <div className="space-y-6" data-testid={`preview-question-${q.id}`}>
          <BigPrompt q={q} />
          <div className="max-w-xl mx-auto space-y-3">
            {items.map((o, i) => (
              <div
                key={o.value}
                className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4 cursor-grab"
                data-testid={`preview-rank-${q.id}-${o.value}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground font-bold">
                  {i + 1}
                </div>
                <span className="flex-1 font-medium">{o.label}</span>
                <GripVertical className="text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // --- Pairwise comparison (mirrors step 5) ---
    case "pairwise": {
      const a = options[0] ?? { label: "Employer A", value: "a" };
      const b = options[1] ?? { label: "Employer B", value: "b" };
      const parsedTotal = Number(q.config?.comparisons ?? 10);
      const total = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 10;
      return (
        <div className="flex flex-col max-w-4xl mx-auto w-full" data-testid={`preview-question-${q.id}`}>
          <BigPrompt q={q} />
          <div className="max-w-md mx-auto w-full mb-10 space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              <span>Progress</span>
              <span>0 / {total}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-primary" style={{ width: "8%" }} />
            </div>
          </div>
          <div className="flex flex-row gap-3 md:gap-8 items-stretch mb-4 relative">
            <div className="flex-1">
              <button
                className="group relative w-full bg-white border-2 border-border hover:border-primary hover:shadow-xl rounded-2xl md:rounded-3xl p-3 md:p-6 transition-all duration-300 flex flex-col items-center justify-center h-[220px] md:h-[280px]"
                data-testid={`preview-pairwise-${q.id}-0`}
              >
                <CompanyLogo name={a.label} size="lg" />
                <h3 className="text-sm md:text-2xl font-bold text-center text-slate-800 mt-2 md:mt-3 line-clamp-2 w-full px-1">
                  {a.label}
                </h3>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground italic">working in</p>
                <p className="mt-1 text-xs md:text-sm font-bold text-slate-700 text-center line-clamp-1 w-full px-1">
                  your chosen role
                </p>
              </button>
            </div>
            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center font-bold text-slate-300 shadow-sm border border-slate-100 z-10 flex-shrink-0 text-xs md:text-base self-center">
              OR
            </div>
            <div className="flex-1">
              <button
                className="group relative w-full bg-white border-2 border-border hover:border-primary hover:shadow-xl rounded-2xl md:rounded-3xl p-3 md:p-6 transition-all duration-300 flex flex-col items-center justify-center h-[220px] md:h-[280px]"
                data-testid={`preview-pairwise-${q.id}-1`}
              >
                <CompanyLogo name={b.label} size="lg" />
                <h3 className="text-sm md:text-2xl font-bold text-center text-slate-800 mt-2 md:mt-3 line-clamp-2 w-full px-1">
                  {b.label}
                </h3>
                <p className="mt-1 text-xs md:text-sm text-muted-foreground italic">working in</p>
                <p className="mt-1 text-xs md:text-sm font-bold text-slate-700 text-center line-clamp-1 w-full px-1">
                  your chosen role
                </p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // --- Hidden / static content block ---
    case "hidden":
      return (
        <div className="max-w-xl mx-auto text-center space-y-2" data-testid={`preview-question-${q.id}`}>
          <p className="text-xl md:text-2xl font-medium text-slate-700">{q.label}</p>
          {q.helperText && <p className="text-base text-slate-600">{q.helperText}</p>}
        </div>
      );

    default:
      return (
        <div className="text-center text-slate-400 text-sm" data-testid={`preview-question-${q.id}`}>
          {q.type} — no preview renderer
        </div>
      );
  }
}

// Render a single page: every question stacked the way the live survey shows it.
export function PagePreview({ page, taxonomies }: { page: SurveyPageDef; taxonomies: Taxonomy[] }) {
  return (
    <div className="w-full space-y-6">
      {(page.questions ?? []).length === 0 && (
        <p className="text-center text-slate-400 text-sm py-8">This page has no questions yet.</p>
      )}
      <div className="space-y-12">
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
    <div className="space-y-4 font-sans text-slate-900">
      <PreviewBanner />
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
        <PagePreview page={page} taxonomies={taxonomies} />
      </div>
    </div>
  );
}

// Full-survey preview with page navigation and the real survey chrome
// (Prosple header + step indicator). Used in the modal and the route.
export function SurveyPreview({
  pages,
  taxonomies,
  startIndex = 0,
  showHeader = true,
}: {
  pages: SurveyPageDef[];
  taxonomies: Taxonomy[];
  startIndex?: number;
  showHeader?: boolean;
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
    <div className="bg-slate-50/50 font-sans text-slate-900 rounded-xl overflow-hidden border border-slate-200">
      {showHeader && (
        <header className="bg-white border-b">
          <img src={headerImage} alt="Prosple Header" className="w-full h-auto" />
        </header>
      )}
      <div className="px-3 pt-3">
        <PreviewBanner />
      </div>
      <main className="flex-1 flex flex-col items-center py-8 md:py-12 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <StepIndicator currentStep={idx} totalSteps={pages.length} />
        <div className="w-full flex flex-col">
          <PagePreview page={page} taxonomies={taxonomies} />
        </div>
        <div className="flex justify-center mt-12 gap-4 w-full">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="w-full max-w-[160px] text-slate-900 border-slate-200"
            data-testid="button-preview-back"
          >
            <ChevronLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button
            size="lg"
            onClick={() => setIdx((i) => Math.min(pages.length - 1, i + 1))}
            disabled={isLast}
            className="w-full max-w-[160px]"
            data-testid="button-preview-next"
          >
            {isLast ? "Finish" : "Continue"} <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-4" data-testid="text-preview-progress">
          Page {idx + 1} of {pages.length}
        </p>
      </main>
    </div>
  );
}
