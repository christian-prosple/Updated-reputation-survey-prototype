import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calculator } from "lucide-react";
import type { EmployerDisplayLogic, RoleAllocationConfig } from "@shared/schema";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function NumField({
  label, value, onChange, step, testId, help, min, max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  testId: string;
  help?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step ?? 1}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
      />
      {help && <p className="text-[11px] text-slate-400">{help}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pure allocation maths (mirrors server/role-allocation.ts, no imports)
// ---------------------------------------------------------------------------
function calcAllocation(nRoles: number, T: number, cfg: RoleAllocationConfig) {
  const nEff = Math.min(nRoles, cfg.maxRolesConsidered);
  const alpha = Math.max(cfg.alphaMin, cfg.alphaBase - cfg.alphaSlope * nEff);
  if (nRoles === 0 || nEff === 0) return { rows: [], alpha, nEff };

  const weights = Array.from({ length: nEff }, (_, i) => 1 / Math.pow(i + 1, alpha));
  const sumW = weights.reduce((a, b) => a + b, 0);

  const rows = Array.from({ length: nRoles }, (_, i) => {
    const rank = i + 1;
    const w = rank <= nEff ? weights[i] : 0;
    const exact = rank <= nEff ? (T * w) / sumW : 0;
    const floor = Math.floor(exact);
    return { rank, w, exact, floor, remainder: exact - floor, bonus: 0, final: floor };
  });

  // Largest-remainder top-up
  let leftover = T - rows.reduce((s, r) => s + r.floor, 0);
  const sorted = rows
    .filter((r) => r.rank <= nEff)
    .sort((a, b) => b.remainder - a.remainder || a.rank - b.rank);
  for (const row of sorted) {
    if (leftover <= 0) break;
    const found = rows[row.rank - 1];
    if (found) { found.bonus = 1; found.final = found.floor + 1; leftover--; }
  }

  return { rows, alpha: Math.round(alpha * 1000) / 1000, nEff };
}

// ---------------------------------------------------------------------------
// Preview Calculator component
// ---------------------------------------------------------------------------
function AllocationPreview({ cfg }: { cfg: RoleAllocationConfig }) {
  const [nRoles, setNRoles] = useState(3);
  const T = cfg.totalCompanies;

  const result = useMemo(() => calcAllocation(nRoles, T, cfg), [nRoles, T, cfg]);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Preview Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1 w-36">
            <Label className="text-xs">Simulated # of roles selected</Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={nRoles}
              onChange={(e) => setNRoles(Math.max(0, Math.min(20, Number(e.target.value))))}
              data-testid="input-preview-nroles"
            />
          </div>
          <div className="text-xs text-slate-500 pt-5 space-y-0.5">
            <div>n_eff = {result.nEff} (capped at maxRolesConsidered)</div>
            <div>alpha = {result.alpha} (decay exponent)</div>
            <div>Total = {T} employers</div>
          </div>
        </div>

        {result.rows.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Enter at least 1 role to see the breakdown.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-1 pr-3">Rank</th>
                  <th className="py-1 pr-3">Weight</th>
                  <th className="py-1 pr-3">Exact</th>
                  <th className="py-1 pr-3">Floor</th>
                  <th className="py-1 pr-3">+Bonus</th>
                  <th className="py-1 font-semibold">Allocated</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr
                    key={row.rank}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      row.rank > result.nEff ? "text-slate-300 dark:text-slate-600" : ""
                    }`}
                    data-testid={`row-preview-role-${row.rank}`}
                  >
                    <td className="py-1 pr-3">
                      #{row.rank}
                      {row.rank === 1 && <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1">top</Badge>}
                      {row.rank > result.nEff && <span className="ml-1 text-[10px] text-slate-300">(ignored)</span>}
                    </td>
                    <td className="py-1 pr-3">{row.rank <= result.nEff ? row.w.toFixed(4) : "—"}</td>
                    <td className="py-1 pr-3">{row.rank <= result.nEff ? row.exact.toFixed(2) : "—"}</td>
                    <td className="py-1 pr-3">{row.rank <= result.nEff ? row.floor : "—"}</td>
                    <td className="py-1 pr-3">{row.bonus === 1 ? "+1" : row.rank <= result.nEff ? "—" : ""}</td>
                    <td className="py-1 font-semibold">{row.rank <= result.nEff ? row.final : 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-slate-700 dark:text-slate-200">
                  <td className="pt-1 pr-3" colSpan={5}>Total</td>
                  <td className="pt-1" data-testid="text-preview-total">
                    {result.rows.reduce((s, r) => s + r.final, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Display Logic section
// ---------------------------------------------------------------------------
function DisplayLogicSection() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<EmployerDisplayLogic>({
    queryKey: ["/api/admin/settings/employer-logic"],
    staleTime: 0,
  });
  const [logic, setLogic] = useState<EmployerDisplayLogic | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync remote data into local edit state when it first arrives or after invalidation.
  useEffect(() => { if (data) setLogic(data); }, [data]);

  // Use local edits if available, fall back to server data, keep spinner only while truly loading.
  const effective = logic ?? data ?? null;
  if (isLoading || !effective) {
    return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }
  const logic_ = effective;

  const bucketTotal =
    logic_.buckets.popular + logic_.buckets.client + logic_.buckets.ranking + logic_.buckets.exploration;

  function set<K extends keyof EmployerDisplayLogic>(key: K, value: EmployerDisplayLogic[K]) {
    setLogic((l) => ({ ...(l ?? data!), [key]: value }));
  }
  function setBucket(key: keyof EmployerDisplayLogic["buckets"], value: number) {
    setLogic((l) => ({ ...(l ?? data!), buckets: { ...(l ?? data!).buckets, [key]: value } }));
  }
  function setWeight(key: keyof EmployerDisplayLogic["weights"], value: number) {
    setLogic((l) => ({ ...(l ?? data!), weights: { ...(l ?? data!).weights, [key]: value } }));
  }

  async function save() {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/settings/employer-logic", logic_);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/employer-logic"] });
      toast({ title: "Display logic saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">How many to show</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label="Total employers shown"
            value={logic_.totalEmployers}
            onChange={(n) => set("totalEmployers", n)}
            testId="input-total-employers"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Buckets (how many from each group)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumField label="Popular" value={logic_.buckets.popular} onChange={(n) => setBucket("popular", n)} testId="input-bucket-popular" />
            <NumField label="Client" value={logic_.buckets.client} onChange={(n) => setBucket("client", n)} testId="input-bucket-client" />
            <NumField label="Ranking" value={logic_.buckets.ranking} onChange={(n) => setBucket("ranking", n)} testId="input-bucket-ranking" />
            <NumField label="Exploration" value={logic_.buckets.exploration} onChange={(n) => setBucket("exploration", n)} testId="input-bucket-exploration" />
          </div>
          <p className="text-xs text-slate-400" data-testid="text-bucket-total">
            Buckets add up to {bucketTotal}. Remaining slots up to {logic_.totalEmployers} are filled by score.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Scoring weights</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <NumField label="Popularity weight" value={logic_.weights.popularity} onChange={(n) => setWeight("popularity", n)} step={0.1} testId="input-weight-popularity" />
          <NumField label="Ranking weight" value={logic_.weights.ranking} onChange={(n) => setWeight("ranking", n)} step={0.1} testId="input-weight-ranking" />
          <NumField label="Client boost" value={logic_.weights.clientBoost} onChange={(n) => setWeight("clientBoost", n)} testId="input-weight-clientboost" />
          <NumField label="Priority tier boost" value={logic_.weights.priorityTierBoost} onChange={(n) => setWeight("priorityTierBoost", n)} testId="input-weight-prioritytier" />
          <NumField label="Exploration (0–1)" value={logic_.weights.exploration} onChange={(n) => setWeight("exploration", n)} step={0.05} testId="input-weight-exploration" help="Adds randomness to surface new employers" />
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
            <Switch checked={logic_.guaranteeClients} onCheckedChange={(v) => set("guaranteeClients", v)} data-testid="switch-guarantee-clients" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Only matching career path</Label>
              <p className="text-xs text-slate-400">Restrict to employers in the respondent's chosen paths.</p>
            </div>
            <Switch checked={logic_.onlyMatchingCareerPath} onCheckedChange={(v) => set("onlyMatchingCareerPath", v)} data-testid="switch-matching-careerpath" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Shuffle final order</Label>
              <p className="text-xs text-slate-400">Randomise display order of selected employers.</p>
            </div>
            <Switch checked={logic_.shuffle} onCheckedChange={(v) => set("shuffle", v)} data-testid="switch-shuffle" />
          </div>
          <div className="space-y-1 max-w-xs">
            <Label className="text-xs">When not enough employers match</Label>
            <Select value={logic_.fallback} onValueChange={(v) => set("fallback", v as EmployerDisplayLogic["fallback"])}>
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
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save display logic
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role Allocation Config section
// ---------------------------------------------------------------------------
function RoleAllocationSection() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<RoleAllocationConfig>({
    queryKey: ["/api/admin/settings/role-allocation"],
    staleTime: 0,
  });
  const [cfg, setCfg] = useState<RoleAllocationConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setCfg(data); }, [data]);

  // Avoid a render cycle where isLoading=false but useEffect hasn't fired yet.
  const effective = cfg ?? data ?? null;
  if (isLoading || !effective) {
    return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }
  const cfg_ = effective;

  function set<K extends keyof RoleAllocationConfig>(key: K, value: RoleAllocationConfig[K]) {
    setCfg((c) => ({ ...(c ?? data!), [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/admin/settings/role-allocation", cfg_);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/role-allocation"] });
      toast({ title: "Allocation config saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Enable role-preference allocation</CardTitle>
            <Switch
              checked={cfg_.enabled}
              onCheckedChange={(v) => set("enabled", v)}
              data-testid="switch-allocation-enabled"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">
            When enabled, the {cfg_.totalCompanies} employers shown to each respondent are drawn
            proportionally from their ranked career-path pools. When disabled, the legacy
            core-20 + random-10 selection is used instead.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Pool size</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumField
            label="Total employers shown (T)"
            value={cfg_.totalCompanies}
            onChange={(n) => set("totalCompanies", n)}
            min={1}
            max={500}
            testId="input-alloc-total"
            help="How many employers each respondent sees on the recognition step."
          />
          <NumField
            label="Max roles considered"
            value={cfg_.maxRolesConsidered}
            onChange={(n) => set("maxRolesConsidered", n)}
            min={1}
            max={20}
            testId="input-alloc-maxroles"
            help="Roles ranked beyond this position are ignored (get 0 employers)."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Decay exponent (alpha)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            alpha = max(alphaMin, alphaBase − alphaSlope × n_eff).
            Higher alpha = steeper preference for the top-ranked role.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumField
              label="alphaBase"
              value={cfg_.alphaBase}
              onChange={(n) => set("alphaBase", n)}
              step={0.05}
              min={0}
              max={10}
              testId="input-alloc-alphabase"
              help="Starting decay at n_eff = 0."
            />
            <NumField
              label="alphaSlope"
              value={cfg_.alphaSlope}
              onChange={(n) => set("alphaSlope", n)}
              step={0.01}
              min={0}
              max={10}
              testId="input-alloc-alphaslope"
              help="Decrease per additional role considered."
            />
            <NumField
              label="alphaMin"
              value={cfg_.alphaMin}
              onChange={(n) => set("alphaMin", n)}
              step={0.05}
              min={0}
              max={10}
              testId="input-alloc-alphamin"
              help="Floor: alpha never goes below this."
            />
          </div>
        </CardContent>
      </Card>

      <AllocationPreview cfg={cfg_} />

      <Button onClick={save} disabled={saving} data-testid="button-save-allocation">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save allocation config
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Settings() {
  const [tab, setTab] = useState<"display" | "allocation">("allocation");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-settings-title">Employer Settings</h2>
        <p className="text-slate-500">Configure which employers respondents see on the recognition step.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === "allocation"
              ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
          onClick={() => setTab("allocation")}
          data-testid="tab-allocation"
        >
          Role Allocation
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === "display"
              ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
          onClick={() => setTab("display")}
          data-testid="tab-display-logic"
        >
          Display Logic (legacy)
        </button>
      </div>

      {tab === "allocation" && <RoleAllocationSection />}
      {tab === "display" && <DisplayLogicSection />}
    </div>
  );
}
