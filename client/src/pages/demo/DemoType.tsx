import { useLocation, useSearch } from "wouter";
import { Briefcase, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DemoType() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans text-slate-900">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold" data-testid="text-demotype-title">
            Choose a demo
          </h1>
          {university && (
            <p className="text-sm text-slate-500" data-testid="text-selected-university">
              {university}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setLocation(`/demo/login${uniParam}`)}
            data-testid="card-career-advisor"
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold">Career Advisor Demo</h2>
              <p className="text-sm text-slate-500">
                Log in as a career advisor and explore the dashboard.
              </p>
              <span className="text-sm font-medium text-emerald-600 flex items-center">
                Start <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() =>
              setLocation(
                `/demo/coming-soon?title=${encodeURIComponent("Student Demo")}&from=${encodeURIComponent(`/demo/type${uniParam}`)}`
              )
            }
            data-testid="card-student"
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-sky-600" />
              </div>
              <h2 className="text-lg font-semibold">Student Demo</h2>
              <p className="text-sm text-slate-500">
                See the experience from a student's perspective.
              </p>
              <span className="text-sm font-medium text-sky-600 flex items-center">
                Start <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </div>
    </div>
  );
}
