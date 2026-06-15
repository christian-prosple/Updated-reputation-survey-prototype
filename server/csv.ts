// Small dependency-free CSV parser. Handles quoted fields, escaped quotes,
// and commas/newlines inside quotes. Good enough for taxonomy uploads.

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(text: string): ParsedCsv {
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    records.push(row);
    row = [];
  };

  // Normalise line endings.
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        pushField();
      } else if (ch === "\n") {
        pushRow();
      } else {
        field += ch;
      }
    }
  }
  // Flush trailing field/row if any content remains.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  // Drop fully empty trailing rows.
  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < nonEmpty.length; r++) {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (nonEmpty[r][idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

// Coerce a CSV string cell into a boolean.
export function toBool(v: string | undefined): boolean {
  if (!v) return false;
  return ["1", "true", "yes", "y", "t"].includes(v.trim().toLowerCase());
}

// Coerce a CSV string cell into a number (or undefined).
export function toNum(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
