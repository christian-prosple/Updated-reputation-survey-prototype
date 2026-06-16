import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Briefcase, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandLogo from "@/components/BrandLogo";

export default function AdvisorLogin() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  // Static for the demo — Harvard maps to demo@harvard.edu regardless of selection.
  const [email, setEmail] = useState("demo@harvard.edu");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/demo/dashboard${uniParam}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans text-slate-900">
      <BrandLogo />
      <Card className="w-full max-w-md border-0 bg-transparent">
        <CardContent className="pt-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-none bg-muted border border-border flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-foreground" />
              </div>
              <h1 className="text-2xl font-bold" data-testid="text-login-title">
                Career Advisor Login
              </h1>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for the demo"
                data-testid="input-password"
              />
            </div>

            <Button type="submit" className="w-full" data-testid="button-login">
              Log In
            </Button>
          </form>

          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/demo/type${uniParam}`)}
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
