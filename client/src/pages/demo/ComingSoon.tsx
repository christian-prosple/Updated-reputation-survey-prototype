import { useLocation, useSearch } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandLogo from "@/components/BrandLogo";

export default function ComingSoon() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const title = params.get("title") ?? "This feature";
  const from = params.get("from") ?? "/";

  const goBack = () => setLocation(from);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans text-slate-900">
      <BrandLogo />
      <Card className="w-full max-w-md border-0 bg-transparent">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
          <h1 className="text-2xl font-normal" data-testid="text-comingsoon-title">
            {title}
          </h1>
          <p className="text-sm text-slate-500" data-testid="text-comingsoon-message">
            Coming soon — this part of the demo isn't built yet.
          </p>
          <Button variant="outline" onClick={goBack} data-testid="button-back">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
