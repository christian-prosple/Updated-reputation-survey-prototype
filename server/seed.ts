import { storage } from "./storage";
import {
  DEFAULT_EMPLOYER_DISPLAY_LOGIC,
  type EmployerItem,
  type SurveyPageDef,
} from "@shared/schema";

// ---------------------------------------------------------------------------
// Hardcoded source data (mirrors the original frontend prototype). On first
// boot we copy this into the database so admins can edit it going forward.
// ---------------------------------------------------------------------------

const COMPANIES_BY_ROLE: Record<string, string[]> = {
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
  "Mining & Resources Engineering": ["Rio Tinto", "BHP", "BHP Australia", "Fortescue", "Woodside Energy", "Chevron Australia", "Glencore", "Santos", "Orica", "INPEX Australia", "Shell", "ExxonMobil", "Alcoa Australia", "Iluka Resources"],
  "Agriculture & Agribusiness": ["John Deere", "Cargill Australia", "GrainCorp Australia", "JBS Australia", "Department of Agriculture, Fisheries and Forestry (DAFF)", "Department of Primary Industries (Queensland)", "Nutrien Ag Solutions", "Elders", "Costa Australia", "Treasury Wine Estates", "Warakirri Asset Management", "Delta Agribusiness Group"],
  "Animation & VFX": ["Animal Logic", "Weta FX", "DNEG", "Rising Sun Pictures", "Electronic Arts (EA)", "Activision Australia", "Disney Australia", "Paramount Australia & New Zealand", "Bus Stop Films", "3D Walkabout"],
};

const FILLER_COMPANIES = [
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
  "Dodgshun Medlin Australia",
];

// Employers the original prototype force-included for a role. We use this to
// flag a starter set of "clients" / priority employers in the taxonomy so the
// display algorithm has meaningful data to work with out of the box.
const MANDATORY_COMPANIES: Record<string, string[]> = {
  "Management Consulting": ["McKinsey & Company Australia", "Boston Consulting Group Australia", "Bain & Company Australia"],
  "Computer Science & Software Engineering": ["Google AU", "Atlassian", "Canva"],
  "Finance & Banking": ["Commonwealth Bank", "NAB Australia", "Westpac Group", "ANZ Bank", "Macquarie Group"],
  "Law": ["Allens", "King & Wood Mallesons", "Herbert Smith Freehills", "Ashurst", "Clayton Utz", "Gilbert + Tobin"],
  "Investment Banking": ["Goldman Sachs Australia", "Macquarie Group", "JPMorganChase Australia", "UBS Australia", "Morgan Stanley Australia"],
  "Accounting & Advisory": ["PwC Australia", "EY Australia", "KPMG Australia", "Deloitte Australia"],
  "Mining & Resources Engineering": ["BHP", "Rio Tinto", "Woodside Energy"],
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Build the employer taxonomy items from the hardcoded data.
function buildEmployerItems(): EmployerItem[] {
  const mandatorySet = new Set<string>();
  Object.values(MANDATORY_COMPANIES).forEach((arr) => arr.forEach((n) => mandatorySet.add(n)));

  // Track every career path each company appears in + how many lists mention it
  // (a rough popularity proxy).
  const careerPathsByCompany = new Map<string, Set<string>>();
  Object.entries(COMPANIES_BY_ROLE).forEach(([role, companies]) => {
    companies.forEach((name) => {
      if (!careerPathsByCompany.has(name)) careerPathsByCompany.set(name, new Set());
      careerPathsByCompany.get(name)!.add(role);
    });
  });

  // Filler companies have no role; assign them "Other" so they can still appear
  // via the fallback path and exploration bucket.
  FILLER_COMPANIES.forEach((name) => {
    if (!careerPathsByCompany.has(name)) careerPathsByCompany.set(name, new Set(["Other"]));
  });

  const items: EmployerItem[] = [];
  for (const [name, paths] of Array.from(careerPathsByCompany.entries())) {
    const pathList = Array.from(paths);
    const isClient = mandatorySet.has(name);
    // popularity proxy: number of career paths it appears in, scaled.
    const popularityScore = Math.min(100, pathList.length * 15 + (isClient ? 20 : 0));
    items.push({
      id: slugify(name),
      employerName: name,
      displayName: name,
      aliases: [],
      careerPath: pathList[0],
      industry: "",
      location: "Australia",
      isClient,
      priorityTier: isClient ? 2 : 0,
      popularityScore,
      rankingScore: popularityScore,
      source: "seed",
      active: true,
      metadata: { careerPaths: pathList },
    });
  }
  return items.sort((a, b) => a.employerName.localeCompare(b.employerName));
}

// The default survey config mirrors the bespoke 8-step flow. The public survey
// keeps its hand-built UI but reads this config for versioning + answer labels;
// the admin editor reads/writes the same structure.
function buildDefaultPages(employerTaxonomyId: number): SurveyPageDef[] {
  return [
    {
      id: "intro",
      kind: "intro",
      title: "US College Data Tool",
      subtitle: "Help us understand which employers students recognise.",
      questions: [],
    },
    {
      id: "personal",
      kind: "personal",
      title: "About you",
      subtitle: "A few details to start.",
      questions: [
        { id: "email", type: "email", label: "Email", required: true, optionsSource: "none" },
        { id: "gender", type: "single_select", label: "Gender", required: false, optionsSource: "static", options: [
          { label: "Female", value: "Female" },
          { label: "Male", value: "Male" },
          { label: "Non-binary", value: "Non-binary" },
          { label: "Prefer not to say", value: "Prefer not to say" },
        ] },
        { id: "preferredCity", type: "text", label: "Preferred work location", required: false, optionsSource: "none" },
      ],
    },
    {
      id: "education",
      kind: "education",
      title: "Your education",
      subtitle: "Where and what you study.",
      questions: [
        { id: "country", type: "single_select", label: "Country of study", required: false, optionsSource: "none" },
        { id: "educationLevel", type: "single_select", label: "Education level", required: false, optionsSource: "none" },
        { id: "selectedDegrees", type: "multi_select", label: "Study fields", required: false, optionsSource: "none" },
        { id: "university", type: "text", label: "School", required: false, optionsSource: "none" },
        { id: "graduation", type: "text", label: "Graduation date", required: false, optionsSource: "none" },
      ],
    },
    {
      id: "careers",
      kind: "careers",
      title: "Career paths",
      subtitle: "Pick the career paths you're interested in.",
      questions: [
        { id: "selectedRoles", type: "tagbox", label: "Career paths", required: true, optionsSource: "none" },
      ],
    },
    {
      id: "career_order",
      kind: "career_order",
      title: "Rank your career paths",
      subtitle: "Drag to order by preference.",
      questions: [
        { id: "roleOrder", type: "drag_rank", label: "Career path order", required: false, optionsSource: "none" },
      ],
    },
    {
      id: "recognition",
      kind: "recognition",
      title: "Which employers do you recognise?",
      subtitle: "Select all the companies you know.",
      questions: [
        {
          id: "recognizedEmployers",
          type: "employer_grid",
          label: "Recognised employers",
          required: false,
          optionsSource: "taxonomy",
          taxonomyId: employerTaxonomyId,
          taxonomyFilter: { byCareerPath: true },
        },
      ],
    },
    {
      id: "pairwise",
      kind: "pairwise",
      title: "Which do you prefer?",
      subtitle: "Compare employers head to head.",
      questions: [
        { id: "pairwise", type: "pairwise", label: "Pairwise comparisons", required: false, optionsSource: "none" },
      ],
    },
    {
      id: "final",
      kind: "final",
      title: "Your ranking",
      subtitle: "Adjust the final order if you like.",
      questions: [
        { id: "finalRanking", type: "final_reorder", label: "Final ranking", required: false, optionsSource: "none" },
      ],
    },
    {
      id: "thankyou",
      kind: "thankyou",
      title: "Thank you!",
      subtitle: "Your response has been recorded.",
      questions: [],
    },
  ];
}

export async function seedIfEmpty(): Promise<void> {
  // 1. Employer taxonomy.
  let employerTax = await storage.getTaxonomyByType("employers");
  if (!employerTax) {
    employerTax = await storage.createTaxonomy({
      name: "Employers",
      type: "employers",
      description: "Employer pool shown on the recognition step.",
      items: buildEmployerItems(),
      processingLogic: {},
    });
    console.log(`[seed] created employers taxonomy with ${employerTax.items.length} items`);
  }

  // 2. Default survey config (only if none exist at all).
  const configs = await storage.listSurveyConfigs();
  if (configs.length === 0) {
    await storage.createSurveyConfig({
      name: "Default Survey",
      version: 1,
      status: "active",
      pages: buildDefaultPages(employerTax.id),
      logic: {},
    });
    console.log("[seed] created default active survey config");
  }

  // 3. Employer display logic setting.
  const existingLogic = await storage.getSetting("employerDisplayLogic");
  if (!existingLogic) {
    await storage.setSetting(
      "employerDisplayLogic",
      DEFAULT_EMPLOYER_DISPLAY_LOGIC as unknown as Record<string, unknown>,
    );
    console.log("[seed] created default employer display logic");
  }
}
