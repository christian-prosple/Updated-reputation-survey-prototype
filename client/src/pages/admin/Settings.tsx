import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { EmployerDisplayLogic } from "@shared/schema";

function NumField({ label, value, onChange, step, testId, help }: { label: string; value: number; onChange: (n: number) => void; step?: number; testId: string; help?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" step={step ?? 1} value={value} onChange={(e) => onChange(Number(e.target.value))} data-testid={testId} />
      {help && <p className="text-[11px] text-slate-400">{help}</p>}
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<EmployerDisplayLogic>({ queryKey: ["/api/admin/settings/employer-logic"], staleTime: 0 });
  const [logic, setLogic] = useState<EmployerDisplayLogic | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setLogic(data);
  }, [data]);

  if (isLoading || !logic) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const bucketTotal = logic.buckets.popular + logic.buckets.client + logic.buckets.ranking + logic.buckets.exploration;

  function set<K extends keyof EmployerDisplayLogic>(key: K, value: EmployerDisplayLogic[K]) {
    setLogic((l) => (l ? { ...l, [key]: value } : l));
  }
  function setBucket(key: keyof EmployerDisplayLogic["buckets"], value: number) {
    setLogic((l) => (l ? { ...l, buckets: { ...l.buckets, [key]: value } } : l));
  }
  function setWeight(key: keyof EmployerDisplayLogic["weights"], value: number) {
    setLogic((l) => (l ? { ...l, weights: { ...l.weights, [key]: value } } : l));
  }

  async function save() {
    if (!logic) return;
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/settings/employer-logic", logic);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/employer-logic"] });
      toast({ title: "Display logic saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-settings-title">Employer Display Logic</h2>
        <p className="text-slate-500">Control which employers respondents see on the recognition step.</p>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">How many to show</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField label="Total employers shown" value={logic.totalEmployers} onChange={(n) => set("totalEmployers", n)} testId="input-total-employers" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Buckets (how many from each group)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumField label="Popular" value={logic.buckets.popular} onChange={(n) => setBucket("popular", n)} testId="input-bucket-popular" />
            <NumField label="Client" value={logic.buckets.client} onChange={(n) => setBucket("client", n)} testId="input-bucket-client" />
            <NumField label="Ranking" value={logic.buckets.ranking} onChange={(n) => setBucket("ranking", n)} testId="input-bucket-ranking" />
            <NumField label="Exploration" value={logic.buckets.exploration} onChange={(n) => setBucket("exploration", n)} testId="input-bucket-exploration" />
          </div>
          <p className="text-xs text-slate-400" data-testid="text-bucket-total">Buckets add up to {bucketTotal}. Remaining slots up to {logic.totalEmployers} are filled by score.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Scoring weights</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumField label="Popularity weight" value={logic.weights.popularity} onChange={(n) => setWeight("popularity", n)} step={0.1} testId="input-weight-popularity" />
          <NumField label="Ranking weight" value={logic.weights.ranking} onChange={(n) => setWeight("ranking", n)} step={0.1} testId="input-weight-ranking" />
          <NumField label="Client boost" value={logic.weights.clientBoost} onChange={(n) => setWeight("clientBoost", n)} testId="input-weight-clientboost" />
          <NumField label="Priority tier boost" value={logic.weights.priorityTierBoost} onChange={(n) => setWeight("priorityTierBoost", n)} testId="input-weight-prioritytier" />
          <NumField label="Exploration (0–1)" value={logic.weights.exploration} onChange={(n) => setWeight("exploration", n)} step={0.05} testId="input-weight-exploration" help="Adds randomness to surface new employers" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Options</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Guarantee clients</Label>
              <p className="text-xs text-slate-400">Ensure client employers always appear.</p>
            </div>
            <Switch checked={logic.guaranteeClients} onCheckedChange={(v) => set("guaranteeClients", v)} data-testid="switch-guarantee-clients" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Only matching career path</Label>
              <p className="text-xs text-slate-400">Restrict to employers in the respondent's chosen paths.</p>
            </div>
            <Switch checked={logic.onlyMatchingCareerPath} onCheckedChange={(v) => set("onlyMatchingCareerPath", v)} data-testid="switch-matching-careerpath" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Shuffle final order</Label>
              <p className="text-xs text-slate-400">Randomise display order of selected employers.</p>
            </div>
            <Switch checked={logic.shuffle} onCheckedChange={(v) => set("shuffle", v)} data-testid="switch-shuffle" />
          </div>
          <div className="space-y-1 max-w-xs">
            <Label className="text-xs">When not enough employers match</Label>
            <Select value={logic.fallback} onValueChange={(v) => set("fallback", v as EmployerDisplayLogic["fallback"])}>
              <SelectTrigger data-testid="select-fallback"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fill_from_all">Fill from all employers</SelectItem>
                <SelectItem value="show_fewer">Show fewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} data-testid="button-save-logic">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save display logic
      </Button>
    </div>
  );
}
