import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ChevronLeft, Eye, Building2 } from "lucide-react";
import type { Taxonomy, EmployerItem } from "@shared/schema";

const IMPORT_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "employerName", label: "Employer name", required: true },
  { key: "careerPath", label: "Career path" },
  { key: "displayName", label: "Display name" },
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "isClient", label: "Is client (yes/no)" },
  { key: "priorityTier", label: "Priority tier (number)" },
  { key: "popularityScore", label: "Popularity score (number)" },
  { key: "rankingScore", label: "Ranking score (number)" },
  { key: "aliases", label: "Aliases (; separated)" },
] as const;

const NONE = "__none__";

function CsvImport({ taxonomy, onDone }: { taxonomy: Taxonomy; onDone: () => void }) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<Record<string, string>[]>([]);
  const [importId, setImportId] = useState<number | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [busy, setBusy] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setContent(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function autoMap(hdrs: string[]) {
    const next: Record<string, string> = {};
    for (const f of IMPORT_FIELDS) {
      const match = hdrs.find((h) => h.toLowerCase().replace(/[^a-z]/g, "") === f.key.toLowerCase().replace(/[^a-z]/g, ""));
      if (match) next[f.key] = match;
    }
    setMapping(next);
  }

  async function preview() {
    if (!content.trim()) { toast({ title: "Paste or upload CSV first", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const res = await apiRequest("POST", `/api/admin/taxonomies/${taxonomy.id}/import/preview`, { filename: filename || "import.csv", content });
      const data = await res.json();
      setHeaders(data.headers);
      setSample(data.sample);
      setImportId(data.importId);
      autoMap(data.headers);
    } catch {
      toast({ title: "Could not parse CSV", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!mapping.employerName) { toast({ title: "Map the Employer name column", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const res = await apiRequest("POST", `/api/admin/taxonomies/${taxonomy.id}/import/commit`, {
        content,
        filename,
        importId: importId ?? undefined,
        mapping,
        mode,
      });
      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/taxonomies"] });
      toast({ title: "Import complete", description: `${data.imported} rows imported, ${data.total} total.` });
      onDone();
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onDone} data-testid="button-back-taxonomies"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      <h3 className="text-lg font-semibold">Import CSV into "{taxonomy.name}"</h3>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">1. Upload or paste CSV</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="file" accept=".csv,text/csv" onChange={onFile} data-testid="input-csv-file" />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="...or paste CSV content here"
            rows={5}
            className="font-mono text-xs"
            data-testid="textarea-csv-content"
          />
          <Button onClick={preview} disabled={busy} data-testid="button-preview-csv">
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Preview
          </Button>
        </CardContent>
      </Card>

      {headers.length > 0 && (
        <>
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">2. Map columns</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {IMPORT_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}{f.required && <span className="text-red-500"> *</span>}</Label>
                  <Select
                    value={mapping[f.key] ?? NONE}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === NONE ? "" : v }))}
                  >
                    <SelectTrigger data-testid={`select-map-${f.key}`}><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Preview ({sample.length} sample rows)</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>{headers.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {sample.map((row, i) => (
                    <TableRow key={i}>{headers.map((h) => <TableCell key={h} className="text-xs">{row[h]}</TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "merge" | "replace")}>
                <SelectTrigger className="w-40" data-testid="select-import-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Merge (update)</SelectItem>
                  <SelectItem value="replace">Replace all</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="mt-5" onClick={commit} disabled={busy} data-testid="button-commit-import">
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Import rows
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Taxonomies() {
  const [importing, setImporting] = useState<Taxonomy | null>(null);
  const [viewing, setViewing] = useState<Taxonomy | null>(null);
  const { data, isLoading } = useQuery<Taxonomy[]>({ queryKey: ["/api/admin/taxonomies"] });

  if (importing) return <CsvImport taxonomy={importing} onDone={() => setImporting(null)} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-taxonomies-title">Taxonomies</h2>
        <p className="text-slate-500">Manage option sets like employers. Import employers from CSV.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((t) => (
            <Card key={t.id} data-testid={`card-taxonomy-${t.id}`}>
              <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">{t.name}</span>
                    <Badge variant="outline">{t.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{t.items.length} item(s)</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setViewing(t)} data-testid={`button-view-taxonomy-${t.id}`}><Eye className="w-4 h-4 mr-1" /> View</Button>
                  {t.type === "employers" && (
                    <Button variant="outline" size="sm" onClick={() => setImporting(t)} data-testid={`button-import-taxonomy-${t.id}`}><Upload className="w-4 h-4 mr-1" /> Import CSV</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {(data?.length ?? 0) === 0 && <p className="text-center text-slate-500 py-16">No taxonomies.</p>}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{viewing?.name} — items</DialogTitle></DialogHeader>
          {viewing && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Career path</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Popularity</TableHead>
                  <TableHead>Ranking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(viewing.items as EmployerItem[]).map((it) => (
                  <TableRow key={it.id} data-testid={`row-item-${it.id}`}>
                    <TableCell className="font-medium">{it.employerName ?? (it as any).label}</TableCell>
                    <TableCell className="text-slate-500">{it.careerPath ?? "—"}</TableCell>
                    <TableCell>{it.isClient ? <Badge>Client</Badge> : "—"}</TableCell>
                    <TableCell>{it.popularityScore ?? 0}</TableCell>
                    <TableCell>{it.rankingScore ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
