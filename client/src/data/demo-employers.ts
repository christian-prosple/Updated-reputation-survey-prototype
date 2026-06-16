// Static, deterministic demo data linking students (with majors + graduation
// years) to employer preferences. No database — generated once at module load
// with a seeded PRNG so filter results are stable and varied across renders.

export type Industry =
  | "tech"
  | "finance"
  | "consulting"
  | "healthcare"
  | "media"
  | "defense"
  | "engineering"
  | "telecom"
  | "consumer";

export interface EmployerCompany {
  name: string;
  industry: Industry;
}

export const COMPANIES: EmployerCompany[] = [
  // Tech
  { name: "Google", industry: "tech" },
  { name: "Microsoft", industry: "tech" },
  { name: "Apple", industry: "tech" },
  { name: "Meta", industry: "tech" },
  { name: "Amazon", industry: "tech" },
  { name: "Salesforce", industry: "tech" },
  { name: "IBM", industry: "tech" },
  { name: "Intel", industry: "tech" },
  { name: "Adobe", industry: "tech" },
  { name: "Oracle", industry: "tech" },
  // Finance
  { name: "Goldman Sachs", industry: "finance" },
  { name: "JPMorgan", industry: "finance" },
  { name: "Morgan Stanley", industry: "finance" },
  { name: "BlackRock", industry: "finance" },
  { name: "Citi", industry: "finance" },
  { name: "Bank of America", industry: "finance" },
  { name: "Deloitte", industry: "finance" },
  { name: "PwC", industry: "finance" },
  { name: "EY", industry: "finance" },
  { name: "KPMG", industry: "finance" },
  // Consulting
  { name: "McKinsey", industry: "consulting" },
  { name: "BCG", industry: "consulting" },
  { name: "Bain", industry: "consulting" },
  { name: "Accenture", industry: "consulting" },
  { name: "Booz Allen", industry: "consulting" },
  // Healthcare / Other
  { name: "Johnson & Johnson", industry: "healthcare" },
  { name: "Pfizer", industry: "healthcare" },
  { name: "Nike", industry: "consumer" },
  { name: "Tesla", industry: "engineering" },
  { name: "SpaceX", industry: "engineering" },
  { name: "Bloomberg", industry: "media" },
  { name: "The New York Times", industry: "media" },
  { name: "NBC", industry: "media" },
  { name: "American Express", industry: "finance" },
  { name: "Verizon", industry: "telecom" },
  { name: "AT&T", industry: "telecom" },
  { name: "Lockheed Martin", industry: "defense" },
  { name: "Boeing", industry: "defense" },
  { name: "Raytheon", industry: "defense" },
  { name: "General Electric", industry: "engineering" },
];

export const MAJORS = [
  "Computer Science",
  "Business",
  "Engineering",
  "Economics",
  "Biology",
  "Political Science",
  "Psychology",
] as const;

export const GRAD_YEARS = ["2024", "2025", "2026", "2027"] as const;

const MAJOR_INDUSTRIES: Record<string, Industry[]> = {
  "Computer Science": ["tech", "engineering"],
  Business: ["finance", "consulting", "consumer", "telecom"],
  Engineering: ["engineering", "defense", "tech", "telecom"],
  Economics: ["finance", "consulting"],
  Biology: ["healthcare"],
  "Political Science": ["media", "defense", "consulting"],
  Psychology: ["healthcare", "media", "consumer"],
};

export interface EmployerStudent {
  id: string;
  major: string;
  gradYear: string;
  preferences: string[]; // company names
}

// Small deterministic PRNG (mulberry32) so the demo data never shifts.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function generateStudents(): EmployerStudent[] {
  const rand = mulberry32(20260616);
  const students: EmployerStudent[] = [];
  let counter = 0;

  // Six students per (major, year) combo guarantees every single-filter
  // selection returns a non-empty, varied result.
  for (const major of MAJORS) {
    for (const gradYear of GRAD_YEARS) {
      for (let k = 0; k < 6; k++) {
        const pool = COMPANIES.filter((c) =>
          MAJOR_INDUSTRIES[major].includes(c.industry)
        ).map((c) => c.name);
        const n = 3 + Math.floor(rand() * 4); // 3–6 preferences
        const prefs = sample(pool, n, rand);
        // Occasional wildcard from outside the major for realistic variety.
        if (rand() < 0.25) {
          const w = COMPANIES[Math.floor(rand() * COMPANIES.length)].name;
          if (!prefs.includes(w)) prefs.push(w);
        }
        students.push({
          id: `es-${++counter}`,
          major,
          gradYear,
          preferences: prefs,
        });
      }
    }
  }

  // Coverage pass: ensure every company is wanted by at least 2 students so the
  // unfiltered view shows all 40.
  const counts = new Map<string, number>();
  for (const s of students)
    for (const p of s.preferences) counts.set(p, (counts.get(p) ?? 0) + 1);
  for (const c of COMPANIES) {
    let guard = 0;
    while ((counts.get(c.name) ?? 0) < 2 && guard < 50) {
      guard++;
      const s = students[Math.floor(rand() * students.length)];
      if (!s.preferences.includes(c.name)) {
        s.preferences.push(c.name);
        counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
      }
    }
  }

  return students;
}

export const EMPLOYER_STUDENTS: EmployerStudent[] = generateStudents();

export interface RankedCompany extends EmployerCompany {
  count: number;
}

// Companies wanted by students matching the (optional) major + year filters,
// ranked by how many matching students listed them.
export function rankCompanies(major?: string, gradYear?: string): RankedCompany[] {
  const matching = EMPLOYER_STUDENTS.filter(
    (s) => (!major || s.major === major) && (!gradYear || s.gradYear === gradYear)
  );
  const counts = new Map<string, number>();
  for (const s of matching)
    for (const p of s.preferences) counts.set(p, (counts.get(p) ?? 0) + 1);
  return COMPANIES.filter((c) => counts.has(c.name))
    .map((c) => ({ ...c, count: counts.get(c.name) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
