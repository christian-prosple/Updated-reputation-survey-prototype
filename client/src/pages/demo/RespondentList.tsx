import { useLocation, useSearch } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandLogo from "@/components/BrandLogo";
import { DEMO_STUDENTS } from "@/data/demo-students";

export default function RespondentList() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  const respondents = DEMO_STUDENTS.filter((s) => s.group === "respondent");

  const dashboardPath = `/demo/dashboard${uniParam}`;
  const listPath = `/demo/respondents${uniParam}`;

  const openProfile = (name: string) => {
    setLocation(
      `/demo/coming-soon?title=${encodeURIComponent(name)}&from=${encodeURIComponent(listPath)}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo variant="inline" />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-respondents-title">
                List of Respondents
              </h1>
              {university && (
                <p className="text-sm text-slate-500" data-testid="text-respondents-university">
                  {university}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(dashboardPath)}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student Name
              </span>
            </div>
            <ul>
              {respondents.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => openProfile(s.name)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                    data-testid={`row-respondent-${s.id}`}
                  >
                    <span className="text-sm font-medium" data-testid={`text-respondent-name-${s.id}`}>
                      {s.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
