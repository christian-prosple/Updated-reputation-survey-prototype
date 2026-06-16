import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandLogo from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import type { Taxonomy, SimpleTaxonomyItem } from "@shared/schema";

export default function UniversitySelection() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: taxonomies, isLoading } = useQuery<Taxonomy[]>({
    queryKey: ["/api/admin/taxonomies"],
  });

  const universities = (() => {
    const tax = taxonomies?.find((t) => t.type === "universities");
    if (!tax) return [] as SimpleTaxonomyItem[];
    return (tax.items as SimpleTaxonomyItem[])
      .filter((i) => i.active !== false)
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const filtered = query.trim()
    ? universities.filter((u) =>
        u.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : universities;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (u: SimpleTaxonomyItem) => {
    setSelected(u.value);
    setQuery(u.label);
    setOpen(false);
  };

  const handleContinue = () => {
    if (!selected) return;
    setLocation(`/demo/type?university=${encodeURIComponent(selected)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 font-sans text-slate-900">
      <BrandLogo />
      <Card className="w-full max-w-md border-0 bg-transparent">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <h1 className="text-2xl font-normal" data-testid="text-university-title">
              Select your college / university
            </h1>
            <p className="text-sm text-slate-500">
              Choose your institution to start the demo.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative" ref={containerRef}>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                disabled={isLoading}
                placeholder={isLoading ? "Loading universities…" : "Search for your university…"}
                className="w-full h-10 pl-9 pr-3 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected("");
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                data-testid="input-university-search"
              />

              {open && !isLoading && (
                <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto border border-border bg-popover shadow-md">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-500 text-center">
                      No university found.
                    </div>
                  ) : (
                    filtered.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => handleSelect(u)}
                        className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        data-testid={`option-university-${u.id}`}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selected === u.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {u.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!selected}
            onClick={handleContinue}
            data-testid="button-continue"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
