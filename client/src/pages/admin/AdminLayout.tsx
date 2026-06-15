import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, ListChecks, Database, Sliders, ExternalLink } from "lucide-react";

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
        <div className="p-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
            data-testid="link-view-survey"
          >
            <ExternalLink className="w-4 h-4" />
            View Survey
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
