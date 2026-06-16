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
import { MAJORS, GRAD_YEARS, rankCompanies } from "@/data/demo-employers";

const DOMAIN_OVERRIDES: Record<string, string> = {
  "The New York Times": "nytimes.com",
  "General Electric": "ge.com",
  "Johnson & Johnson": "jnj.com",
  JPMorgan: "jpmorganchase.com",
};

function logoUrl(name: string): string {
  const domain =
    DOMAIN_OVERRIDES[name] ??
    name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function CompanyLogo({ name }: { name: string }) {
  const [err, setErr] = useState(false);
  const init = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
      {!err ? (
        <img
          src={logoUrl(name)}
          alt={`${name} logo`}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-xs font-bold text-slate-500">{init}</span>
      )}
    </div>
  );
}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {companies.map((c) => (
              <Card key={c.name} data-testid={`card-company-${c.name}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <CompanyLogo name={c.name} />
                  <div className="min-w-0">
                    <p className="font-medium truncate" data-testid={`text-company-name-${c.name}`}>
                      {c.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.count} interested
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
