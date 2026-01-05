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
export interface CompanyEntity {
  name: string;
  role: RoleType;
  id: string; // e.g. "Commonwealth Bank|Finance and Banking"
}

export interface SurveyState {
  step: number;
  selectedRoles: RoleType[];
  roleOrder: RoleType[];
  displayedCompanies: CompanyEntity[]; // Unique entities
  selectedCompanies: CompanyEntity[]; // Unique entities
  pairwiseWins: Record<string, number>; // Use ID
  completedPairs: Set<string>; // "ID1|ID2"
  pairwiseCount: number; // New counter
  finalRanking: CompanyEntity[]; 
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
    pairwiseCount: 0,
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
    // 1. Gather all unique company-role pairs
    const allEntities: CompanyEntity[] = [];
    state.selectedRoles.forEach(role => {
      COMPANIES_BY_ROLE[role].forEach(name => {
        allEntities.push({
          name,
          role,
          id: `${name}|${role}`
        });
      });
    });
    
    // 2. Shuffle
    const shuffled = [...allEntities].sort(() => 0.5 - Math.random());
    
    // 3. Take first 20
    const displayedCompanies = shuffled.slice(0, 20);
    
    setState(prev => ({ ...prev, displayedCompanies }));
  };

  const toggleCompanySelection = (entity: CompanyEntity) => {
    setState(prev => {
      const exists = prev.selectedCompanies.find(c => c.id === entity.id);
      const nextCompanies = exists
        ? prev.selectedCompanies.filter(c => c.id !== entity.id)
        : [...prev.selectedCompanies, entity];
      return { ...prev, selectedCompanies: nextCompanies };
    });
  };

  const recordWin = (winnerId: string) => {
    setState(prev => {
      const currentScore = prev.pairwiseWins[winnerId] || 0;
      return {
        ...prev,
        pairwiseWins: { ...prev.pairwiseWins, [winnerId]: currentScore + 1 }
      };
    });
  };

  const markPairSeen = (idA: string, idB: string) => {
    setState(prev => {
      const key = [idA, idB].sort().join("|");
      return {
        ...prev,
        completedPairs: new Set(prev.completedPairs).add(key),
        pairwiseCount: prev.pairwiseCount + 1
      };
    });
  };

  const generateFinalRanking = () => {
    const sorted = [...state.selectedCompanies].sort((a, b) => {
      const scoreA = state.pairwiseWins[a.id] || 0;
      const scoreB = state.pairwiseWins[b.id] || 0;
      return scoreB - scoreA;
    });
    setState(prev => ({ ...prev, finalRanking: sorted }));
  };
  
  const updateFinalRanking = (newRanking: CompanyEntity[]) => {
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
