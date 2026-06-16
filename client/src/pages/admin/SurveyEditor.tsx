import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Copy, Trash2, CheckCircle2, Pencil, ChevronLeft, Plus,
  ChevronUp, ChevronDown, GripVertical, Eye, Sparkles, ExternalLink,
  AlertCircle, Wand2,
} from "lucide-react";
import {
  QUESTION_TYPES,
  type SurveyConfig, type SurveyPageDef, type SurveyQuestion,
  type SurveyOption, type ConditionRule, type QuestionType, type Taxonomy,
} from "@shared/schema";
import { SinglePagePreview, SurveyPreview, injectAspectPages } from "@/components/SurveyPreview";
import {
  QUESTION_TEMPLATES, EXAMPLE_QUESTION_JSON,
  generateQuestionFromDescription, normalizeQuestion,
} from "@/lib/questionTemplates";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ConfigList({ onEdit }: { onEdit: (c: SurveyConfig) => void }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<SurveyConfig[]>({ queryKey: ["/api/admin/configs"], staleTime: 0 });

  async function activate(id: number) {
    await apiRequest("POST", `/api/admin/configs/${id}/activate`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    toast({ title: "Survey activated" });
  }
  async function duplicate(id: number) {
    await apiRequest("POST", `/api/admin/configs/${id}/duplicate`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
    toast({ title: "Survey duplicated" });
  }
  async function create() {
    const blank = {
      name: "New survey",
      status: "draft",
      pages: [{ id: uid("page"), title: "Untitled page", subtitle: "", kind: "custom", questions: [] }],
    };
    await apiRequest("POST", `/api/admin/configs`, blank);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
    toast({ title: "Survey created" });
  }
  async function remove(id: number) {
    if (!confirm("Delete this survey config?")) return;
    await apiRequest("DELETE", `/api/admin/configs/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
    toast({ title: "Survey deleted" });
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={create} data-testid="button-new-config"><Plus className="w-4 h-4 mr-1" /> New survey</Button>
      </div>
      {(data ?? []).map((c) => (
        <Card key={c.id} data-testid={`card-config-${c.id}`}>
          <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.name}</span>
                <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                <span className="text-xs text-slate-400">v{c.version}</span>
              </div>
              <p className="text-sm text-slate-500">{c.pages.length} page(s)</p>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => onEdit(c)} data-testid={`button-edit-config-${c.id}`}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
              {c.status !== "active" && (
                <Button variant="outline" size="sm" onClick={() => activate(c.id)} data-testid={`button-activate-config-${c.id}`}><CheckCircle2 className="w-4 h-4 mr-1" /> Activate</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => duplicate(c.id)} data-testid={`button-duplicate-config-${c.id}`}><Copy className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)} data-testid={`button-delete-config-${c.id}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {(data?.length ?? 0) === 0 && <p className="text-center text-slate-500 py-16">No survey configs.</p>}
    </div>
  );
}

function ConditionsEditor({
  conditions, allPages, onChange,
}: {
  conditions: ConditionRule[];
  allPages: SurveyPageDef[];
  onChange: (next: ConditionRule[]) => void;
}) {
  function update(i: number, patch: Partial<ConditionRule>) {
    onChange(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function add() {
    onChange([...conditions, { action: "show", questionId: "", operator: "equals", value: "" }]);
  }
  function remove(i: number) {
    onChange(conditions.filter((_, idx) => idx !== i));
  }
  const allQuestionIds = allPages.flatMap((p) => p.questions.map((q) => q.id));

  return (
    <div className="space-y-2 rounded-md border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Conditions ({conditions.length})</Label>
        <Button variant="outline" size="sm" onClick={add} data-testid="button-add-condition"><Plus className="w-3 h-3 mr-1" /> Add rule</Button>
      </div>
      {conditions.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-sm" data-testid={`condition-row-${i}`}>
          <Select value={c.action} onValueChange={(v) => update(i, { action: v as ConditionRule["action"] })}>
            <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="show">Show</SelectItem>
              <SelectItem value="skip">Skip to</SelectItem>
            </SelectContent>
          </Select>
          {c.action === "skip" && (
            <Select value={c.targetPageId ?? ""} onValueChange={(v) => update(i, { targetPageId: v })}>
              <SelectTrigger className="w-36 h-8"><SelectValue placeholder="page" /></SelectTrigger>
              <SelectContent>
                {allPages.map((p) => <SelectItem key={p.id} value={p.id}>{p.title || p.id}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <span className="text-slate-400">when</span>
          <Select value={c.questionId} onValueChange={(v) => update(i, { questionId: v })}>
            <SelectTrigger className="w-40 h-8"><SelectValue placeholder="question" /></SelectTrigger>
            <SelectContent>
              {allQuestionIds.map((qid) => <SelectItem key={qid} value={qid}>{qid}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={c.operator} onValueChange={(v) => update(i, { operator: v as ConditionRule["operator"] })}>
            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">not equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
            </SelectContent>
          </Select>
          <Input className="w-32 h-8" value={c.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="value" data-testid={`input-condition-value-${i}`} />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(i)} data-testid={`button-remove-condition-${i}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
      ))}
    </div>
  );
}

function OptionsEditor({ options, onChange }: { options: SurveyOption[]; onChange: (next: SurveyOption[]) => void }) {
  function update(i: number, patch: Partial<SurveyOption>) {
    onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  return (
    <div className="space-y-2 rounded-md border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Options ({options.length})</Label>
        <Button variant="outline" size="sm" onClick={() => onChange([...options, { label: "", value: "" }])} data-testid="button-add-option"><Plus className="w-3 h-3 mr-1" /> Add option</Button>
      </div>
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-2" data-testid={`option-row-${i}`}>
          <Input className="h-8" value={o.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" data-testid={`input-option-label-${i}`} />
          <Input className="h-8" value={o.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="Value" data-testid={`input-option-value-${i}`} />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(options.filter((_, idx) => idx !== i))} data-testid={`button-remove-option-${i}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
      ))}
    </div>
  );
}

function QuestionCard({
  q, pageIdx, qIdx, total, allPages, taxonomies, onChange, onMove, onDuplicate, onDelete,
}: {
  q: SurveyQuestion;
  pageIdx: number;
  qIdx: number;
  total: number;
  allPages: SurveyPageDef[];
  taxonomies: Taxonomy[];
  onChange: (patch: Partial<SurveyQuestion>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700" data-testid={`card-question-${pageIdx}-${qIdx}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <GripVertical className="w-4 h-4 text-slate-300" />
        <button className="flex-1 text-left text-sm" onClick={() => setOpen((v) => !v)} data-testid={`button-toggle-question-${pageIdx}-${qIdx}`}>
          <span className="font-medium">{q.label || "(untitled)"}</span>
          <Badge variant="outline" className="ml-2 text-[10px]">{q.type}</Badge>
          {q.required && <span className="ml-2 text-[10px] text-red-500">required</span>}
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(-1)} disabled={qIdx === 0} data-testid={`button-question-up-${pageIdx}-${qIdx}`}><ChevronUp className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(1)} disabled={qIdx === total - 1} data-testid={`button-question-down-${pageIdx}-${qIdx}`}><ChevronDown className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate} data-testid={`button-question-duplicate-${pageIdx}-${qIdx}`}><Copy className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} data-testid={`button-question-delete-${pageIdx}-${qIdx}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
      </div>

      {open && (
        <div className="space-y-3 px-3 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input value={q.label} onChange={(e) => onChange({ label: e.target.value })} data-testid={`input-question-label-${pageIdx}-${qIdx}`} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={q.type} onValueChange={(v) => onChange({ type: v as QuestionType })}>
                <SelectTrigger data-testid={`select-question-type-${pageIdx}-${qIdx}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Helper text</Label>
            <Input value={q.helperText ?? ""} onChange={(e) => onChange({ helperText: e.target.value })} data-testid={`input-question-helper-${pageIdx}-${qIdx}`} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={q.required} onCheckedChange={(v) => onChange({ required: v })} data-testid={`switch-question-required-${pageIdx}-${qIdx}`} />
            <Label className="text-xs">Required</Label>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Options source</Label>
            <Select value={q.optionsSource} onValueChange={(v) => onChange({ optionsSource: v as SurveyQuestion["optionsSource"] })}>
              <SelectTrigger data-testid={`select-options-source-${pageIdx}-${qIdx}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="static">Static list</SelectItem>
                <SelectItem value="taxonomy">From taxonomy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {q.optionsSource === "static" && (() => {
            const opts = q.options ?? [];
            const INLINE_LIMIT = 12;
            return (
              <div className="space-y-2">
                {opts.length > 0 && opts.length <= INLINE_LIMIT && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Options ({opts.length})</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {opts.map((o) => (
                        <span key={o.value} className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-700 border border-slate-200">
                          {o.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <OptionsEditor options={opts} onChange={(options) => onChange({ options })} />
              </div>
            );
          })()}
          {q.optionsSource === "taxonomy" && (() => {
            const linked = taxonomies.find((t) => t.id === q.taxonomyId);
            return (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Taxonomy</Label>
                  <Select value={q.taxonomyId ? String(q.taxonomyId) : ""} onValueChange={(v) => onChange({ taxonomyId: Number(v) })}>
                    <SelectTrigger data-testid={`select-question-taxonomy-${pageIdx}-${qIdx}`}><SelectValue placeholder="Pick a taxonomy" /></SelectTrigger>
                    <SelectContent>
                      {taxonomies.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name} — {(t.items as unknown[]).length} items
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {linked && (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{linked.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{(linked.items as unknown[]).length} items</Badge>
                      <Badge variant="outline" className="text-[10px] text-slate-500">{linked.type}</Badge>
                    </div>
                    <a
                      href="/admin/taxonomies"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      data-testid={`link-manage-taxonomy-${q.id}`}
                    >
                      Manage <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {!linked && q.taxonomyId && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Taxonomy id {q.taxonomyId} not found
                  </p>
                )}
              </div>
            );
          })()}

          <ConditionsEditor conditions={q.conditions ?? []} allPages={allPages} onChange={(conditions) => onChange({ conditions })} />

          <div>
            <Button variant="ghost" size="sm" onClick={() => setAdvanced((v) => !v)} data-testid={`button-question-advanced-${pageIdx}-${qIdx}`}>
              {advanced ? "Hide" : "Show"} advanced JSON
            </Button>
            {advanced && (
              <Textarea
                className="font-mono text-xs mt-2"
                rows={8}
                defaultValue={JSON.stringify(q, null, 2)}
                onBlur={(e) => {
                  try {
                    onChange(JSON.parse(e.target.value));
                  } catch { /* ignore invalid json on blur */ }
                }}
                data-testid={`textarea-question-json-${pageIdx}-${qIdx}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CUSTOM QUESTION BUILDER
// ---------------------------------------------------------------------------
// A human/agent-friendly workflow for adding a question to a page. You can:
//   1. Pick a starter template, or
//   2. Describe the question in plain English and "Generate question JSON", or
//   3. Paste/edit raw question JSON directly (e.g. JSON produced by Replit
//      Agent in chat).
// The JSON is validated (id/type/label required, defaults auto-filled, ids made
// unique) before it is inserted into the selected page. See
// client/src/lib/questionTemplates.ts for the schema docs + generators.
// ---------------------------------------------------------------------------
function CustomQuestionBuilder({
  open, onOpenChange, pages, existingIds, onInsert,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pages: SurveyPageDef[];
  existingIds: string[];
  onInsert: (pageId: string, q: SurveyQuestion) => void;
}) {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [targetPageId, setTargetPageId] = useState(pages[0]?.id ?? "");
  const [json, setJson] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (open && !targetPageId && pages[0]?.id) setTargetPageId(pages[0].id);
  }, [open, pages, targetPageId]);

  function loadTemplate(key: string) {
    const tpl = QUESTION_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    setJson(JSON.stringify(tpl.build(), null, 2));
    setErrors([]);
    setValid(false);
  }

  function generate() {
    if (!description.trim()) {
      toast({ title: "Describe the question first", variant: "destructive" });
      return;
    }
    const q = generateQuestionFromDescription(description);
    setJson(JSON.stringify(q, null, 2));
    setErrors([]);
    setValid(false);
    toast({ title: "Draft generated", description: "Review the JSON, then validate and insert." });
  }

  function validate(): SurveyQuestion | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setErrors([`Invalid JSON: ${(e as Error).message}`]);
      setValid(false);
      return null;
    }
    const result = normalizeQuestion(parsed, new Set(existingIds));
    setErrors(result.errors);
    setValid(result.ok);
    return result.ok ? (result.question ?? null) : null;
  }

  function insert() {
    const q = validate();
    if (!q) {
      toast({ title: "Fix the errors first", variant: "destructive" });
      return;
    }
    if (!targetPageId) {
      toast({ title: "Pick a target page", variant: "destructive" });
      return;
    }
    onInsert(targetPageId, q);
    toast({ title: "Question inserted", description: `Added "${q.label}" to the survey.` });
    onOpenChange(false);
    setDescription("");
    setJson("");
    setErrors([]);
    setValid(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-custom-builder">
        <DialogHeader>
          <DialogTitle>Custom Question Builder</DialogTitle>
          <DialogDescription>
            Create a question from a template, a plain-English description, or by pasting JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-none bg-muted border border-border text-muted-foreground text-xs px-3 py-2 flex gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Tip: You can ask Replit Agent to generate a question JSON object, paste it here,
            validate it, then insert it into the survey.
          </span>
        </div>

        <div className="space-y-4 py-2">
          {/* Templates */}
          <div className="space-y-1">
            <Label className="text-xs">Start from a template</Label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TEMPLATES.map((t) => (
                <Button
                  key={t.key}
                  variant="outline"
                  size="sm"
                  title={t.description}
                  onClick={() => loadTemplate(t.key)}
                  data-testid={`button-template-${t.key}`}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Describe + generate */}
          <div className="space-y-1">
            <Label className="text-xs">Describe the question you want to create</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Create a pairwise employer comparison using recognized employers, 10 comparisons, allow skip, store exposure data."
              data-testid="textarea-builder-description"
            />
            <Button variant="secondary" size="sm" onClick={generate} data-testid="button-generate-json">
              <Wand2 className="w-4 h-4 mr-1" /> Generate question JSON
            </Button>
          </div>

          {/* Advanced JSON editor */}
          <div className="space-y-1">
            <Label className="text-xs">Question JSON (advanced editor)</Label>
            <Textarea
              rows={12}
              value={json}
              onChange={(e) => { setJson(e.target.value); setValid(false); }}
              placeholder="Paste or edit the question JSON here…"
              className="font-mono text-xs"
              data-testid="textarea-builder-json"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => validate()} data-testid="button-validate-json">
                Validate
              </Button>
              {valid && (
                <span className="text-xs text-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Looks valid
                </span>
              )}
            </div>
            {errors.length > 0 && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 space-y-1" data-testid="text-builder-errors">
                {errors.map((e, i) => (
                  <div key={i} className="flex gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{e}</span></div>
                ))}
              </div>
            )}
          </div>

          {/* Target page */}
          <div className="space-y-1">
            <Label className="text-xs">Insert into page</Label>
            <Select value={targetPageId} onValueChange={setTargetPageId}>
              <SelectTrigger data-testid="select-target-page"><SelectValue placeholder="Pick a page" /></SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title || p.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Example help */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-toggle-example">Show example question JSON</Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 rounded-md bg-slate-900 text-slate-100 text-xs p-3 overflow-x-auto" data-testid="text-example-json">
                {EXAMPLE_QUESTION_JSON}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-builder-cancel">Cancel</Button>
          <Button onClick={insert} data-testid="button-insert-question">
            <Plus className="w-4 h-4 mr-1" /> Insert into survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfigEditor({ config, onBack }: { config: SurveyConfig; onBack: () => void }) {
  const { toast } = useToast();
  const { data: taxonomies } = useQuery<Taxonomy[]>({ queryKey: ["/api/admin/taxonomies"], staleTime: 0 });
  const [name, setName] = useState(config.name);
  const [pages, setPages] = useState<SurveyPageDef[]>(config.pages);
  const [pagesJson, setPagesJson] = useState(JSON.stringify(config.pages, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    setPagesJson(JSON.stringify(pages, null, 2));
  }, [pages]);

  // Auto-save: debounce 1.5 s after any change to pages or name.
  const isFirstRender = useRef(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "pending" | "saving" | "saved">("idle");

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setAutoSaveStatus("pending");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        await apiRequest("PATCH", `/api/admin/configs/${config.id}`, { name, pages });
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [pages, name]);

  // All existing question ids across the survey — used to keep new ids unique.
  const existingIds = pages.flatMap((p) => (p.questions ?? []).map((q) => q.id));

  function openPreviewFor(idx: number) {
    setPreviewIdx(idx);
    setPreviewOn(true);
  }

  // Insert a (validated) question from the Custom Question Builder into a page.
  function insertCustomQuestion(pageId: string, q: SurveyQuestion) {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, questions: [...(p.questions ?? []), q] } : p)));
  }

  function setPage(idx: number, patch: Partial<SurveyPageDef>) {
    setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function addPage() {
    setPages((prev) => [...prev, { id: uid("page"), title: "Untitled page", subtitle: "", kind: "custom", questions: [] }]);
  }
  function duplicatePage(idx: number) {
    setPages((prev) => {
      const copy: SurveyPageDef = {
        ...prev[idx],
        id: uid("page"),
        title: `${prev[idx].title} (copy)`,
        questions: prev[idx].questions.map((q) => ({ ...q, id: uid("q") })),
      };
      const next = prev.slice();
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }
  function deletePage(idx: number) {
    if (!confirm("Delete this page?")) return;
    setPages((prev) => prev.filter((_, i) => i !== idx));
  }
  function movePage(idx: number, dir: -1 | 1) {
    setPages((prev) => move(prev, idx, idx + dir));
  }

  function setQuestion(pageIdx: number, qIdx: number, patch: Partial<SurveyQuestion>) {
    setPages((prev) => prev.map((p, i) =>
      i === pageIdx ? { ...p, questions: p.questions.map((q, j) => (j === qIdx ? { ...q, ...patch } : q)) } : p));
  }
  function addQuestion(pageIdx: number) {
    const blank: SurveyQuestion = { id: uid("q"), type: "text", label: "New question", required: false, optionsSource: "none" };
    setPages((prev) => prev.map((p, i) => (i === pageIdx ? { ...p, questions: [...p.questions, blank] } : p)));
  }
  function duplicateQuestion(pageIdx: number, qIdx: number) {
    setPages((prev) => prev.map((p, i) => {
      if (i !== pageIdx) return p;
      const copy = { ...p.questions[qIdx], id: uid("q"), label: `${p.questions[qIdx].label} (copy)` };
      const qs = p.questions.slice();
      qs.splice(qIdx + 1, 0, copy);
      return { ...p, questions: qs };
    }));
  }
  function deleteQuestion(pageIdx: number, qIdx: number) {
    setPages((prev) => prev.map((p, i) => (i === pageIdx ? { ...p, questions: p.questions.filter((_, j) => j !== qIdx) } : p)));
  }
  function moveQuestion(pageIdx: number, qIdx: number, dir: -1 | 1) {
    setPages((prev) => prev.map((p, i) => (i === pageIdx ? { ...p, questions: move(p.questions, qIdx, qIdx + dir) } : p)));
  }

  function syncFromJson() {
    try {
      const parsed = JSON.parse(pagesJson);
      if (!Array.isArray(parsed)) throw new Error("Pages must be an array");
      setPages(parsed);
      setJsonError(null);
      toast({ title: "JSON applied" });
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/admin/configs/${config.id}`, { name, pages });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
      toast({ title: "Survey saved" });
      onBack();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const editorBody = (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pages ({pages.length})</h3>
          <Button variant="outline" size="sm" onClick={addPage} data-testid="button-add-page"><Plus className="w-4 h-4 mr-1" /> Add page</Button>
        </div>
        {pages.map((p, idx) => (
          <Card key={p.id ?? idx} data-testid={`card-page-${idx}`}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{p.kind || "page"}</Badge>
                <span className="text-xs text-slate-400">{p.questions?.length ?? 0} question(s)</span>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPreviewFor(idx)} title="Preview this page" data-testid={`button-page-preview-${idx}`}><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => movePage(idx, -1)} disabled={idx === 0} data-testid={`button-page-up-${idx}`}><ChevronUp className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => movePage(idx, 1)} disabled={idx === pages.length - 1} data-testid={`button-page-down-${idx}`}><ChevronDown className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicatePage(idx)} data-testid={`button-page-duplicate-${idx}`}><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePage(idx)} data-testid={`button-page-delete-${idx}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={p.title} onChange={(e) => setPage(idx, { title: e.target.value })} data-testid={`input-page-title-${idx}`} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subtitle</Label>
                  <Input value={p.subtitle ?? ""} onChange={(e) => setPage(idx, { subtitle: e.target.value })} data-testid={`input-page-subtitle-${idx}`} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kind (semantic tag)</Label>
                  <Input value={p.kind ?? ""} onChange={(e) => setPage(idx, { kind: e.target.value })} data-testid={`input-page-kind-${idx}`} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Page id</Label>
                  <Input value={p.id} onChange={(e) => setPage(idx, { id: e.target.value })} data-testid={`input-page-id-${idx}`} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Questions</Label>
                  <Button variant="outline" size="sm" onClick={() => addQuestion(idx)} data-testid={`button-add-question-${idx}`}><Plus className="w-3 h-3 mr-1" /> Add question</Button>
                </div>
                {(p.questions ?? []).map((q, j) => (
                  <QuestionCard
                    key={q.id ?? j}
                    q={q}
                    pageIdx={idx}
                    qIdx={j}
                    total={p.questions.length}
                    allPages={pages}
                    taxonomies={taxonomies ?? []}
                    onChange={(patch) => setQuestion(idx, j, patch)}
                    onMove={(dir) => moveQuestion(idx, j, dir)}
                    onDuplicate={() => duplicateQuestion(idx, j)}
                    onDelete={() => deleteQuestion(idx, j)}
                  />
                ))}
              </div>

              <ConditionsEditor conditions={p.conditions ?? []} allPages={pages} onChange={(conditions) => setPage(idx, { conditions })} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Advanced: edit pages JSON
            <Button variant="ghost" size="sm" onClick={() => setShowJson((v) => !v)} data-testid="button-toggle-json">{showJson ? "Hide" : "Show"}</Button>
          </CardTitle>
        </CardHeader>
        {showJson && (
          <CardContent className="space-y-2">
            <Textarea
              value={pagesJson}
              onChange={(e) => setPagesJson(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              data-testid="textarea-pages-json"
            />
            {jsonError && <p className="text-sm text-red-500" data-testid="text-json-error">{jsonError}</p>}
            <Button variant="outline" size="sm" onClick={syncFromJson} data-testid="button-apply-json"><Plus className="w-4 h-4 mr-1" /> Apply JSON</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );

  const previewPages = injectAspectPages(pages);
  const previewPanel = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold">Live preview</Label>
        <Select value={String(previewIdx)} onValueChange={(v) => setPreviewIdx(Number(v))}>
          <SelectTrigger className="h-8 w-44 text-xs" data-testid="select-preview-page"><SelectValue /></SelectTrigger>
          <SelectContent>
            {previewPages.map((p, i) => (
              <SelectItem key={p.id ?? i} value={String(i)}>{p.title || `Page ${i + 1}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {previewPages[previewIdx]
        ? <SinglePagePreview page={previewPages[previewIdx]} taxonomies={taxonomies ?? []} />
        : <p className="text-sm text-slate-400">No page selected.</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-configs"><ChevronLeft className="w-4 h-4 mr-1" /> Back to list</Button>

      <div className="space-y-2 max-w-md">
        <Label htmlFor="config-name">Survey name</Label>
        <Input id="config-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-config-name" />
      </div>

      {/* Toolbar: builder + preview entry points */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="sm" onClick={() => setBuilderOpen(true)} data-testid="button-open-builder">
          <Sparkles className="w-4 h-4 mr-1" /> Create custom question
        </Button>
        <Button variant={previewOn ? "secondary" : "outline"} size="sm" onClick={() => setPreviewOn((v) => !v)} data-testid="button-toggle-preview">
          <Eye className="w-4 h-4 mr-1" /> {previewOn ? "Hide preview" : "Show preview"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setFullPreviewOpen(true)} data-testid="button-preview-full">
          <Eye className="w-4 h-4 mr-1" /> Preview full survey
        </Button>
        <Button asChild variant="ghost" size="sm" data-testid="link-open-preview-route">
          <a href={`/admin/preview/${config.id}`} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" /> Open saved preview
          </a>
        </Button>
        {autoSaveStatus === "pending" && (
          <span className="text-xs text-slate-400 ml-1">Unsaved changes…</span>
        )}
        {autoSaveStatus === "saving" && (
          <span className="flex items-center gap-1 text-xs text-slate-400 ml-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </span>
        )}
        {autoSaveStatus === "saved" && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
            <CheckCircle2 className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      {previewOn ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div>{editorBody}</div>
          <div className="xl:sticky xl:top-4">{previewPanel}</div>
        </div>
      ) : (
        editorBody
      )}

      <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-slate-900 py-3 border-t border-slate-200 dark:border-slate-700">
        <Button onClick={save} disabled={saving} data-testid="button-save-config">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save survey
        </Button>
        <Button variant="outline" onClick={onBack} data-testid="button-cancel-config">Cancel</Button>
      </div>

      {/* Custom question builder */}
      <CustomQuestionBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        pages={pages}
        existingIds={existingIds}
        onInsert={insertCustomQuestion}
      />

      {/* Full-survey preview (live, unsaved edits) */}
      <Dialog open={fullPreviewOpen} onOpenChange={setFullPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-full-preview">
          <DialogHeader>
            <DialogTitle>Full survey preview</DialogTitle>
            <DialogDescription>Walk through every page as a respondent would. Nothing is saved.</DialogDescription>
          </DialogHeader>
          <SurveyPreview pages={pages} taxonomies={taxonomies ?? []} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SurveyEditor() {
  const [editing, setEditing] = useState<SurveyConfig | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-survey-editor-title">Survey Editor</h2>
        <p className="text-slate-500">Manage survey versions, pages, questions, and which one is live.</p>
      </div>
      {editing ? <ConfigEditor config={editing} onBack={() => setEditing(null)} /> : <ConfigList onEdit={setEditing} />}
    </div>
  );
}
