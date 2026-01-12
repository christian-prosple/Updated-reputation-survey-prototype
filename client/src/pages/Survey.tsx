import { useEffect, useMemo, useState } from "react";
import { useSurvey, ROLES, RoleType, CompanyEntity, DEGREES } from "@/hooks/use-survey";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button-custom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ChevronRight, ChevronLeft, GripVertical, CheckCircle2, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualCompany {
  name: string;
  role: string;
}

export default function SurveyPage() {
  const { state, actions, suggestedRoles } = useSurvey();
  const [activePair, setActivePair] = useState<[CompanyEntity, CompanyEntity] | null>(null);

  const [newCompany, setNewCompany] = useState<ManualCompany>({ name: "", role: ROLES[0] });
  const [isAdding, setIsAdding] = useState(false);
  const [showFullTaxonomy, setShowFullTaxonomy] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleAddManualCompany = () => {
    if (!newCompany.name.trim()) return;
    
    const entity: CompanyEntity = {
      name: newCompany.name.trim(),
      role: newCompany.role as RoleType,
      id: `manual-${Date.now()}-${newCompany.name.trim()}|${newCompany.role}`
    };
    
    actions.updateFinalRanking([entity, ...state.finalRanking]);
    setNewCompany({ name: "", role: ROLES[0] });
    setIsAdding(false);
  };

  // --- DERIVED STATE ---
  const totalSteps = 6; 

  const targetPairwiseCount = useMemo(() => {
    const n = state.selectedCompanies.length;
    if (n < 2) return 0;
    const maxPossible = (n * (n - 1)) / 2;
    return Math.min(20, maxPossible);
  }, [state.selectedCompanies.length]);

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

    const recentIds = state.comparisonHistory
      .slice(-3) // Look at last 3 comparisons
      .flatMap(h => h.pair);
    const recentIdSet = new Set(recentIds);

    // Simple random pair logic - try to find one not seen
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const idx1 = Math.floor(Math.random() * candidates.length);
      let idx2 = Math.floor(Math.random() * candidates.length);
      while (idx2 === idx1) idx2 = Math.floor(Math.random() * candidates.length);

      const a = candidates[idx1];
      const b = candidates[idx2];
      const key = [a.id, b.id].sort().join("|");

      if (!state.completedPairs.has(key)) {
        // If we have plenty of attempts left, try to avoid recently seen companies
        if (attempts < maxAttempts / 2 && (recentIdSet.has(a.id) || recentIdSet.has(b.id))) {
          attempts++;
          continue;
        }
        return [a, b] as [CompanyEntity, CompanyEntity];
      }
      attempts++;
    }
    return null; // Exhausted or too hard to find new random one
  };

  // --- EFFECT: Manage Pairwise Loop ---
  useEffect(() => {
    if (state.step === 4 && !activePair) {
      if (state.pairwiseCount >= targetPairwiseCount) {
        actions.nextStep();
        return;
      }
      
      const next = getNextPair();
      if (next) {
        setActivePair(next);
      } else {
        // No more pairs? Auto-advance to step 5
        actions.nextStep();
      }
    }
  }, [state.step, activePair, state.completedPairs, state.pairwiseCount, targetPairwiseCount]);


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

  const handlePairChoice = (winnerId: string | null) => {
    if (!activePair) return;
    const [a, b] = activePair;
    
    if (winnerId) {
      actions.recordWin(winnerId, [a.id, b.id]);
      actions.markPairSeen(a.id, b.id, false);
    } else {
      actions.markPairSeen(a.id, b.id, true);
    }
    
    // Reset active pair to trigger effect
    setActivePair(null);
  };

  const handleUndo = () => {
    const lastComparison = state.comparisonHistory[state.comparisonHistory.length - 1];
    if (lastComparison) {
      const [idA, idB] = lastComparison.pair;
      const compA = state.selectedCompanies.find(c => c.id === idA);
      const compB = state.selectedCompanies.find(c => c.id === idB);
      
      if (compA && compB) {
        setActivePair([compA, compB]);
      }
    }
    actions.undoLastComparison();
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

  // STEP 0: DEGREE SELECTION
  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
          Degree Study
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          What degree did you study or are currently studying? (Select all that apply)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {DEGREES.map((degree) => {
          const isSelected = state.selectedDegrees.includes(degree);
          return (
            <motion.div
              key={degree}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => actions.selectDegree(degree)}
              className={cn(
                "cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 flex items-center gap-4 group",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                  : "border-border bg-card hover:border-primary/50 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                isSelected ? "border-primary bg-primary text-slate-900" : "border-muted-foreground group-hover:border-primary"
              )}>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <span className={cn("font-medium", isSelected ? "text-slate-900" : "text-foreground")}>
                {degree}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mt-12 gap-4">
        <Button 
          onClick={() => actions.nextStep()} 
          disabled={state.selectedDegrees.length === 0}
          size="lg"
          className="w-full max-w-[160px]"
        >
          Continue <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // STEP 1: ROLE SELECTION
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
          Career Paths
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          What role/s or career path/s are you most interested in pursuing?
        </p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto w-full relative">
        {/* Search Bar with Selected Pills */}
        <div className="relative z-50">
          <div className={cn(
            "min-h-[56px] w-full p-2 bg-white border-2 rounded-2xl flex flex-wrap gap-2 items-center transition-all duration-200",
            (isSearchFocused || roleSearchQuery) ? "border-primary shadow-lg" : "border-slate-200 shadow-sm"
          )}>
            <div className="flex items-center pl-2">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            
            <AnimatePresence>
              {state.selectedRoles.map((role) => (
                <motion.div
                  key={role}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-primary/10 text-primary-foreground border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold group"
                >
                  <span className="text-slate-900">{role}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.selectRole(role);
                    }}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <input
              type="text"
              placeholder={state.selectedRoles.length === 0 ? "Search for roles..." : ""}
              value={roleSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none py-2 px-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Dropdown Results */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl max-h-[400px] overflow-hidden flex flex-col z-50"
              >
                <div className="overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {roleSearchQuery.length === 0 ? (
                    <>
                      {/* Suggested Section */}
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Suggested for you
                      </div>
                      {suggestedRoles.slice(0, 5).map((role) => {
                        const isSelected = state.selectedRoles.includes(role);
                        return (
                          <div
                            key={role}
                            onClick={() => actions.selectRole(role)}
                            className={cn(
                              "cursor-pointer rounded-xl p-3 flex items-center justify-between transition-colors",
                              isSelected ? "bg-primary/10" : "hover:bg-slate-50"
                            )}
                          >
                            <span className={cn("text-sm font-medium", isSelected ? "text-slate-900 font-bold" : "text-slate-600")}>
                              {role}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                        );
                      })}
                      
                      <div className="border-t my-2" />
                      
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        All Roles
                      </div>
                      {[...ROLES].sort().map((role) => {
                        if (suggestedRoles.slice(0, 5).includes(role)) return null;
                        const isSelected = state.selectedRoles.includes(role);
                        return (
                          <div
                            key={role}
                            onClick={() => actions.selectRole(role)}
                            className={cn(
                              "cursor-pointer rounded-xl p-3 flex items-center justify-between transition-colors",
                              isSelected ? "bg-primary/10" : "hover:bg-slate-50"
                            )}
                          >
                            <span className={cn("text-sm font-medium", isSelected ? "text-slate-900 font-bold" : "text-slate-600")}>
                              {role}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Search Results
                      </div>
                      {[...ROLES]
                        .sort()
                        .filter(role => role.toLowerCase().includes(roleSearchQuery.toLowerCase()))
                        .map((role) => {
                          const isSelected = state.selectedRoles.includes(role);
                          return (
                            <div
                              key={role}
                              onClick={() => actions.selectRole(role)}
                              className={cn(
                                "cursor-pointer rounded-xl p-3 flex items-center justify-between transition-colors",
                                isSelected ? "bg-primary/10" : "hover:bg-slate-50"
                              )}
                            >
                              <span className={cn("text-sm font-medium", isSelected ? "text-slate-900 font-bold" : "text-slate-600")}>
                                {role}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          );
                        })}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center mt-12 gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => actions.prevStep()}
          className="w-full max-w-[160px] text-slate-900 border-slate-200"
        >
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button 
          onClick={handleRoleContinue} 
          disabled={state.selectedRoles.length === 0}
          size="lg"
          className="w-full max-w-[160px]"
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
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
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

      <div className="flex justify-center mt-12 gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => actions.prevStep()}
          className="w-full max-w-[160px] text-slate-900 border-slate-200"
        >
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button onClick={handleOrderContinue} size="lg" className="w-full max-w-[200px]">
          Confirm Order <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // STEP 3: COMPANY SELECTION
  const renderStep3 = () => {
    // Get unique company names from displayed entities
    const uniqueCompanyNames = Array.from(new Set(state.displayedCompanies.map(c => c.name)));
    
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="text-center mb-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            Employer Recognition
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Which of the following employers do you recognise? Select all that apply.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto w-full">
          {uniqueCompanyNames.map((name) => {
            const isSelected = !!state.selectedCompanies.find(c => c.name === name);
            return (
              <div
                key={name}
                onClick={() => actions.toggleCompanySelection(name)}
                className={cn(
                  "cursor-pointer rounded-lg p-3 border transition-all duration-200 flex items-center gap-3 select-none",
                  isSelected 
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                    : "border-border bg-card hover:bg-secondary/50"
                )}
              >
                 <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                  isSelected ? "border-primary bg-primary text-slate-900" : "border-muted-foreground/50"
                )}>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={cn("text-sm font-bold leading-tight truncate", isSelected ? "text-slate-900" : "text-foreground")}>
                    {name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-8 pb-8 gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => actions.prevStep()}
            className="w-full max-w-[160px] text-slate-900 border-slate-200"
          >
            <ChevronLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button 
            onClick={handleCompanyContinue} 
            disabled={state.selectedCompanies.length === 0}
            size="lg"
            className="w-full max-w-[160px]"
          >
            Continue <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  // STEP 4: PAIRWISE LOOP
  const renderStep4 = () => (
    <div className="flex flex-col h-full justify-center max-w-4xl mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
          Company comparison
        </h2>
        <p className="text-lg text-muted-foreground">
          Which of these two would you prefer to work for?
        </p>
      </div>

      <div className="max-w-md mx-auto w-full mb-10 space-y-2">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          <span>Progress</span>
          <span>{state.pairwiseCount} / {targetPairwiseCount}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((state.pairwiseCount / targetPairwiseCount) * 100, 100)}%` }}
            className={cn(
              "h-full transition-colors duration-500",
              state.pairwiseCount >= targetPairwiseCount ? "bg-green-500" : "bg-primary"
            )}
          />
        </div>
      </div>

      {activePair ? (
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12 relative">
           {/* Option A */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex flex-col h-full w-full md:flex-1"
           >
             <button
                onClick={() => handlePairChoice(activePair[0].id)}
                className="group relative flex-1 bg-white border-2 border-border hover:border-primary hover:shadow-xl rounded-3xl p-8 transition-all duration-300 text-left flex flex-col items-center justify-center min-h-[240px]"
             >
                <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Option A</div>
                <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors">
                  {activePair[0].name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-tight">
                  {activePair[0].role}
                </p>
                <span className="mt-4 text-sm font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  Select this company →
                </span>
             </button>
           </motion.div>

           {/* VS Badge in middle */}
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-slate-300 shadow-sm border border-slate-100 z-10 flex-shrink-0">
             VS
           </div>

           {/* Option B */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex flex-col h-full w-full md:flex-1"
           >
             <button
                onClick={() => handlePairChoice(activePair[1].id)}
                className="group relative flex-1 bg-white border-2 border-border hover:border-primary hover:shadow-xl rounded-3xl p-8 transition-all duration-300 text-left flex flex-col items-center justify-center min-h-[240px]"
             >
                <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Option B</div>
                <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors">
                  {activePair[1].name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-tight">
                  {activePair[1].role}
                </p>
                <span className="mt-4 text-sm font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <div className="flex flex-col items-center gap-4">
        <Button variant="ghost" onClick={() => handlePairChoice(null)} className="text-muted-foreground">
          Too hard, skip this pair
        </Button>
        <div className="flex gap-4 w-full max-w-xs">
          {state.comparisonHistory.length > 0 && (
            <Button variant="outline" size="lg" className="flex-1" onClick={handleUndo}>
              Back
            </Button>
          )}
          <Button 
            variant={state.pairwiseCount >= targetPairwiseCount ? "primary" : "secondary"}
            size="lg"
            className={cn(
              "flex-[2] transition-all duration-300",
              state.pairwiseCount >= targetPairwiseCount ? "shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground"
            )}
            onClick={handleFinishSurvey}
          >
            {state.pairwiseCount >= targetPairwiseCount ? "Continue" : "Finish Early"}
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // STEP 5: FINAL RANKING
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
          Top Shortlist
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Based on your responses we have generated a draft shortlist for you. Drag to sort them in order of preference before submitting your final rankings
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-3 pb-4">
        <div className="flex justify-end mb-4">
          {!isAdding ? (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="text-slate-900 border-slate-200 hover:bg-slate-50">
              + Add another company
            </Button>
          ) : (
            <div className="bg-white border rounded-xl p-4 shadow-sm w-full space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                  <input 
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Enter company name..."
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Industry / Role</label>
                  <select 
                    value={newCompany.role}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, role: e.target.value as RoleType }))}
                    className="w-full p-2 border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none bg-white"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddManualCompany} disabled={!newCompany.name.trim()}>Add to List</Button>
              </div>
            </div>
          )}
        </div>

        <Reorder.Group axis="y" values={state.finalRanking} onReorder={actions.updateFinalRanking} className="space-y-3">
          {state.finalRanking.map((entity, index) => (
            <Reorder.Item key={entity.id} value={entity}>
              <div className="group bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-grab active:cursor-grabbing">
                <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{entity.name}</h3>
                  <p className="text-sm text-muted-foreground">{entity.role}</p>
                </div>

                <GripVertical className="text-muted-foreground/50" />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <div className="flex justify-center mt-8 pb-12 gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => actions.prevStep()}
          className="w-full max-w-[160px] text-slate-900 border-slate-200"
        >
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <Button 
          size="lg"
          className="px-12 bg-[#96D2C0] text-slate-900 hover:bg-[#85c1af] shadow-lg shadow-[#96D2C0]/20 font-bold"
          onClick={() => actions.nextStep()}
        >
          Submit Ranking
        </Button>
      </div>
    </div>
  );

  // STEP 6: THANK YOU
  const renderStep6 = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h2 className="text-4xl font-bold mb-4">Thank you for your response</h2>
      <p className="text-xl text-muted-foreground max-w-md mx-auto">
        Your career preferences have been recorded. We appreciate your time and insights.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#96D2C0] rounded-full flex items-center justify-center text-slate-800 font-bold text-xl font-display">
              P
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">Prosple</span>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Career Preferences
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-8 md:py-12 px-4 md:px-8 max-w-6xl mx-auto w-full">
        {state.step <= 5 && <StepIndicator currentStep={state.step} totalSteps={totalSteps} />}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex flex-col"
          >
            {state.step === 0 && renderStep0()}
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
            {state.step === 5 && renderStep5()}
            {state.step === 6 && renderStep6()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
