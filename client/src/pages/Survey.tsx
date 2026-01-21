import { useEffect, useMemo, useState } from "react";
import { useSurvey, ROLES, RoleType, CompanyEntity, GENDERS, EDUCATION_STATUSES, ALL_COMPANY_NAMES, COMPANIES_BY_ROLE } from "@/hooks/use-survey";
import { DEGREE_TAXONOMY, ALL_DEGREES, DEGREE_CATEGORIES } from "@/data/degrees";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button-custom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ChevronRight, ChevronLeft, ChevronDown, GripVertical, CheckCircle2, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualCompany {
  name: string;
  role: string;
}

// Countries with ISO codes for flags
const COUNTRIES = [
  { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" },
  { name: "Belgium", code: "BE" },
  { name: "Brazil", code: "BR" },
  { name: "Canada", code: "CA" },
  { name: "China", code: "CN" },
  { name: "Denmark", code: "DK" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "Germany", code: "DE" },
  { name: "Hong Kong", code: "HK" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Ireland", code: "IE" },
  { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" },
  { name: "Japan", code: "JP" },
  { name: "Malaysia", code: "MY" },
  { name: "Mexico", code: "MX" },
  { name: "Netherlands", code: "NL" },
  { name: "New Zealand", code: "NZ" },
  { name: "Norway", code: "NO" },
  { name: "Philippines", code: "PH" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Singapore", code: "SG" },
  { name: "South Africa", code: "ZA" },
  { name: "South Korea", code: "KR" },
  { name: "Spain", code: "ES" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Taiwan", code: "TW" },
  { name: "Thailand", code: "TH" },
  { name: "Turkey", code: "TR" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "Vietnam", code: "VN" },
];

// Helper to get flag URL from country code
const getFlagUrl = (code: string) => 
  `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

// Company domain mapping for logo fetching
const COMPANY_DOMAINS: Record<string, string> = {
  // Banks & Finance
  "Commonwealth Bank": "commbank.com.au",
  "Westpac": "westpac.com.au",
  "Westpac Group": "westpac.com.au",
  "NAB": "nab.com.au",
  "NAB Australia": "nab.com.au",
  "ANZ": "anz.com.au",
  "ANZ Bank": "anz.com.au",
  "Macquarie Group": "macquarie.com",
  "Reserve Bank of Australia": "rba.gov.au",
  "Australian Taxation Office (ATO)": "ato.gov.au",
  "AustralianSuper": "australiansuper.com",
  "AMP": "amp.com.au",
  "Munich Re": "munichre.com",
  "Swiss Re Australia": "swissre.com",
  "RGA": "rgare.com",
  "JPMorganChase Australia": "jpmorgan.com",
  "Goldman Sachs Australia": "goldmansachs.com",
  "UBS Australia": "ubs.com",
  "Morgan Stanley Australia": "morganstanley.com",
  "Citi Group Australia": "citi.com",
  "Bank of America": "bankofamerica.com",
  "Barrenjoey (Barclays)": "barrenjoey.com",
  "Jefferies Australia": "jefferies.com",
  "Deutsche Bank": "db.com",
  "Gresham": "gresham.com.au",
  "Azure Capital (Natixis)": "azurecapital.com.au",
  
  // Big 4 & Consulting
  "Deloitte": "deloitte.com",
  "Deloitte Australia": "deloitte.com",
  "PwC": "pwc.com",
  "PwC Australia": "pwc.com",
  "EY": "ey.com",
  "EY Australia": "ey.com",
  "EY-Parthenon": "ey.com",
  "KPMG": "kpmg.com",
  "KPMG Australia": "kpmg.com",
  "BDO Australia": "bdo.com.au",
  "Grant Thornton Australia": "grantthornton.com.au",
  "RSM Australia": "rsm.global",
  "Pitcher Partners": "pitcher.com.au",
  "Grant Samuel": "grantsamuel.com.au",
  "McGrathNicol": "mcgrathnicol.com",
  "KordaMentha": "kordamentha.com",
  "FTI Consulting": "fticonsulting.com",
  "Crowe Australia": "crowe.com",
  "Moore Australia": "moore-australia.com.au",
  "McKinsey & Company": "mckinsey.com",
  "McKinsey & Company Australia": "mckinsey.com",
  "BCG": "bcg.com",
  "Boston Consulting Group Australia": "bcg.com",
  "Bain & Company": "bain.com",
  "Bain & Company Australia": "bain.com",
  "Accenture": "accenture.com",
  "Accenture Australia": "accenture.com",
  "Kearney": "kearney.com",
  "Oliver Wyman": "oliverwyman.com",
  "L.E.K. Consulting": "lek.com",
  "OC&C Strategy Consultants": "occstrategy.com",
  "Altman Solon Australia": "altmansolon.com",
  "Partners in Performance": "pip.global",
  "Nous Group": "nousgroup.com",
  "Strategy&": "strategyand.pwc.com",
  "Publicis Sapient": "publicissapient.com",
  
  // Tech
  "Google": "google.com",
  "Google AU": "google.com",
  "Microsoft": "microsoft.com",
  "Microsoft Australia": "microsoft.com",
  "Amazon": "amazon.com",
  "Amazon AU": "amazon.com",
  "Apple": "apple.com",
  "Apple Australia": "apple.com",
  "Meta": "meta.com",
  "Meta Australia": "meta.com",
  "Netflix": "netflix.com",
  "Atlassian": "atlassian.com",
  "Atlassian Australia": "atlassian.com",
  "Canva": "canva.com",
  "Salesforce": "salesforce.com",
  "Salesforce Australia": "salesforce.com",
  "IBM": "ibm.com",
  "IBM Australia": "ibm.com",
  "Oracle": "oracle.com",
  "SAP": "sap.com",
  "Cisco": "cisco.com",
  "Intel": "intel.com",
  "NVIDIA": "nvidia.com",
  "Adobe": "adobe.com",
  "Adobe AU": "adobe.com",
  "Spotify": "spotify.com",
  "Uber": "uber.com",
  "Airbnb": "airbnb.com",
  "Stripe": "stripe.com",
  "TikTok Australia & New Zealand": "tiktok.com",
  "Airwallex": "airwallex.com",
  "ZipCo": "zip.co",
  "HelloFresh": "hellofresh.com.au",
  "Planet Innovation": "planetinnovation.com",
  "Luxury Escapes": "luxuryescapes.com",
  "Vow": "vowfood.com",
  "Jane Street": "janestreet.com",
  "Optiver": "optiver.com",
  "Xero Australia": "xero.com",
  "Dell Technologies": "dell.com",
  "WiseTech Global": "wisetechglobal.com",
  "CyberCX": "cybercx.com.au",
  "Quantium": "quantium.com",
  "Palantir Australia": "palantir.com",
  
  // Law Firms
  "Herbert Smith Freehills": "herbertsmithfreehills.com",
  "King & Wood Mallesons": "kwm.com",
  "Allens": "allens.com.au",
  "Clayton Utz": "claytonutz.com",
  "Ashurst": "ashurst.com",
  "MinterEllison": "minterellison.com",
  "Gilbert + Tobin": "gtlaw.com.au",
  "Corrs Chambers Westgarth": "corrs.com.au",
  "Baker McKenzie": "bakermckenzie.com",
  "White & Case": "whitecase.com",
  "K&L Gates": "klgates.com",
  "Pinsent Masons": "pinsentmasons.com",
  
  // Aviation & Aerospace
  "Qantas": "qantas.com",
  "Virgin Australia": "virginaustralia.com",
  "Lockheed Martin": "lockheedmartin.com",
  "Boeing Australia": "boeing.com",
  "Airbus Australia": "airbus.com",
  "Raytheon": "rtx.com",
  "Northrop Grumman Australia": "northropgrumman.com",
  "BAE Systems Australia": "baesystems.com",
  "ADF Careers": "defence.gov.au",
  "Thales Australia": "thalesgroup.com",
  "QinetiQ Australia": "qinetiq.com",
  "Nova Systems": "novasystems.com",
  "ASC": "asc.com.au",
  "CAE Australia": "cae.com",
  "Rohde & Schwarz Australia": "rohde-schwarz.com",
  
  // Telecom
  "Telstra": "telstra.com.au",
  "Optus": "optus.com.au",
  
  // Mining & Resources
  "BHP": "bhp.com",
  "Rio Tinto": "riotinto.com",
  "Woodside": "woodside.com",
  "Santos": "santos.com",
  
  // Retail
  "Wesfarmers": "wesfarmers.com.au",
  "Woolworths": "woolworths.com.au",
  "Coles": "coles.com.au",
  
  // Healthcare
  "CSL": "csl.com",
  "Cochlear": "cochlear.com",
  "ResMed": "resmed.com",
  
  // Construction & Property
  "Transurban": "transurban.com",
  "Lendlease": "lendlease.com",
  "Mirvac": "mirvac.com",
  "Stockland": "stockland.com.au",
  "Multiplex Australia": "multiplex.global",
  "John Holland": "johnholland.com.au",
  "CPB Contractors AU": "cpbcon.com.au",
  "AECOM": "aecom.com",
  "Laing O'Rourke": "laingorourke.com",
  "Downer Group": "downergroup.com",
  "Bechtel Australia": "bechtel.com",
  "Custom Built New Homes & Renovations": "custombuilt.com.au",
  "Built": "built.com.au",
  
  // Insurance
  "Suncorp": "suncorp.com.au",
  "QBE Insurance": "qbe.com",
  "IAG": "iag.com.au",
  "Medibank": "medibank.com.au",
  "NIB": "nib.com.au",
  "Bupa": "bupa.com.au",
  
  // Marketing & Media
  "L'Oréal Australia": "loreal.com",
  "Procter & Gamble": "pg.com",
  "Unilever": "unilever.com",
  "Ogilvy Australia": "ogilvy.com",
  "Leo Burnett Australia": "leoburnett.com",
  "Disney Studios Australia": "disney.com",
  "NBCUniversal Australia": "nbcuniversal.com",
  "Village Roadshow Theme Parks": "vrtp.com.au",
  "Paramount Australia & New Zealand": "paramount.com",
  "Octagon": "octagon.com",
  
  // Environment & Science
  "CSIRO": "csiro.au",
  "Umwelt Australia": "umwelt.com.au",
  "Ecology & Heritage Partners": "ehpartners.com.au",
  "Urbis": "urbis.com.au",
  "Department of Transport and Main Roads": "tmr.qld.gov.au",
  "Sunshine Coast Council (SCC)": "sunshinecoast.qld.gov.au",
  "SLR Consulting": "slrconsulting.com",
  "GHD": "ghd.com",
  "Worley": "worley.com",
  "Hydro Tasmania": "hydro.com.au",
  "Clean Energy Regulator": "cleanenergyregulator.gov.au",
  "Taylor Fry": "taylorfry.com.au",
  "Finity Consulting": "finity.com.au",
  "Rice Warner": "ricewarner.com",
  
  // Architecture
  "BVN": "bvn.com.au",
  "Woods Bagot": "woodsbagot.com",
  "Cox Architecture": "coxarchitecture.com.au",
  "Hassell": "hassellstudio.com",
  "Architectus": "architectus.com.au",
  "HDR": "hdrinc.com",
  "Rothelowman Australia": "rothelowman.com.au",
  "Hayball": "hayball.com.au",
  "Gray Puksand": "graypuksand.com.au",
  "DesignInc Australia": "designinc.com.au",
  "i2C Architects": "i2c.com.au",
  "Stantec Australia": "stantec.com",
};

// Helper to get company logo URL - try multiple sources
const getCompanyLogoUrl = (companyName: string): string => {
  const domain = COMPANY_DOMAINS[companyName];
  if (domain) {
    // Use Google's favicon service which is more reliable
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }
  // Fallback: try to guess the domain from company name
  const guessedDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `https://www.google.com/s2/favicons?domain=${guessedDomain}&sz=128`;
};

// Component to display company logo with fallback
const CompanyLogo = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
  const [hasError, setHasError] = useState(false);
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };
  
  const textSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm"
  };
  
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200`}>
      {!hasError ? (
        <img 
          src={getCompanyLogoUrl(name)}
          alt={`${name} logo`}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`${textSizeClasses[size]} font-bold text-slate-500`}>{initials}</span>
      )}
    </div>
  );
};

export default function SurveyPage() {
  const { state, actions, suggestedRoles } = useSurvey();
  const [activePair, setActivePair] = useState<[CompanyEntity, CompanyEntity] | null>(null);

  const [newCompany, setNewCompany] = useState<ManualCompany>({ name: "", role: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [showFullTaxonomy, setShowFullTaxonomy] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCompanySearchFocused, setIsCompanySearchFocused] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isCountrySearchFocused, setIsCountrySearchFocused] = useState(false);
  const [isEducationLevelFocused, setIsEducationLevelFocused] = useState(false);
  const [isGenderFocused, setIsGenderFocused] = useState(false);
  const [isGradMonthFocused, setIsGradMonthFocused] = useState(false);
  const [isGradYearFocused, setIsGradYearFocused] = useState(false);
  const [degreeSearchQuery, setDegreeSearchQuery] = useState("");
  const [isDegreeSearchFocused, setIsDegreeSearchFocused] = useState(false);

  // Get suggested roles based on selected company name
  const getSuggestedRolesForCompany = (companyName: string): RoleType[] => {
    const matchedRoles: RoleType[] = [];
    for (const [role, companies] of Object.entries(COMPANIES_BY_ROLE)) {
      if (companies.includes(companyName)) {
        matchedRoles.push(role as RoleType);
      }
    }
    // If we found matches, return up to 3
    if (matchedRoles.length > 0) {
      return matchedRoles.slice(0, 3);
    }
    // Otherwise return 3 random roles
    const shuffled = [...ROLES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const handleAddManualCompany = () => {
    if (!newCompany.name.trim()) return;
    
    const entity: CompanyEntity = {
      name: newCompany.name.trim(),
      role: newCompany.role as RoleType,
      id: `manual-${Date.now()}-${newCompany.name.trim()}|${newCompany.role}`
    };
    
    actions.updateFinalRanking([entity, ...state.finalRanking]);
    setNewCompany({ name: "", role: "" });
    setIsAdding(false);
  };

  // --- DERIVED STATE ---
  const totalSteps = 7; 

  const targetPairwiseCount = useMemo(() => {
    const n = state.selectedCompanies.length;
    if (n < 2) return 0;
    const maxPossible = (n * (n - 1)) / 2;
    return Math.min(20, maxPossible);
  }, [state.selectedCompanies.length]);

  // --- EFFECT: Initialize Companies for Step 4 ---
  useEffect(() => {
    if (state.step === 4 && state.displayedCompanies.length === 0) {
      actions.generateCompanyPool();
    }
  }, [state.step]);

  // --- EFFECT: Initialize Final Ranking for Step 6 ---
  useEffect(() => {
    if (state.step === 6 && state.finalRanking.length === 0) {
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
    if (state.step === 5 && !activePair) {
      if (state.pairwiseCount >= targetPairwiseCount) {
        actions.nextStep();
        return;
      }
      
      const next = getNextPair();
      if (next) {
        setActivePair(next);
      } else {
        // No more pairs? Auto-advance to step 6
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

  const handleRoleSelection = (role: string) => {
    actions.selectRole(role as RoleType);
    setRoleSearchQuery("");
    // We don't need to do anything else, the dropdown should stay open
    // because isSearchFocused is still true and we stopPropagation on the click
  };

  const handleDegreeSelection = (degree: string) => {
    actions.selectDegree(degree);
    setDegreeSearchQuery("");
    // Dropdown stays open for multi-select
  };

  // Get suggested degrees based on already selected degrees (same category)
  const suggestedDegrees = useMemo(() => {
    if (state.selectedDegrees.length === 0) {
      // Return first 5 from first category as default suggestions
      return ALL_DEGREES.slice(0, 8);
    }
    
    // Find categories of selected degrees and suggest more from those categories
    const selectedCategories = new Set<string>();
    for (const degree of state.selectedDegrees) {
      for (const [category, degrees] of Object.entries(DEGREE_TAXONOMY)) {
        if (degrees.includes(degree)) {
          selectedCategories.add(category);
        }
      }
    }
    
    // Get degrees from same categories that aren't already selected
    const suggested: string[] = [];
    for (const category of Array.from(selectedCategories)) {
      const categoryDegrees = DEGREE_TAXONOMY[category] || [];
      for (const degree of categoryDegrees) {
        if (!state.selectedDegrees.includes(degree) && !suggested.includes(degree)) {
          suggested.push(degree);
        }
      }
    }
    
    return suggested.slice(0, 8);
  }, [state.selectedDegrees]);

  // Generate month and year options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 + 6 }, (_, i) => String(2015 + i));

  // Education level options
  const EDUCATION_LEVELS = [
    "Accelerated master's",
    "Advanced certificate",
    "Associate's",
    "Bachelor's",
    "Bachelor's (Honours)",
    "Certificate",
    "Community / Technical college",
    "Diploma",
    "Doctorate",
    "Doctorate (PhD)",
    "High School Certificate",
    "Juris Doctor",
    "M.D.",
    "Masters (Coursework)",
    "Masters (Research)",
    "Master's of Business Administration",
    "Non-award",
    "Postdoctoral studies",
    "Professional Certificate",
    "Short course or microcredential",
    "Technical diploma",
    "Non-degree seeking"
  ];

  // Check if personal info is complete enough to continue
  const isPersonalInfoValid = () => {
    const { email, gender, country, university, graduationMonth, graduationYear } = state.personalInfo;
    const hasValidEmail = email.includes("@") && email.includes(".");
    const hasValidGender = gender.length > 0;
    const hasValidSchool = university.trim().length > 0;
    const hasValidGraduation = graduationMonth.length > 0 && graduationYear.length > 0;
    return hasValidEmail && hasValidGender && country.trim() && hasValidSchool && hasValidGraduation;
  };
  
  // Helper to check if graduation date is in the future
  const isGraduationInFuture = () => {
    const { graduationMonth, graduationYear } = state.personalInfo;
    if (!graduationMonth || !graduationYear) return true; // default to "currently studying"
    
    const monthIndex = months.indexOf(graduationMonth);
    const year = parseInt(graduationYear);
    const gradDate = new Date(year, monthIndex, 1);
    const today = new Date();
    
    return gradDate > today;
  };

  // STEP 0: PERSONAL INFO
  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
          Let's start with a bit about you
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <p className="text-xs text-[#2e3445]">So we can send you a thank you gift!</p>
          </div>
          <input
            type="email"
            value={state.personalInfo.email}
            onChange={(e) => actions.updatePersonalInfo("email", e.target.value)}
            placeholder="your.email@example.com"
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
            data-testid="input-email"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
          <label className="text-sm font-medium text-slate-700">Gender</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGenderFocused(!isGenderFocused)}
              className={cn(
                "w-full p-3 pr-3 border-2 rounded-xl text-left transition-colors bg-white flex items-center justify-between text-slate-900",
                isGenderFocused ? "border-primary" : "border-slate-200"
              )}
              data-testid="select-gender"
            >
              <span>{state.personalInfo.gender || "Select gender"}</span>
              <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isGenderFocused && "rotate-180")} />
            </button>
          </div>
          
          {/* Gender dropdown */}
          {isGenderFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50">
              {[...GENDERS, "Other"].map((g) => (
                <div
                  key={g}
                  onClick={() => {
                    actions.updatePersonalInfo("gender", g);
                    setIsGenderFocused(false);
                  }}
                  className={cn(
                    "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
                    state.personalInfo.gender === g ? "bg-primary/10 text-slate-900" : "text-slate-700"
                  )}
                >
                  {g}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education Level */}
        <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
            <label className="text-sm font-medium text-slate-700">Highest education level (completed or in progress)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEducationLevelFocused(!isEducationLevelFocused)}
                className={cn(
                  "w-full p-3 pr-3 border-2 rounded-xl text-left transition-colors bg-white flex items-center justify-between text-slate-900",
                  isEducationLevelFocused ? "border-primary" : "border-slate-200"
                )}
                data-testid="select-education-level"
              >
                <span>{state.personalInfo.educationLevel || "Select education level"}</span>
                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isEducationLevelFocused && "rotate-180")} />
              </button>
            </div>
            
            {/* Education level dropdown */}
            {isEducationLevelFocused && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50"
              >
                {EDUCATION_LEVELS.map((level) => (
                  <div
                    key={level}
                    onClick={() => {
                      actions.updatePersonalInfo("educationLevel", level);
                      setIsEducationLevelFocused(false);
                    }}
                    className={cn(
                      "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
                      state.personalInfo.educationLevel === level ? "bg-primary/10 text-slate-900" : "text-slate-700"
                    )}
                  >
                    {level}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Graduation Date */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Graduation date (expected or actual)</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Month dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { setIsGradMonthFocused(!isGradMonthFocused); setIsGradYearFocused(false); }}
                  className={cn(
                    "w-full p-3 pr-3 border-2 rounded-xl text-left transition-colors bg-white flex items-center justify-between text-slate-900",
                    isGradMonthFocused ? "border-primary" : "border-slate-200"
                  )}
                  data-testid="select-graduation-month"
                >
                  <span>{state.personalInfo.graduationMonth || "Month"}</span>
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isGradMonthFocused && "rotate-180")} />
                </button>
                
                {isGradMonthFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                    {months.map((m) => (
                      <div
                        key={m}
                        onClick={() => {
                          actions.updatePersonalInfo("graduationMonth", m);
                          setIsGradMonthFocused(false);
                        }}
                        className={cn(
                          "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
                          state.personalInfo.graduationMonth === m ? "bg-primary/10 text-slate-900" : "text-slate-700"
                        )}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Year dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { setIsGradYearFocused(!isGradYearFocused); setIsGradMonthFocused(false); }}
                  className={cn(
                    "w-full p-3 pr-3 border-2 rounded-xl text-left transition-colors bg-white flex items-center justify-between text-slate-900",
                    isGradYearFocused ? "border-primary" : "border-slate-200"
                  )}
                  data-testid="select-graduation-year"
                >
                  <span>{state.personalInfo.graduationYear || "Year"}</span>
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isGradYearFocused && "rotate-180")} />
                </button>
                
                {isGradYearFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                    {years.map((y) => (
                      <div
                        key={y}
                        onClick={() => {
                          actions.updatePersonalInfo("graduationYear", y);
                          setIsGradYearFocused(false);
                        }}
                        className={cn(
                          "px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
                          state.personalInfo.graduationYear === y ? "bg-primary/10 text-slate-900" : "text-slate-700"
                        )}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* School */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">School</label>
            <input
              type="text"
              value={state.personalInfo.university}
              onChange={(e) => actions.updatePersonalInfo("university", e.target.value)}
              placeholder="e.g. University of Melbourne"
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
              data-testid="input-school"
          />
        </div>

        {/* Country */}
        <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
          <label className="text-sm font-medium text-slate-700">Country</label>
          <input
            type="text"
            value={state.personalInfo.country}
            onChange={(e) => actions.updatePersonalInfo("country", e.target.value)}
            onFocus={() => setIsCountrySearchFocused(true)}
            onClick={() => setIsCountrySearchFocused(true)}
            placeholder="e.g. Australia"
            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
            data-testid="input-country"
          />
          
          {/* Country dropdown suggestions */}
          {isCountrySearchFocused && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50"
            >
              {COUNTRIES
                .filter(c => !state.personalInfo.country || c.name.toLowerCase().includes(state.personalInfo.country.toLowerCase()))
                .map((country) => (
                  <div
                    key={country.code}
                    onClick={() => {
                      actions.updatePersonalInfo("country", country.name);
                      setIsCountrySearchFocused(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                  >
                    <img 
                      src={getFlagUrl(country.code)} 
                      alt={`${country.name} flag`}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-sm font-medium text-slate-700">{country.name}</span>
                  </div>
                ))}
              {state.personalInfo.country && COUNTRIES.filter(c => c.name.toLowerCase().includes(state.personalInfo.country.toLowerCase())).length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No matching countries found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-12 gap-4">
        <Button 
          onClick={() => actions.nextStep()} 
          disabled={!isPersonalInfoValid()}
          size="lg"
          className="w-full max-w-[160px]"
          data-testid="button-continue-personal"
        >
          Continue <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  // STEP 1: DEGREE SELECTION (Searchable dropdown like role selection)
  const renderStep1 = () => {
    // Dynamic question text based on graduation date
    const questionText = isGraduationInFuture()
      ? "What is your area of study? (Select all that apply)"
      : "What was your area of study? (Select all that apply)";

    return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
          {questionText}
        </p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto w-full relative">
        {/* Search Bar with Selected Pills */}
        <div className="relative z-50" onClick={(e) => e.stopPropagation()}>
          <div className={cn(
            "min-h-[56px] w-full p-2 bg-white border-2 rounded-2xl flex flex-wrap gap-2 items-center transition-all duration-200",
            (isDegreeSearchFocused || degreeSearchQuery) ? "border-primary shadow-lg" : "border-slate-200 shadow-sm"
          )}>
            <div className="flex items-center pl-2">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            
            <AnimatePresence>
              {state.selectedDegrees.map((degree) => (
                <motion.div
                  key={degree}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-primary/10 text-primary-foreground border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold group"
                >
                  <span className="text-slate-900">{degree}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.selectDegree(degree);
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
              placeholder={state.selectedDegrees.length === 0 ? "Search for study areas..." : ""}
              value={degreeSearchQuery}
              onFocus={(e) => {
                e.stopPropagation();
                setIsDegreeSearchFocused(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsDegreeSearchFocused(true);
              }}
              onChange={(e) => setDegreeSearchQuery(e.target.value)}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none py-2 px-2 text-slate-900 placeholder:text-slate-400"
              data-testid="input-degree-search"
            />
          </div>

          {/* Dropdown Results */}
          <AnimatePresence>
            {(isDegreeSearchFocused || degreeSearchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl max-h-[400px] overflow-hidden flex flex-col z-50"
              >
                <div className="overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {degreeSearchQuery.length === 0 ? (
                    <>
                      {ALL_DEGREES.map((degree) => {
                        const isSelected = state.selectedDegrees.includes(degree);
                        return (
                          <div
                            key={degree}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDegreeSelection(degree);
                            }}
                            className={cn(
                              "cursor-pointer rounded-xl p-3 flex items-center justify-between transition-colors",
                              isSelected ? "bg-primary/10" : "hover:bg-slate-50"
                            )}
                          >
                            <span className={cn("text-sm font-medium", isSelected ? "text-slate-900 font-bold" : "text-slate-600")}>
                              {degree}
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
                      {ALL_DEGREES
                        .filter(degree => degree.toLowerCase().includes(degreeSearchQuery.toLowerCase()))
                        .map((degree) => {
                          const isSelected = state.selectedDegrees.includes(degree);
                          return (
                            <div
                              key={degree}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDegreeSelection(degree);
                              }}
                              className={cn(
                                "cursor-pointer rounded-xl p-3 flex items-center justify-between transition-colors",
                                isSelected ? "bg-primary/10" : "hover:bg-slate-50"
                              )}
                            >
                              <span className={cn("text-sm font-medium", isSelected ? "text-slate-900 font-bold" : "text-slate-600")}>
                                {degree}
                              </span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                            </div>
                          );
                        })}
                      {ALL_DEGREES.filter(degree => degree.toLowerCase().includes(degreeSearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          No matching degrees found
                        </div>
                      )}
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
  };

  // STEP 2: ROLE SELECTION
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">What career path(s) are you most interested in?</p>
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
              placeholder={state.selectedRoles.length === 0 ? "Search for career paths..." : ""}
              value={roleSearchQuery}
              onFocus={(e) => {
                e.stopPropagation();
                setIsSearchFocused(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsSearchFocused(true);
              }}
              onBlur={() => {
                // Keep dropdown open by only closing if not clicking inside or manually selecting
              }}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none py-2 px-2 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Dropdown Results */}
          <AnimatePresence>
            {(isSearchFocused || roleSearchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl max-h-[400px] overflow-hidden flex flex-col z-50"
              >
                <div className="overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {roleSearchQuery.length === 0 ? (
                    <>
                      {/* Suggested Section */}
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        Suggested
                      </div>
                      {suggestedRoles.slice(0, 5).map((role) => {
                        const isSelected = state.selectedRoles.includes(role);
                        return (
                          <div
                            key={role}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoleSelection(role);
                            }}
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
                        All Career Paths
                      </div>
                      {[...ROLES].sort().map((role) => {
                        if (suggestedRoles.slice(0, 5).includes(role)) return null;
                        const isSelected = state.selectedRoles.includes(role);
                        return (
                          <div
                            key={role}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoleSelection(role);
                            }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoleSelection(role);
                              }}
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

  // STEP 3: ROLE ORDERING
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
          What career path are you most interested in?
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Drag and drop to sort your career paths in order of preference
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

  // STEP 4: COMPANY SELECTION
  const renderStep4 = () => {
    // Get unique company names from displayed entities
    const uniqueCompanyNames = Array.from(new Set(state.displayedCompanies.map(c => c.name)));
    
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="text-center mb-4">
          <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
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
                <CompanyLogo name={name} size="sm" />
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

  // STEP 5: PAIRWISE LOOP
  const renderStep5 = () => (
    <div className="flex flex-col h-full justify-center max-w-4xl mx-auto w-full">
      <div className="text-center mb-6">
        <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
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
                <CompanyLogo name={activePair[0].name} size="lg" />
                <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors mt-4">
                  {activePair[0].name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  Role: {activePair[0].role}
                </p>
                <span className="mt-4 text-sm font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  Select this company →
                </span>
             </button>
           </motion.div>

           {/* VS Badge in middle */}
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-slate-300 shadow-sm border border-slate-100 z-10 flex-shrink-0">OR</div>

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
                <CompanyLogo name={activePair[1].name} size="lg" />
                <h3 className="text-2xl md:text-3xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors mt-4">
                  {activePair[1].name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  Role: {activePair[1].role}
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
        <div className="flex gap-4 items-center mb-4">
          {state.comparisonHistory.length > 0 && (
            <Button variant="outline" onClick={handleUndo} className="text-slate-900 border-slate-200">
              <ChevronLeft className="mr-1 w-4 h-4" /> Undo previous choice
            </Button>
          )}
          <Button variant="outline" onClick={() => handlePairChoice(null)} className="text-slate-900 border-slate-200">
            Too hard, skip this pair
          </Button>
        </div>
        <div className="flex gap-4 w-full max-w-xs">
          <Button 
            variant="secondary"
            size="lg"
            className="flex-1 text-muted-foreground" 
            onClick={() => actions.prevStep()}
          >
            <ChevronLeft className="mr-1 w-5 h-5 flex-shrink-0" /> Back
          </Button>
          <Button 
            variant={state.pairwiseCount >= targetPairwiseCount ? "primary" : "secondary"}
            size="lg"
            className={cn(
              "flex-1 transition-all duration-300",
              state.pairwiseCount >= targetPairwiseCount ? "shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground"
            )}
            onClick={handleFinishSurvey}
          >
            {state.pairwiseCount >= targetPairwiseCount ? "Continue" : "Finish Early"}
            <ChevronRight className="ml-1 w-5 h-5 flex-shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );

  // STEP 6: FINAL RANKING
  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
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
            <div 
              className="bg-white border rounded-xl p-4 shadow-sm w-full space-y-4 animate-in fade-in slide-in-from-top-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Company Name</label>
                  <input 
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                    onFocus={() => setIsCompanySearchFocused(true)}
                    className={cn(
                      "w-full p-2 border rounded-md text-sm outline-none transition-all",
                      isCompanySearchFocused ? "ring-2 ring-primary border-primary" : ""
                    )}
                    placeholder="Search or type company name..."
                    autoFocus
                    data-testid="input-company-name"
                  />
                  {/* Company search dropdown */}
                  {isCompanySearchFocused && newCompany.name.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                      {ALL_COMPANY_NAMES
                        .filter(name => name.toLowerCase().includes(newCompany.name.toLowerCase()))
                        .slice(0, 8)
                        .map((name) => (
                          <div
                            key={name}
                            onClick={() => {
                              setNewCompany(prev => ({ ...prev, name }));
                              setIsCompanySearchFocused(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-b-0"
                            data-testid={`company-option-${name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {name}
                          </div>
                        ))}
                      {ALL_COMPANY_NAMES.filter(name => name.toLowerCase().includes(newCompany.name.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No matches found - your entry "{newCompany.name}" will be used
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Role</label>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className={cn(
                      "w-full p-2 border rounded-md text-sm text-left bg-white flex items-center justify-between transition-all",
                      isRoleDropdownOpen ? "ring-2 ring-primary border-primary" : ""
                    )}
                    data-testid="select-company-role"
                  >
                    <span className={cn("truncate", !newCompany.role && "text-muted-foreground")}>{newCompany.role || "Select role"}</span>
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isRoleDropdownOpen ? "rotate-90" : "")} />
                  </button>
                  
                  {/* Role dropdown with sections */}
                  {isRoleDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                      {/* Suggested Roles Section */}
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border-b sticky top-0">
                        Suggested Roles
                      </div>
                      {getSuggestedRolesForCompany(newCompany.name).map((role) => (
                        <div
                          key={`suggested-${role}`}
                          onClick={() => {
                            setNewCompany(prev => ({ ...prev, role }));
                            setIsRoleDropdownOpen(false);
                          }}
                          className={cn(
                            "px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-b-0",
                            newCompany.role === role ? "bg-primary/10 font-medium" : ""
                          )}
                        >
                          {role}
                        </div>
                      ))}
                      
                      {/* All Roles Section */}
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-t sticky top-0">
                        All Roles
                      </div>
                      {ROLES.filter(role => !getSuggestedRolesForCompany(newCompany.name).includes(role)).map((role) => (
                        <div
                          key={`all-${role}`}
                          onClick={() => {
                            setNewCompany(prev => ({ ...prev, role }));
                            setIsRoleDropdownOpen(false);
                          }}
                          className={cn(
                            "px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-b-0",
                            newCompany.role === role ? "bg-primary/10 font-medium" : ""
                          )}
                        >
                          {role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setIsCompanySearchFocused(false); setIsRoleDropdownOpen(false); }}>Cancel</Button>
                <Button size="sm" onClick={() => { handleAddManualCompany(); setIsCompanySearchFocused(false); setIsRoleDropdownOpen(false); }} disabled={!newCompany.name.trim() || !newCompany.role}>Add to List</Button>
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
                
                <CompanyLogo name={entity.name} size="md" />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{entity.name}</h3>
                  <p className="text-sm text-muted-foreground">Role: {entity.role}</p>
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

  // STEP 7: THANK YOU
  const renderStep7 = () => (
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
    <div 
      className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900"
      onClick={() => { setIsSearchFocused(false); setIsCountrySearchFocused(false); setIsEducationLevelFocused(false); setIsGenderFocused(false); setIsGradMonthFocused(false); setIsGradYearFocused(false); setIsDegreeSearchFocused(false); }}
    >
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
        {state.step <= 6 && <StepIndicator currentStep={state.step} totalSteps={totalSteps} />}
        
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
            {state.step === 7 && renderStep7()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
