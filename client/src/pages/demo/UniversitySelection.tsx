import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import BrandLogo from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import type { Taxonomy, SimpleTaxonomyItem } from "@shared/schema";

export default function UniversitySelection() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");

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
            <div className="w-12 h-12 rounded-none bg-muted border border-border flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-university-title">
              Select your college / university
            </h1>
            <p className="text-sm text-slate-500">
              Choose your institution to start the demo.
            </p>
          </div>

          <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={isLoading}
                  className="w-full justify-between font-normal"
                  data-testid="button-university-select"
                >
                  <span className={cn("truncate", !selected && "text-slate-400")}>
                    {selected ||
                      (isLoading ? "Loading universities…" : "Search for your university…")}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search universities…" data-testid="input-university-search" />
                  <CommandList>
                    <CommandEmpty>No university found.</CommandEmpty>
                    <CommandGroup>
                      {universities.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.label}
                          onSelect={() => {
                            setSelected(u.value);
                            setOpen(false);
                          }}
                          data-testid={`option-university-${u.id}`}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selected === u.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {u.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
