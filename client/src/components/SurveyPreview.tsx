// ===========================================================================
// SURVEY PREVIEW (respondent-facing, read-only)
// ===========================================================================
// Renders a survey config the way a respondent sees it. Uses the SAME markup
// as client/src/pages/Survey.tsx, including its two layout modes:
//
// formStyle (page.questions.length > 1)
// → small"text-sm font-medium text-slate-700" label above each control,
// all fields stacked inside max-w-xl mx-auto space-y-6
// (mirrors steps 0 & 1 — personal info, education)
//
// promptStyle (single question on the page)
// → big centered"text-xl md:text-2xl font-medium text-slate-700" heading
// above the control (mirrors steps 2–7)
//
// Nothing here ever saves a response. Every entry shows a"Preview only" banner.
// ===========================================================================

import { useState } from"react";
import { Button } from"@/components/ui/button";
import {
 Eye,
 Search,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 CheckCircle2,
 GripVertical,
 X,
} from"lucide-react";
import { StepIndicator } from"@/components/StepIndicator";
import { cn } from"@/lib/utils";
import headerImage from"@assets/Screenshot_2026-01-22_at_3.04.34_pm_1769054676986.png";
import type { SurveyPageDef, SurveyQuestion, Taxonomy } from"@shared/schema";

const ASPECT_OPTIONS = [
"Company reputation",
"Salary and benefits",
"Career opportunities",
"Diversity and inclusion",
"Senior management",
"Culture and values",
"Work life balance",
];

const ASPECT_PAGES: SurveyPageDef[] = [
 { id:"__aspect_select__", kind:"aspect_select", title:"What matters most to you in an employer?", subtitle:"Select all that apply.", questions: [] },
 { id:"__aspect_pairwise__", kind:"aspect_pairwise", title:"Which matters more to you?", subtitle:"Compare values head to head.", questions: [] },
 { id:"__aspect_reorder__", kind:"aspect_reorder", title:"Here's how we ranked your values.", subtitle:"Drag to adjust if needed.", questions: [] },
];

export function injectAspectPages(pages: SurveyPageDef[]): SurveyPageDef[] {
 if (pages.some((p) => p.kind ==="aspect_select")) return pages;
 const idx = pages.findIndex((p) => p.kind ==="career_order");
 if (idx === -1) return pages;
 return [...pages.slice(0, idx + 1), ...ASPECT_PAGES, ...pages.slice(idx + 1)];
}

// Exact prompt text per page kind — mirrors the hardcoded text in Survey.tsx
type KindPrompt = { title?: string; subtitle?: string; bold?: boolean; usePageTitle?: boolean; usePageSubtitle?: boolean };
const KIND_PROMPTS: Record<string, KindPrompt> = {
 career_order: {
 title:"What career path are you most interested in?",
 subtitle:"Drag and drop to sort your career paths in order of preference",
 },
 recognition: {
 title:"Which of the following employers do you recognise? Select all that apply.",
 },
 pairwise: {
 title:"Which opportunity would you choose?",
 },
 final: {
 title:"Nice, here's your shortlist!",
 subtitle:"Make any final adjustments by dragging and dropping or adding missing companies",
 bold: true,
 },
 top_pick_reason: {
 usePageTitle: true,
 subtitle:"Why did you choose your top pick?",
 bold: true,
 },
 thankyou: {
 usePageTitle: true,
 usePageSubtitle: true,
 bold: true,
 },
};

// --- Inline CompanyLogo (mirrors Survey.tsx; uses favicon-guess fallback) ---
function getCompanyLogoUrl(name: string): string {
 const d = name.toLowerCase().replace(/[^a-z0-9]/g,"") +".com";
 return `https://www.google.com/s2/favicons?domain=${d}&sz=128`;
}
function CompanyLogo({ name, size ="md" }: { name: string; size?:"sm" |"md" |"lg" }) {
 const [err, setErr] = useState(false);
 const sz = { sm:"w-6 h-6", md:"w-8 h-8", lg:"w-12 h-12" }[size];
 const ts = { sm:"text-[10px]", md:"text-xs", lg:"text-sm" }[size];
 const init = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
 return (
 <div className={`${sz} rounded-none bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200`}>
 {!err ? (
 <img src={getCompanyLogoUrl(name)} alt={`${name} logo`} className="w-full h-full object-cover" onError={() => setErr(true)} />
 ) : (
 <span className={`${ts} font-bold text-slate-500`}>{init}</span>
 )}
 </div>
 );
}

function PreviewBanner() {
 return (
 <div className="flex items-center justify-center gap-2 rounded-none bg-muted border border-border text-muted-foreground text-xs font-medium py-1.5 px-3" data-testid="banner-preview-only">
 <Eye className="w-3.5 h-3.5" />
 Preview only — responses are not saved
 </div>
 );
}

function resolveOptions(q: SurveyQuestion, taxonomies: Taxonomy[]): { label: string; value: string }[] {
 if (q.optionsSource ==="static") {
 return (q.options ?? []).map((o) => ({ label: o.label, value: o.value }));
 }
 if (q.optionsSource ==="taxonomy") {
 const tax = taxonomies.find((t) => t.id === q.taxonomyId);
 const items = (tax?.items as Array<Record<string, unknown>> | undefined) ?? [];
 if (items.length === 0) return [
 { label:"Example option A", value:"a" },
 { label:"Example option B", value:"b" },
 { label:"Example option C", value:"c" },
 ];
 return items.slice(0, 12).map((it, i) => ({
 label: String(it.displayName ?? it.employerName ?? it.label ?? it.name ?? `Item ${i + 1}`),
 value: String(it.id ?? i),
 }));
 }
 return [];
}

// ---------------------------------------------------------------------------
// MonthYearPicker — mirrors graduation date picker in Survey.tsx step 1
// Extracted into its own component so useState calls are at the top level.
// ---------------------------------------------------------------------------
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function MonthYearPicker({ qId, formStyle, q }: { qId: string; formStyle: boolean; q: SurveyQuestion }) {
 const currentYear = new Date().getFullYear();
 const [pickerYear, setPickerYear] = useState(currentYear);
 const [pickerOpen, setPickerOpen] = useState(false);
 const [selMonth, setSelMonth] = useState("");
 const [selYear, setSelYear] = useState("");
 const displayValue = selMonth && selYear ? `${selMonth} ${selYear}` :"";

 const FieldLabel = () => (
 <label className="text-sm font-medium text-slate-700">
 {q.label ||"(untitled question)"}
 {q.required && <span className="text-red-500"> *</span>}
 </label>
 );
 const BigPromptEl = () => (
 <div className="text-center mb-8">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 {q.label ||"(untitled question)"}
 {q.required && <span className="text-red-500"> *</span>}
 </p>
 {q.helperText && <p className="text-sm text-slate-500 mt-2">{q.helperText}</p>}
 </div>
 );

 const picker = (
 <div className="relative">
 <div
 role="button"
 tabIndex={0}
 onClick={() => setPickerOpen((v) => !v)}
 onKeyDown={(e) => e.key ==="Enter" && setPickerOpen((v) => !v)}
 className={cn(
"w-full p-3 pr-3 border-2 rounded-none text-left transition-colors bg-white flex items-center justify-between text-slate-900 cursor-pointer select-none",
 pickerOpen ?"border-primary" :"border-slate-200",
 )}
 data-testid={`preview-monthyear-${qId}`}
 >
 <span className={displayValue ?"" :"text-slate-400"}>{displayValue ||"Select graduation date"}</span>
 <div className="flex items-center gap-2">
 {displayValue && (
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); setSelMonth(""); setSelYear(""); }}
 className="p-0.5 hover:bg-slate-100 rounded-none"
 >
 <X className="w-4 h-4 text-slate-400" />
 </button>
 )}
 <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", pickerOpen &&"rotate-180")} />
 </div>
 </div>
 {pickerOpen && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none z-50 p-4">
 <div className="flex items-center justify-between mb-4">
 <button type="button" onClick={() => setPickerYear((y) => y - 1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
 <ChevronLeft className="w-5 h-5 text-slate-600" />
 </button>
 <span className="text-lg font-bold text-slate-900">{pickerYear}</span>
 <button type="button" onClick={() => setPickerYear((y) => y + 1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
 <ChevronRight className="w-5 h-5 text-slate-600" />
 </button>
 </div>
 <div className="grid grid-cols-3 gap-2">
 {SHORT_MONTHS.map((short, idx) => {
 const full = FULL_MONTHS[idx];
 const isSel = selMonth === full && selYear === String(pickerYear);
 return (
 <button
 key={short}
 type="button"
 onClick={() => { setSelMonth(full); setSelYear(String(pickerYear)); setPickerOpen(false); }}
 className={cn("py-2.5 px-4 rounded-none text-sm font-medium transition-colors", isSel ?"bg-slate-800 text-white" :"text-slate-600 hover:bg-slate-100")}
 data-testid={`preview-month-${qId}-${short}`}
 >
 {short}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>
 );

 return (
 <div className="space-y-2" data-testid={`preview-question-${qId}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 {formStyle ? picker : <div className="max-w-xl mx-auto">{picker}</div>}
 {formStyle && q.helperText && <p className="text-xs text-slate-500">{q.helperText}</p>}
 </div>
 );
}

// ---------------------------------------------------------------------------
// QuestionPreview
// formStyle=true → small field label (steps 0/1 treatment)
// formStyle=false → big centered prompt (steps 2–7 treatment)
// ---------------------------------------------------------------------------
function QuestionPreview({
 q,
 taxonomies,
 formStyle,
 hidePrompt = false,
}: {
 q: SurveyQuestion;
 taxonomies: Taxonomy[];
 formStyle: boolean;
 hidePrompt?: boolean;
}) {
 const [text, setText] = useState("");
 const [selected, setSelected] = useState<string[]>([]);
 const [open, setOpen] = useState(false);
 const options = resolveOptions(q, taxonomies);

 function toggle(value: string, single: boolean) {
 setSelected((prev) =>
 single ? [value] : prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
 );
 }

 // Small label used in form-style (steps 0/1)
 const FieldLabel = () => (
 <label className="text-sm font-medium text-slate-700">
 {q.label ||"(untitled question)"}
 {q.required && <span className="text-red-500"> *</span>}
 </label>
 );

 // Big centered prompt used in prompt-style (steps 2–7)
 const BigPromptEl = () => hidePrompt ? null : (
 <div className="text-center mb-8">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 {q.label ||"(untitled question)"}
 {q.required && <span className="text-red-500"> *</span>}
 </p>
 {q.helperText && <p className="text-sm text-slate-500 mt-2">{q.helperText}</p>}
 </div>
 );

 switch (q.type) {

 // -----------------------------------------------------------------------
 // text / email
 // -----------------------------------------------------------------------
 case"text":
 case"email":
 return (
 <div className="space-y-2" data-testid={`preview-question-${q.id}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 <input
 type={q.type ==="email" ?"email" :"text"}
 placeholder={q.type ==="email" ?"your.email@example.com" :"Type your answer..."}
 value={text}
 onChange={(e) => setText(e.target.value)}
 className={cn(
"w-full p-3 border-2 border-slate-200 rounded-none focus:border-primary focus:outline-none transition-colors",
 !formStyle &&"max-w-md mx-auto block",
 )}
 data-testid={`preview-input-${q.id}`}
 />
 {formStyle && q.helperText && <p className="text-xs text-slate-500">{q.helperText}</p>}
 </div>
 );

 // -----------------------------------------------------------------------
 // month_year — delegates to MonthYearPicker (state lives there)
 // -----------------------------------------------------------------------
 case"month_year":
 return <MonthYearPicker key={q.id} qId={q.id} formStyle={formStyle} q={q} />;

 // -----------------------------------------------------------------------
 // single_select — dropdown (mirrors gender/education-level in steps 0/1)
 // -----------------------------------------------------------------------
 case"single_select": {
 const selectedLabel = options.find((o) => o.value === selected[0])?.label;
 const trigger = (
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpen((v) => !v)}
 className={cn(
"w-full p-3 pr-3 border-2 rounded-none text-left transition-colors bg-white flex items-center justify-between text-slate-900",
 open ?"border-primary" :"border-slate-200",
 )}
 data-testid={`preview-select-${q.id}`}
 >
 <span className={selectedLabel ?"" :"text-slate-400"}>{selectedLabel ||"Select an option"}</span>
 <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", open &&"rotate-180")} />
 </button>
 {open && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none max-h-64 overflow-y-auto z-50">
 {options.map((o) => (
 <div
 key={o.value}
 onClick={() => { toggle(o.value, true); setOpen(false); }}
 className={cn(
"px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
 selected[0] === o.value ?"bg-primary/10 text-slate-900" :"text-slate-700",
 )}
 data-testid={`preview-option-${q.id}-${o.value}`}
 >
 {o.label}
 </div>
 ))}
 </div>
 )}
 </div>
 );
 return (
 <div className="space-y-2" data-testid={`preview-question-${q.id}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 {formStyle ? trigger : <div className="max-w-xl mx-auto">{trigger}</div>}
 {formStyle && q.helperText && <p className="text-xs text-slate-500">{q.helperText}</p>}
 </div>
 );
 }

 // -----------------------------------------------------------------------
 // multi_select / tagbox
 // form style → step 1 study-fields: rounded-none min-h-[48px] small icons
 // prompt style → step 2 career paths: rounded-none min-h-[56px] larger
 // -----------------------------------------------------------------------
 case"multi_select":
 case"tagbox": {
 const selOpts = options.filter((o) => selected.includes(o.value));
 const unselOpts = options.filter((o) => !selected.includes(o.value));
 const pillBox = (
 <div className="relative">
 <div
 className={cn(
"w-full p-2 bg-white border-2 flex flex-wrap gap-2 items-center transition-all duration-200 cursor-text",
 formStyle
 ?"min-h-[48px] rounded-none"
 :"min-h-[56px] rounded-none",
 open || selOpts.length
 ?"border-primary"
 :"border-slate-200",
 )}
 onClick={() => setOpen(true)}
 >
 <div className="flex items-center pl-1">
 <Search className={formStyle ?"w-4 h-4 text-slate-400" :"w-5 h-5 text-slate-400"} />
 </div>
 {selOpts.map((o) => (
 <div
 key={o.value}
 className={cn(
"bg-primary/10 text-primary-foreground border border-primary/20 flex items-center gap-1.5 font-bold",
 formStyle
 ?"px-2 py-1 rounded-lg text-xs"
 :"px-3 py-1.5 rounded-none text-sm",
 )}
 >
 <span className="text-slate-900">{o.label}</span>
 <button
 onClick={(e) => { e.stopPropagation(); toggle(o.value, false); }}
 className="hover:bg-primary/20 rounded-none p-0.5 transition-colors"
 data-testid={`preview-pill-remove-${q.id}-${o.value}`}
 >
 <X className="w-3 h-3 text-slate-600" />
 </button>
 </div>
 ))}
 <input
 type="text"
 placeholder={selOpts.length === 0 ? (formStyle ?"Search for study fields..." :"Search...") :""}
 onFocus={() => setOpen(true)}
 readOnly
 className={cn(
"flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400",
 formStyle ?"min-w-[100px] py-1 px-1 text-sm" :"min-w-[120px] py-2 px-2",
 )}
 data-testid={`preview-search-${q.id}`}
 />
 </div>
 {open && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-none max-h-[300px] overflow-y-auto z-50">
 <div className="p-2 space-y-1">
 <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">Options</div>
 {unselOpts.length === 0 && (
 <div className="px-3 py-2 text-sm text-muted-foreground">All options selected</div>
 )}
 {unselOpts.map((o) => (
 <div
 key={o.value}
 onClick={() => toggle(o.value, false)}
 className="cursor-pointer rounded-none p-3 flex items-center justify-between transition-colors hover:bg-slate-50"
 data-testid={`preview-option-${q.id}-${o.value}`}
 >
 <span className="text-sm font-medium text-slate-600">{o.label}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
 return (
 <div className={cn("space-y-2", !formStyle &&"space-y-6")} data-testid={`preview-question-${q.id}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 {formStyle ? pillBox : <div className="max-w-2xl mx-auto w-full relative">{pillBox}</div>}
 {formStyle && q.helperText && <p className="text-xs text-slate-500">{q.helperText}</p>}
 </div>
 );
 }

 // -----------------------------------------------------------------------
 // employer_grid — recognition grid (mirrors step 4)
 // -----------------------------------------------------------------------
 case"employer_grid":
 return (
 <div className={cn(!formStyle &&"space-y-6")} data-testid={`preview-question-${q.id}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 <div className={cn(
"grid grid-cols-1 sm:grid-cols-2 gap-3",
 !formStyle &&"max-w-3xl mx-auto",
 )}>
 {options.map((o) => {
 const isSel = selected.includes(o.value);
 return (
 <div
 key={o.value}
 onClick={() => toggle(o.value, false)}
 className={cn(
"cursor-pointer rounded-lg p-3 border transition-all duration-200 flex items-center gap-3 select-none",
 isSel ?"border-primary bg-primary/5 ring-1 ring-primary/20" :"border-border bg-card hover:bg-secondary/50",
 )}
 data-testid={`preview-grid-${q.id}-${o.value}`}
 >
 <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0", isSel ?"border-primary bg-primary text-slate-900" :"border-muted-foreground/50")}>
 {isSel && <CheckCircle2 className="w-3.5 h-3.5" />}
 </div>
 <CompanyLogo name={o.label} size="sm" />
 <div className="flex flex-col min-w-0">
 <span className={cn("text-sm font-bold leading-tight truncate", isSel ?"text-slate-900" :"text-foreground")}>{o.label}</span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );

 // -----------------------------------------------------------------------
 // drag_rank / final_reorder — numbered reorder rows (mirrors step 3)
 // -----------------------------------------------------------------------
 case"drag_rank":
 case"final_reorder": {
 const items = options.length ? options : [
 { label:"Item 1", value:"1" },
 { label:"Item 2", value:"2" },
 { label:"Item 3", value:"3" },
 ];
 return (
 <div className={cn(!formStyle &&"space-y-6")} data-testid={`preview-question-${q.id}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 <div className={cn("space-y-3", !formStyle &&"max-w-xl mx-auto")}>
 {items.map((o, i) => (
 <div key={o.value} className="bg-card border border-border rounded-none p-4 flex items-center gap-4 cursor-grab" data-testid={`preview-rank-${q.id}-${o.value}`}>
 <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground font-bold">{i + 1}</div>
 <span className="flex-1 font-medium">{o.label}</span>
 <GripVertical className="text-muted-foreground/50" />
 </div>
 ))}
 </div>
 </div>
 );
 }

 // -----------------------------------------------------------------------
 // pairwise — two big cards with OR divider + progress bar (mirrors step 5)
 // -----------------------------------------------------------------------
 case"pairwise": {
 const a = options[0] ?? { label:"Employer A", value:"a" };
 const b = options[1] ?? { label:"Employer B", value:"b" };
 const parsedTotal = Number(q.config?.comparisons ?? 10);
 const total = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : 10;
 return (
 <div className={cn("flex flex-col max-w-4xl mx-auto w-full", !formStyle &&"mt-0")} data-testid={`preview-question-${q.id}`}>
 {formStyle ? <FieldLabel /> : <BigPromptEl />}
 <div className="max-w-md mx-auto w-full mb-10 space-y-2">
 <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
 <span>Progress</span>
 <span>0 / {total}</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-none overflow-hidden border border-slate-200">
 <div className="h-full bg-primary" style={{ width:"8%" }} />
 </div>
 </div>
 <div className="flex flex-row gap-3 md:gap-8 items-stretch mb-4">
 <div className="flex-1">
 <button className="group relative w-full bg-white border-2 border-border hover:border-primary rounded-none md:rounded-none p-3 md:p-6 transition-all duration-300 flex flex-col items-center justify-center h-[220px] md:h-[280px]" data-testid={`preview-pairwise-${q.id}-0`}>
 <CompanyLogo name={a.label} size="lg" />
 <h3 className="text-sm md:text-2xl font-bold text-center text-slate-800 mt-2 md:mt-3 line-clamp-2 w-full px-1">{a.label}</h3>
 <p className="mt-1 text-xs md:text-sm text-muted-foreground italic">working in</p>
 <p className="mt-1 text-xs md:text-sm font-bold text-slate-700 text-center line-clamp-1 w-full px-1">your chosen role</p>
 </button>
 </div>
 <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-none flex items-center justify-center font-bold text-slate-300 border border-slate-100 z-10 flex-shrink-0 text-xs md:text-base self-center">OR</div>
 <div className="flex-1">
 <button className="group relative w-full bg-white border-2 border-border hover:border-primary rounded-none md:rounded-none p-3 md:p-6 transition-all duration-300 flex flex-col items-center justify-center h-[220px] md:h-[280px]" data-testid={`preview-pairwise-${q.id}-1`}>
 <CompanyLogo name={b.label} size="lg" />
 <h3 className="text-sm md:text-2xl font-bold text-center text-slate-800 mt-2 md:mt-3 line-clamp-2 w-full px-1">{b.label}</h3>
 <p className="mt-1 text-xs md:text-sm text-muted-foreground italic">working in</p>
 <p className="mt-1 text-xs md:text-sm font-bold text-slate-700 text-center line-clamp-1 w-full px-1">your chosen role</p>
 </button>
 </div>
 </div>
 </div>
 );
 }

 // -----------------------------------------------------------------------
 // hidden / static content block
 // -----------------------------------------------------------------------
 case"hidden":
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

// ---------------------------------------------------------------------------
// Aspect page renderers (hardcoded steps not stored in DB config)
// ---------------------------------------------------------------------------
function AspectSelectPreview() {
 const [selected, setSelected] = useState<string[]>([]);
 return (
 <div className="space-y-6">
 <div className="text-center mb-4">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 What matters most to you in an employer? Select all that apply. <span className="text-red-500">*</span>
 </p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
 {ASPECT_OPTIONS.map((aspect) => {
 const isSelected = selected.includes(aspect);
 return (
 <div
 key={aspect}
 onClick={() => setSelected((prev) => isSelected ? prev.filter((a) => a !== aspect) : [...prev, aspect])}
 className={cn(
"cursor-pointer rounded-lg p-4 border transition-all duration-200 flex items-center gap-3 select-none",
 isSelected ?"border-primary bg-primary/5 ring-1 ring-primary/20" :"border-border bg-card hover:bg-secondary/50"
 )}
 >
 <div className={cn("w-5 h-5 rounded border flex items-center justify-center flex-shrink-0", isSelected ?"border-primary bg-primary text-white" :"border-muted-foreground/50")}>
 {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
 </div>
 <span className={cn("text-sm font-semibold", isSelected ?"text-slate-900" :"text-foreground")}>{aspect}</span>
 </div>
 );
 })}
 </div>
 </div>
 );
}

function AspectPairwisePreview() {
 const pair = ["Career opportunities","Salary and benefits"];
 return (
 <div className="flex flex-col items-center w-full">
 <p className="text-xl md:text-2xl font-medium text-slate-700 mb-8 text-center">Which matters more to you?</p>
 <div className="flex flex-row gap-3 md:gap-8 items-stretch w-full max-w-2xl mx-auto">
 {pair.map((aspect, i) => (
 <div key={aspect} className="flex-1">
 <div className="group w-full bg-white border-2 border-border hover:border-primary rounded-none p-6 md:p-10 transition-all duration-300 flex flex-col items-center justify-center h-[160px] md:h-[180px] cursor-pointer">
 <span className="text-lg md:text-2xl font-bold text-center text-slate-800">{aspect}</span>
 </div>
 </div>
 ))}
 </div>
 <div className="mt-6 flex gap-3">
 <button className="px-4 py-2 text-sm border rounded-lg text-slate-700 border-slate-200">Undo previous choice</button>
 <button className="px-4 py-2 text-sm border rounded-lg text-slate-700 border-slate-200">Too hard, skip this pair</button>
 </div>
 </div>
 );
}

function AspectReorderPreview() {
 return (
 <div className="space-y-6">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto text-center">
 Based on your choices, here's how we've ranked what matters to you. Adjust if needed.
 </p>
 <div className="max-w-xl mx-auto space-y-3">
 {ASPECT_OPTIONS.slice(0, 5).map((aspect, index) => (
 <div key={aspect} className="bg-card border border-border rounded-none p-4 flex items-center gap-4">
 <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground font-bold text-sm">{index + 1}</div>
 <span className="flex-1 font-medium">{aspect}</span>
 <GripVertical className="text-muted-foreground/50" />
 </div>
 ))}
 </div>
 </div>
 );
}

// ---------------------------------------------------------------------------
// PagePreview
// ---------------------------------------------------------------------------
export function PagePreview({ page, taxonomies }: { page: SurveyPageDef; taxonomies: Taxonomy[] }) {
 if (page.kind ==="aspect_select") return <AspectSelectPreview />;
 if (page.kind ==="aspect_pairwise") return <AspectPairwisePreview />;
 if (page.kind ==="aspect_reorder") return <AspectReorderPreview />;

 const qs = page.questions ?? [];
 // Multiple questions on one page → form layout (like steps 0 & 1).
 // Single question → centered prompt layout (like steps 2–7).
 const formStyle = qs.length > 1;

 if (qs.length === 0) {
 return <p className="text-center text-slate-400 text-sm py-8">This page has no questions yet.</p>;
 }

 if (formStyle) {
 // Wrap all fields in the same container as steps 0 & 1.
 // Show the page title heading exactly as Survey.tsx does (cfg.pageTitle).
 return (
 <div className="space-y-8">
 {page.title && (
 <div className="text-center">
 <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{page.title}</h2>
 {page.subtitle && <p className="text-slate-500 mt-1">{page.subtitle}</p>}
 </div>
 )}
 <div className="max-w-xl mx-auto space-y-6 w-full">
 {qs.map((q) => (
 <QuestionPreview key={q.id} q={q} taxonomies={taxonomies} formStyle={true} />
 ))}
 </div>
 </div>
 );
 }

 // Single question — check if this kind has a hardcoded prompt override
 const kindPrompt = page.kind ? KIND_PROMPTS[page.kind] : undefined;
 if (kindPrompt) {
 const title = kindPrompt.usePageTitle ? (page.title ??"") : (kindPrompt.title ??"");
 const subtitle = kindPrompt.usePageSubtitle ? (page.subtitle ??"") : (kindPrompt.subtitle ??"");
 return (
 <div className="w-full">
 <div className="text-center mb-8">
 {kindPrompt.bold ? (
 <>
 <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{title}</h2>
 {subtitle && <p className="text-lg md:text-xl font-medium text-slate-600 max-w-lg mx-auto">{subtitle}</p>}
 </>
 ) : (
 <>
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">{title}</p>
 {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
 </>
 )}
 </div>
 {qs.map((q) => (
 <QuestionPreview key={q.id} q={q} taxonomies={taxonomies} formStyle={false} hidePrompt={true} />
 ))}
 </div>
 );
 }

 // No override — render with the question's own label as the prompt
 return (
 <div className="w-full">
 {qs.map((q) => (
 <QuestionPreview key={q.id} q={q} taxonomies={taxonomies} formStyle={false} />
 ))}
 </div>
 );
}

// ---------------------------------------------------------------------------
// SinglePagePreview — editor side panel
// ---------------------------------------------------------------------------
export function SinglePagePreview({ page, taxonomies }: { page: SurveyPageDef; taxonomies: Taxonomy[] }) {
 return (
 <div className="space-y-4 font-sans text-slate-900">
 <PreviewBanner />
 <div className="rounded-none border border-slate-200 bg-slate-50/50 p-6">
 <PagePreview page={page} taxonomies={taxonomies} />
 </div>
 </div>
 );
}

// ---------------------------------------------------------------------------
// SurveyPreview — full survey modal + /admin/preview route
// ---------------------------------------------------------------------------
export function SurveyPreview({
 pages: rawPages,
 taxonomies,
 startIndex = 0,
 showHeader = true,
}: {
 pages: SurveyPageDef[];
 taxonomies: Taxonomy[];
 startIndex?: number;
 showHeader?: boolean;
}) {
 // Hidden pages are skipped for respondents, so exclude them from the full preview.
 const pages = injectAspectPages(rawPages.filter((p) => !p.hidden));
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
 <div className="bg-slate-50/50 font-sans text-slate-900 rounded-none overflow-hidden border border-slate-200">
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
 {isLast ?"Finish" :"Continue"} <ChevronRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 <p className="text-xs text-slate-400 mt-4" data-testid="text-preview-progress">
 Page {idx + 1} of {pages.length}
 </p>
 </main>
 </div>
 );
}
