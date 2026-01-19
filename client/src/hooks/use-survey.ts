import { useState, useMemo } from 'react';

// --- DATA CONSTANTS ---
export const DEGREES = [
  "Business & Management",
  "Creative Arts",
  "Engineering & Mathematics",
  "Food, Hospitality & Personal Services",
  "Humanities, Arts, & Social Sciences",
  "IT & Computer Science",
  "Law, Legal Studies & Justice",
  "Medicine & Health Sciences",
  "Property & Built Environment",
  "Sciences",
  "Teaching & Education",
  "Other"
] as const;

export type DegreeType = typeof DEGREES[number];

export const ROLES = [
  "Accounting & Advisory",
  "Actuarial Studies, Insurance & Risk",
  "Aerospace Engineering & Aviation",
  "Agriculture & Agribusiness",
  "Animation & VFX",
  "Archaeology & History",
  "Architecture",
  "Artificial Intelligence & Machine Learning",
  "Biology & Biochemistry",
  "Biomedical Engineering & Sciences",
  "Business, Commerce & Management",
  "Chemical & Process Engineering",
  "Chemistry",
  "Civil & Structural Engineering",
  "Communications & Public Relations",
  "Computer Science & Software Engineering",
  "Construction Management",
  "Creative, Performing & Visual Arts",
  "Criminology & Forensic Science",
  "Customer Success & Client Services",
  "Cybersecurity",
  "Data Science & Analytics",
  "Design & User Experience",
  "Economics",
  "Education & Teaching",
  "Electrical & Electronic Engineering",
  "Environment & Sustainability",
  "Environmental Engineering",
  "Events, Tourism & Hospitality",
  "Exercise & Sport Sciences",
  "Fashion",
  "Film & TV Production",
  "Finance & Banking",
  "Food Science & Technology",
  "Game Design & Development",
  "Geology & Earth Sciences",
  "Geospatial & GIS",
  "Geotechnical Engineering",
  "Government & Public Administration",
  "Healthcare Administration & Management",
  "HR & Recruitment",
  "Information Technology",
  "Intelligence & National Security",
  "Interior Design",
  "International Development & NGOs",
  "Investment Banking",
  "Language & Linguistics",
  "Law",
  "Management Consulting",
  "Manufacturing and Industrial Engineering",
  "Marketing",
  "Materials Engineering",
  "Mathematics & Statistics",
  "Mechanical & Mechatronic Engineering",
  "Medicine",
  "Midwifery",
  "Mining & Resources Engineering",
  "Music & Audio Production",
  "Network & Telecommunications Engineering",
  "Nursing",
  "Nutrition & Dietetics",
  "Occupational Health & Safety",
  "Pharmacy & Pharmaceuticals",
  "Physics",
  "Physiotherapy & Occupational Therapy",
  "Policy & International Relations",
  "Private Equity & Hedge funds",
  "Product Management",
  "Project Management",
  "Property Development & Management",
  "Psychology & Counselling",
  "Public Health",
  "Sales & Business Development",
  "Social Work",
  "Supply Chain & Logistics",
  "Surveying",
  "Trading",
  "Urban Planning",
  "Venture Capital",
  "Veterinary Science",
  "Writing, Journalism & Publishing",
  "Zoology"
] as const;

export type RoleType = typeof ROLES[number];

export const DEGREE_TO_ROLES: Record<DegreeType, RoleType[]> = {
  "Business & Management": ["Business, Commerce & Management", "Finance & Banking", "Marketing", "Management Consulting", "HR & Recruitment", "Project Management", "Supply Chain & Logistics", "Accounting & Advisory", "Investment Banking"],
  "Creative Arts": ["Animation & VFX", "Creative, Performing & Visual Arts", "Design & User Experience", "Fashion", "Film & TV Production", "Music & Audio Production", "Writing, Journalism & Publishing"],
  "Engineering & Mathematics": ["Aerospace Engineering & Aviation", "Biomedical Engineering & Sciences", "Chemical & Process Engineering", "Civil & Structural Engineering", "Electrical & Electronic Engineering", "Environmental Engineering", "Geotechnical Engineering", "Manufacturing and Industrial Engineering", "Materials Engineering", "Mechanical & Mechatronic Engineering", "Mining & Resources Engineering", "Mathematics & Statistics"],
  "Food, Hospitality & Personal Services": ["Events, Tourism & Hospitality", "Food Science & Technology", "Nutrition & Dietetics"],
  "Humanities, Arts, & Social Sciences": ["Archaeology & History", "Communications & Public Relations", "Economics", "Government & Public Administration", "International Development & NGOs", "Language & Linguistics", "Policy & International Relations", "Psychology & Counselling", "Social Work", "Writing, Journalism & Publishing"],
  "IT & Computer Science": ["Artificial Intelligence & Machine Learning", "Computer Science & Software Engineering", "Cybersecurity", "Data Science & Analytics", "Information Technology", "Game Design & Development", "Network & Telecommunications Engineering", "Product Management"],
  "Law, Legal Studies & Justice": ["Law", "Criminology & Forensic Science", "Intelligence & National Security", "Government & Public Administration"],
  "Medicine & Health Sciences": ["Medicine", "Nursing", "Midwifery", "Pharmacy & Pharmaceuticals", "Physiotherapy & Occupational Therapy", "Public Health", "Exercise & Sport Sciences", "Healthcare Administration & Management"],
  "Property & Built Environment": ["Architecture", "Construction Management", "Interior Design", "Property Development & Management", "Surveying", "Urban Planning"],
  "Sciences": ["Biology & Biochemistry", "Chemistry", "Geology & Earth Sciences", "Physics", "Zoology", "Veterinary Science", "Environment & Sustainability", "Geospatial & GIS"],
  "Teaching & Education": ["Education & Teaching"],
  "Other": []
};

export const COMPANIES_BY_ROLE: Record<string, string[]> = {
  "Product Management": ["Canva", "Atlassian Australia", "Airwallex", "TikTok Australia & New Zealand", "Microsoft Australia", "Macquarie Group", "Commonwealth Bank", "ZipCo", "Westpac Group", "HelloFresh", "Planet Innovation", "Luxury Escapes", "Telstra", "Vow"],
  "Design & User Experience": ["Canva", "Atlassian Australia", "Airwallex", "TikTok Australia & New Zealand", "Microsoft Australia", "Macquarie Group", "Commonwealth Bank", "ZipCo", "Westpac Group", "HelloFresh", "Planet Innovation", "Luxury Escapes", "Telstra", "Vow"],
  "Accounting & Advisory": ["PwC Australia", "EY Australia", "KPMG Australia", "Deloitte Australia", "BDO Australia", "Grant Thornton Australia", "RSM Australia", "Pitcher Partners", "Grant Samuel", "McGrathNicol", "KordaMentha", "FTI Consulting", "Crowe Australia", "Moore Australia"],
  "Finance & Banking": ["Commonwealth Bank", "NAB Australia", "Westpac Group", "ANZ Bank", "Macquarie Group", "Reserve Bank of Australia", "Australian Taxation Office (ATO)", "AustralianSuper", "AMP", "Munich Re", "Swiss Re Australia", "RGA", "JPMorganChase Australia"],
  "Law": ["Allens", "King & Wood Mallesons", "Herbert Smith Freehills", "Ashurst", "Clayton Utz", "Gilbert + Tobin", "MinterEllison", "Corrs Chambers Westgarth", "Baker McKenzie", "White & Case", "K&L Gates", "Pinsent Masons"],
  "Management Consulting": ["McKinsey & Company Australia", "Boston Consulting Group Australia", "Bain & Company Australia", "Accenture Australia", "Kearney", "Oliver Wyman", "L.E.K. Consulting", "EY-Parthenon", "OC&C Strategy Consultants", "Altman Solon Australia", "Partners in Performance", "Nous Group", "Strategy&", "Publicis Sapient"],
  "Computer Science & Software Engineering": ["Google AU", "Atlassian", "Canva", "Microsoft Australia", "Amazon AU", "Jane Street", "Optiver", "Meta Australia", "Apple Australia", "TikTok Australia & New Zealand", "Xero Australia", "Salesforce Australia", "Adobe AU", "IBM Australia", "Dell Technologies", "WiseTech Global", "CyberCX", "Quantium"],
  "Investment Banking": ["Goldman Sachs Australia", "Macquarie Group", "JPMorganChase Australia", "UBS Australia", "Morgan Stanley Australia", "Citi Group Australia", "Bank of America", "Barrenjoey (Barclays)", "Jefferies Australia", "Deutsche Bank", "Gresham", "Azure Capital (Natixis)"],
  "Data Science & Analytics": ["Quantium", "Palantir Australia", "Google AU", "Commonwealth Bank", "CSIRO", "Taylor Fry", "Finity Consulting", "Rice Warner", "Munich Re"],
  "Marketing": ["L'Oréal Australia", "Procter & Gamble", "Unilever", "Google AU", "Canva", "Ogilvy Australia", "Leo Burnett Australia", "Disney Studios Australia", "NBCUniversal Australia", "Village Roadshow Theme Parks", "Paramount Australia & New Zealand", "Octagon"],
  "Aerospace Engineering & Aviation": ["Lockheed Martin", "Boeing Australia", "Airbus Australia", "Raytheon", "Northrop Grumman Australia", "BAE Systems Australia", "Qantas", "ADF Careers", "Thales Australia", "QinetiQ Australia", "Nova Systems", "ASC", "CAE Australia", "Rohde & Schwarz Australia"],
  "Construction Management": ["Lendlease", "Multiplex Australia", "Mirvac", "John Holland", "CPB Contractors AU", "AECOM", "Laing O'Rourke", "Downer Group", "Bechtel Australia", "Custom Built New Homes & Renovations", "Built"],
  "Environment & Sustainability": ["CSIRO", "Umwelt Australia", "Ecology & Heritage Partners", "Urbis", "Department of Transport and Main Roads", "Sunshine Coast Council (SCC)", "SLR Consulting", "GHD", "Worley", "Hydro Tasmania", "Clean Energy Regulator"],
  "Architecture": ["BVN", "Woods Bagot", "Cox Architecture", "Hassell", "Architectus", "HDR", "Rothelowman Australia", "Hayball", "Gray Puksand", "DesignInc Australia", "i2C Architects", "Urbis", "Stantec Australia"],
  "Education & Teaching": ["Teach For Australia", "Department of Education", "University of Sydney", "Haileybury College", "International Grammar School", "Goodstart Early Learning", "Only About Children", "G8 Education", "Carlile Swimming", "Aquabliss Swim School"],
  "Medicine": ["CSIRO", "CSL", "Thermo Fisher Scientific Australia", "Cochlear", "GSK Australia", "ResMed", "Bayer Australia", "Medtronic Australia", "Stryker Australia", "Johnson & Johnson Australia", "GE HealthCare Australia", "Pfizer Australia", "AstraZeneca Australia", "Novartis", "Roche Australia", "Garvan Institute of Medical Research", "Viatris Australia"],
  "Mining & Resources Engineering": ["Rio Tinto", "BHP", "BHP Australia", "Fortescue", "Rio Tinto", "Woodside Energy", "Chevron Australia", "Glencore", "Santos", "Orica", "INPEX Australia", "Shell", "ExxonMobil", "Alcoa Australia", "Iluka Resources"],
  "Agriculture & Agribusiness": ["John Deere", "Cargill Australia", "GrainCorp Australia", "JBS Australia", "Department of Agriculture, Fisheries and Forestry (DAFF)", "Department of Primary Industries (Queensland)", "Nutrien Ag Solutions", "Elders", "Costa Australia", "Treasury Wine Estates", "Warakirri Asset Management", "Delta Agribusiness Group"],
  "Animation & VFX": ["Animal Logic", "Weta FX", "DNEG", "Rising Sun Pictures", "Electronic Arts (EA)", "Activision Australia", "Disney Australia", "Paramount Australia & New Zealand", "Bus Stop Films", "3D Walkabout"]
};

// Proxied to handle missing roles gracefully
const SAFE_COMPANIES_BY_ROLE = new Proxy(COMPANIES_BY_ROLE, {
  get: (target, prop: string) => target[prop] || ["Deloitte Australia", "Accenture Australia", "PwC Australia", "EY Australia", "KPMG Australia"]
});

// Filler companies to reach 30 total - assigned random roles from user's selection
export const FILLER_COMPANIES = [
  "Insurance Commission of Western Australia",
  "Bottrell Business Consultants Australia",
  "Lagardere AWPL",
  "Ebury Australia",
  "O'Brien",
  "Novartis",
  "Hewlett Packard Enterprise (HPE)",
  "Kennedy Cross Australia",
  "Corporate Carbon Australia",
  "The Alternative",
  "Tyroola Australia",
  "FDM Group Australia",
  "Delta Agribusiness Group",
  "Pinnacle Rehab Australia",
  "PaidRight Australia",
  "The RepTrak Company Australia",
  "ClearScore Australia",
  "Legrand Australia",
  "JLL Australia",
  "Wilcorp",
  "Dodgshun Medlin Australia"
];

// Create a master list of all unique company names
export const ALL_COMPANY_NAMES: string[] = Array.from(new Set([
  ...FILLER_COMPANIES,
  ...Object.values(COMPANIES_BY_ROLE).flat()
])).sort();

// --- TYPES ---
export const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;
export type GenderType = typeof GENDERS[number] | string;

export const EDUCATION_STATUSES = ["Studying", "Graduated", "Neither"] as const;
export type EducationStatusType = typeof EDUCATION_STATUSES[number];

export interface PersonalInfo {
  email: string;
  gender: GenderType;
  customGender: string;
  educationStatus: EducationStatusType | "";
  graduationMonth: string;
  graduationYear: string;
  country: string;
  university: string;
}

export interface CompanyEntity {
  name: string;
  role: RoleType;
  id: string; // e.g. "Commonwealth Bank|Finance and Banking"
}

export interface SurveyState {
  step: number;
  personalInfo: PersonalInfo;
  selectedDegrees: DegreeType[];
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
    step: 0,
    personalInfo: {
      email: "",
      gender: "",
      customGender: "",
      educationStatus: "",
      graduationMonth: "",
      graduationYear: "",
      country: "",
      university: ""
    },
    selectedDegrees: [],
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

  const selectDegree = (degree: DegreeType) => {
    setState(prev => {
      const exists = prev.selectedDegrees.includes(degree);
      const nextDegrees = exists
        ? prev.selectedDegrees.filter(d => d !== degree)
        : [...prev.selectedDegrees, degree];
      return { ...prev, selectedDegrees: nextDegrees };
    });
  };

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
    // Guard: need at least one role selected
    if (state.selectedRoles.length === 0) {
      return;
    }

    // Mandatory companies for specific roles
    const mandatoryCompanies: Record<string, string[]> = {
      "Management Consulting": ["McKinsey & Company Australia", "Boston Consulting Group Australia", "Bain & Company Australia"],
      "Computer Science & Software Engineering": ["Google AU", "Atlassian", "Canva"],
      "Finance & Banking": ["Commonwealth Bank", "NAB Australia", "Westpac Group", "ANZ Bank", "Macquarie Group"],
      "Law": ["Allens", "King & Wood Mallesons", "Herbert Smith Freehills", "Ashurst", "Clayton Utz", "Gilbert + Tobin"],
      "Investment Banking": ["Goldman Sachs Australia", "Macquarie Group", "JPMorganChase Australia", "UBS Australia", "Morgan Stanley Australia"],
      "Accounting & Advisory": ["PwC Australia", "EY Australia", "KPMG Australia", "Deloitte Australia"],
      "Product Management": ["Canva", "Atlassian Australia", "Airwallex", "Microsoft Australia"],
      "Design & User Experience": ["Canva", "Atlassian Australia", "Airwallex", "Microsoft Australia"],
      "Mining & Resources Engineering": ["BHP", "Rio Tinto", "Woodside Energy"],
      "Medicine": ["CSIRO", "CSL", "Cochlear"],
      "Architecture": ["BVN", "Woods Bagot", "Cox Architecture"],
      "Engineering & Mathematics": ["Boeing Australia", "BHP", "Rio Tinto", "Arup Australia", "GHD"],
      "Animation & VFX": ["Animal Logic", "Weta FX", "Disney Australia"]
    };

    // 1. Gather mandatory company entities with their specific roles
    const mandatoryEntities: CompanyEntity[] = [];
    const usedNames = new Set<string>();
    
    state.selectedRoles.forEach(role => {
      if (mandatoryCompanies[role]) {
        mandatoryCompanies[role].forEach(name => {
          if (!usedNames.has(name)) {
            usedNames.add(name);
            mandatoryEntities.push({
              name,
              role,
              id: `${name}|${role}`
            });
          }
        });
      }
    });

    // 2. Calculate how many filler companies we need
    let needed = 30 - mandatoryEntities.length;
    const fillerEntities: CompanyEntity[] = [];
    
    // 3. First use the 21 filler companies
    const shuffledFillers = [...FILLER_COMPANIES].sort(() => Math.random() - 0.5);
    shuffledFillers.forEach((name, index) => {
      if (needed > 0 && !usedNames.has(name)) {
        usedNames.add(name);
        const role = state.selectedRoles[index % state.selectedRoles.length];
        fillerEntities.push({
          name,
          role,
          id: `${name}|${role}`
        });
        needed--;
      }
    });

    // 4. If still need more, draw from role-based companies
    if (needed > 0) {
      const roleCompanies: string[] = [];
      state.selectedRoles.forEach(role => {
        const companies = SAFE_COMPANIES_BY_ROLE[role];
        companies.forEach((name: string) => {
          if (!usedNames.has(name)) {
            roleCompanies.push(name);
          }
        });
      });
      
      const shuffledRoleCompanies = Array.from(new Set(roleCompanies)).sort(() => Math.random() - 0.5);
      shuffledRoleCompanies.slice(0, needed).forEach((name, index) => {
        usedNames.add(name);
        const role = state.selectedRoles[index % state.selectedRoles.length];
        fillerEntities.push({
          name,
          role,
          id: `${name}|${role}`
        });
      });
    }

    // 5. Combine mandatory + fillers and ensure exactly 30
    const allEntities = [...mandatoryEntities, ...fillerEntities];
    
    // Cap at 30 if we somehow have more (e.g., many mandatory companies from multiple roles)
    const cappedEntities = allEntities.slice(0, 30);
    
    // Shuffle the final pool
    const shuffledPool = cappedEntities.sort(() => Math.random() - 0.5);
    
    setState(prev => ({
      ...prev,
      displayedCompanies: shuffledPool,
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

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setState(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const nextStep = () => {
    setState(prev => {
      const next = prev.step + 1;
      
      // LOGIC GATES FOR STEP TRANSITIONS
      // Step 2 is role selection - if only 1 role, skip reordering (step 3) and go to 4
      if (prev.step === 2) {
        if (prev.selectedRoles.length <= 1) {
           return { ...prev, step: 4, roleOrder: prev.selectedRoles };
        }
        // If >1 role, initialize order with selection order
        return { ...prev, step: 3, roleOrder: prev.selectedRoles };
      }

      // Cap at step 7 (Thank You)
      return { ...prev, step: Math.min(next, 7) };
    });
  };
  
  // Custom setter for specific logic needs
  const setStep = (step: number) => setState(prev => ({ ...prev, step }));

  const prevStep = () => {
    setState(prev => {
      // Logic to reverse the skip from step 2 to 4
      if (prev.step === 4 && prev.selectedRoles.length <= 1) {
        return { ...prev, step: 2 };
      }
      return { ...prev, step: Math.max(0, prev.step - 1) };
    });
  };

  const suggestedRoles = useMemo(() => {
    const rolesPerDegree: Record<string, RoleType[]> = {};
    state.selectedDegrees.forEach(degree => {
      rolesPerDegree[degree] = [...DEGREE_TO_ROLES[degree]];
    });

    // Explicitly handle "Law" if "Law, Legal Studies & Justice" is selected
    if (state.selectedDegrees.includes("Law, Legal Studies & Justice")) {
      if (!rolesPerDegree["Law, Legal Studies & Justice"]) {
        rolesPerDegree["Law, Legal Studies & Justice"] = [];
      }
      if (!rolesPerDegree["Law, Legal Studies & Justice"].includes("Law")) {
        rolesPerDegree["Law, Legal Studies & Justice"].push("Law");
      }
    }

    const finalRoles: RoleType[] = [];
    const degrees = Object.keys(rolesPerDegree);
    
    if (degrees.length > 0) {
      // Round-robin selection to ensure even mix across degrees
      let hasMore = true;
      let degreeIdx = 0;
      const pointers: Record<string, number> = {};
      degrees.forEach(d => pointers[d] = 0);

      while (finalRoles.length < 10 && hasMore) {
        hasMore = false;
        for (const degree of degrees) {
          const roles = rolesPerDegree[degree];
          const ptr = pointers[degree];
          if (ptr < roles.length) {
            const role = roles[ptr];
            if (!finalRoles.includes(role)) {
              finalRoles.push(role);
            }
            pointers[degree]++;
            hasMore = true;
          }
          if (finalRoles.length >= 10) break;
        }
      }
    }

    return finalRoles; // Return in priority order (not sorted alphabetically)
  }, [state.selectedDegrees]);

  return {
    state,
    actions: {
      selectDegree,
      selectRole,
      reorderRoles,
      generateCompanyPool,
      toggleCompanySelection,
      recordWin,
      markPairSeen,
      undoLastComparison,
      generateFinalRanking,
      updateFinalRanking,
      updatePersonalInfo,
      nextStep,
      prevStep,
      setStep,
    },
    suggestedRoles
  };
}
