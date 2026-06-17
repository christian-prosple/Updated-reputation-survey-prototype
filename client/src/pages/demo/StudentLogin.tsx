import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandLogo from "@/components/BrandLogo";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const university = new URLSearchParams(search).get("university") ?? "";
  const uniParam = university ? `?university=${encodeURIComponent(university)}` : "";

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const proceed = () => {
    setLocation(`/survey${uniParam}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    proceed();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans text-slate-900">
      <BrandLogo />
      <Card className="w-full max-w-md border-0 bg-transparent">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <h1
              className="text-2xl font-normal"
              data-testid="text-invite-title"
            >
              Hannah has invited you to{" "}
              {university ? `the ${university}` : "your university"} career
              planning tool
            </h1>
            <p className="text-sm text-slate-500" data-testid="text-auth-mode">
              {mode === "signup" ? "Sign Up" : "Log In"} to continue
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={proceed}
            data-testid="button-google"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-slate-400">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
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
                placeholder="Enter a password"
                data-testid="input-password"
              />
            </div>

            <Button type="submit" className="w-full" data-testid="button-continue">
              Continue
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              data-testid="button-toggle-mode"
            >
              {mode === "signup" ? "Log In" : "Sign Up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
