import { useState, useMemo } from 'react';

// --- DATA CONSTANTS ---
export const ROLES = [
  "Business, Commerce & Management",
  "Finance and Banking",
  "Law"
] as const;

export type RoleType = typeof ROLES[number];

export const COMPANIES_BY_ROLE: Record<RoleType, string[]> = {
  "Business, Commerce & Management": ["Deloitte Australia", "Commonwealth Bank", "Macquarie Group", "SAP Australia", "Oracle Australia", "PKF Australia", "WSP Australia", "Carter Newell Australia", "Nexia Sydney", "Liberty Financial", "Accenture Australia and New Zealand", "Westpac Group", "L'Oréal Australia and New Zealand", "Accru Felsers", "BAE Systems Australia", "Lockheed Martin Australia", "Northrop Grumman Australia", "Qantas", "Linfox ANZ", "Western Power"],
  "Finance and Banking": ["Commonwealth Bank", "UBS Australia", "Goldman Sachs Australia", "Deloitte Australia", "PwC Australia", "NAB Australia", "Moody's Corporation Australia", "QBE Insurance Australia Pacific", "AustralianSuper", "Stanton Road Partners Australia", "Origin Energy Australia", "BASF Australia & New Zealand", "Nutrien Ag Solutions", "BlueScope Australia", "Chatham Financial", "Canopius Group Australia", "Moore Australia", "Pitcher Partners", "Qantas", "WiseTech Global"],
  "Law": ["Allens", "King & Wood Mallesons", "Herbert Smith Freehills Kramer", "Ashurst", "Clayton Utz", "Gilbert + Tobin", "MinterEllison", "Corrs Chambers Westgarth", "Baker McKenzie", "White & Case", "Arcadis Australia Pacific", "Safewill", "LIgold", "George Migration", "Weir Legal and Consulting", "Bendigo Health", "McCabes Lawyers", "K&L Gates", "Pinsent Masons", "RELX Australia"]
};

// --- TYPES ---
export interface SurveyState {
  step: number;
  selectedRoles: RoleType[];
  roleOrder: RoleType[];
  displayedCompanies: string[]; // The pool of 20 random companies
  selectedCompanies: string[]; // The subset recognized by user
  pairwiseWins: Record<string, number>; // "CompanyName": count
  completedPairs: Set<string>; // "A|B" to track history
  finalRanking: string[]; // Final sorted list
}

// --- HOOK ---
export function useSurvey() {
  const [state, setState] = useState<SurveyState>({
    step: 1,
    selectedRoles: [],
    roleOrder: [],
    displayedCompanies: [],
    selectedCompanies: [],
    pairwiseWins: {},
    completedPairs: new Set(),
    finalRanking: [],
  });

  // --- ACTIONS ---

  const selectRole = (role: RoleType) => {
    setState(prev => {
      const exists = prev.selectedRoles.includes(role);
      const nextRoles = exists
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role];
      return { ...prev, selectedRoles: nextRoles };
    });
  };

  const reorderRoles = (newOrder: RoleType[]) => {
    setState(prev => ({ ...prev, roleOrder: newOrder }));
  };

  const generateCompanyPool = () => {
    // 1. Gather all unique companies from selected roles
    const allCompanies = new Set<string>();
    state.selectedRoles.forEach(role => {
      COMPANIES_BY_ROLE[role].forEach(company => allCompanies.add(company));
    });
    
    // 2. Convert to array and shuffle
    const companyList = Array.from(allCompanies);
    const shuffled = [...companyList].sort(() => 0.5 - Math.random());
    
    // 3. Take first 20 (or fewer if not enough unique companies)
    const displayedCompanies = shuffled.slice(0, 20);
    
    setState(prev => ({ ...prev, displayedCompanies }));
  };

  const toggleCompanySelection = (company: string) => {
    setState(prev => {
      const exists = prev.selectedCompanies.includes(company);
      const nextCompanies = exists
        ? prev.selectedCompanies.filter(c => c !== company)
        : [...prev.selectedCompanies, company];
      return { ...prev, selectedCompanies: nextCompanies };
    });
  };

  const recordWin = (winner: string) => {
    setState(prev => {
      const currentScore = prev.pairwiseWins[winner] || 0;
      return {
        ...prev,
        pairwiseWins: { ...prev.pairwiseWins, [winner]: currentScore + 1 }
      };
    });
  };

  const markPairSeen = (a: string, b: string) => {
    setState(prev => {
      // Create canonical key for the pair
      const key = [a, b].sort().join("|");
      return {
        ...prev,
        completedPairs: new Set(prev.completedPairs).add(key)
      };
    });
  };

  const generateFinalRanking = () => {
    const sorted = [...state.selectedCompanies].sort((a, b) => {
      const scoreA = state.pairwiseWins[a] || 0;
      const scoreB = state.pairwiseWins[b] || 0;
      return scoreB - scoreA; // Descending
    });
    setState(prev => ({ ...prev, finalRanking: sorted }));
  };
  
  const updateFinalRanking = (newRanking: string[]) => {
    setState(prev => ({ ...prev, finalRanking: newRanking }));
  };

  const nextStep = () => {
    setState(prev => {
      const next = prev.step + 1;
      
      // LOGIC GATES FOR STEP TRANSITIONS
      if (prev.step === 1) {
        // If only 1 role, skip reordering (step 2) and go to 3
        if (prev.selectedRoles.length <= 1) {
           // We need to trigger this side effect properly. 
           // In a real app we might use useEffect, but here we can just chain logic.
           // However, generating company pool depends on state update.
           // Better to let component handle side effect or update state atomically.
           return { ...prev, step: 3, roleOrder: prev.selectedRoles };
        }
        // If >1 role, initialize order with selection order
        return { ...prev, step: 2, roleOrder: prev.selectedRoles };
      }

      return { ...prev, step: next };
    });
  };
  
  // Custom setter for specific logic needs
  const setStep = (step: number) => setState(prev => ({ ...prev, step }));

  return {
    state,
    actions: {
      selectRole,
      reorderRoles,
      generateCompanyPool,
      toggleCompanySelection,
      recordWin,
      markPairSeen,
      generateFinalRanking,
      updateFinalRanking,
      nextStep,
      setStep,
    }
  };
}
