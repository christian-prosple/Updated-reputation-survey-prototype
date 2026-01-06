import { useState, useMemo } from 'react';

// --- DATA CONSTANTS ---
export const ROLES = [
  "Business, Commerce & Management",
  "Finance and Banking",
  "Law",
  "Management consulting",
  "Computer Science & Software Engineering",
  "Investment banking",
  "Accounting & Advisory"
] as const;

export type RoleType = typeof ROLES[number];

export const COMPANIES_BY_ROLE: Record<RoleType, string[]> = {
  "Business, Commerce & Management": ["Deloitte Australia", "Commonwealth Bank", "Macquarie Group", "SAP Australia", "Oracle Australia", "PKF Australia", "WSP Australia", "Carter Newell Australia", "Nexia Sydney", "Liberty Financial", "Accenture Australia and New Zealand", "Westpac Group", "L'Oréal Australia and New Zealand", "Accru Felsers", "BAE Systems Australia", "Lockheed Martin Australia", "Northrop Grumman Australia", "Qantas", "Linfox ANZ", "Western Power"],
  "Finance and Banking": ["Commonwealth Bank", "UBS Australia", "Goldman Sachs Australia", "Deloitte Australia", "PwC Australia", "NAB Australia", "Moody's Corporation Australia", "QBE Insurance Australia Pacific", "AustralianSuper", "Stanton Road Partners Australia", "Origin Energy Australia", "BASF Australia & New Zealand", "Nutrien Ag Solutions", "BlueScope Australia", "Chatham Financial", "Canopius Group Australia", "Moore Australia", "Pitcher Partners", "Qantas", "WiseTech Global"],
  "Law": ["Allens", "King & Wood Mallesons", "Herbert Smith Freehills Kramer", "Ashurst", "Clayton Utz", "Gilbert + Tobin", "MinterEllison", "Corrs Chambers Westgarth", "Baker McKenzie", "White & Case", "Arcadis Australia Pacific", "Safewill", "LIgold", "George Migration", "Weir Legal and Consulting", "Bendigo Health", "McCabes Lawyers", "K&L Gates", "Pinsent Masons", "RELX Australia"],
  "Management consulting": [
    "McKinsey & Company Australia",
    "Boston Consulting Group Australia",
    "Bain & Company Australia",
    "L.E.K. Consulting",
    "Oliver Wyman Australia & New Zealand",
    "EY-Parthenon Strategy (formerly EY Port Jackson Partners)",
    "OC&C Strategy Consultants Australia",
    "Altman Solon Australia",
    "Kearney",
    "Partners in Performance",
    "Nous Group",
    "Argon & Co",
    "Visagio",
    "NMG Consulting",
    "TSA Riley",
    "Escient",
    "Cognizant Australia",
    "Strategic Project Partners"
  ],
  "Computer Science & Software Engineering": [
    "Google AU",
    "Atlassian",
    "Jane Street",
    "Optiver",
    "IMC Trading Australia",
    "Canva",
    "Amazon AU",
    "Microsoft Australia",
    "Meta Australia",
    "Apple Australia",
    "Commonwealth Bank",
    "21CS Australia",
    "NTI Australia",
    "Kroolo",
    "NetApp Australia",
    "Crown Management Consultants",
    "simPRO",
    "Fontis Australia"
  ],
  "Investment banking": [
    "Goldman Sachs Australia",
    "Macquarie Group",
    "JPMorganChase Australia",
    "UBS Australia",
    "Morgan Stanley Australia",
    "Citi Group Australia",
    "Bank of America",
    "Barrenjoey (Barclays)",
    "Jefferies Australia",
    "Deutsche Bank",
    "Gresham",
    "Azure Capital (Natixis)",
    "Grant Samuel",
    "ICA Partners",
    "Stanton Road Partners Australia",
    "Flagstaff Partners",
    "Allier Capital",
    "Alchemist Capital Partners"
  ],
  "Accounting & Advisory": [
    "PwC Australia",
    "EY Australia",
    "KPMG Australia",
    "Deloitte Australia",
    "Australian Taxation Office (ATO)",
    "Grant Thornton Australia",
    "BDO Australia",
    "RSM Australia",
    "Kelly+Partners",
    "Byfields Business Advisers",
    "Fordham",
    "Altus Financial",
    "Abound Group",
    "Worrells",
    "Sage Advising",
    "Vincents Chartered Accountants",
    "BlueSky Accounting",
    "Scott Chartered Accountants"
  ]
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
  comparisonHistory: { winnerId: string | null; pair: [string, string] }[];
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
    comparisonHistory: [],
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
    
    // Group entities by company name
    const groupedByName: Record<string, CompanyEntity[]> = {};
    allEntities.forEach(entity => {
      if (!groupedByName[entity.name]) {
        groupedByName[entity.name] = [];
      }
      groupedByName[entity.name].push(entity);
    });

    const mandatoryCompanies: Record<string, string[]> = {
      "Management consulting": ["McKinsey & Company Australia", "Boston Consulting Group Australia", "Bain & Company Australia"],
      "Computer Science & Software Engineering": ["Google AU", "Atlassian", "Canva"],
      "Finance and Banking": ["Goldman Sachs Australia", "Commonwealth Bank"],
      "Law": ["Allens", "King & Wood Mallesons", "Herbert Smith Freehills Kramer", "Ashurst", "Clayton Utz", "Gilbert + Tobin"],
      "Investment banking": ["Goldman Sachs Australia", "Macquarie Group", "JPMorganChase Australia", "UBS Australia", "Morgan Stanley Australia"],
      "Accounting & Advisory": ["PwC Australia", "EY Australia", "KPMG Australia", "Deloitte Australia", "Australian Taxation Office (ATO)"]
    };

    const mandatoryNames = new Set<string>();
    state.selectedRoles.forEach(role => {
      if (mandatoryCompanies[role]) {
        mandatoryCompanies[role].forEach(name => mandatoryNames.add(name));
      }
    });

    const uniqueNames = Object.keys(groupedByName);
    const nonMandatoryNames = uniqueNames.filter(name => !mandatoryNames.has(name));

    // Shuffle non-mandatory names
    const shuffledNonMandatory = [...nonMandatoryNames].sort(() => Math.random() - 0.5);
    
    // Pick until we have 20 total including mandatory ones
    const finalSelection = Array.from(mandatoryNames).filter(name => uniqueNames.includes(name));
    const needed = 20 - finalSelection.length;
    
    if (needed > 0) {
      finalSelection.push(...shuffledNonMandatory.slice(0, needed));
    }

    // Shuffle the final selection so mandatory ones aren't always at the start
    const finalShuffled = [...finalSelection].sort(() => Math.random() - 0.5);
    
    // The pool contains ALL role-specific entities for those names
    const pool = finalShuffled.flatMap(name => groupedByName[name]);
    
    setState(prev => ({
      ...prev,
      displayedCompanies: pool,
      selectedCompanies: [],
      pairwiseWins: {},
      completedPairs: new Set(),
      pairwiseCount: 0,
      finalRanking: []
    }));
  };

  const toggleCompanySelection = (name: string) => {
    setState(prev => {
      // Find all entities with this name
      const entitiesWithName = prev.displayedCompanies.filter(c => c.name === name);
      const firstEntityId = entitiesWithName[0]?.id;
      const isCurrentlySelected = prev.selectedCompanies.some(c => c.id === firstEntityId);

      let nextSelected: CompanyEntity[];
      if (isCurrentlySelected) {
        // Remove all entities with this name
        nextSelected = prev.selectedCompanies.filter(c => c.name !== name);
      } else {
        // Add all entities with this name
        nextSelected = [...prev.selectedCompanies, ...entitiesWithName];
      }

      return {
        ...prev,
        selectedCompanies: nextSelected
      };
    });
  };

  const recordWin = (winnerId: string, pair: [string, string]) => {
    setState(prev => {
      const currentScore = prev.pairwiseWins[winnerId] || 0;
      return {
        ...prev,
        pairwiseWins: { ...prev.pairwiseWins, [winnerId]: currentScore + 1 },
        comparisonHistory: [...prev.comparisonHistory, { winnerId, pair }]
      };
    });
  };

  const markPairSeen = (idA: string, idB: string, skip: boolean = false) => {
    setState(prev => {
      const key = [idA, idB].sort().join("|");
      const nextState = {
        ...prev,
        completedPairs: new Set(prev.completedPairs).add(key),
        pairwiseCount: prev.pairwiseCount + 1
      };
      
      if (skip) {
        nextState.comparisonHistory = [...prev.comparisonHistory, { winnerId: null, pair: [idA, idB] }];
      }
      
      return nextState;
    });
  };

  const undoLastComparison = () => {
    setState(prev => {
      if (prev.comparisonHistory.length === 0) return prev;
      
      const last = prev.comparisonHistory[prev.comparisonHistory.length - 1];
      const newHistory = prev.comparisonHistory.slice(0, -1);
      const newWins = { ...prev.pairwiseWins };
      
      if (last.winnerId) {
        newWins[last.winnerId] = Math.max(0, (newWins[last.winnerId] || 1) - 1);
      }
      
      const key = [...last.pair].sort().join("|");
      const newCompleted = new Set(prev.completedPairs);
      newCompleted.delete(key);
      
      return {
        ...prev,
        pairwiseWins: newWins,
        completedPairs: newCompleted,
        comparisonHistory: newHistory,
        pairwiseCount: Math.max(0, prev.pairwiseCount - 1)
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
           return { ...prev, step: 3, roleOrder: prev.selectedRoles };
        }
        // If >1 role, initialize order with selection order
        return { ...prev, step: 2, roleOrder: prev.selectedRoles };
      }

      // Cap at step 6 (Thank You)
      return { ...prev, step: Math.min(next, 6) };
    });
  };
  
  // Custom setter for specific logic needs
  const setStep = (step: number) => setState(prev => ({ ...prev, step }));

  const prevStep = () => {
    setState(prev => {
      // Logic to reverse the skip from step 1 to 3
      if (prev.step === 3 && prev.selectedRoles.length <= 1) {
        return { ...prev, step: 1 };
      }
      return { ...prev, step: Math.max(1, prev.step - 1) };
    });
  };

  return {
    state,
    actions: {
      selectRole,
      reorderRoles,
      generateCompanyPool,
      toggleCompanySelection,
      recordWin,
      markPairSeen,
      undoLastComparison,
      generateFinalRanking,
      updateFinalRanking,
      nextStep,
      prevStep,
      setStep,
    }
  };
}
