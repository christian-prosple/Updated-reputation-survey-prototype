import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function BrandLogo({
  className,
  variant = "fixed",
  university,
}: {
  className?: string;
  variant?: "fixed" | "inline";
  university?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex flex-col group leading-tight",
        variant === "fixed" && "fixed top-4 left-4 z-50",
        className
      )}
      data-testid="link-home-logo"
    >
      {university && (
        <span className="text-xs font-medium text-slate-500" data-testid="text-brand-university">
          {university}
        </span>
      )}
      <span className="font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
        Employer League
      </span>
    </Link>
  );
}
