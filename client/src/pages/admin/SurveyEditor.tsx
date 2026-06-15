import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Copy, Trash2, CheckCircle2, Pencil, ChevronLeft, Plus,
  ChevronUp, ChevronDown, GripVertical,
} from "lucide-react";
import {
  QUESTION_TYPES,
  type SurveyConfig, type SurveyPageDef, type SurveyQuestion,
  type SurveyOption, type ConditionRule, type QuestionType, type Taxonomy,
} from "@shared/schema";

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
  const { data, isLoading } = useQuery<SurveyConfig[]>({ queryKey: ["/api/admin/configs"] });

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

          {q.optionsSource === "static" && (
            <OptionsEditor options={q.options ?? []} onChange={(options) => onChange({ options })} />
          )}
          {q.optionsSource === "taxonomy" && (
            <div className="space-y-1">
              <Label className="text-xs">Taxonomy</Label>
              <Select value={q.taxonomyId ? String(q.taxonomyId) : ""} onValueChange={(v) => onChange({ taxonomyId: Number(v) })}>
                <SelectTrigger data-testid={`select-question-taxonomy-${pageIdx}-${qIdx}`}><SelectValue placeholder="Pick a taxonomy" /></SelectTrigger>
                <SelectContent>
                  {taxonomies.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

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

function ConfigEditor({ config, onBack }: { config: SurveyConfig; onBack: () => void }) {
  const { toast } = useToast();
  const { data: taxonomies } = useQuery<Taxonomy[]>({ queryKey: ["/api/admin/taxonomies"] });
  const [name, setName] = useState(config.name);
  const [pages, setPages] = useState<SurveyPageDef[]>(config.pages);
  const [pagesJson, setPagesJson] = useState(JSON.stringify(config.pages, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPagesJson(JSON.stringify(pages, null, 2));
  }, [pages]);

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

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-configs"><ChevronLeft className="w-4 h-4 mr-1" /> Back to list</Button>

      <div className="space-y-2 max-w-md">
        <Label htmlFor="config-name">Survey name</Label>
        <Input id="config-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-config-name" />
      </div>

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

      <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-slate-900 py-3 border-t border-slate-200 dark:border-slate-700">
        <Button onClick={save} disabled={saving} data-testid="button-save-config">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save survey
        </Button>
        <Button variant="outline" onClick={onBack} data-testid="button-cancel-config">Cancel</Button>
      </div>
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
