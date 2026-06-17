import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import CompanyLogo from "@/components/CompanyLogo";
import { MAJORS, GRAD_YEARS, rankCompanies } from "@/data/demo-employers";

const ALL = "all";

export default function SoughtAfterEmployers() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  const [major, setMajor] = useState<string>(ALL);
  const [gradYear, setGradYear] = useState<string>(ALL);

  const companies = useMemo(
    () =>
      rankCompanies(
        major === ALL ? undefined : major,
        gradYear === ALL ? undefined : gradYear
      ),
    [major, gradYear]
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <PageHeader
        university={university}
        onBack={() => setLocation(`/demo/dashboard${uniParam}`)}
        title="Most Sought After Employers"
        subtitle="Where students most want to work, based on their survey responses."
      />

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-12 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Filter by
          </p>
          <div className="flex flex-wrap gap-3">
            <Select value={major} onValueChange={setMajor}>
              <SelectTrigger
                className="w-auto gap-2"
                aria-label="Filter by major"
                data-testid="select-major"
              >
                {major === ALL ? "Major" : major}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All majors</SelectItem>
                {MAJORS.map((m) => (
                  <SelectItem key={m} value={m} data-testid={`option-major-${m}`}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={gradYear} onValueChange={setGradYear}>
              <SelectTrigger
                className="w-auto gap-2"
                aria-label="Filter by graduation year"
                data-testid="select-gradyear"
              >
                {gradYear === ALL ? "Grad Year" : gradYear}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All years</SelectItem>
                {GRAD_YEARS.map((y) => (
                  <SelectItem key={y} value={y} data-testid={`option-gradyear-${y}`}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-slate-500" data-testid="text-results-count">
          {companies.length} {companies.length === 1 ? "company" : "companies"}
        </p>

        {companies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No companies match the selected filters.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-2">
              <ol className="divide-y">
                {companies.map((c, i) => (
                  <li key={c.name} className="divide-y">
                    <button
                      type="button"
                      onClick={() =>
                        setLocation(
                          `/demo/employers/${encodeURIComponent(c.name)}${uniParam}`
                        )
                      }
                      className="flex w-full items-center gap-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`card-company-${c.name}`}
                    >
                      <span className="w-8 text-lg font-semibold text-slate-400 tabular-nums">
                        {i + 1}
                      </span>
                      <CompanyLogo name={c.name} />
                      <span
                        className="flex-1 font-serif text-lg truncate"
                        data-testid={`text-company-name-${c.name}`}
                      >
                        {c.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 shrink-0">
                        {c.count} interested
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
