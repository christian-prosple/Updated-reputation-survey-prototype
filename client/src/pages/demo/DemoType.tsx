import { useLocation, useSearch } from "wouter";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BrandLogo from "@/components/BrandLogo";

export default function DemoType() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans text-slate-900">
      <BrandLogo />
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-normal" data-testid="text-demotype-title">
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
            className="cursor-pointer transition-colors hover:border-foreground"
            onClick={() => setLocation(`/demo/login${uniParam}`)}
            data-testid="card-career-advisor"
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-3">
              <h2 className="text-lg font-normal">Career Advisor Demo</h2>
              <p className="text-sm text-muted-foreground">
                Log in as a career advisor and explore the dashboard.
              </p>
              <span className="text-sm font-medium text-foreground flex items-center">
                Start <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:border-foreground"
            onClick={() => setLocation(`/demo/student${uniParam}`)}
            data-testid="card-student"
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-3">
              <h2 className="text-lg font-normal">Student Demo</h2>
              <p className="text-sm text-muted-foreground">
                See the experience from a student's perspective.
              </p>
              <span className="text-sm font-medium text-foreground flex items-center">
                Start <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
