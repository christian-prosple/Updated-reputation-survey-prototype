import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/admin/login", { password });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      navigate("/admin");
    } catch {
      toast({ title: "Incorrect password", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <CardTitle data-testid="text-login-title">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                data-testid="input-admin-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !password} data-testid="button-admin-login">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
