import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search, Upload, ChevronLeft } from "lucide-react";
import type { CareerPathEmployer, Taxonomy } from "@shared/schema";

const NONE = "__none__";

// ---------------------------------------------------------------------------
// Matrix import helpers
// ---------------------------------------------------------------------------
function detectDelimiter(firstLine: string): string {
  return firstLine.includes("\t") ? "\t" : ",";
}

function splitCSVRow(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) { result.push(""); break; }
    if (line[i] === '"') {
      let field = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { field += '"'; i += 2; }
          else { i++; break; }
        } else { field += line[i++]; }
      }
      result.push(field.trim());
      if (i < line.length && line[i] === ',') i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) { result.push(line.slice(i).trim()); break; }
      result.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return result;
}

function searchRaw(content: string, query: string, delimiter: string): { row: number; col: number; path: string; cell: string }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const lines = content.split(/\r?\n/);
  const splitRow = (line: string) => delimiter === "," ? splitCSVRow(line) : line.split("\t").map((s) => s.trim());
  const headers = splitRow(lines[0] ?? "");
  const results: { row: number; col: number; path: string; cell: string }[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitRow(lines[r]);
    for (let c = 0; c < cells.length; c++) {
      if (cells[c].toLowerCase().includes(q)) {
        results.push({ row: r, col: c, path: headers[c] ?? `col ${c}`, cell: cells[c] });
      }
    }
  }
  return results;
}

function parseMatrix(content: string, forceDelimiter?: string): { careerPaths: string[]; employers: { name: string; paths: string[] }[]; delimiter: string } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { careerPaths: [], employers: [], delimiter: "\t" };
  const delimiter = forceDelimiter ?? detectDelimiter(lines[0]);
  const splitRow = (line: string) => delimiter === "," ? splitCSVRow(line) : line.split("\t").map((s) => s.trim());
  const rawPaths = splitRow(lines[0]);
  const byKey = new Map<string, { name: string; paths: Set<string> }>();
  for (let row = 1; row < lines.length; row++) {
    const cells = splitRow(lines[row]);
    for (let col = 0; col < rawPaths.length; col++) {
      const pathName = rawPaths[col];
      if (!pathName) continue;
      const name = (cells[col] ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, { name, paths: new Set() });
      byKey.get(key)!.paths.add(pathName);
    }
  }
  return {
    delimiter,
    careerPaths: rawPaths.filter(Boolean),
    employers: Array.from(byKey.values()).map((e) => ({ name: e.name, paths: Array.from(e.paths).sort() })),
  };
}

function MatrixImport({ taxonomyId, onDone }: { taxonomyId: number; onDone: () => void }) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("replace");
  const [delimOverride, setDelimOverride] = useState<"auto" | "tab" | "comma">("auto");
  const [busy, setBusy] = useState(false);
  const [verifyQuery, setVerifyQuery] = useState("");

  const forceDelim = delimOverride === "tab" ? "\t" : delimOverride === "comma" ? "," : undefined;
  const parsed = content.trim() ? parseMatrix(content, forceDelim) : { careerPaths: [], employers: [], delimiter: "\t" };
  const verifyResults = content.trim() && verifyQuery.trim()
    ? searchRaw(content, verifyQuery, parsed.delimiter)
    : null;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setContent(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function doImport() {
    if (!content.trim()) { toast({ title: "Upload or paste a file first", variant: "destructive" }); return; }
    if (parsed.employers.length === 0) { toast({ title: "No employers detected — check the file format", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const res = await apiRequest("POST", `/api/admin/taxonomies/${taxonomyId}/import/matrix`, { content, mode });
      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/taxonomies"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/career-paths"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/career-path-employers"] });
      toast({ title: "Import complete", description: `${data.imported} employers across ${data.careerPaths} career paths.` });
      onDone();
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onDone} data-testid="button-back-matrix">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Employers
      </Button>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Upload Employer Matrix</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload a CSV or TSV where <strong>row 1 = career path names</strong> (one per column) and each row below lists employers ranked for that path.
          The first 20 rows per column are marked as "core". Delimiter (comma or tab) is auto-detected.
        </p>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">1. Upload file or paste content</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input type="file" accept=".csv,.tsv,.txt" onChange={onFile} className="max-w-xs" data-testid="input-matrix-file" />
            {filename && <span className="text-sm text-slate-500 truncate">{filename}</span>}
          </div>
          <p className="text-xs text-slate-400">Or paste directly:</p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Paste CSV/TSV content here…"}
            rows={5}
            className="font-mono text-xs"
            data-testid="textarea-matrix-content"
          />
          {content.trim() && (
            <div className="flex items-center gap-3">
              <Label className="text-xs">Delimiter</Label>
              <Select value={delimOverride} onValueChange={(v) => setDelimOverride(v as "auto" | "tab" | "comma")}>
                <SelectTrigger className="w-36 h-7 text-xs" data-testid="select-delim-override"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect ({parsed.delimiter === "\t" ? "tab" : "comma"})</SelectItem>
                  <SelectItem value="tab">Tab</SelectItem>
                  <SelectItem value="comma">Comma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {parsed.careerPaths.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              2. Preview
              <Badge variant="secondary">{parsed.careerPaths.length} career paths</Badge>
              <Badge variant="secondary">{parsed.employers.length} unique employers</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">First 5 column headers — verify these look right:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                {parsed.careerPaths.slice(0, 5).map((cp, i) => (
                  <li key={i} className="text-xs text-slate-700">Col {i + 1}: <strong>{cp}</strong></li>
                ))}
                {parsed.careerPaths.length > 5 && <li className="text-xs text-slate-400">…and {parsed.careerPaths.length - 5} more</li>}
              </ol>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Sample employers (first 10) with their detected career paths:</p>
              <div className="space-y-1">
                {parsed.employers.slice(0, 10).map((e) => (
                  <div key={e.name} className="flex items-start gap-2 text-sm">
                    <span className="font-medium w-48 flex-shrink-0 truncate">{e.name}</span>
                    <span className="text-xs text-slate-500">{e.paths.join(", ")}</span>
                  </div>
                ))}
                {parsed.employers.length > 10 && <p className="text-xs text-slate-400">…and {parsed.employers.length - 10} more employers</p>}
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Verify an employer — search the raw file:</p>
              <Input
                placeholder="e.g. Deloitte"
                value={verifyQuery}
                onChange={(e) => setVerifyQuery(e.target.value)}
                className="h-7 text-xs max-w-xs"
                data-testid="input-verify-employer"
              />
              {verifyResults !== null && (
                <div className="mt-2 space-y-1">
                  {verifyResults.length === 0 ? (
                    <p className="text-xs text-slate-400">Not found anywhere in the raw file.</p>
                  ) : (
                    verifyResults.map((r, i) => (
                      <p key={i} className="text-xs">
                        <span className="text-slate-400">Row {r.row}, Col {r.col + 1}</span>
                        {" → "}<strong className="text-slate-800">{r.cell}</strong>
                        {" → career path: "}<span className="text-blue-600">{r.path}</span>
                      </p>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as "merge" | "replace")}>
            <SelectTrigger className="w-40" data-testid="select-matrix-mode"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="replace">Replace all</SelectItem>
              <SelectItem value="merge">Merge (update existing)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="mt-5" onClick={doImport} disabled={busy || parsed.employers.length === 0} data-testid="button-matrix-import">
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Import {parsed.employers.length > 0 ? `${parsed.employers.length} employers` : ""}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Employers page
// ---------------------------------------------------------------------------
export default function AdminEmployers() {
  const { toast } = useToast();
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [addingCore, setAddingCore] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: paths = [], isLoading: loadingPaths } = useQuery<string[]>({
    queryKey: ["/api/admin/career-paths"],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: taxonomies = [] } = useQuery<Taxonomy[]>({
    queryKey: ["/api/admin/taxonomies"],
    staleTime: 0,
  });
  const employersTaxonomy = taxonomies.find((t) => t.type === "employers");

  const { data: employers = [], isLoading: loadingEmployers } = useQuery<CareerPathEmployer[]>({
    queryKey: ["/api/admin/career-path-employers", selectedPath],
    queryFn: () =>
      fetch(`/api/admin/career-path-employers?careerPath=${encodeURIComponent(selectedPath)}`).then((r) => r.json()),
    enabled: !!selectedPath,
    staleTime: 0,
  });

  const toggleCore = useMutation({
    mutationFn: ({ id, isCore }: { id: number; isCore: boolean }) =>
      apiRequest("PATCH", `/api/admin/career-path-employers/${id}`, { isCore }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/career-path-employers"] }),
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest("PATCH", `/api/admin/career-path-employers/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/career-path-employers"] }),
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteEmp = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/career-path-employers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/career-path-employers"] });
      toast({ title: "Employer removed" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const addEmp = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/admin/career-path-employers", {
        careerPath: selectedPath,
        employerName: name.trim(),
        isCore: addingCore,
        active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/career-path-employers"] });
      setNewName("");
      toast({ title: "Employer added" });
    },
    onError: () => toast({ title: "Failed to add employer", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? employers.filter((e) => e.employerName.toLowerCase().includes(q)) : employers;
  }, [employers, search]);

  const core = employers.filter((e) => e.isCore && e.active);
  const nonCore = employers.filter((e) => !e.isCore && e.active);
  const inactive = employers.filter((e) => !e.active);

  if (showImport && employersTaxonomy) {
    return <MatrixImport taxonomyId={employersTaxonomy.id} onDone={() => { setShowImport(false); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage which employers are shown to respondents for each career path. Core employers (top 20) always appear;
            10 others are sampled randomly.
          </p>
        </div>
        {employersTaxonomy && (
          <Button variant="outline" onClick={() => setShowImport(true)} data-testid="button-open-matrix-import">
            <Upload className="w-4 h-4 mr-2" /> Upload CSV
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-80">
          <Select
            value={selectedPath || NONE}
            onValueChange={(v) => { setSelectedPath(v === NONE ? "" : v); setSearch(""); }}
          >
            <SelectTrigger data-testid="select-career-path">
              <SelectValue placeholder={loadingPaths ? "Loading…" : "Select a career path"} />
            </SelectTrigger>
            <SelectContent className="max-h-72 overflow-y-auto">
              <SelectItem value={NONE}>— select a career path —</SelectItem>
              {paths.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedPath && !loadingEmployers && (
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary">{employers.length} total</Badge>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{core.length} core</Badge>
            <Badge variant="outline">{nonCore.length} other</Badge>
            {inactive.length > 0 && <Badge variant="destructive">{inactive.length} inactive</Badge>}
          </div>
        )}
      </div>

      {selectedPath && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search employers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
                data-testid="input-employer-search"
              />
            </div>
            {search && (
              <span className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {loadingEmployers ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-5 w-5 text-slate-400" /></div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-14 text-xs">#</TableHead>
                    <TableHead className="text-xs">Employer</TableHead>
                    <TableHead className="w-24 text-xs text-center">Core</TableHead>
                    <TableHead className="w-24 text-xs text-center">Active</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-slate-400 py-8">
                        {search ? "No employers match your search." : "No employers for this career path yet. Upload a CSV to get started."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className={!emp.active ? "opacity-50" : undefined}
                      data-testid={`row-employer-${emp.id}`}
                    >
                      <TableCell className="text-xs text-slate-400 font-mono">{emp.rank}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {emp.employerName}
                        {emp.isCore && (
                          <span className="ml-2 text-xs text-blue-500 font-normal">core</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={emp.isCore}
                          onCheckedChange={(v) => toggleCore.mutate({ id: emp.id, isCore: v })}
                          disabled={toggleCore.isPending}
                          data-testid={`toggle-core-${emp.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={emp.active}
                          onCheckedChange={(v) => toggleActive.mutate({ id: emp.id, active: v })}
                          disabled={toggleActive.isPending}
                          data-testid={`toggle-active-${emp.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-500"
                          onClick={() => deleteEmp.mutate(emp.id)}
                          disabled={deleteEmp.isPending}
                          data-testid={`button-delete-employer-${emp.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add employer name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) addEmp.mutate(newName); }}
              className="h-9 max-w-xs"
              data-testid="input-add-employer"
            />
            <div className="flex items-center gap-1.5">
              <Switch
                checked={addingCore}
                onCheckedChange={setAddingCore}
                id="add-core-toggle"
              />
              <label htmlFor="add-core-toggle" className="text-xs text-slate-600 cursor-pointer">Core</label>
            </div>
            <Button
              size="sm"
              onClick={() => { if (newName.trim()) addEmp.mutate(newName); }}
              disabled={!newName.trim() || addEmp.isPending}
              data-testid="button-add-employer"
            >
              {addEmp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
