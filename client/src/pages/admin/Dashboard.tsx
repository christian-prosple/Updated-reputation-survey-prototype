import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle2, Clock, FileText, Database } from "lucide-react";

interface Stats {
  responses: { total: number; completed: number; partial: number };
  configs: number;
  taxonomies: number;
  activeConfig: string | null;
}

function StatCard({ label, value, icon: Icon, testId }: { label: string; value: string | number; icon: typeof Users; testId: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-bold mt-1" data-testid={testId}>{value}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Stats>({ queryKey: ["/api/admin/stats"] });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h2>
        <p className="text-slate-500">Overview of your survey activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total responses" value={data?.responses.total ?? 0} icon={Users} testId="stat-total" />
        <StatCard label="Completed" value={data?.responses.completed ?? 0} icon={CheckCircle2} testId="stat-completed" />
        <StatCard label="In progress" value={data?.responses.partial ?? 0} icon={Clock} testId="stat-partial" />
        <StatCard label="Taxonomies" value={data?.taxonomies ?? 0} icon={Database} testId="stat-taxonomies" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Active survey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium" data-testid="text-active-config">{data?.activeConfig ?? "None"}</p>
          <p className="text-sm text-slate-500">{data?.configs ?? 0} survey config(s) total.</p>
        </CardContent>
      </Card>
    </div>
  );
}
