import { ReactNode, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, ListChecks, Database, Sliders, LogOut, Loader2, ExternalLink } from "lucide-react";

interface MeResponse {
  isAdmin: boolean;
}

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/responses", label: "Responses", icon: ListChecks },
  { href: "/admin/survey", label: "Survey Editor", icon: FileText },
  { href: "/admin/taxonomies", label: "Taxonomies", icon: Database },
  { href: "/admin/settings", label: "Display Logic", icon: Sliders },
];

function NavItem({ href, label, icon: Icon, exact }: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }) {
  const [location] = useLocation();
  const active = exact ? location === href : location === href || location.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
      data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [isLoginRoute] = useRoute("/admin/login");

  const { data, isLoading } = useQuery<MeResponse>({
    queryKey: ["/api/admin/me"],
  });

  useEffect(() => {
    if (!isLoginRoute && !isLoading && !data?.isAdmin) {
      navigate("/admin/login");
    }
  }, [isLoginRoute, isLoading, data?.isAdmin, navigate]);

  async function handleLogout() {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.clear();
    navigate("/admin/login");
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-60 shrink-0 border-r bg-white flex flex-col">
        <div className="px-5 py-5 border-b">
          <h1 className="font-bold text-lg" data-testid="text-admin-title">Survey Admin</h1>
          <p className="text-xs text-slate-500">US College Data Tool</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
        <div className="p-3 border-t space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
            data-testid="link-view-survey"
          >
            <ExternalLink className="w-4 h-4" />
            View Survey
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
