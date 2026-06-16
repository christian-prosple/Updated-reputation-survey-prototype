import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BrandLogo from "@/components/BrandLogo";
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
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo variant="inline" university={university} />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-employers-title">
                Most Sought After Employers
              </h1>
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Student Major</label>
            <Select value={major} onValueChange={setMajor}>
              <SelectTrigger data-testid="select-major">
                <SelectValue />
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
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Graduation Year</label>
            <Select value={gradYear} onValueChange={setGradYear}>
              <SelectTrigger data-testid="select-gradyear">
                <SelectValue />
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
                  <li
                    key={c.name}
                    className="flex items-center gap-4 py-3"
                    data-testid={`card-company-${c.name}`}
                  >
                    <span className="w-8 text-lg font-semibold text-slate-400 tabular-nums">
                      {i + 1}
                    </span>
                    <CompanyLogo name={c.name} />
                    <span
                      className="flex-1 font-medium truncate"
                      data-testid={`text-company-name-${c.name}`}
                    >
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {c.count} interested
                    </span>
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
