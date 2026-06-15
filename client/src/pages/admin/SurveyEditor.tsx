import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Trash2, CheckCircle2, Pencil, ChevronLeft, Plus } from "lucide-react";
import type { SurveyConfig, SurveyPageDef } from "@shared/schema";

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
  async function remove(id: number) {
    if (!confirm("Delete this survey config?")) return;
    await apiRequest("DELETE", `/api/admin/configs/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
    toast({ title: "Survey deleted" });
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
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

function ConfigEditor({ config, onBack }: { config: SurveyConfig; onBack: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(config.name);
  const [pages, setPages] = useState<SurveyPageDef[]>(config.pages);
  const [pagesJson, setPagesJson] = useState(JSON.stringify(config.pages, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPagesJson(JSON.stringify(pages, null, 2));
  }, [pages]);

  function updatePageField(idx: number, field: keyof SurveyPageDef, value: string) {
    setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
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
        <h3 className="font-semibold">Pages ({pages.length})</h3>
        {pages.map((p, idx) => (
          <Card key={p.id ?? idx} data-testid={`card-page-${idx}`}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge variant="outline">{p.kind || "page"}</Badge>
                <span className="text-xs text-slate-400">{p.questions?.length ?? 0} question(s)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={p.title} onChange={(e) => updatePageField(idx, "title", e.target.value)} data-testid={`input-page-title-${idx}`} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subtitle</Label>
                  <Input value={p.subtitle ?? ""} onChange={(e) => updatePageField(idx, "subtitle", e.target.value)} data-testid={`input-page-subtitle-${idx}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Advanced: edit pages JSON</CardTitle>
        </CardHeader>
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
      </Card>

      <div className="flex gap-2">
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
        <p className="text-slate-500">Manage survey versions, pages, and which one is live.</p>
      </div>
      {editing ? <ConfigEditor config={editing} onBack={() => setEditing(null)} /> : <ConfigList onEdit={setEditing} />}
    </div>
  );
}
