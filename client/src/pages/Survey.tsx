import { useEffect, useMemo, useState } from "react";
import { useSurvey, ROLES, RoleType } from "@/hooks/use-survey";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button-custom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ChevronRight, GripVertical, CheckCircle2, Circle, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SurveyPage() {
  const { state, actions } = useSurvey();
  const [activePair, setActivePair] = useState<[string, string] | null>(null);

  // --- DERIVED STATE ---
  const totalSteps = 4; // We combine pairwise & ranking conceptually for the user, or just say 4 steps. User brief said 4 steps.

  // --- EFFECT: Initialize Companies for Step 3 ---
  useEffect(() => {
    if (state.step === 3 && state.displayedCompanies.length === 0) {
      actions.generateCompanyPool();
    }
  }, [state.step]);

  // --- EFFECT: Initialize Final Ranking for Step 5 ---
  useEffect(() => {
    if (state.step === 5 && state.finalRanking.length === 0) {
      actions.generateFinalRanking();
    }
  }, [state.step]);

  // --- HELPER: Get Next Pair ---
  const getNextPair = () => {
    const candidates = state.selectedCompanies;
    if (candidates.length < 2) return null;

    // Simple random pair logic - try to find one not seen
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const idx1 = Math.floor(Math.random() * candidates.length);
      let idx2 = Math.floor(Math.random() * candidates.length);
      while (idx2 === idx1) idx2 = Math.floor(Math.random() * candidates.length);

      const a = candidates[idx1];
      const b = candidates[idx2];
      const key = [a, b].sort().join("|");

      if (!state.completedPairs.has(key)) {
        return [a, b] as [string, string];
      }
      attempts++;
    }
    return null; // Exhausted or too hard to find new random one
  };

  // --- EFFECT: Manage Pairwise Loop ---
  useEffect(() => {
    if (state.step === 4 && !activePair) {
      const next = getNextPair();
      if (next) {
        setActivePair(next);
      } else {
        // No more pairs? Auto-advance to step 5
        actions.nextStep();
      }
    }
  }, [state.step, activePair, state.completedPairs]);


  // --- HANDLERS ---
  const handleRoleContinue = () => {
    actions.nextStep();
  };

  const handleOrderContinue = () => {
    actions.nextStep();
  };

  const handleCompanyContinue = () => {
    actions.nextStep();
  };

  const handlePairChoice = (winner: string | null) => {
    if (!activePair) return;
    const [a, b] = activePair;
    
    if (winner) actions.recordWin(winner);
    actions.markPairSeen(a, b);
    
    // Reset active pair to trigger effect
    setActivePair(null);
  };

  const handleFinishSurvey = () => {
      // In pairwise step, user can choose to finish early
      actions.nextStep(); 
  };

  const moveRankItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...state.finalRanking];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    actions.updateFinalRanking(newOrder);
  };

  // --- RENDER STEPS ---

  // STEP 1: ROLE SELECTION
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Career Path
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          What role/s or career path/s are you most interested in pursuing?
        </p>
      </div>

      <div className="grid gap-4 max-w-xl mx-auto">
        {ROLES.map((role) => {
          const isSelected = state.selectedRoles.includes(role);
          return (
            <motion.div
              key={role}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => actions.selectRole(role)}
              className={cn(
                "cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex items-center gap-4 group",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                  : "border-border bg-card hover:border-primary/50 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground group-hover:border-primary"
              )}>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <span className={cn("font-medium text-lg", isSelected ? "text-primary" : "text-foreground")}>
                {role}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mt-12">
        <Button 
          onClick={handleRoleContinue} 
          disabled={state.selectedRoles.length === 0}
          size="lg"
          className="w-full max-w-xs"
        >
          Continue <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // STEP 2: ROLE ORDERING
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Priorities
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Which roles are most attractive to you? Drag to sort them in order of preference.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <Reorder.Group axis="y" values={state.roleOrder} onReorder={actions.reorderRoles} className="space-y-3">
          {state.roleOrder.map((role, index) => (
            <Reorder.Item key={role} value={role}>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 cursor-grab active:cursor-grabbing">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground font-bold">
                  {index + 1}
                </div>
                <span className="flex-1 font-medium">{role}</span>
                <GripVertical className="text-muted-foreground/50" />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <div className="flex justify-center mt-12">
        <Button onClick={handleOrderContinue} size="lg" className="w-full max-w-xs">
          Confirm Order <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // STEP 3: COMPANY SELECTION
  const renderStep3 = () => (
    <div className="space-y-6 h-full flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Employer Recognition
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Which of the following employers do you recognise? Select all that apply.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto w-full">
        {state.displayedCompanies.map((company) => {
          const isSelected = state.selectedCompanies.includes(company);
          return (
            <div
              key={company}
              onClick={() => actions.toggleCompanySelection(company)}
              className={cn(
                "cursor-pointer rounded-lg p-3 border transition-all duration-200 flex items-center gap-3 select-none",
                isSelected 
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                  : "border-border bg-card hover:bg-secondary/50"
              )}
            >
               <div className={cn(
                "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/50"
              )}>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className={cn("text-sm font-medium leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                {company}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center mt-8 pb-8">
        <Button 
          onClick={handleCompanyContinue} 
          disabled={state.selectedCompanies.length === 0}
          size="lg"
          className="w-full max-w-xs"
        >
          Continue <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // STEP 4: PAIRWISE LOOP
  const renderStep4 = () => (
    <div className="flex flex-col h-full justify-center max-w-4xl mx-auto w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Your Preference
        </h2>
        <p className="text-lg text-muted-foreground">
          Which of these two would you prefer to work for?
        </p>
      </div>

      {activePair ? (
        <div className="grid md:grid-cols-2 gap-8 items-stretch mb-12">
           {/* Option A */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex flex-col h-full"
           >
             <button
                onClick={() => handlePairChoice(activePair[0])}
                className="group relative flex-1 bg-white border-2 border-border hover:border-primary hover:shadow-xl rounded-3xl p-8 transition-all duration-300 text-left flex flex-col items-center justify-center min-h-[240px]"
             >
                <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Option A</div>
                <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 group-hover:text-primary transition-colors">
                  {activePair[0]}
                </h3>
                <span className="mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Select this company →
                </span>
             </button>
           </motion.div>

           {/* VS Badge in middle (absolute on desktop, between on mobile) */}
           <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full items-center justify-center font-bold text-slate-300 shadow-sm border border-slate-100 z-10">
             VS
           </div>

           {/* Option B */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex flex-col h-full"
           >
             <button
                onClick={() => handlePairChoice(activePair[1])}
                className="group relative flex-1 bg-white border-2 border-border hover:border-primary hover:shadow-xl rounded-3xl p-8 transition-all duration-300 text-left flex flex-col items-center justify-center min-h-[240px]"
             >
                <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Option B</div>
                <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 group-hover:text-primary transition-colors">
                  {activePair[1]}
                </h3>
                <span className="mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Select this company →
                </span>
             </button>
           </motion.div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
           <span className="loading loading-spinner text-primary">Finding next pair...</span>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="secondary" onClick={() => handlePairChoice(null)}>
          Too hard, skip
        </Button>
        <Button variant="ghost" onClick={handleFinishSurvey} className="text-muted-foreground hover:text-foreground">
          Finish Survey
        </Button>
      </div>
    </div>
  );

  // STEP 5: FINAL RANKING
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Your Personal Shortlist
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          We've sorted these based on your preferences. Use the arrow buttons to make final adjustments.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-3 pb-8">
        {state.finalRanking.map((company, index) => (
          <motion.div 
            key={company}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg">
              {index + 1}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{company}</h3>
            </div>

            <div className="flex gap-1">
               <Button
                 variant="secondary" 
                 size="icon" 
                 className="h-8 w-8 rounded-lg"
                 disabled={index === 0}
                 onClick={() => moveRankItem(index, 'up')}
               >
                 <ArrowUp className="w-4 h-4" />
               </Button>
               <Button
                 variant="secondary" 
                 size="icon" 
                 className="h-8 w-8 rounded-lg"
                 disabled={index === state.finalRanking.length - 1}
                 onClick={() => moveRankItem(index, 'down')}
               >
                 <ArrowDown className="w-4 h-4" />
               </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mt-8 pb-12 gap-4">
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="mr-2 w-4 h-4" /> Start Over
        </Button>
        <Button 
          size="lg"
          className="px-12 bg-green-600 hover:bg-green-700 shadow-green-600/25"
          onClick={() => alert("Survey complete! In a real app, this would submit the data.")}
        >
          Submit Ranking
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl font-display">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-tight">SurveyFlow</span>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Career Preferences
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-8 md:py-12 px-4 md:px-8 max-w-6xl mx-auto w-full">
        {state.step <= 4 && (
          <StepIndicator currentStep={state.step} totalSteps={totalSteps} />
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex flex-col"
          >
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
            {state.step === 5 && renderStep5()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
