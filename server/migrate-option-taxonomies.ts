/**
 * One-off migration: create Countries, Study Fields, Career Paths, and
 * Universities taxonomies, then wire up the matching survey-config questions.
 *
 * Run with:  npx tsx server/migrate-option-taxonomies.ts
 */

import { storage } from "./storage";

// ---------------------------------------------------------------------------
// Source data
// ---------------------------------------------------------------------------

const COUNTRIES = [
  "Australia","Austria","Belgium","Brazil","Canada","China","Denmark",
  "Finland","France","Germany","Hong Kong","India","Indonesia","Ireland",
  "Israel","Italy","Japan","Malaysia","Mexico","Netherlands","New Zealand",
  "Norway","Philippines","Poland","Portugal","Saudi Arabia","Singapore",
  "South Africa","South Korea","Spain","Sweden","Switzerland","Taiwan",
  "Thailand","Turkey","United Arab Emirates","United Kingdom",
  "United States","Vietnam",
];

const STUDY_FIELDS = [
  // Business & Management
  "Accounting","Commerce","Finance","Actuarial Studies","Business",
  "Business Administration","International Business","Management",
  "Office Studies","Project Management","Event Management","Economics",
  "Human Resources","Hospitality Management","Retail & Merchandising",
  "Tourism","Marketing & Advertising","Public Relations",
  "Transport, Logistics & Procurement","Business Information Systems",
  // IT & Computer Science
  "Artificial Intelligence","Bioinformatics","Computer Graphics & Animation",
  "Computer Science (all other)","Computer Systems and Networks",
  "Cyber Security","Data Science","Programming & Software Engineering",
  "Video Game Development","Design & User Experience",
  // Creative Arts
  "Communication","Media Studies","Fashion Design","Film & TV","Fine Arts",
  "Graphic Design & Visual Arts","Creative Writing","Journalism","Music",
  "Performing Arts","Photography","Creative Arts (all other)",
  "Animation, Visual Effects & Post Production",
  // Engineering & Mathematics
  "Aerospace Engineering","Air Traffic Control",
  "Aircraft Maintenance Engineering","Aircraft Operation & Aviation",
  "Automotive & Transport Engineering","Chemical Engineering",
  "Civil Engineering & Construction","Communications Engineering",
  "Electrical & Electronic Engineering","Engineering Management",
  "Environmental Engineering","Fire & Safety Engineering",
  "Geomatic Engineering","Manufacturing Engineering","Marine Engineering",
  "Materials Engineering","Mathematics & Statistics","Mechanical Engineering",
  "Mining Engineering","Petroleum Engineering",
  "Renewable Energy Engineering","Robotics & Mechatronics Engineering",
  "Engineering & Mathematics (all other)","Geotechnical Engineering",
  "Biomedical Engineering",
  // Medical & Health Sciences
  "Audiology","Speech Pathology","Biomedical Science",
  "Chiropractic & Osteopathy","Dentistry & Dental Science",
  "Exercise & Sports Science","Health Administration","Nursing (all other)",
  "Nutrition & Dietetics","Occupational Therapy","Paramedic Science",
  "Pharmacy & Pharmacology","Physiotherapy","Radiography",
  "Medical & Health Sciences (all other)","Medicine","Public Health (all other)",
  // Humanities, Arts & Social Sciences
  "Anthropology","Geography","Criminology","Gender Studies",
  "International Studies","Modern Languages","Literature","Linguistics",
  "Philosophy","Political Science","Psychology","Social Work & Sociology",
  "Liberal Arts","Humanities (all other)","Social Science (all other)",
  // Law
  "Justice & Law Enforcement","Commercial Law","Criminal Law","Family Law",
  "International Law","Tax Law","Legal Studies",
  // Property & Built Environment
  "Architecture","Interior Design","Landscape Architecture","Building",
  "Construction Management","Property, Land & Real Estate",
  "Quantity Surveying","Sustainable Development","Urban Design & Town Planning",
  // Sciences
  "Agricultural Science","Biochemistry","Biology","Chemistry","Earth Sciences",
  "Ecology & Evolution","Environmental Studies","Food Science",
  "Forensic Science","Genetics","Geology","Marine Science","Physics",
  "Veterinary Science","Sciences (all other)",
  // Teaching & Education
  "Early Childhood Education","Primary Teaching","Secondary Teaching",
  "Special Education","Tertiary Education","TESOL",
  // Vocational
  "Carpentry","Electrical","Plumbing & Gasfitting","Automotive",
  // Food, Hospitality & Personal Services
  "Cookery","Beauty Therapy","Hairdressing",
];

const CAREER_PATHS = [
  "Accounting & Advisory","Actuarial Studies, Insurance & Risk",
  "Aerospace Engineering & Aviation","Agriculture & Agribusiness",
  "Animation & VFX","Archaeology & History","Architecture",
  "Artificial Intelligence & Machine Learning","Biology & Biochemistry",
  "Biomedical Engineering & Sciences","Business, Commerce & Management",
  "Chemical & Process Engineering","Chemistry","Civil & Structural Engineering",
  "Communications & Public Relations","Computer Science & Software Engineering",
  "Construction Management","Creative, Performing & Visual Arts",
  "Criminology & Forensic Science","Customer Success & Client Services",
  "Cybersecurity","Data Science & Analytics","Design & User Experience",
  "Economics","Education & Teaching","Electrical & Electronic Engineering",
  "Environment & Sustainability","Environmental Engineering",
  "Events, Tourism & Hospitality","Exercise & Sport Sciences","Fashion",
  "Film & TV Production","Finance & Banking","Food Science & Technology",
  "Game Design & Development","Geology & Earth Sciences","Geospatial & GIS",
  "Geotechnical Engineering","Government & Public Administration",
  "Healthcare Administration & Management","HR & Recruitment",
  "Information Technology","Intelligence & National Security",
  "Interior Design","International Development & NGOs","Investment Banking",
  "Language & Linguistics","Law","Management Consulting",
  "Manufacturing and Industrial Engineering","Marketing","Materials Engineering",
  "Mathematics & Statistics","Mechanical & Mechatronic Engineering","Medicine",
  "Midwifery","Mining & Resources Engineering","Music & Audio Production",
  "Network & Telecommunications Engineering","Nursing",
  "Nutrition & Dietetics","Occupational Health & Safety",
  "Pharmacy & Pharmaceuticals","Physics",
  "Physiotherapy & Occupational Therapy","Policy & International Relations",
  "Private Equity & Hedge funds","Product Management","Project Management",
  "Property Development & Management","Psychology & Counselling",
  "Public Health","Sales & Business Development","Social Work",
  "Supply Chain & Logistics","Surveying","Trading","Urban Planning",
  "Venture Capital","Veterinary Science","Writing, Journalism & Publishing",
  "Zoology",
];

const UNIVERSITIES = [
  // Group of Eight
  "Australian National University (ANU)",
  "Monash University",
  "University of Melbourne",
  "University of New South Wales (UNSW)",
  "University of Queensland (UQ)",
  "University of Sydney",
  "University of Western Australia (UWA)",
  "University of Adelaide",
  // Australian Technology Network
  "Curtin University",
  "Deakin University",
  "RMIT University",
  "University of Newcastle",
  "University of South Australia (UniSA)",
  "University of Technology Sydney (UTS)",
  // Innovative Research Universities
  "Flinders University",
  "Griffith University",
  "James Cook University",
  "La Trobe University",
  "Murdoch University",
  "Western Sydney University",
  // Other major Australian universities
  "Australian Catholic University (ACU)",
  "Bond University",
  "Central Queensland University (CQU)",
  "Charles Darwin University (CDU)",
  "Charles Sturt University (CSU)",
  "Edith Cowan University (ECU)",
  "Federation University Australia",
  "Macquarie University",
  "Queensland University of Technology (QUT)",
  "Swinburne University of Technology",
  "University of Canberra",
  "University of Divinity",
  "University of New England (UNE)",
  "University of Notre Dame Australia",
  "University of Southern Queensland (USQ)",
  "University of the Sunshine Coast (USC)",
  "University of Tasmania (UTAS)",
  "University of Wollongong (UOW)",
  "Victoria University",
  // International (common feeders)
  "Harvard University",
  "University of Oxford",
  "University of Cambridge",
  "MIT",
  "Stanford University",
  "London School of Economics (LSE)",
  "National University of Singapore (NUS)",
  "University of Hong Kong (HKU)",
  "University of Toronto",
  "McGill University",
  "University of Auckland",
  "Peking University",
  "Tsinghua University",
  "Indian Institute of Technology (IIT)",
];

const EDUCATION_LEVELS = [
  "High School Certificate",
  "Certificate",
  "Advanced certificate",
  "Diploma",
  "Technical diploma",
  "Associate's",
  "Community / Technical college",
  "Bachelor's",
  "Bachelor's (Honours)",
  "Accelerated master's",
  "Masters (Coursework)",
  "Masters (Research)",
  "Master's of Business Administration",
  "Juris Doctor",
  "M.D.",
  "Doctorate",
  "Doctorate (PhD)",
  "Postdoctoral studies",
  "Professional Certificate",
  "Short course or microcredential",
  "Non-award",
  "Non-degree seeking",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simpleItems(labels: string[]) {
  return labels.map((label) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    label,
    value: label,
    active: true,
  }));
}

function staticOptions(labels: string[]) {
  return labels.map((label) => ({ label, value: label }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  console.log("[migrate] starting option-taxonomies migration…");

  // 1. Upsert each taxonomy (skip if it already exists)
  async function upsertTaxonomy(
    type: string,
    name: string,
    description: string,
    labels: string[],
  ) {
    const existing = await storage.getTaxonomyByType(type as never);
    if (existing) {
      console.log(`[migrate] taxonomy "${name}" already exists (id=${existing.id}) — skipping`);
      return existing;
    }
    const tax = await storage.createTaxonomy({
      name,
      type: type as never,
      description,
      items: simpleItems(labels),
      processingLogic: {},
    });
    console.log(`[migrate] created "${name}" taxonomy with ${tax.items.length} items (id=${tax.id})`);
    return tax;
  }

  const [countriesTax, studyFieldsTax, careerPathsTax, universitiesTax] =
    await Promise.all([
      upsertTaxonomy("countries", "Countries", "Countries of study.", COUNTRIES),
      upsertTaxonomy("study_fields", "Study Fields", "Degree subjects and disciplines.", STUDY_FIELDS),
      upsertTaxonomy("career_paths", "Career Paths", "Career path options shown on the career-paths step.", CAREER_PATHS),
      upsertTaxonomy("universities", "Universities", "Universities and colleges (AU-focused).", UNIVERSITIES),
    ]);

  // 2. Update survey config education + careers questions
  const configs = await storage.listSurveyConfigs();
  for (const config of configs) {
    const pages = config.pages as unknown as Array<{ id: string; questions: Array<Record<string, unknown>> }>;
    let changed = false;

    for (const page of pages) {
      for (const q of page.questions) {
        if (q.id === "country" && q.optionsSource !== "taxonomy") {
          q.optionsSource = "taxonomy";
          q.taxonomyId = countriesTax.id;
          changed = true;
        }
        if (q.id === "educationLevel" && q.optionsSource !== "static") {
          q.optionsSource = "static";
          q.options = staticOptions(EDUCATION_LEVELS);
          changed = true;
        }
        if (q.id === "selectedDegrees" && q.optionsSource !== "taxonomy") {
          q.optionsSource = "taxonomy";
          q.taxonomyId = studyFieldsTax.id;
          changed = true;
        }
        if (q.id === "university" && q.optionsSource !== "taxonomy") {
          q.optionsSource = "taxonomy";
          q.taxonomyId = universitiesTax.id;
          changed = true;
        }
        if (q.id === "selectedRoles" && q.optionsSource !== "taxonomy") {
          q.optionsSource = "taxonomy";
          q.taxonomyId = careerPathsTax.id;
          changed = true;
        }
        // graduation type fix
        if (q.id === "graduation" && q.type === "text") {
          q.type = "month_year";
          changed = true;
        }
      }
    }

    if (changed) {
      await storage.updateSurveyConfig(config.id, { pages: pages as unknown as import("@shared/schema").SurveyPageDef[] });
      console.log(`[migrate] updated survey config id=${config.id} ("${config.name}")`);
    }
  }

  console.log("[migrate] done!");
  process.exit(0);
}

run().catch((err) => {
  console.error("[migrate] error:", err);
  process.exit(1);
});
