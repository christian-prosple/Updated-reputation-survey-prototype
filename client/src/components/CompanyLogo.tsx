import { useState } from "react";
import { cn } from "@/lib/utils";

const DOMAIN_OVERRIDES: Record<string, string> = {
  "The New York Times": "nytimes.com",
  "General Electric": "ge.com",
  "Johnson & Johnson": "jnj.com",
  JPMorgan: "jpmorganchase.com",
};

export function companyLogoUrl(name: string): string {
  const domain =
    DOMAIN_OVERRIDES[name] ??
    name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export default function CompanyLogo({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  const init = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0",
        className
      )}
    >
      {!err ? (
        <img
          src={companyLogoUrl(name)}
          alt={`${name} logo`}
          className="w-7 h-7 object-contain"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-xs font-bold text-slate-500">{init}</span>
      )}
    </div>
  );
}
