// Static placeholder data for the stateless demo flow.
// No database, no persistence — these names exist only to make the
// dashboard search feel real during a demo.

export interface DemoStudent {
  id: string;
  name: string;
  group: "respondent" | "invited";
}

const FIRST_NAMES = [
  "Olivia", "Liam", "Charlotte", "Noah", "Amelia", "William",
  "Mia", "Jack", "Isla", "Lucas", "Grace", "Henry",
];

const LAST_NAMES = [
  "Nguyen", "Smith", "Patel", "Chen", "Williams",
];

// 12 x 5 = 60 unique, deterministic names (stable across renders so search works).
// Interleaving first/last by independent moduli keeps all 60 combos unique
// (lcm(12,5) = 60) while giving each group a realistic spread of surnames.
const ALL_NAMES: string[] = [];
for (let i = 0; i < 60; i++) {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[i % LAST_NAMES.length];
  ALL_NAMES.push(`${first} ${last}`);
}

export const DEMO_STUDENTS: DemoStudent[] = ALL_NAMES.map((name, i) => ({
  id: `student-${i + 1}`,
  name,
  group: i < 10 ? "respondent" : "invited",
}));

export const RESPONDENT_COUNT = DEMO_STUDENTS.filter((s) => s.group === "respondent").length;
export const INVITED_COUNT = DEMO_STUDENTS.filter((s) => s.group === "invited").length;

export const MOST_SOUGHT_AFTER_EMPLOYERS = [
  "Google",
  "Goldman Sachs",
  "Microsoft",
  "JPMorgan",
  "Amazon",
];
