import { Link } from "wouter";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandLogo({
  className,
  variant = "fixed",
}: {
  className?: string;
  variant?: "fixed" | "inline";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 group",
        variant === "fixed" && "fixed top-4 left-4 z-50",
        className
      )}
      data-testid="link-home-logo"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
        <Trophy className="w-4 h-4" />
      </span>
      <span className="font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
        Employer League
      </span>
    </Link>
  );
}
