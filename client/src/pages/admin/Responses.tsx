import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Eye, Trash2 } from "lucide-react";
import type { SurveyResponse } from "@shared/schema";

type Filter = "all" | "completed" | "partial";

export default function AdminResponses() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<SurveyResponse | null>(null);
  const { toast } = useToast();

  const queryKey = ["/api/admin/responses", filter];
  const { data, isLoading } = useQuery<{ rows: SurveyResponse[]; total: number }>({
    queryKey,
    queryFn: async () => {
      const url = filter === "all" ? "/api/admin/responses" : `/api/admin/responses?status=${filter}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  async function handleDelete(id: number) {
    if (!confirm("Delete this response? This cannot be undone.")) return;
    await apiRequest("DELETE", `/api/admin/responses/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/responses"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    toast({ title: "Response deleted" });
  }

  const exportUrl = filter === "all" ? "/api/admin/responses/export.csv" : `/api/admin/responses/export.csv?status=${filter}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-responses-title">Responses</h2>
          <p className="text-slate-500">{data?.total ?? 0} response(s).</p>
        </div>
        <a href={exportUrl} download>
          <Button variant="outline" data-testid="button-export-csv"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </a>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="partial" data-testid="tab-partial">In progress</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : (data?.rows.length ?? 0) === 0 ? (
            <p className="text-center text-slate-500 py-16" data-testid="text-no-responses">No responses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Career paths</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.rows.map((r) => (
                  <TableRow key={r.id} data-testid={`row-response-${r.id}`}>
                    <TableCell className="font-medium">{r.respondentEmail || <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{r.startedAt ? new Date(r.startedAt).toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-slate-500 max-w-[200px] truncate">
                      {(r.metadata?.employerExposure?.careerPaths ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelected(r)} data-testid={`button-view-${r.id}`}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} data-testid={`button-delete-${r.id}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Response detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">Email:</span> {selected.respondentEmail || "—"}</div>
                <div><span className="text-slate-500">Status:</span> {selected.status}</div>
                <div><span className="text-slate-500">Session:</span> <span className="font-mono text-xs">{selected.sessionId}</span></div>
                <div><span className="text-slate-500">Completed:</span> {selected.completedAt ? new Date(selected.completedAt).toLocaleString() : "—"}</div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Answers</h4>
                <div className="space-y-1">
                  {(selected.answers ?? []).map((a, i) => (
                    <div key={i} className="flex gap-2 py-1 border-b border-slate-100" data-testid={`answer-${a.questionId}`}>
                      <span className="text-slate-500 w-40 shrink-0">{a.label}</span>
                      <span className="break-words">{Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selected.metadata?.employerExposure && (
                <div>
                  <h4 className="font-semibold mb-2">Employer exposure</h4>
                  <div className="text-slate-600 space-y-1">
                    <div><span className="text-slate-500">Shown:</span> {(selected.metadata.employerExposure.shown ?? []).join(", ") || "—"}</div>
                    <div><span className="text-slate-500">Recognised:</span> {(selected.metadata.employerExposure.recognized ?? []).join(", ") || "—"}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
