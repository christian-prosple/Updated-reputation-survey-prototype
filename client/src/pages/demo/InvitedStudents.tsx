import { useLocation, useSearch } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandLogo from "@/components/BrandLogo";
import { DEMO_STUDENTS } from "@/data/demo-students";
import { cn } from "@/lib/utils";

type InviteStatus = "Invited" | "Reminded" | "Completed";

// Deterministic spread across 50 students: ~20 Invited, 15 Reminded, 15 Completed.
const STATUS_POOL: InviteStatus[] = [
  ...Array<InviteStatus>(20).fill("Invited"),
  ...Array<InviteStatus>(15).fill("Reminded"),
  ...Array<InviteStatus>(15).fill("Completed"),
];

// Reorder by a bijective step (gcd(17,50)=1) so statuses are mixed, not clumped.
function statusForIndex(j: number): InviteStatus {
  return STATUS_POOL[(j * 17) % STATUS_POOL.length];
}

const STATUS_STYLES: Record<InviteStatus, string> = {
  Invited: "bg-sky-100 text-sky-700",
  Reminded: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

function emailFor(name: string, domain: string): string {
  const [first, last] = name.split(" ");
  return `${first}.${last}@${domain}`.toLowerCase();
}

export default function InvitedStudents() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  const domain =
    (university.split(/\s+/)[0] || "university").toLowerCase().replace(/[^a-z]/g, "") + ".edu";

  const invited = DEMO_STUDENTS.filter((s) => s.group === "invited");

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo variant="inline" />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-invited-title">
                Invited Students
              </h1>
              {university && (
                <p className="text-sm text-slate-500" data-testid="text-invited-university">
                  {university}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/demo/dashboard${uniParam}`)}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 border-b">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </span>
            </div>
            <ul>
              {invited.map((s, j) => {
                const status = statusForIndex(j);
                return (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 border-b last:border-b-0"
                    data-testid={`row-invited-${s.id}`}
                  >
                    <span className="text-sm truncate" data-testid={`text-invited-email-${s.id}`}>
                      {emailFor(s.name, domain)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUS_STYLES[status]
                      )}
                      data-testid={`badge-invited-status-${s.id}`}
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
