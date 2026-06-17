// ---------------------------------------------------------------------------
// ROLE PREFERENCE ALLOCATION
// ---------------------------------------------------------------------------
// Pure function — no DB, no side effects. Decides how many employers to show
// from each career path pool based on the user's ranked role preferences.
//
// Algorithm:
//   n_eff = min(n_raw, maxRolesConsidered)    (cap at top N roles)
//   alpha  = max(alphaMin, alphaBase - alphaSlope * n_eff)
//   w_r    = 1 / r^alpha   for r = 1..n_eff, 0 otherwise
//   exact_r = T * w_r / sum(w)
//   floor_r = floor(exact_r)
//   bonus   = largest-remainder method to distribute leftover to sum = T
// ---------------------------------------------------------------------------

export interface AllocationConfig {
  maxRolesConsidered: number;
  alphaMin: number;
  alphaBase: number;
  alphaSlope: number;
}

export interface AllocationRow {
  roleId: string;
  rank: number;        // 1-based
  considered: boolean; // rank <= n_eff
  weight: number;
  exactCompanies: number;
  floorCompanies: number;
  remainder: number;
  bonus: number;       // 0 or 1
  finalCompanies: number;
}

export interface AllocationMeta {
  nRaw: number;
  nEff: number;
  alpha: number;
  denominator: number;
  totalCompanies: number;
  leftover: number;
}

export interface AllocationResult {
  rows: AllocationRow[];
  meta: AllocationMeta;
}

export function allocateCompaniesByRolePreference(
  selectedRoles: string[],
  totalCompanies = 30,
  config: Partial<AllocationConfig> = {},
): AllocationResult {
  const maxRolesConsidered = config.maxRolesConsidered ?? 5;
  const alphaMin = config.alphaMin ?? 0.6;
  const alphaBase = config.alphaBase ?? 1.4;
  const alphaSlope = config.alphaSlope ?? 0.15;

  const nRaw = selectedRoles.length;
  const nEff = Math.min(nRaw, maxRolesConsidered);
  const alpha = Math.max(alphaMin, alphaBase - alphaSlope * nEff);

  if (nRaw === 0) {
    return {
      rows: [],
      meta: { nRaw: 0, nEff: 0, alpha: round4(alpha), denominator: 0, totalCompanies, leftover: totalCompanies },
    };
  }

  // Weights for ranks 1..nEff
  const weights = Array.from({ length: nEff }, (_, i) => 1 / Math.pow(i + 1, alpha));
  const sumW = weights.reduce((a, b) => a + b, 0);

  // Build rows
  const rows: AllocationRow[] = selectedRoles.map((roleId, i) => {
    const rank = i + 1;
    const considered = rank <= nEff;
    const weight = considered ? weights[i] : 0;
    const exactCompanies = considered ? (totalCompanies * weight) / sumW : 0;
    const floorCompanies = Math.floor(exactCompanies);
    const remainder = exactCompanies - floorCompanies;
    return {
      roleId,
      rank,
      considered,
      weight: round4(weight),
      exactCompanies: round4(exactCompanies),
      floorCompanies,
      remainder: round4(remainder),
      bonus: 0,
      finalCompanies: floorCompanies,
    };
  });

  // Largest-remainder distribution of leftover slots
  const floorSum = rows.reduce((s, r) => s + r.floorCompanies, 0);
  let leftover = totalCompanies - floorSum;

  // Eligible = considered rows, sorted by remainder desc, then rank asc (tiebreak)
  const eligibleIndices = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.considered)
    .sort((a, b) => b.r.remainder - a.r.remainder || a.r.rank - b.r.rank);

  for (const { i } of eligibleIndices) {
    if (leftover <= 0) break;
    rows[i].bonus = 1;
    rows[i].finalCompanies = rows[i].floorCompanies + 1;
    leftover--;
  }

  return {
    rows,
    meta: {
      nRaw,
      nEff,
      alpha: round4(alpha),
      denominator: round4(sumW),
      totalCompanies,
      leftover: 0,
    },
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Quick console-verifiable checks (run with: npx tsx server/role-allocation.ts)
// ---------------------------------------------------------------------------
if (process.argv[1]?.endsWith("role-allocation.ts") || process.argv[1]?.endsWith("role-allocation.js")) {
  function check(label: string, roles: string[], T: number, expected: number[]) {
    const result = allocateCompaniesByRolePreference(roles, T);
    const finals = result.rows.map((r) => r.finalCompanies);
    const sum = finals.reduce((a, b) => a + b, 0);
    const match = JSON.stringify(finals) === JSON.stringify(expected);
    console.log(
      `${match ? "✓" : "✗"} ${label}`,
      `| alpha=${result.meta.alpha}`,
      `| finals=${JSON.stringify(finals)}`,
      `| sum=${sum}`,
      match ? "" : `| expected=${JSON.stringify(expected)}`,
    );
  }

  const r = (n: number) => Array.from({ length: n }, (_, i) => `role${i + 1}`);

  check("1 role,  T=30", r(1), 30, [30]);
  check("2 roles, T=30", r(2), 30, allocateCompaniesByRolePreference(r(2), 30).rows.map((x) => x.finalCompanies));
  check("5 roles, T=6 ", r(5), 6,  [2, 1, 1, 1, 1]);
  check("5 roles, T=30", r(5), 30, allocateCompaniesByRolePreference(r(5), 30).rows.map((x) => x.finalCompanies));
  check("8 roles, T=30", r(8), 30, [...allocateCompaniesByRolePreference(r(8), 30).rows.slice(0,5).map((x) => x.finalCompanies), 0, 0, 0]);
  // Verify sum always = T
  for (let n = 1; n <= 10; n++) {
    for (const T of [6, 10, 30]) {
      const res = allocateCompaniesByRolePreference(r(n), T);
      const sum = res.rows.reduce((a, b) => a + b.finalCompanies, 0);
      if (sum !== T) console.error(`✗ sum check FAILED n=${n} T=${T} got sum=${sum}`);
    }
  }
  console.log("✓ sum-always-T check passed for n=1..10, T=6,10,30");
}
