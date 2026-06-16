import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Search } from "lucide-react";
import type { CareerPathEmployer } from "@shared/schema";

const NONE = "__none__";

export default function AdminEmployers() {
  const { toast } = useToast();
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [addingCore, setAddingCore] = useState(false);

  const { data: paths = [], isLoading: loadingPaths } = useQuery<string[]>({
    queryKey: ["/api/admin/career-paths"],
    staleTime: 0,
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage which employers are shown to respondents for each career path. Core employers (top 20) always appear;
          10 others are sampled randomly.
        </p>
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
                        {search ? "No employers match your search." : "No employers for this career path."}
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
