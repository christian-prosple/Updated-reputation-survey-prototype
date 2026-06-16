import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronUp, ChevronDown, ChevronsUpDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
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

const STATUS_RANK: Record<InviteStatus, number> = {
  Invited: 0,
  Reminded: 1,
  Completed: 2,
};

const BADGE_STYLES: Record<"Invited" | "Completed", string> = {
  Invited: "bg-muted text-muted-foreground border border-border",
  Completed: "bg-foreground text-background",
};

function emailFor(name: string, domain: string): string {
  const [first, last] = name.split(" ");
  return `${first}.${last}@${domain}`.toLowerCase();
}

type SortDir = "none" | "asc" | "desc";

export default function InvitedStudents() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  const domain =
    (university.split(/\s+/)[0] || "university").toLowerCase().replace(/[^a-z]/g, "") + ".edu";

  const [sortDir, setSortDir] = useState<SortDir>("none");

  const rows = useMemo(() => {
    const base = DEMO_STUDENTS.filter((s) => s.group === "invited").map((s, j) => ({
      ...s,
      status: statusForIndex(j),
      email: emailFor(s.name, domain),
    }));
    if (sortDir === "none") return base;
    const sorted = [...base].sort(
      (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]
    );
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [domain, sortDir]);

  const cycleSort = () =>
    setSortDir((d) => (d === "none" ? "asc" : d === "asc" ? "desc" : "none"));

  const SortIcon =
    sortDir === "asc" ? ChevronUp : sortDir === "desc" ? ChevronDown : ChevronsUpDown;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <PageHeader
        university={university}
        containerClass="max-w-3xl mx-auto px-4"
        onBack={() => setLocation(`/demo/dashboard${uniParam}`)}
        title="Invited Students"
        subtitle="Track invitations and send reminders."
      />

      <main className="max-w-3xl mx-auto px-4 pt-6 pb-12">
        <div className="grid grid-cols-[1fr_auto] gap-4 py-3 border-b">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </span>
          <button
            type="button"
            onClick={cycleSort}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
            data-testid="button-sort-status"
          >
            Status
            <SortIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <ul>
          {rows.map((s) => (
            <li
              key={s.id}
              className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 border-b last:border-b-0"
              data-testid={`row-invited-${s.id}`}
            >
              <span className="text-sm truncate" data-testid={`text-invited-email-${s.id}`}>
                {s.email}
              </span>
              <div className="flex justify-end min-w-[7rem]">
                {s.status === "Reminded" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() =>
                      toast({
                        title: "Reminder sent",
                        description: `A reminder was sent to ${s.email}.`,
                      })
                    }
                    data-testid={`button-remind-${s.id}`}
                  >
                    <Bell className="w-3.5 h-3.5 mr-1" /> Remind
                  </Button>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-medium",
                      BADGE_STYLES[s.status]
                    )}
                    data-testid={`badge-invited-status-${s.id}`}
                  >
                    {s.status}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
