interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-2xl mb-8">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isCompleted = idx < currentStep;
        
        return (
          <div
            key={idx}
            className={`flex-1 h-2 rounded-sm transition-colors duration-300 ${
              isCompleted ? "bg-[#96D2C0]" : "bg-slate-200"
            }`}
          />
        );
      })}
    </div>
  );
}
