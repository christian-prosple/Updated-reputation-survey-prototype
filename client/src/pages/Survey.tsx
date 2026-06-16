import { useEffect, useMemo, useRef, useState } from"react";
import { Link } from"wouter";
import BrandLogo from"@/components/BrandLogo";
import { useSurvey, ROLES, RoleType, CompanyEntity, GENDERS, EDUCATION_STATUSES, ALL_COMPANY_NAMES, COMPANIES_BY_ROLE } from"@/hooks/use-survey";
import { useSurveyBackend } from"@/hooks/use-survey-backend";
import { DEGREE_TAXONOMY, ALL_DEGREES, DEGREE_CATEGORIES } from"@/data/degrees";
import { CITIES, formatCity } from"@/data/cities";
import { StepIndicator } from"@/components/StepIndicator";
import { Button } from"@/components/ui/button-custom";
import { Textarea } from"@/components/ui/textarea";
import { motion, AnimatePresence, Reorder } from"framer-motion";
import { ChevronRight, ChevronLeft, ChevronDown, GripVertical, CheckCircle2, RefreshCw, Search, X, Settings } from"lucide-react";
import { cn } from"@/lib/utils";
import { useSurveyConfig } from"@/hooks/use-survey-config";

interface ManualCompany {
 name: string;
 role: string;
}

// Countries with ISO codes for flags
const COUNTRIES = [
 { name:"Australia", code:"AU" },
 { name:"Austria", code:"AT" },
 { name:"Belgium", code:"BE" },
 { name:"Brazil", code:"BR" },
 { name:"Canada", code:"CA" },
 { name:"China", code:"CN" },
 { name:"Denmark", code:"DK" },
 { name:"Finland", code:"FI" },
 { name:"France", code:"FR" },
 { name:"Germany", code:"DE" },
 { name:"Hong Kong", code:"HK" },
 { name:"India", code:"IN" },
 { name:"Indonesia", code:"ID" },
 { name:"Ireland", code:"IE" },
 { name:"Israel", code:"IL" },
 { name:"Italy", code:"IT" },
 { name:"Japan", code:"JP" },
 { name:"Malaysia", code:"MY" },
 { name:"Mexico", code:"MX" },
 { name:"Netherlands", code:"NL" },
 { name:"New Zealand", code:"NZ" },
 { name:"Norway", code:"NO" },
 { name:"Philippines", code:"PH" },
 { name:"Poland", code:"PL" },
 { name:"Portugal", code:"PT" },
 { name:"Saudi Arabia", code:"SA" },
 { name:"Singapore", code:"SG" },
 { name:"South Africa", code:"ZA" },
 { name:"South Korea", code:"KR" },
 { name:"Spain", code:"ES" },
 { name:"Sweden", code:"SE" },
 { name:"Switzerland", code:"CH" },
 { name:"Taiwan", code:"TW" },
 { name:"Thailand", code:"TH" },
 { name:"Turkey", code:"TR" },
 { name:"United Arab Emirates", code:"AE" },
 { name:"United Kingdom", code:"GB" },
 { name:"United States", code:"US" },
 { name:"Vietnam", code:"VN" },
];

// Helper to get flag URL from country code
const getFlagUrl = (code: string) => 
 `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

// Company domain mapping for logo fetching
const COMPANY_DOMAINS: Record<string, string> = {
 // Banks & Finance
"Commonwealth Bank":"commbank.com.au",
"Westpac":"westpac.com.au",
"Westpac Group":"westpac.com.au",
"NAB":"nab.com.au",
"NAB Australia":"nab.com.au",
"ANZ":"anz.com.au",
"ANZ Bank":"anz.com.au",
"Macquarie Group":"macquarie.com",
"Reserve Bank of Australia":"rba.gov.au",
"Australian Taxation Office (ATO)":"ato.gov.au",
"AustralianSuper":"australiansuper.com",
"AMP":"amp.com.au",
"Munich Re":"munichre.com",
"Swiss Re Australia":"swissre.com",
"RGA":"rgare.com",
"JPMorganChase Australia":"jpmorgan.com",
"Goldman Sachs Australia":"goldmansachs.com",
"UBS Australia":"ubs.com",
"Morgan Stanley Australia":"morganstanley.com",
"Citi Group Australia":"citi.com",
"Bank of America":"bankofamerica.com",
"Barrenjoey (Barclays)":"barrenjoey.com",
"Jefferies Australia":"jefferies.com",
"Deutsche Bank":"db.com",
"Gresham":"gresham.com.au",
"Azure Capital (Natixis)":"azurecapital.com.au",
 
 // Big 4 & Consulting
"Deloitte":"deloitte.com",
"Deloitte Australia":"deloitte.com",
"PwC":"pwc.com",
"PwC Australia":"pwc.com",
"EY":"ey.com",
"EY Australia":"ey.com",
"EY-Parthenon":"ey.com",
"KPMG":"kpmg.com",
"KPMG Australia":"kpmg.com",
"BDO Australia":"bdo.com.au",
"Grant Thornton Australia":"grantthornton.com.au",
"RSM Australia":"rsm.global",
"Pitcher Partners":"pitcher.com.au",
"Grant Samuel":"grantsamuel.com.au",
"McGrathNicol":"mcgrathnicol.com",
"KordaMentha":"kordamentha.com",
"FTI Consulting":"fticonsulting.com",
"Crowe Australia":"crowe.com",
"Moore Australia":"moore-australia.com.au",
"McKinsey & Company":"mckinsey.com",
"McKinsey & Company Australia":"mckinsey.com",
"BCG":"bcg.com",
"Boston Consulting Group Australia":"bcg.com",
"Bain & Company":"bain.com",
"Bain & Company Australia":"bain.com",
"Accenture":"accenture.com",
"Accenture Australia":"accenture.com",
"Kearney":"kearney.com",
"Oliver Wyman":"oliverwyman.com",
"L.E.K. Consulting":"lek.com",
"OC&C Strategy Consultants":"occstrategy.com",
"Altman Solon Australia":"altmansolon.com",
"Partners in Performance":"pip.global",
"Nous Group":"nousgroup.com",
"Strategy&":"strategyand.pwc.com",
"Publicis Sapient":"publicissapient.com",
 
 // Tech
"Google":"google.com",
"Google AU":"google.com",
"Microsoft":"microsoft.com",
"Microsoft Australia":"microsoft.com",
"Amazon":"amazon.com",
"Amazon AU":"amazon.com",
"Apple":"apple.com",
"Apple Australia":"apple.com",
"Meta":"meta.com",
"Meta Australia":"meta.com",
"Netflix":"netflix.com",
"Atlassian":"atlassian.com",
"Atlassian Australia":"atlassian.com",
"Canva":"canva.com",
"Salesforce":"salesforce.com",
"Salesforce Australia":"salesforce.com",
"IBM":"ibm.com",
"IBM Australia":"ibm.com",
"Oracle":"oracle.com",
"SAP":"sap.com",
"Cisco":"cisco.com",
"Intel":"intel.com",
"NVIDIA":"nvidia.com",
"Adobe":"adobe.com",
"Adobe AU":"adobe.com",
"Spotify":"spotify.com",
"Uber":"uber.com",
"Airbnb":"airbnb.com",
"Stripe":"stripe.com",
"TikTok Australia & New Zealand":"tiktok.com",
"Airwallex":"airwallex.com",
"ZipCo":"zip.co",
"HelloFresh":"hellofresh.com.au",
"Planet Innovation":"planetinnovation.com",
"Luxury Escapes":"luxuryescapes.com",
"Vow":"vowfood.com",
"Jane Street":"janestreet.com",
"Optiver":"optiver.com",
"Xero Australia":"xero.com",
"Dell Technologies":"dell.com",
"WiseTech Global":"wisetechglobal.com",
"CyberCX":"cybercx.com.au",
"Quantium":"quantium.com",
"Palantir Australia":"palantir.com",
 
 // Law Firms
"Herbert Smith Freehills":"herbertsmithfreehills.com",
"King & Wood Mallesons":"kwm.com",
"Allens":"allens.com.au",
"Clayton Utz":"claytonutz.com",
"Ashurst":"ashurst.com",
"MinterEllison":"minterellison.com",
"Gilbert + Tobin":"gtlaw.com.au",
"Corrs Chambers Westgarth":"corrs.com.au",
"Baker McKenzie":"bakermckenzie.com",
"White & Case":"whitecase.com",
"K&L Gates":"klgates.com",
"Pinsent Masons":"pinsentmasons.com",
 
 // Aviation & Aerospace
"Qantas":"qantas.com",
"Virgin Australia":"virginaustralia.com",
"Lockheed Martin":"lockheedmartin.com",
"Boeing Australia":"boeing.com",
"Airbus Australia":"airbus.com",
"Raytheon":"rtx.com",
"Northrop Grumman Australia":"northropgrumman.com",
"BAE Systems Australia":"baesystems.com",
"ADF Careers":"defence.gov.au",
"Thales Australia":"thalesgroup.com",
"QinetiQ Australia":"qinetiq.com",
"Nova Systems":"novasystems.com",
"ASC":"asc.com.au",
"CAE Australia":"cae.com",
"Rohde & Schwarz Australia":"rohde-schwarz.com",
 
 // Telecom
"Telstra":"telstra.com.au",
"Optus":"optus.com.au",
 
 // Mining & Resources
"BHP":"bhp.com",
"Rio Tinto":"riotinto.com",
"Woodside":"woodside.com",
"Santos":"santos.com",
 
 // Retail
"Wesfarmers":"wesfarmers.com.au",
"Woolworths":"woolworths.com.au",
"Coles":"coles.com.au",
 
 // Healthcare
"CSL":"csl.com",
"Cochlear":"cochlear.com",
"ResMed":"resmed.com",
 
 // Construction & Property
"Transurban":"transurban.com",
"Lendlease":"lendlease.com",
"Mirvac":"mirvac.com",
"Stockland":"stockland.com.au",
"Multiplex Australia":"multiplex.global",
"John Holland":"johnholland.com.au",
"CPB Contractors AU":"cpbcon.com.au",
"AECOM":"aecom.com",
"Laing O'Rourke":"laingorourke.com",
"Downer Group":"downergroup.com",
"Bechtel Australia":"bechtel.com",
"Custom Built New Homes & Renovations":"custombuilt.com.au",
"Built":"built.com.au",
 
 // Insurance
"Suncorp":"suncorp.com.au",
"QBE Insurance":"qbe.com",
"IAG":"iag.com.au",
"Medibank":"medibank.com.au",
"NIB":"nib.com.au",
"Bupa":"bupa.com.au",
 
 // Marketing & Media
"L'Oréal Australia":"loreal.com",
"Procter & Gamble":"pg.com",
"Unilever":"unilever.com",
"Ogilvy Australia":"ogilvy.com",
"Leo Burnett Australia":"leoburnett.com",
"Disney Studios Australia":"disney.com",
"NBCUniversal Australia":"nbcuniversal.com",
"Village Roadshow Theme Parks":"vrtp.com.au",
"Paramount Australia & New Zealand":"paramount.com",
"Octagon":"octagon.com",
 
 // Environment & Science
"CSIRO":"csiro.au",
"Umwelt Australia":"umwelt.com.au",
"Ecology & Heritage Partners":"ehpartners.com.au",
"Urbis":"urbis.com.au",
"Department of Transport and Main Roads":"tmr.qld.gov.au",
"Sunshine Coast Council (SCC)":"sunshinecoast.qld.gov.au",
"SLR Consulting":"slrconsulting.com",
"GHD":"ghd.com",
"Worley":"worley.com",
"Hydro Tasmania":"hydro.com.au",
"Clean Energy Regulator":"cleanenergyregulator.gov.au",
"Taylor Fry":"taylorfry.com.au",
"Finity Consulting":"finity.com.au",
"Rice Warner":"ricewarner.com",
 
 // Architecture
"BVN":"bvn.com.au",
"Woods Bagot":"woodsbagot.com",
"Cox Architecture":"coxarchitecture.com.au",
"Hassell":"hassellstudio.com",
"Architectus":"architectus.com.au",
"HDR":"hdrinc.com",
"Rothelowman Australia":"rothelowman.com.au",
"Hayball":"hayball.com.au",
"Gray Puksand":"graypuksand.com.au",
"DesignInc Australia":"designinc.com.au",
"i2C Architects":"i2c.com.au",
"Stantec Australia":"stantec.com",
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
const CompanyLogo = ({ name, size ="md" }: { name: string; size?:"sm" |"md" |"lg" }) => {
 const [hasError, setHasError] = useState(false);
 
 const sizeClasses = {
 sm:"w-6 h-6",
 md:"w-8 h-8", 
 lg:"w-12 h-12"
 };
 
 const textSizeClasses = {
 sm:"text-[10px]",
 md:"text-xs",
 lg:"text-sm"
 };
 
 const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
 
 return (
 <div className={`${sizeClasses[size]} rounded-none bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200`}>
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
 useSurveyBackend(state, actions);
 const cfg = useSurveyConfig();
 const [activePair, setActivePair] = useState<[CompanyEntity, CompanyEntity] | null>(null);
 const [activeAspectPair, setActiveAspectPair] = useState<[string, string] | null>(null);

 const ASPECT_OPTIONS = [
"Company reputation",
"Salary and benefits",
"Career opportunities",
"Diversity and inclusion",
"Senior management",
"Culture and values",
"Work life balance",
 ];

 const [newCompany, setNewCompany] = useState<ManualCompany>({ name:"", role:"" });
 const [isAdding, setIsAdding] = useState(false);
 const [isRolePopupOpen, setIsRolePopupOpen] = useState(false);
 const [rolePopupSearchQuery, setRolePopupSearchQuery] = useState("");
 const [isCustomCompany, setIsCustomCompany] = useState(false);
 const [showFullTaxonomy, setShowFullTaxonomy] = useState(false);
 const [roleSearchQuery, setRoleSearchQuery] = useState("");
 const [isSearchFocused, setIsSearchFocused] = useState(false);
 const [isCompanySearchFocused, setIsCompanySearchFocused] = useState(false);
 const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
 const [isCountrySearchFocused, setIsCountrySearchFocused] = useState(false);
 const [isEducationLevelFocused, setIsEducationLevelFocused] = useState(false);
 const [isGenderFocused, setIsGenderFocused] = useState(false);
 const [isGradMonthFocused, setIsGradMonthFocused] = useState(false);
 const [pickerYear, setPickerYear] = useState<number | null>(null);
 const [degreeSearchQuery, setDegreeSearchQuery] = useState("");
 const [isDegreeSearchFocused, setIsDegreeSearchFocused] = useState(false);
 const [isCitySearchFocused, setIsCitySearchFocused] = useState(false);

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
 if (!newCompany.name.trim() || !newCompany.role) return;
 
 const entity: CompanyEntity = {
 name: newCompany.name.trim(),
 role: newCompany.role as RoleType,
 id: `manual-${Date.now()}-${newCompany.name.trim()}|${newCompany.role}`
 };
 
 actions.updateFinalRanking([entity, ...state.finalRanking]);
 setNewCompany({ name:"", role:"" });
 setIsAdding(false);
 setIsRolePopupOpen(false);
 setIsCompanySearchFocused(false);
 setRolePopupSearchQuery("");
 setIsCustomCompany(false);
 };

 const handleCompanySelected = (companyName: string, isCustom: boolean = false) => {
 setNewCompany(prev => ({ ...prev, name: companyName }));
 setIsCompanySearchFocused(false);
 setIsCustomCompany(isCustom);
 setIsRolePopupOpen(true);
 };

 // --- DERIVED STATE ---
 const totalSteps = 11; 

 const targetPairwiseCount = useMemo(() => {
 const n = state.selectedCompanies.length;
 if (n < 2) return 0;
 const maxPossible = (n * (n - 1)) / 2;
 return Math.min(20, maxPossible);
 }, [state.selectedCompanies.length]);

 // Minimum comparisons required before showing"Finish Early" button
 const minComparisonsToFinish = useMemo(() => {
 return Math.min(state.selectedCompanies.length, 20);
 }, [state.selectedCompanies.length]);

 // --- EFFECT: Initialize Companies for Step 7 (Company Recognition) ---
 useEffect(() => {
 if (state.step !== 7 || state.displayedCompanies.length > 0) return;
 const careerPaths = state.selectedRoles;
 fetch("/api/survey/employers", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({ careerPaths }),
 })
 .then((r) => r.json())
 .then((data: { employers?: { id: string; name: string }[] }) => {
 if (data.employers && data.employers.length > 0) {
 actions.setDisplayedCompanies(
 data.employers.map((e) => ({ id: e.id, name: e.name, role: careerPaths[0] ??"" }))
 );
 } else {
 actions.generateCompanyPool();
 }
 })
 .catch(() => actions.generateCompanyPool());
 }, [state.step]);

 // --- EFFECT: Initialize Final Ranking for Step 9 (Final Ranking) ---
 useEffect(() => {
 if (state.step === 9 && state.finalRanking.length === 0) {
 actions.generateFinalRanking();
 }
 }, [state.step]);

 // --- EFFECT: Initialize company pairwise session when entering step 8 ---
 useEffect(() => {
 if (state.step === 8 && state.sessionOrder.length === 0 && state.selectedCompanies.length >= 2) {
 actions.initializePairwiseSession();
 }
 }, [state.step, state.sessionOrder.length, state.selectedCompanies.length]);

 // --- EFFECT: Initialize aspect pairwise session when entering step 5 ---
 useEffect(() => {
 if (state.step === 5 && Object.keys(state.aspectEloRatings).length === 0 && state.selectedAspects.length >= 2) {
 actions.initializeAspectPairwiseSession();
 }
 }, [state.step]);

 // --- EFFECT: Reset activeAspectPair when leaving step 5 ---
 useEffect(() => {
 if (state.step !== 5) {
 setActiveAspectPair(null);
 }
 }, [state.step]);

 // --- EFFECT: Manage Aspect Pairwise Loop ---
 useEffect(() => {
 if (state.step !== 5 || !state.aspectEloRatings || Object.keys(state.aspectEloRatings).length === 0) return;
 if (activeAspectPair) return;

 const MAX_ASPECT_PAIRS = Math.min(5, state.selectedAspects.length - 1);
 if (state.aspectPairwiseCount >= MAX_ASPECT_PAIRS) {
 const sorted = [...state.selectedAspects].sort(
 (a, b) => (state.aspectEloRatings[b] || 1500) - (state.aspectEloRatings[a] || 1500)
 );
 actions.reorderAspects(sorted);
 actions.nextStep();
 return;
 }

 // Find next incomplete pair
 const aspects = state.selectedAspects;
 for (let i = 0; i < aspects.length; i++) {
 for (let j = i + 1; j < aspects.length; j++) {
 const key = [aspects[i], aspects[j]].sort().join("|");
 if (!state.aspectCompletedPairs.has(key)) {
 setActiveAspectPair([aspects[i], aspects[j]]);
 return;
 }
 }
 }

 // All pairs exhausted early
 const sorted = [...state.selectedAspects].sort(
 (a, b) => (state.aspectEloRatings[b] || 1500) - (state.aspectEloRatings[a] || 1500)
 );
 actions.reorderAspects(sorted);
 actions.nextStep();
 }, [state.step, activeAspectPair, state.aspectPairwiseCount, state.aspectCompletedPairs, state.aspectEloRatings]);

 const CHAIN_LIMIT = 8;

 // --- FIX 7: Build id→company map once ---
 const companyMap = useMemo(() => {
 const map = new Map<string, CompanyEntity>();
 state.selectedCompanies.forEach(c => map.set(c.id, c));
 return map;
 }, [state.selectedCompanies]);

 // --- FIX 2: Recency set with null filtering ---
 const recentlyShownSet = useMemo(() => {
 const ids = state.comparisonHistory
 .slice(-2)
 .flatMap(h => h.pair)
 .filter(Boolean);
 return new Set(ids);
 }, [state.comparisonHistory]);

 const isPairCompleted = (idA: string, idB: string): boolean => {
 const key = [idA, idB].sort().join("|");
 return state.completedPairs.has(key);
 };

 // --- HELPER: 3-Stage Pair Selection ---
 const getNextPair = (): { pair: [CompanyEntity, CompanyEntity]; isChain: boolean; newChainIndex?: number } | null => {
 const candidates = state.selectedCompanies;
 if (candidates.length < 2) return null;
 const n = candidates.length;

 // FIX 1: Stage A — loop forward, skip completed/invalid links, return new chainIndex
 const chainCap = Math.min(n - 1, CHAIN_LIMIT);
 if (state.chainIndex < chainCap && state.sessionOrder.length > 0) {
 for (let i = state.chainIndex; i < chainCap; i++) {
 const idA = state.sessionOrder[i];
 const idB = state.sessionOrder[i + 1];
 if (idA && idB && !isPairCompleted(idA, idB)) {
 const a = companyMap.get(idA);
 const b = companyMap.get(idB);
 if (a && b) {
 return { pair: [a, b], isChain: true, newChainIndex: i + 1 };
 }
 }
 }
 }

 // Stage B: Coverage booster — ensure every company has appeared at least once
 const unseenIds = candidates
 .filter(c => (state.appearancesInSession[c.id] || 0) === 0)
 .map(c => c.id);

 if (unseenIds.length > 0) {
 const unseenId = unseenIds[0];

 const sortedByElo = [...candidates].sort((a, b) => {
 return (state.eloRatings[b.id] || 1500) - (state.eloRatings[a.id] || 1500);
 });
 const medianIdx = Math.floor(sortedByElo.length / 2);

 // FIX 3: After median, sort by LEAST appearances for real diversity
 const pivotCandidates = [
 sortedByElo[medianIdx]?.id,
 ...candidates
 .filter(c => c.id !== unseenId)
 .sort((a, b) => (state.appearancesInSession[a.id] || 0) - (state.appearancesInSession[b.id] || 0))
 .map(c => c.id)
 ].filter((id): id is string => !!id && id !== unseenId);

 for (const pivotId of pivotCandidates) {
 if (!isPairCompleted(unseenId, pivotId)) {
 const a = companyMap.get(unseenId);
 const b = companyMap.get(pivotId);
 if (a && b) {
 if (recentlyShownSet.has(unseenId) && recentlyShownSet.has(pivotId)) {
 continue;
 }
 return { pair: [a, b], isChain: false };
 }
 }
 }

 for (const pivotId of pivotCandidates) {
 if (!isPairCompleted(unseenId, pivotId)) {
 const a = companyMap.get(unseenId);
 const b = companyMap.get(pivotId);
 if (a && b) return { pair: [a, b], isChain: false };
 }
 }
 }

 // Stage C: Neighbour tightening — compare adjacent by Elo ranking
 const sortedByElo = [...candidates].sort((a, b) => {
 return (state.eloRatings[b.id] || 1500) - (state.eloRatings[a.id] || 1500);
 });

 type ScoredPair = { a: CompanyEntity; b: CompanyEntity; score: number };
 const neighbourPairs: ScoredPair[] = [];
 const TARGET_APPEARANCES = 3;

 for (let gap = 1; gap <= Math.min(3, sortedByElo.length - 1); gap++) {
 for (let i = 0; i < sortedByElo.length - gap; i++) {
 const a = sortedByElo[i];
 const b = sortedByElo[i + gap];
 if (isPairCompleted(a.id, b.id)) continue;

 const eloA = state.eloRatings[a.id] || 1500;
 const eloB = state.eloRatings[b.id] || 1500;
 const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
 const closenessTo50 = Math.abs(expectedA - 0.5);
 // FIX 4: Gentle tie-breaker — only penalize excess appearances above target
 const combinedAppearances = (state.appearancesInSession[a.id] || 0) + (state.appearancesInSession[b.id] || 0);
 const score = closenessTo50 + Math.max(0, combinedAppearances - TARGET_APPEARANCES * 2) * 0.002;

 neighbourPairs.push({ a, b, score });
 }
 }

 neighbourPairs.sort((x, y) => x.score - y.score);

 for (const { a, b } of neighbourPairs) {
 if (!recentlyShownSet.has(a.id) || !recentlyShownSet.has(b.id)) {
 return { pair: [a, b], isChain: false };
 }
 }

 if (neighbourPairs.length > 0) {
 return { pair: [neighbourPairs[0].a, neighbourPairs[0].b], isChain: false };
 }

 for (let i = 0; i < candidates.length; i++) {
 for (let j = i + 1; j < candidates.length; j++) {
 if (!isPairCompleted(candidates[i].id, candidates[j].id)) {
 return { pair: [candidates[i], candidates[j]], isChain: false };
 }
 }
 }

 return null;
 };

 const activePairMeta = useRef<{ isChain: boolean; newChainIndex?: number }>({ isChain: false });

 // --- EFFECT: Manage Company Pairwise Loop ---
 useEffect(() => {
 if (state.step === 8 && !activePair && state.sessionOrder.length > 0) {
 if (state.pairwiseCount >= targetPairwiseCount) {
 actions.nextStep();
 return;
 }
 
 const result = getNextPair();
 if (result) {
 setActivePair(result.pair);
 activePairMeta.current = { isChain: result.isChain, newChainIndex: result.newChainIndex };
 } else {
 actions.nextStep();
 }
 }
 }, [state.step, activePair, state.completedPairs, state.pairwiseCount, targetPairwiseCount, state.sessionOrder.length]);


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
 
 actions.recordComparison({
 pair: [a.id, b.id],
 winnerId,
 isChain: activePairMeta.current.isChain,
 newChainIndex: activePairMeta.current.newChainIndex,
 });
 
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
"January","February","March","April","May","June",
"July","August","September","October","November","December"
 ];
 const currentYear = new Date().getFullYear();
 const years = Array.from({ length: currentYear - 2015 + 6 }, (_, i) => String(2015 + i));

 // Derived from config; fall back to hardcoded lists if config not loaded yet
 const gendersToShow = cfg.questionOptions("personal","gender");
 const educationLevelsFromCfg = cfg.questionOptions("education","educationLevel");

 // Education level options (fallback when config not yet loaded)
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

 // Check if step 0 info (location, gender) is complete
 const isStep0Valid = () => {
 const { gender, preferredCity } = state.personalInfo;
 const hasValidGender = gender.length > 0;
 const hasValidCity = preferredCity.trim().length > 0;
 return hasValidGender && hasValidCity;
 };

 // Check if step 1 info (education details) is complete
 const isStep1Valid = () => {
 const { country, university, graduationMonth, graduationYear } = state.personalInfo;
 const hasValidCountry = country.trim().length > 0;
 const hasValidSchool = university.trim().length > 0;
 const hasValidGraduation = graduationMonth.length > 0 && graduationYear.length > 0;
 const hasSelectedDegrees = state.selectedDegrees.length > 0;
 return hasValidCountry && hasValidSchool && hasValidGraduation && hasSelectedDegrees;
 };
 
 // Helper to check if graduation date is in the future
 const isGraduationInFuture = () => {
 const { graduationMonth, graduationYear } = state.personalInfo;
 if (!graduationMonth || !graduationYear) return true; // default to"currently studying"
 
 const monthIndex = months.indexOf(graduationMonth);
 const year = parseInt(graduationYear);
 const gradDate = new Date(year, monthIndex, 1);
 const today = new Date();
 
 return gradDate > today;
 };

 // STEP 0: PERSONAL INFO - Preferred Work Location, Gender
 const renderStep0 = () => (
 <div className="space-y-6">
 <div className="text-center mb-8">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 {cfg.pageTitle("personal","Let's start with a bit about you")}
 </p>
 </div>

 <div className="max-w-xl mx-auto space-y-6">
 {/* Preferred Work Location (City) */}
 <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
 <label className="text-sm font-medium text-slate-700">{cfg.questionLabel("personal","preferredCity","Preferred work location (city)")} <span className="text-red-500">*</span></label>
 <input
 type="text"
 value={state.personalInfo.preferredCity}
 onChange={(e) => actions.updatePersonalInfo("preferredCity", e.target.value)}
 onFocus={() => setIsCitySearchFocused(true)}
 onClick={() => setIsCitySearchFocused(true)}
 placeholder="e.g. Sydney, Australia"
 className="w-full p-3 border-2 border-slate-200 rounded-none focus:border-primary focus:outline-none transition-colors"
 data-testid="input-preferred-city"
 />
 
 {/* City dropdown suggestions - only show when typing */}
 {isCitySearchFocused && state.personalInfo.preferredCity.length > 0 && (
 <div 
 className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none max-h-64 overflow-y-auto z-50"
 >
 {CITIES
 .filter(c => {
 const formatted = formatCity(c);
 return !state.personalInfo.preferredCity || 
 formatted.toLowerCase().includes(state.personalInfo.preferredCity.toLowerCase()) ||
 c.city.toLowerCase().includes(state.personalInfo.preferredCity.toLowerCase()) ||
 c.country.toLowerCase().includes(state.personalInfo.preferredCity.toLowerCase());
 })
 .slice(0, 50)
 .map((city) => (
 <div
 key={`${city.city}-${city.country}`}
 onClick={() => {
 actions.updatePersonalInfo("preferredCity", formatCity(city));
 setIsCitySearchFocused(false);
 }}
 className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
 >
 <span className="text-sm font-medium text-slate-700">{formatCity(city)}</span>
 </div>
 ))}
 {state.personalInfo.preferredCity && CITIES.filter(c => {
 const formatted = formatCity(c);
 return formatted.toLowerCase().includes(state.personalInfo.preferredCity.toLowerCase()) ||
 c.city.toLowerCase().includes(state.personalInfo.preferredCity.toLowerCase()) ||
 c.country.toLowerCase().includes(state.personalInfo.preferredCity.toLowerCase());
 }).length === 0 && (
 <div className="px-4 py-3 text-sm text-muted-foreground">
 No matching cities found
 </div>
 )}
 </div>
 )}
 </div>

 {/* Gender */}
 <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
 <label className="text-sm font-medium text-slate-700">{cfg.questionLabel("personal","gender","Gender")} <span className="text-red-500">*</span></label>
 <div className="relative">
 <button
 type="button"
 onClick={() => setIsGenderFocused(!isGenderFocused)}
 className={cn(
"w-full p-3 pr-3 border-2 rounded-none text-left transition-colors bg-white flex items-center justify-between text-slate-900",
 isGenderFocused ?"border-primary" :"border-slate-200"
 )}
 data-testid="select-gender"
 >
 <span>{state.personalInfo.gender ||"Select gender"}</span>
 <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isGenderFocused &&"rotate-180")} />
 </button>
 </div>
 
 {/* Gender dropdown */}
 {isGenderFocused && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none max-h-64 overflow-y-auto z-50">
 {(gendersToShow.length > 0 ? gendersToShow : [...GENDERS,"Other"]).map((g) => (
 <div
 key={g}
 onClick={() => {
 actions.updatePersonalInfo("gender", g);
 setIsGenderFocused(false);
 }}
 className={cn(
"px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
 state.personalInfo.gender === g ?"bg-primary/10 text-slate-900" :"text-slate-700"
 )}
 >
 {g}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="flex justify-center mt-12 gap-4">
 <Button 
 onClick={() => actions.nextStep()} 
 disabled={!isStep0Valid()}
 size="lg"
 className="w-full max-w-[160px]"
 data-testid="button-continue-personal"
 >
 Continue <ChevronRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 );

 // STEP 1: EDUCATION INFO - Country of study, Education level, Study fields, School, Graduation date
 const renderStep1 = () => (
 <div className="space-y-6">
 <div className="text-center mb-8">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 {cfg.pageTitle("education","Tell us about your education")}
 </p>
 </div>

 <div className="max-w-xl mx-auto space-y-6">
 {/* Country */}
 <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
 <label className="text-sm font-medium text-slate-700">{cfg.questionLabel("education","country","Country of study")} <span className="text-red-500">*</span></label>
 <input
 type="text"
 value={state.personalInfo.country}
 onChange={(e) => actions.updatePersonalInfo("country", e.target.value)}
 onFocus={() => setIsCountrySearchFocused(true)}
 onClick={() => setIsCountrySearchFocused(true)}
 placeholder="e.g. Australia"
 className="w-full p-3 border-2 border-slate-200 rounded-none focus:border-primary focus:outline-none transition-colors"
 data-testid="input-country"
 />
 
 {/* Country dropdown suggestions */}
 {isCountrySearchFocused && (
 <div 
 className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none max-h-64 overflow-y-auto z-50"
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
 className="w-8 h-8 rounded-none object-cover border border-slate-200"
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

 {/* Education Level */}
 <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
 <label className="text-sm font-medium text-slate-700">{cfg.questionLabel("education","educationLevel","Highest education level (completed or in progress)")} <span className="text-red-500">*</span></label>
 <div className="relative">
 <button
 type="button"
 onClick={() => setIsEducationLevelFocused(!isEducationLevelFocused)}
 className={cn(
"w-full p-3 pr-3 border-2 rounded-none text-left transition-colors bg-white flex items-center justify-between text-slate-900",
 isEducationLevelFocused ?"border-primary" :"border-slate-200"
 )}
 data-testid="select-education-level"
 >
 <span>{state.personalInfo.educationLevel ||"Select education level"}</span>
 <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isEducationLevelFocused &&"rotate-180")} />
 </button>
 </div>
 
 {/* Education level dropdown */}
 {isEducationLevelFocused && (
 <div 
 className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none max-h-48 overflow-y-auto z-50"
 >
 {(educationLevelsFromCfg.length > 0 ? educationLevelsFromCfg : EDUCATION_LEVELS).map((level) => (
 <div
 key={level}
 onClick={() => {
 actions.updatePersonalInfo("educationLevel", level);
 setIsEducationLevelFocused(false);
 }}
 className={cn(
"px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 text-sm font-medium",
 state.personalInfo.educationLevel === level ?"bg-primary/10 text-slate-900" :"text-slate-700"
 )}
 >
 {level}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Area of Study - inline searchable multi-select */}
 <div
 className="space-y-2 relative"
 onClick={(e) => e.stopPropagation()}
 onBlur={(e) => {
 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
 setIsDegreeSearchFocused(false);
 }
 }}
 tabIndex={-1}
 >
 <label className="text-sm font-medium text-slate-700">
 {cfg.questionLabel("education","selectedDegrees","Study field(s)")} <span className="text-red-500">*</span>
 </label>
 <div className={cn(
"min-h-[48px] w-full p-2 bg-white border-2 rounded-none flex flex-wrap gap-2 items-center transition-all duration-200 cursor-text",
 isDegreeSearchFocused ?"border-primary" :"border-slate-200"
 )}
 onClick={() => setIsDegreeSearchFocused(true)}
 >
 <div className="flex items-center pl-1">
 <Search className="w-4 h-4 text-slate-400" />
 </div>
 
 <AnimatePresence>
 {state.selectedDegrees.map((degree) => (
 <motion.div
 key={degree}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.8 }}
 className="bg-primary/10 text-primary-foreground border border-primary/20 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold group"
 >
 <span className="text-slate-900">{degree}</span>
 <button 
 onClick={(e) => {
 e.stopPropagation();
 actions.selectDegree(degree);
 }}
 className="hover:bg-primary/20 rounded-none p-0.5 transition-colors"
 >
 <X className="w-3 h-3 text-slate-600" />
 </button>
 </motion.div>
 ))}
 </AnimatePresence>

 <input
 type="text"
 placeholder={state.selectedDegrees.length === 0 ?"Search for study fields..." :""}
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
 className="flex-1 min-w-[100px] bg-transparent border-none outline-none py-1 px-1 text-sm text-slate-900 placeholder:text-slate-400"
 data-testid="input-degree-search"
 />
 
 {/* Clear all button - only shows when degrees are selected */}
 {state.selectedDegrees.length > 0 && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 state.selectedDegrees.forEach(degree => actions.selectDegree(degree));
 }}
 className="p-1 hover:bg-slate-100 rounded-none transition-colors flex-shrink-0"
 data-testid="button-clear-degrees"
 >
 <X className="w-4 h-4 text-slate-400" />
 </button>
 )}
 </div>

 {/* Degree dropdown */}
 <AnimatePresence>
 {isDegreeSearchFocused && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 onMouseDown={(e) => {
 e.preventDefault();
 }}
 className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none max-h-64 overflow-y-auto z-50"
 >
 <div className="p-2 space-y-1">
 {degreeSearchQuery.length === 0 ? (
 ALL_DEGREES.map((degree) => {
 const isSelected = state.selectedDegrees.includes(degree);
 return (
 <div
 key={degree}
 onClick={(e) => {
 e.stopPropagation();
 handleDegreeSelection(degree);
 }}
 className={cn(
"cursor-pointer rounded-lg p-2.5 flex items-center justify-between transition-colors text-sm",
 isSelected ?"bg-primary/10" :"hover:bg-slate-50"
 )}
 >
 <span className={cn("font-medium", isSelected ?"text-slate-900 font-bold" :"text-slate-600")}>
 {degree}
 </span>
 {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
 </div>
 );
 })
 ) : (
 <>
 <div className="px-2 py-1 text-xs font-bold uppercase tracking-widest text-slate-400">
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
"cursor-pointer rounded-lg p-2.5 flex items-center justify-between transition-colors text-sm",
 isSelected ?"bg-primary/10" :"hover:bg-slate-50"
 )}
 >
 <span className={cn("font-medium", isSelected ?"text-slate-900 font-bold" :"text-slate-600")}>
 {degree}
 </span>
 {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
 </div>
 );
 })}
 {ALL_DEGREES.filter(degree => degree.toLowerCase().includes(degreeSearchQuery.toLowerCase())).length === 0 && (
 <div className="px-3 py-2 text-sm text-muted-foreground">
 No matching study fields found
 </div>
 )}
 </>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* School */}
 <div className="space-y-2">
 <label className="text-sm font-medium text-slate-700">{cfg.questionLabel("education","university","School")} <span className="text-red-500">*</span></label>
 <input
 type="text"
 value={state.personalInfo.university}
 onChange={(e) => actions.updatePersonalInfo("university", e.target.value)}
 placeholder="e.g. University of Melbourne"
 className="w-full p-3 border-2 border-slate-200 rounded-none focus:border-primary focus:outline-none transition-colors"
 data-testid="input-school"
 />
 </div>

 {/* Graduation Date - Calendar Style Picker */}
 <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
 <label className="text-sm font-medium text-slate-700">{cfg.questionLabel("education","graduation","Graduation date (expected or actual)")} <span className="text-red-500">*</span></label>
 <button
 type="button"
 onClick={() => { 
 setIsGradMonthFocused(!isGradMonthFocused); 
 if (!pickerYear) setPickerYear(parseInt(state.personalInfo.graduationYear) || currentYear);
 }}
 className={cn(
"w-full p-3 pr-3 border-2 rounded-none text-left transition-colors bg-white flex items-center justify-between text-slate-900",
 isGradMonthFocused ?"border-primary" :"border-slate-200"
 )}
 data-testid="select-graduation-date"
 >
 <span>
 {state.personalInfo.graduationMonth && state.personalInfo.graduationYear 
 ? `${state.personalInfo.graduationMonth} ${state.personalInfo.graduationYear}`
 :"Select graduation date"}
 </span>
 <div className="flex items-center gap-2">
 {state.personalInfo.graduationMonth && state.personalInfo.graduationYear && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 actions.updatePersonalInfo("graduationMonth","");
 actions.updatePersonalInfo("graduationYear","");
 }}
 className="p-0.5 hover:bg-slate-100 rounded-none"
 >
 <X className="w-4 h-4 text-slate-400" />
 </button>
 )}
 <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", isGradMonthFocused &&"rotate-180")} />
 </div>
 </button>
 
 {isGradMonthFocused && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-100 rounded-none z-50 p-4">
 <div className="flex items-center justify-between mb-4">
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setPickerYear(prev => (prev || currentYear) - 1);
 }}
 className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
 >
 <ChevronLeft className="w-5 h-5 text-slate-600" />
 </button>
 <span className="text-lg font-bold text-slate-900">{pickerYear || currentYear}</span>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setPickerYear(prev => (prev || currentYear) + 1);
 }}
 className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
 >
 <ChevronRight className="w-5 h-5 text-slate-600" />
 </button>
 </div>
 
 <div className="grid grid-cols-3 gap-2">
 {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((shortMonth, idx) => {
 const fullMonth = months[idx];
 const isSelected = state.personalInfo.graduationMonth === fullMonth && 
 state.personalInfo.graduationYear === String(pickerYear || currentYear);
 return (
 <button
 key={shortMonth}
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 actions.updatePersonalInfo("graduationMonth", fullMonth);
 actions.updatePersonalInfo("graduationYear", String(pickerYear || currentYear));
 setIsGradMonthFocused(false);
 }}
 className={cn(
"py-2.5 px-4 rounded-none text-sm font-medium transition-colors",
 isSelected 
 ?"bg-slate-800 text-white" 
 :"text-slate-600 hover:bg-slate-100"
 )}
 >
 {shortMonth}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="flex justify-center mt-12 gap-4">
 <Button 
 variant="outline"
 onClick={() => actions.prevStep()} 
 size="lg"
 className="w-full max-w-[160px] text-slate-900 border-slate-200"
 data-testid="button-back-education"
 >
 <ChevronLeft className="mr-2 w-5 h-5" /> Back
 </Button>
 <Button 
 onClick={() => actions.nextStep()} 
 disabled={!isStep1Valid()}
 size="lg"
 className="w-full max-w-[160px]"
 data-testid="button-continue-education"
 >
 Continue <ChevronRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 );

 // STEP 2: ROLE SELECTION
 const renderStep2 = () => (
 <div className="space-y-6">
 <div className="text-center mb-8">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">{cfg.questionLabel("careers","selectedRoles","What career path(s) are you most interested in?")} <span className="text-red-500">*</span></p>
 </div>

 <div className="space-y-8 max-w-2xl mx-auto w-full relative">
 {/* Search Bar with Selected Pills */}
 <div className="relative z-50">
 <div className={cn(
"min-h-[56px] w-full p-2 bg-white border-2 rounded-none flex flex-wrap gap-2 items-center transition-all duration-200",
 (isSearchFocused || roleSearchQuery) ?"border-primary" :"border-slate-200"
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
 className="bg-primary/10 text-primary-foreground border border-primary/20 px-3 py-1.5 rounded-none flex items-center gap-2 text-sm font-bold group"
 >
 <span className="text-slate-900">{role}</span>
 <button 
 onClick={(e) => {
 e.stopPropagation();
 actions.selectRole(role);
 }}
 className="hover:bg-primary/20 rounded-none p-0.5 transition-colors"
 >
 <X className="w-3.5 h-3.5 text-slate-600" />
 </button>
 </motion.div>
 ))}
 </AnimatePresence>

 <input
 type="text"
 placeholder={state.selectedRoles.length === 0 ?"Search for career paths..." :""}
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
 className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-none max-h-[400px] overflow-hidden flex flex-col z-50"
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
"cursor-pointer rounded-none p-3 flex items-center justify-between transition-colors",
 isSelected ?"bg-primary/10" :"hover:bg-slate-50"
 )}
 >
 <span className={cn("text-sm font-medium", isSelected ?"text-slate-900 font-bold" :"text-slate-600")}>
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
"cursor-pointer rounded-none p-3 flex items-center justify-between transition-colors",
 isSelected ?"bg-primary/10" :"hover:bg-slate-50"
 )}
 >
 <span className={cn("text-sm font-medium", isSelected ?"text-slate-900 font-bold" :"text-slate-600")}>
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
"cursor-pointer rounded-none p-3 flex items-center justify-between transition-colors",
 isSelected ?"bg-primary/10" :"hover:bg-slate-50"
 )}
 >
 <span className={cn("text-sm font-medium", isSelected ?"text-slate-900 font-bold" :"text-slate-600")}>
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
 What career path are you most interested in? <span className="text-red-500">*</span>
 </p>
 <p className="text-sm text-slate-500 mt-2">
 Drag and drop to sort your career paths in order of preference
 </p>
 </div>

 <div className="max-w-xl mx-auto">
 <Reorder.Group axis="y" values={state.roleOrder} onReorder={actions.reorderRoles} className="space-y-3">
 {state.roleOrder.map((role, index) => (
 <Reorder.Item key={role} value={role}>
 <div className="bg-card border border-border rounded-none p-4 transition-shadow flex items-center gap-4 cursor-grab active:cursor-grabbing">
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

 // STEP 4: ASPECTS SELECTION
 const renderStep4 = () => (
 <div className="space-y-6 h-full flex flex-col">
 <div className="text-center mb-4">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 What matters most to you in an employer? Select all that apply. <span className="text-red-500">*</span>
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
 {ASPECT_OPTIONS.map((aspect) => {
 const isSelected = state.selectedAspects.includes(aspect);
 return (
 <div
 key={aspect}
 onClick={() => actions.toggleAspect(aspect)}
 data-testid={`aspect-option-${aspect.toLowerCase().replace(/\s+/g, '-')}`}
 className={cn(
"cursor-pointer rounded-lg p-4 border transition-all duration-200 flex items-center gap-3 select-none",
 isSelected
 ?"border-primary bg-primary/5 ring-1 ring-primary/20"
 :"border-border bg-card hover:bg-secondary/50"
 )}
 >
 <div className={cn(
"w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
 isSelected ?"border-primary bg-primary text-white" :"border-muted-foreground/50"
 )}>
 {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
 </div>
 <span className={cn("text-sm font-semibold", isSelected ?"text-slate-900" :"text-foreground")}>
 {aspect}
 </span>
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
 data-testid="button-aspects-back"
 >
 <ChevronLeft className="mr-2 w-5 h-5" /> Back
 </Button>
 <Button
 onClick={() => actions.nextStep()}
 size="lg"
 className="w-full max-w-[160px]"
 data-testid="button-aspects-continue"
 >
 Continue <ChevronRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 );

 // STEP 5: ASPECTS PAIRWISE
 const renderStep5 = () => {
 const MAX_ASPECT_PAIRS = Math.min(5, state.selectedAspects.length - 1);
 return (
 <div className="flex flex-col h-full justify-center max-w-4xl mx-auto w-full">
 <div className="text-center mb-6">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 Which matters more to you?
 </p>
 </div>

 <div className="max-w-md mx-auto w-full mb-10 space-y-2">
 <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
 <span>Progress</span>
 <span>{state.aspectPairwiseCount} / {MAX_ASPECT_PAIRS}</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-none overflow-hidden border border-slate-200">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${Math.min((state.aspectPairwiseCount / MAX_ASPECT_PAIRS) * 100, 100)}%` }}
 className={cn(
"h-full transition-colors duration-500",
 state.aspectPairwiseCount >= MAX_ASPECT_PAIRS ? "bg-foreground" : "bg-primary"
 )}
 />
 </div>
 </div>

 {activeAspectPair ? (
 <div className="flex flex-row gap-3 md:gap-8 items-stretch mb-12 relative">
 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
 <button
 onClick={() => {
 actions.recordAspectComparison(activeAspectPair, activeAspectPair[0]);
 setActiveAspectPair(null);
 }}
 data-testid={`aspect-choice-a`}
 className="group w-full bg-white border-2 border-border hover:border-primary rounded-none p-6 md:p-10 transition-all duration-300 flex flex-col items-center justify-center h-[160px] md:h-[200px]"
 >
 <span className="text-lg md:text-2xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors">
 {activeAspectPair[0]}
 </span>
 <span className="mt-3 text-xs font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
 Select this →
 </span>
 </button>
 </motion.div>

 <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-none flex items-center justify-center font-bold text-slate-300 border border-slate-100 z-10 flex-shrink-0 text-xs md:text-base self-center">OR</div>

 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
 <button
 onClick={() => {
 actions.recordAspectComparison(activeAspectPair, activeAspectPair[1]);
 setActiveAspectPair(null);
 }}
 data-testid={`aspect-choice-b`}
 className="group w-full bg-white border-2 border-border hover:border-primary rounded-none p-6 md:p-10 transition-all duration-300 flex flex-col items-center justify-center h-[160px] md:h-[200px]"
 >
 <span className="text-lg md:text-2xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors">
 {activeAspectPair[1]}
 </span>
 <span className="mt-3 text-xs font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
 Select this →
 </span>
 </button>
 </motion.div>
 </div>
 ) : (
 <div className="h-48 flex items-center justify-center">
 <span className="text-slate-400">Finding next pair...</span>
 </div>
 )}

 <div className="flex flex-col items-center gap-4">
 <div className="flex gap-4 items-center mb-4">
 {state.aspectComparisonHistory.length > 0 && (
 <Button variant="outline" onClick={() => { actions.undoLastAspectComparison(); setActiveAspectPair(null); }} className="text-slate-900 border-slate-200">
 <ChevronLeft className="mr-1 w-4 h-4" /> Undo previous choice
 </Button>
 )}
 <Button variant="outline" disabled={!activeAspectPair} onClick={() => { if (activeAspectPair) { actions.recordAspectComparison(activeAspectPair, null); setActiveAspectPair(null); } }} className="text-slate-900 border-slate-200">
 Too hard, skip this pair
 </Button>
 </div>
 <div className="flex gap-4 w-full max-w-xs">
 <Button variant="secondary" size="lg" className="flex-1 text-muted-foreground" onClick={() => actions.prevStep()}>
 <ChevronLeft className="mr-1 w-5 h-5" /> Back
 </Button>
 {state.aspectPairwiseCount >= MAX_ASPECT_PAIRS && (
 <Button size="lg" className="flex-1" onClick={() => actions.nextStep()} data-testid="button-aspects-pairwise-continue">
 Continue <ChevronRight className="ml-1 w-5 h-5" />
 </Button>
 )}
 </div>
 </div>
 </div>
 );
 };

 // STEP 6: ASPECTS REORDER
 const renderStep6 = () => (
 <div className="space-y-6">
 <div className="text-center mb-8">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 Based on your choices, here's how we've ranked what matters to you. Adjust if needed.
 </p>
 </div>

 <div className="max-w-xl mx-auto">
 <Reorder.Group axis="y" values={state.aspectOrder} onReorder={actions.reorderAspects} className="space-y-3">
 {state.aspectOrder.map((aspect, index) => (
 <Reorder.Item key={aspect} value={aspect}>
 <div className="bg-card border border-border rounded-none p-4 transition-shadow flex items-center gap-4 cursor-grab active:cursor-grabbing">
 <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-muted-foreground font-bold text-sm">
 {index + 1}
 </div>
 <span className="flex-1 font-medium">{aspect}</span>
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
 <Button onClick={() => actions.nextStep()} size="lg" className="w-full max-w-[200px]" data-testid="button-aspects-order-continue">
 Confirm Order <ChevronRight className="ml-2 w-5 h-5" />
 </Button>
 </div>
 </div>
 );

 // STEP 7: COMPANY RECOGNITION
 const renderStep7 = () => {
 // Get unique company names from displayed entities
 const uniqueCompanyNames = Array.from(new Set(state.displayedCompanies.map(c => c.name)));
 
 return (
 <div className="space-y-6 h-full flex flex-col">
 <div className="text-center mb-4">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">
 Which of the following employers do you recognise? Select all that apply. <span className="text-red-500">*</span>
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
 ?"border-primary bg-primary/5 ring-1 ring-primary/20" 
 :"border-border bg-card hover:bg-secondary/50"
 )}
 >
 <div className={cn(
"w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
 isSelected ?"border-primary bg-primary text-slate-900" :"border-muted-foreground/50"
 )}>
 {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
 </div>
 <CompanyLogo name={name} size="sm" />
 <div className="flex flex-col min-w-0">
 <span className={cn("text-sm font-bold leading-tight truncate", isSelected ?"text-slate-900" :"text-foreground")}>
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

 // STEP 8: COMPANY PAIRWISE
 const renderStep8 = () => (
 <div className="flex flex-col h-full justify-center max-w-4xl mx-auto w-full">
 <div className="text-center mb-6">
 <p className="text-xl md:text-2xl font-medium text-slate-700 max-w-lg mx-auto">Which opportunity would you choose?</p>
 </div>

 <div className="max-w-md mx-auto w-full mb-10 space-y-2">
 <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
 <span>Progress</span>
 <span>{state.pairwiseCount} / {targetPairwiseCount}</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-none overflow-hidden border border-slate-200">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.min((state.pairwiseCount / targetPairwiseCount) * 100, 100)}%` }}
 className={cn(
"h-full transition-colors duration-500",
 state.pairwiseCount >= targetPairwiseCount ? "bg-foreground" : "bg-primary"
 )}
 />
 </div>
 </div>

 {activePair ? (
 <div className="flex flex-row gap-3 md:gap-8 items-stretch mb-12 relative">
 {/* Option A */}
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="flex-1"
 >
 <button
 onClick={() => handlePairChoice(activePair[0].id)}
 className="group relative w-full bg-white border-2 border-border hover:border-primary rounded-none md:rounded-none p-3 md:p-6 transition-all duration-300 text-left flex flex-col items-center justify-center h-[220px] md:h-[280px]"
 >
 <CompanyLogo name={activePair[0].name} size="lg" />
 <h3 className="text-sm md:text-2xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors mt-2 md:mt-3 line-clamp-2 w-full px-1">
 {activePair[0].name}
 </h3>
 <p className="mt-1 text-xs md:text-sm text-muted-foreground italic">
 working in
 </p>
 <p className="mt-1 text-xs md:text-sm font-bold text-slate-700 text-center line-clamp-1 w-full px-1">
 {activePair[0].role}
 </p>
 <span className="mt-2 text-xs font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
 Select this company →
 </span>
 </button>
 </motion.div>

 {/* VS Badge in middle */}
 <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-none flex items-center justify-center font-bold text-slate-300 border border-slate-100 z-10 flex-shrink-0 text-xs md:text-base">OR</div>

 {/* Option B */}
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="flex-1"
 >
 <button
 onClick={() => handlePairChoice(activePair[1].id)}
 className="group relative w-full bg-white border-2 border-border hover:border-primary rounded-none md:rounded-none p-3 md:p-6 transition-all duration-300 text-left flex flex-col items-center justify-center h-[220px] md:h-[280px]"
 >
 <CompanyLogo name={activePair[1].name} size="lg" />
 <h3 className="text-sm md:text-2xl font-bold text-center text-slate-800 group-hover:text-slate-900 transition-colors mt-2 md:mt-3 line-clamp-2 w-full px-1">
 {activePair[1].name}
 </h3>
 <p className="mt-1 text-xs md:text-sm text-muted-foreground italic">
 working in
 </p>
 <p className="mt-1 text-xs md:text-sm font-bold text-slate-700 text-center line-clamp-1 w-full px-1">
 {activePair[1].role}
 </p>
 <span className="mt-2 text-xs font-medium text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
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
 {state.pairwiseCount >= minComparisonsToFinish && (
 <Button 
 variant={state.pairwiseCount >= targetPairwiseCount ?"primary" :"secondary"}
 size="lg"
 className={cn(
"flex-1 transition-all duration-300",
 state.pairwiseCount >= targetPairwiseCount ?" shadow-primary/20 scale-105" :"text-muted-foreground"
 )}
 onClick={handleFinishSurvey}
 >
 {state.pairwiseCount >= targetPairwiseCount ?"Continue" :"Finish Early"}
 <ChevronRight className="ml-1 w-5 h-5 flex-shrink-0" />
 </Button>
 )}
 </div>
 </div>
 </div>
 );

 // STEP 9: FINAL RANKING
 const renderStep9 = () => (
 <div className="space-y-6">
 <div className="text-center mb-8">
 <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
 Nice, here's your shortlist!
 </h2>
 <p className="text-lg md:text-xl font-medium text-slate-600 max-w-lg mx-auto">
 Make any final adjustments by dragging and dropping or adding missing companies
 </p>
 </div>

 <div className="max-w-2xl mx-auto space-y-3 pb-4">
 {/* Add Company Search Card - Pinned to top */}
 <div 
 className="bg-white border border-dashed border-slate-300 rounded-none p-4 relative"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
 <input 
 type="text"
 value={newCompany.name}
 onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
 onFocus={() => setIsCompanySearchFocused(true)}
 className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm outline-none transition-all bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary"
 placeholder="Add a company..."
 data-testid="input-add-company-search"
 />
 </div>
 
 {/* Company search dropdown */}
 {isCompanySearchFocused && newCompany.name.length > 0 && (
 <div className="absolute left-4 right-4 top-full mt-1 bg-white border rounded-lg max-h-48 overflow-y-auto z-50">
 {ALL_COMPANY_NAMES
 .filter(name => name.toLowerCase().includes(newCompany.name.toLowerCase()))
 .slice(0, 8)
 .map((name) => (
 <div
 key={name}
 onClick={() => handleCompanySelected(name)}
 className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-b-0"
 data-testid={`company-option-${name.toLowerCase().replace(/\s+/g, '-')}`}
 >
 {name}
 </div>
 ))}
 {ALL_COMPANY_NAMES.filter(name => name.toLowerCase().includes(newCompany.name.toLowerCase())).length === 0 && (
 <div 
 onClick={() => handleCompanySelected(newCompany.name.trim(), true)}
 className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-primary"
 >
 Add"{newCompany.name}" as custom company
 </div>
 )}
 </div>
 )}
 </div>

 {/* Role Selection Popup */}
 {isRolePopupOpen && (
 <div 
 className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
 onClick={() => { setIsRolePopupOpen(false); setNewCompany({ name:"", role:"" }); setRolePopupSearchQuery(""); setIsCustomCompany(false); }}
 >
 <div 
 className="bg-white rounded-none w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="p-6 border-b">
 <h3 className="text-lg font-bold text-slate-900">Select a career path</h3>
 <p className="text-sm text-slate-500 mt-1">
 What career path do you want to work at <span className="font-semibold text-slate-700">{newCompany.name}</span> in?
 </p>
 
 {/* Search bar */}
 <div className="relative mt-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
 <input 
 type="text"
 value={rolePopupSearchQuery}
 onChange={(e) => setRolePopupSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none transition-all bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary"
 placeholder="Search..."
 data-testid="input-role-search"
 />
 </div>
 </div>
 
 <div className="p-4 max-h-80 overflow-y-auto">
 {/* Suggested Roles Section - only show for known companies */}
 {!isCustomCompany && getSuggestedRolesForCompany(newCompany.name).filter(role => 
 role.toLowerCase().includes(rolePopupSearchQuery.toLowerCase())
 ).length > 0 && (
 <>
 <div className="px-2 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">
 Suggested
 </div>
 {getSuggestedRolesForCompany(newCompany.name)
 .filter(role => role.toLowerCase().includes(rolePopupSearchQuery.toLowerCase()))
 .map((role) => (
 <div
 key={`suggested-${role}`}
 onClick={() => setNewCompany(prev => ({ ...prev, role }))}
 className={cn(
"px-3 py-3 hover:bg-slate-50 cursor-pointer text-sm rounded-lg mb-1 transition-all",
 newCompany.role === role ?"bg-primary/10 ring-2 ring-primary font-medium" :""
 )}
 data-testid={`role-option-suggested-${role.toLowerCase().replace(/\s+/g, '-')}`}
 >
 {role}
 </div>
 ))}
 </>
 )}
 
 {/* All Roles Section */}
 {(isCustomCompany ? ROLES : ROLES.filter(role => 
 !getSuggestedRolesForCompany(newCompany.name).includes(role)
 )).filter(role => 
 role.toLowerCase().includes(rolePopupSearchQuery.toLowerCase())
 ).length > 0 && (
 <>
 {!isCustomCompany && (
 <div className="px-2 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">
 All
 </div>
 )}
 {(isCustomCompany ? ROLES : ROLES.filter(role => 
 !getSuggestedRolesForCompany(newCompany.name).includes(role)
 ))
 .filter(role => role.toLowerCase().includes(rolePopupSearchQuery.toLowerCase()))
 .map((role) => (
 <div
 key={`all-${role}`}
 onClick={() => setNewCompany(prev => ({ ...prev, role }))}
 className={cn(
"px-3 py-3 hover:bg-slate-50 cursor-pointer text-sm rounded-lg mb-1 transition-all",
 newCompany.role === role ?"bg-primary/10 ring-2 ring-primary font-medium" :""
 )}
 data-testid={`role-option-all-${role.toLowerCase().replace(/\s+/g, '-')}`}
 >
 {role}
 </div>
 ))}
 </>
 )}
 
 {/* No results message */}
 {ROLES.filter(role => 
 role.toLowerCase().includes(rolePopupSearchQuery.toLowerCase())
 ).length === 0 && rolePopupSearchQuery.length > 0 && (
 <div className="text-center py-6 text-slate-400 text-sm">
 No roles found matching"{rolePopupSearchQuery}"
 </div>
 )}
 </div>
 
 <div className="p-4 border-t flex justify-end gap-3">
 <Button 
 variant="ghost" 
 onClick={() => { setIsRolePopupOpen(false); setNewCompany({ name:"", role:"" }); setRolePopupSearchQuery(""); setIsCustomCompany(false); }}
 >
 Cancel
 </Button>
 <Button 
 onClick={handleAddManualCompany} 
 disabled={!newCompany.role}
 data-testid="button-add-company-confirm"
 >
 Add to Shortlist
 </Button>
 </div>
 </div>
 </div>
 )}

 <Reorder.Group axis="y" values={state.finalRanking} onReorder={actions.updateFinalRanking} className="space-y-3">
 {state.finalRanking.map((entity, index) => (
 <Reorder.Item key={entity.id} value={entity}>
 <div className="group bg-card border border-border rounded-none p-4 transition-all flex items-center gap-4 cursor-grab active:cursor-grabbing">
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
 className="px-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
 onClick={() => actions.nextStep()}
 data-testid="button-next-ranking"
 >
 Next
 </Button>
 </div>
 </div>
 );

 // STEP 10: TOP PICK REASON
 const renderStep10 = () => {
 const topPick = state.finalRanking[0]?.name ??"your top pick";
 const reason = state.personalInfo.topPickReason;
 const isValid = reason.trim().length > 0;

 return (
 <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="text-center mb-10">
 <h2 className="text-4xl font-bold mb-4">{cfg.pageTitle("top_pick_reason","One last thing...")}</h2>
 <p className="text-xl text-muted-foreground">
 Why did you choose <span className="font-semibold text-slate-900">{topPick}</span> as your top pick?
 </p>
 </div>

 <div className="bg-card border border-border rounded-none p-6">
 <Textarea
 value={reason}
 onChange={(e) => actions.updatePersonalInfo("topPickReason", e.target.value)}
 placeholder="Share what stood out to you..."
 rows={6}
 className="resize-none text-base"
 data-testid="input-top-pick-reason"
 />
 </div>

 <div className="flex justify-center mt-8 pb-12 gap-4">
 <Button
 variant="outline"
 size="lg"
 onClick={() => actions.prevStep()}
 className="w-full max-w-[160px] text-slate-900 border-slate-200"
 data-testid="button-back-reason"
 >
 <ChevronLeft className="mr-2 w-5 h-5" /> Back
 </Button>
 <Button
 size="lg"
 disabled={!isValid}
 className="px-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
 onClick={() => actions.nextStep()}
 data-testid="button-submit-reason"
 >
 Submit
 </Button>
 </div>
 </div>
 );
 };

 // STEP 11: THANK YOU
 const renderStep11 = () => (
 <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
 <div className="w-20 h-20 bg-muted text-foreground border border-border rounded-none flex items-center justify-center mb-8">
 <CheckCircle2 className="w-10 h-10" />
 </div>
 <h2 className="text-4xl font-bold mb-4">{cfg.pageTitle("thankyou","Thanks for submitting your list!")}</h2>
 <p className="text-xl text-muted-foreground max-w-md mx-auto">{cfg.pageSubtitle("thankyou","Your preferences have been saved and will contribute towards Prosple's global employer rankings!")}</p>
 <p className="text-xl text-muted-foreground max-w-md mx-auto mt-4">You'll receive an email shortly with your list so you can start applying to your dream jobs.</p>
 <Button 
 size="lg"
 className="mt-8 px-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
 onClick={() => {}}
 data-testid="button-continue-prosple"
 >
 Continue to Prosple
 </Button>
 </div>
 );

 return (
 <div 
 className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900"
 onClick={() => { setIsSearchFocused(false); setIsCountrySearchFocused(false); setIsEducationLevelFocused(false); setIsGenderFocused(false); setIsGradMonthFocused(false); setIsDegreeSearchFocused(false); setIsCitySearchFocused(false); }}
 >
 {/* Brand logo */}
 <BrandLogo />

 {/* Admin link */}
 <Link
 href="/admin"
 className="fixed top-2 right-2 z-50 p-2 rounded-none bg-white/70 hover:bg-white text-slate-500 hover:text-slate-900 transition-colors"
 title="Admin"
 data-testid="link-admin"
 onClick={(e) => e.stopPropagation()}
 >
 <Settings className="w-5 h-5" />
 </Link>

 {/* Main Content */}
 <main className="flex-1 flex flex-col items-center py-8 md:py-12 px-4 md:px-8 max-w-6xl mx-auto w-full">
 {state.step <= 9 && <StepIndicator currentStep={state.step} totalSteps={totalSteps} />}
 
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
 {state.step === 8 && renderStep8()}
 {state.step === 9 && renderStep9()}
 {state.step === 10 && renderStep10()}
 {state.step === 11 && renderStep11()}
 </motion.div>
 </AnimatePresence>
 </main>
 </div>
 );
}
