// A more aesthetic wrapper around shadcn button or a fresh component
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-white text-foreground border border-border hover:border-primary/50 hover:bg-slate-50",
      outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/5",
      ghost: "bg-transparent text-foreground hover:bg-secondary",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs rounded-none",
      md: "h-12 px-6 text-sm rounded-none",
      lg: "h-14 px-8 text-base rounded-none",
      icon: "h-10 w-10 p-0 rounded-none flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:shadow-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
        <span className={cn(isLoading ? "opacity-0" : "opacity-100", "flex items-center gap-2")}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
