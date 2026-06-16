import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  university?: string;
  /** Container width/alignment shared by the brand bar, title block and page. */
  containerClass?: string;
  backLabel?: string;
  onBack: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional right-aligned actions next to the title (e.g. a download button). */
  actions?: ReactNode;
}

const DEFAULT_CONTAINER = "max-w-5xl mx-auto px-4";

export default function PageHeader({
  university,
  containerClass = DEFAULT_CONTAINER,
  backLabel = "Back",
  onBack,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <>
      <header className="bg-white border-b">
        <div className={cn(containerClass, "py-4")}>
          <BrandLogo variant="inline" university={university} />
        </div>
      </header>

      <div className={cn(containerClass, "pt-6")}>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </button>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl" data-testid="text-page-title">
              {title}
            </h1>
            {subtitle ? (
              <p
                className="mt-1 text-sm text-muted-foreground"
                data-testid="text-page-subtitle"
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </>
  );
}
