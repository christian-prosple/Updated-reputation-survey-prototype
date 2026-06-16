import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Users, UserPlus, Building2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BrandLogo from "@/components/BrandLogo";
import {
  DEMO_STUDENTS,
  RESPONDENT_COUNT,
  INVITED_COUNT,
  MOST_SOUGHT_AFTER_EMPLOYERS,
} from "@/data/demo-students";

export default function AdvisorDashboard() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";

  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return DEMO_STUDENTS.filter((s) => s.name.toLowerCase().includes(q));
  }, [query]);

  const dashboardPath = `/demo/dashboard${university ? `?university=${encodeURIComponent(university)}` : ""}`;
  const goComingSoon = (title: string) =>
    setLocation(
      `/demo/coming-soon?title=${encodeURIComponent(title)}&from=${encodeURIComponent(dashboardPath)}`
    );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo variant="inline" />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-bold" data-testid="text-dashboard-title">
                Career Advisor Dashboard
              </h1>
              {university && (
                <p className="text-sm text-slate-500" data-testid="text-dashboard-university">
                  {university}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setLocation(`/demo/respondents${university ? `?university=${encodeURIComponent(university)}` : ""}`)}
            data-testid="card-respondents"
          >
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">List of Respondents</p>
                <p className="text-sm text-slate-500" data-testid="text-respondent-count">
                  {RESPONDENT_COUNT} students
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setLocation(`/demo/invited${university ? `?university=${encodeURIComponent(university)}` : ""}`)}
            data-testid="card-invited"
          >
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Invited Students</p>
                <p className="text-sm text-slate-500" data-testid="text-invited-count">
                  {INVITED_COUNT} students
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </CardContent>
          </Card>
        </div>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setLocation(`/demo/employers${university ? `?university=${encodeURIComponent(university)}` : ""}`)}
          data-testid="card-employers"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" /> Most Sought After Employers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {MOST_SOUGHT_AFTER_EMPLOYERS.map((name, i) => (
                <li
                  key={name}
                  className="flex items-center gap-3 text-sm"
                  data-testid={`text-employer-${i}`}
                >
                  <span className="w-5 text-slate-400">{i + 1}</span>
                  <span className="font-medium">{name}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-500" /> Search for a Student
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all students by name…"
              data-testid="input-student-search"
            />
            {query.trim() && (
              <div className="border rounded-md divide-y" data-testid="list-search-results">
                {matches.length === 0 ? (
                  <p className="text-sm text-slate-500 p-3" data-testid="text-no-results">
                    No students found.
                  </p>
                ) : (
                  matches.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 text-sm"
                      data-testid={`row-student-${s.id}`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-slate-400 capitalize">{s.group}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
