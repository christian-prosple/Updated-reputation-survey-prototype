import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-start w-full max-w-2xl mb-8">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-sm font-semibold text-primary uppercase tracking-wider">
          Step {currentStep > totalSteps ? totalSteps : currentStep} of {totalSteps}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {Math.round(((currentStep) / totalSteps) * 100)}% Complete
        </span>
      </div>
      
      {/* Progress Bar Background */}
      <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
        {/* Animated Progress Fill */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step Labels (Optional enhancement) */}
      <div className="flex justify-between w-full mt-4 px-1">
         {Array.from({ length: totalSteps }).map((_, idx) => {
           const stepNum = idx + 1;
           const isActive = stepNum === currentStep;
           const isCompleted = stepNum < currentStep;

           return (
             <div key={idx} className="flex flex-col items-center gap-2">
               <motion.div
                 initial={false}
                 animate={{
                    backgroundColor: isActive ? "hsl(var(--primary))" : isCompleted ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                    scale: isActive ? 1.1 : 1
                 }}
                 className={cn(
                   "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300",
                   (isActive || isCompleted) ? "text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground"
                 )}
               >
                 {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
               </motion.div>
             </div>
           );
         })}
      </div>
    </div>
  );
}
