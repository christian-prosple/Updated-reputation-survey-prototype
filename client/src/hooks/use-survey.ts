import { useState, useMemo } from 'react';
import { DEGREE_TAXONOMY } from '@/data/degrees';

// --- DATA CONSTANTS ---
// DegreeType is now a string to support the full taxonomy
export type DegreeType = string;

// Helper to find which category a degree belongs to
const getDegreeCategory = (degree: string): string | null => {
  for (const [category, degrees] of Object.entries(DEGREE_TAXONOMY)) {
    if (degrees.includes(degree)) {
      return category;
    }
  }
  return null;
};

// Mapping from degree categories to relevant roles
const CATEGORY_TO_ROLES: Record<string, string[]> = {
  "Business & Management": ["Business, Commerce & Management", "Finance & Banking", "Marketing", "Management Consulting", "HR & Recruitment", "Project Management", "Supply Chain & Logistics", "Accounting & Advisory", "Investment Banking", "Economics", "Sales & Business Development"],
  "IT & Computer Science": ["Computer Science & Software Engineering", "Artificial Intelligence & Machine Learning", "Cybersecurity", "Data Science & Analytics", "Information Technology", "Game Design & Development", "Network & Telecommunications Engineering", "Product Management", "Design & User Experience"],
  "Creative Arts": ["Animation & VFX", "Creative, Performing & Visual Arts", "Design & User Experience", "Fashion", "Film & TV Production", "Music & Audio Production", "Writing, Journalism & Publishing", "Communications & Public Relations"],
  "Engineering & Mathematics": ["Aerospace Engineering & Aviation", "Biomedical Engineering & Sciences", "Chemical & Process Engineering", "Civil & Structural Engineering", "Electrical & Electronic Engineering", "Environmental Engineering", "Geotechnical Engineering", "Manufacturing and Industrial Engineering", "Materials Engineering", "Mechanical & Mechatronic Engineering", "Mining & Resources Engineering", "Mathematics & Statistics", "Data Science & Analytics"],
  "Medical & Health Sciences": ["Medicine", "Nursing", "Midwifery", "Pharmacy & Pharmaceuticals", "Physiotherapy & Occupational Therapy", "Public Health", "Exercise & Sport Sciences", "Healthcare Administration & Management", "Nutrition & Dietetics", "Psychology & Counselling"],
  "Humanities, Arts & Social Sciences": ["Archaeology & History", "Communications & Public Relations", "Economics", "Government & Public Administration", "International Development & NGOs", "Language & Linguistics", "Policy & International Relations", "Psychology & Counselling", "Social Work", "Writing, Journalism & Publishing", "Education & Teaching"],
  "Law, Legal Studies & Justice": ["Law", "Criminology & Forensic Science", "Intelligence & National Security", "Government & Public Administration", "Policy & International Relations"],
  "Property & Built Environment": ["Architecture", "Construction Management", "Interior Design", "Property Development & Management", "Surveying", "Urban Planning", "Civil & Structural Engineering"],
  "Sciences": ["Biology & Biochemistry", "Chemistry", "Geology & Earth Sciences", "Physics", "Zoology", "Veterinary Science", "Environment & Sustainability", "Geospatial & GIS", "Food Science & Technology", "Data Science & Analytics"],
  "Teaching & Education": ["Education & Teaching"],
  "Vocational Education & Training": ["Construction Management", "Electrical & Electronic Engineering", "Manufacturing and Industrial Engineering", "Events, Tourism & Hospitality"],
  "Food, Hospitality & Personal Services": ["Events, Tourism & Hospitality", "Food Science & Technology", "Nutrition & Dietetics", "Marketing"]
};

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
  educationLevel: string;
  graduationMonth: string;
  graduationYear: string;
  country: string;
  university: string;
  preferredCity: string;
  topPickReason: string;
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
  displayedCompanies: CompanyEntity[];
  selectedCompanies: CompanyEntity[];
  pairwiseWins: Record<string, number>;
  completedPairs: Set<string>;
  pairwiseCount: number;
  comparisonHistory: { winnerId: string | null; pair: [string, string]; chainIndexBefore: number; chainIndexAfter: number }[];
  finalRanking: CompanyEntity[];
  eloRatings: Record<string, number>;
  sessionOrder: string[];
  chainIndex: number;
  appearancesInSession: Record<string, number>;
  wasChainPair: boolean;
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
      educationLevel: "",
      graduationMonth: "",
      graduationYear: "",
      country: "",
      university: "",
      preferredCity: "",
      topPickReason: ""
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
    eloRatings: {},
    sessionOrder: [],
    chainIndex: 0,
    appearancesInSession: {},
    wasChainPair: false,
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
      finalRanking: [],
      eloRatings: {},
      sessionOrder: [],
      chainIndex: 0,
      appearancesInSession: {},
      wasChainPair: false,
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

  const getK = (appearances: Record<string, number>, idA: string, idB: string): number => {
    const total = (appearances[idA] || 0) + (appearances[idB] || 0);
    return 32 / Math.sqrt(1 + total);
  };

  const computeEloUpdate = (
    ratings: Record<string, number>,
    winnerId: string,
    loserId: string,
    appearances: Record<string, number>
  ): Record<string, number> => {
    const K = getK(appearances, winnerId, loserId);
    const ratingW = ratings[winnerId] || 1500;
    const ratingL = ratings[loserId] || 1500;
    const expectedW = 1 / (1 + Math.pow(10, (ratingL - ratingW) / 400));
    const expectedL = 1 - expectedW;
    return {
      ...ratings,
      [winnerId]: ratingW + K * (1 - expectedW),
      [loserId]: ratingL + K * (0 - expectedL),
    };
  };

  const recordComparison = (args: {
    pair: [string, string];
    winnerId: string | null;
    isChain: boolean;
    newChainIndex?: number;
  }) => {
    const { pair, winnerId, isChain, newChainIndex } = args;
    setState(prev => {
      const [idA, idB] = pair;
      const key = [idA, idB].sort().join("|");

      const newAppearances = { ...prev.appearancesInSession };
      newAppearances[idA] = (newAppearances[idA] || 0) + 1;
      newAppearances[idB] = (newAppearances[idB] || 0) + 1;

      let newElo = prev.eloRatings;
      const newWins = { ...prev.pairwiseWins };

      if (winnerId) {
        const loserId = idA === winnerId ? idB : idA;
        newElo = computeEloUpdate(prev.eloRatings, winnerId, loserId, newAppearances);
        newWins[winnerId] = (newWins[winnerId] || 0) + 1;
      }

      const chainIndexAfter = isChain ? (newChainIndex !== undefined ? newChainIndex : prev.chainIndex + 1) : prev.chainIndex;

      return {
        ...prev,
        completedPairs: new Set(prev.completedPairs).add(key),
        pairwiseCount: prev.pairwiseCount + 1,
        pairwiseWins: newWins,
        comparisonHistory: [...prev.comparisonHistory, { winnerId, pair, chainIndexBefore: prev.chainIndex, chainIndexAfter }],
        eloRatings: newElo,
        appearancesInSession: newAppearances,
        chainIndex: chainIndexAfter,
        wasChainPair: isChain,
      };
    });
  };

  const replayEloFromHistory = (
    history: { winnerId: string | null; pair: [string, string]; chainIndexBefore: number; chainIndexAfter: number }[],
    allIds: string[]
  ): Record<string, number> => {
    const ratings: Record<string, number> = {};
    const appearances: Record<string, number> = {};
    allIds.forEach(id => { ratings[id] = 1500; appearances[id] = 0; });
    for (const entry of history) {
      appearances[entry.pair[0]] = (appearances[entry.pair[0]] || 0) + 1;
      appearances[entry.pair[1]] = (appearances[entry.pair[1]] || 0) + 1;
      if (entry.winnerId) {
        const loserId = entry.pair[0] === entry.winnerId ? entry.pair[1] : entry.pair[0];
        const K = getK(appearances, entry.winnerId, loserId);
        const rW = ratings[entry.winnerId] || 1500;
        const rL = ratings[loserId] || 1500;
        const eW = 1 / (1 + Math.pow(10, (rL - rW) / 400));
        ratings[entry.winnerId] = rW + K * (1 - eW);
        ratings[loserId] = rL + K * (0 - (1 - eW));
      }
    }
    return ratings;
  };

  const replayAppearancesFromHistory = (
    history: { winnerId: string | null; pair: [string, string]; chainIndexBefore: number; chainIndexAfter: number }[],
    allIds: string[]
  ): Record<string, number> => {
    const appearances: Record<string, number> = {};
    allIds.forEach(id => { appearances[id] = 0; });
    for (const entry of history) {
      appearances[entry.pair[0]] = (appearances[entry.pair[0]] || 0) + 1;
      appearances[entry.pair[1]] = (appearances[entry.pair[1]] || 0) + 1;
    }
    return appearances;
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

      const allIds = prev.selectedCompanies.map(c => c.id);
      const newElo = replayEloFromHistory(newHistory, allIds);
      const newAppearances = replayAppearancesFromHistory(newHistory, allIds);

      return {
        ...prev,
        pairwiseWins: newWins,
        completedPairs: newCompleted,
        comparisonHistory: newHistory,
        pairwiseCount: Math.max(0, prev.pairwiseCount - 1),
        eloRatings: newElo,
        appearancesInSession: newAppearances,
        chainIndex: last.chainIndexBefore,
        wasChainPair: false,
      };
    });
  };

  const generateFinalRanking = () => {
    const sorted = [...state.selectedCompanies].sort((a, b) => {
      const eloA = state.eloRatings[a.id] || 1500;
      const eloB = state.eloRatings[b.id] || 1500;
      return eloB - eloA;
    });
    setState(prev => ({ ...prev, finalRanking: sorted }));
  };
  
  const updateFinalRanking = (newRanking: CompanyEntity[]) => {
    setState(prev => ({ ...prev, finalRanking: newRanking }));
  };

  // Replace the recognition-step company pool (used when the backend employer
  // display algorithm decides which employers to show). Resets dependent state.
  const setDisplayedCompanies = (companies: CompanyEntity[]) => {
    setState(prev => ({
      ...prev,
      displayedCompanies: companies,
      selectedCompanies: [],
      pairwiseWins: {},
      completedPairs: new Set(),
      pairwiseCount: 0,
      finalRanking: [],
      eloRatings: {},
      sessionOrder: [],
      chainIndex: 0,
      appearancesInSession: {},
      wasChainPair: false,
    }));
  };

  const initializePairwiseSession = () => {
    const ids = state.selectedCompanies.map(c => c.id);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    const initialElo: Record<string, number> = {};
    const initialAppearances: Record<string, number> = {};
    ids.forEach(id => {
      initialElo[id] = 1500;
      initialAppearances[id] = 0;
    });
    setState(prev => ({
      ...prev,
      sessionOrder: shuffled,
      chainIndex: 0,
      eloRatings: initialElo,
      appearancesInSession: initialAppearances,
      pairwiseWins: {},
      completedPairs: new Set<string>(),
      pairwiseCount: 0,
      comparisonHistory: [],
    }));
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
        // If >1 role, initialize order with selection order and go to step 3
        return { ...prev, step: 3, roleOrder: prev.selectedRoles };
      }

      // Cap at step 8 (Thank You)
      return { ...prev, step: Math.min(next, 8) };
    });
  };
  
  // Custom setter for specific logic needs
  const setStep = (step: number) => setState(prev => ({ ...prev, step }));

  const prevStep = () => {
    setState(prev => {
      if (prev.step === 4 && prev.selectedRoles.length <= 1) {
        return { ...prev, step: 2 };
      }
      if (prev.step === 5) {
        return {
          ...prev,
          step: 4,
          sessionOrder: [],
          chainIndex: 0,
          appearancesInSession: {},
          eloRatings: {},
          pairwiseWins: {},
          completedPairs: new Set<string>(),
          pairwiseCount: 0,
          comparisonHistory: [],
          wasChainPair: false,
        };
      }
      return { ...prev, step: Math.max(0, prev.step - 1) };
    });
  };

  const suggestedRoles = useMemo(() => {
    // Collect all relevant roles based on degree categories
    const allRelevantRoles: Set<string> = new Set();
    const categoriesFound: Set<string> = new Set();
    
    state.selectedDegrees.forEach(degree => {
      // Find the category this degree belongs to
      const category = getDegreeCategory(degree);
      if (category && CATEGORY_TO_ROLES[category]) {
        categoriesFound.add(category);
        CATEGORY_TO_ROLES[category].forEach(role => allRelevantRoles.add(role));
      }
    });
    
    // If we found matching categories, return 5 roles from them
    if (allRelevantRoles.size > 0) {
      const rolesArray = Array.from(allRelevantRoles) as RoleType[];
      // Shuffle and return first 5
      const shuffled = rolesArray.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    }
    
    // Fallback: return 5 random popular roles if no matches
    const popularRoles: RoleType[] = [
      "Business, Commerce & Management",
      "Computer Science & Software Engineering",
      "Finance & Banking",
      "Marketing",
      "Data Science & Analytics"
    ];
    return popularRoles;
  }, [state.selectedDegrees]);

  return {
    state,
    actions: {
      selectDegree,
      selectRole,
      reorderRoles,
      generateCompanyPool,
      toggleCompanySelection,
      recordComparison,
      undoLastComparison,
      generateFinalRanking,
      updateFinalRanking,
      setDisplayedCompanies,
      updatePersonalInfo,
      nextStep,
      prevStep,
      setStep,
      initializePairwiseSession,
    },
    suggestedRoles
  };
}
