import * as XLSX from "xlsx";

export interface ParsedImportRow {
  row: number;
  name: string;
  phone_raw: string;
  flat_label: string;
  resident_type: string;
  committee_role: string | null;
  email: string | null;
  role: string;
  error?: string;
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "resident", "resident_name", "residentname", "full_name", "fullname", "member_name", "member"],
  phone: ["phone", "mobile", "mobile_number", "mobile_no", "mobileno", "contact", "contact_number", "phone_number"],
  flat: ["flat", "flat_no", "flat_number", "flatno", "flat_no_", "unit", "unit_no", "flatno_"],
  role: ["role", "user_role"],
  resident_type: [
    "resident_type",
    "residenttype",
    "type",
    "owner_or_tenant",
    "owner_tenant",
    "owner_or_tenant_",
    "resident_type_",
  ],
  committee_role: ["committee_role", "committee", "committee_role_"],
  email: ["email", "e_mail"],
};

function normalizeHeader(value: unknown): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\//g, "_")
    .replace(/-/g, "_")
    .replace(/ /g, "_");
  return raw.replace(/[^a-z0-9_]/g, "");
}

function cellStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

function findHeaderRow(rows: unknown[][]): number {
  for (let idx = 0; idx < Math.min(rows.length, 10); idx++) {
    const normalized = rows[idx].map((c) => normalizeHeader(c)).filter(Boolean);
    if (!normalized.length) continue;
    const hasName = normalized.some((n) => HEADER_ALIASES.name.includes(n));
    const hasFlat = normalized.some((n) => HEADER_ALIASES.flat.includes(n));
    if (hasName && hasFlat) return idx;
    if (hasName) return idx;
  }
  return 0;
}

interface ColumnMapping {
  fields: Record<string, number>;
  owner_col: number | null;
  tenant_col: number | null;
}

function buildColumnMap(headerRow: unknown[]): ColumnMapping {
  const colMap: Record<string, number> = {};
  let ownerCol: number | null = null;
  let tenantCol: number | null = null;

  headerRow.forEach((raw, i) => {
    const nh = normalizeHeader(raw);
    if (!nh) return;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(nh)) colMap[field] = i;
    }
    if (nh === "owner") ownerCol = i;
    if (nh === "tenant") tenantCol = i;
  });

  if (ownerCol == null && tenantCol == null && colMap.resident_type != null) {
    const idx = colMap.resident_type;
    const nextHdr = idx + 1 < headerRow.length ? normalizeHeader(headerRow[idx + 1]) : "";
    if (nextHdr && !["committee_role", "committee", "email"].includes(nextHdr)) {
      ownerCol = idx;
      tenantCol = idx + 1;
    }
  }

  return { fields: colMap, owner_col: ownerCol, tenant_col: tenantCol };
}

function getCell(row: unknown[], index: number | null | undefined): string {
  if (index == null || index >= row.length) return "";
  return cellStr(row[index]);
}

function mapResidentTypeLabel(raw: string): string | null {
  if (!raw) return null;
  const key = raw.toUpperCase().replace(/[\s\-/]/g, "_");
  const mapping: Record<string, string> = {
    OWNER: "IN_HOUSE_OWNER",
    IN_HOUSE_OWNER: "IN_HOUSE_OWNER",
    INHOUSE_OWNER: "IN_HOUSE_OWNER",
    OUT_HOUSE_OWNER: "OUT_HOUSE_OWNER",
    OUTHOUSE_OWNER: "OUT_HOUSE_OWNER",
    TENANT: "TENANT",
  };
  if (mapping[key]) return mapping[key];
  const lowered = raw.trim().toLowerCase();
  if (lowered.startsWith("owner")) return "IN_HOUSE_OWNER";
  if (lowered.startsWith("tenant")) return "TENANT";
  return null;
}

function parseResidentType(row: unknown[], mapping: ColumnMapping): string {
  const { fields, owner_col, tenant_col } = mapping;
  if (fields.resident_type != null) {
    const mapped = mapResidentTypeLabel(getCell(row, fields.resident_type));
    if (mapped) return mapped;
  }
  const ownerVal = owner_col != null ? getCell(row, owner_col).toLowerCase() : "";
  const tenantVal = tenant_col != null ? getCell(row, tenant_col).toLowerCase() : "";
  if (tenantVal === "tenant" && ownerVal !== "owner") return "TENANT";
  if (ownerVal === "owner") return "IN_HOUSE_OWNER";
  return "IN_HOUSE_OWNER";
}

function isSubheaderRow(row: unknown[], mapping: ColumnMapping): boolean {
  const { fields } = mapping;
  if (getCell(row, fields.name)) return false;
  if (getCell(row, fields.flat)) return false;
  if (getCell(row, fields.phone)) return false;
  let ownerIdx: number | null = null;
  let tenantIdx: number | null = null;
  row.forEach((raw, i) => {
    const nh = normalizeHeader(raw);
    if (nh === "owner") ownerIdx = i;
    if (nh === "tenant") tenantIdx = i;
  });
  return ownerIdx != null && tenantIdx != null;
}

function parseRow(row: unknown[], rowNum: number, mapping: ColumnMapping): ParsedImportRow | null {
  const { fields } = mapping;
  const name = getCell(row, fields.name);
  const flat_label = getCell(row, fields.flat);
  const phone_raw = getCell(row, fields.phone);
  const role = getCell(row, fields.role).toUpperCase() || "RESIDENT";
  const email = getCell(row, fields.email) || null;
  const committee_role = getCell(row, fields.committee_role).toUpperCase() || null;

  if (!name && !flat_label && !phone_raw) return null;
  if (["owner", "tenant", "name"].includes(name.toLowerCase()) && !flat_label) return null;
  if (!name) {
    return { row: rowNum, name: "—", phone_raw, flat_label, resident_type: "IN_HOUSE_OWNER", committee_role: null, email: null, role, error: "Name is required" };
  }
  if (!flat_label && (role === "RESIDENT" || role === "COMMITTEE")) {
    return { row: rowNum, name, phone_raw, flat_label, resident_type: "IN_HOUSE_OWNER", committee_role: null, email: null, role, error: "Flat number is required" };
  }

  return {
    row: rowNum,
    name,
    phone_raw,
    flat_label,
    resident_type: parseResidentType(row, mapping),
    committee_role: committee_role || null,
    email,
    role,
  };
}

export function parseResidentsExcel(file: ArrayBuffer): ParsedImportRow[] {
  const wb = XLSX.read(file, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];
  if (rows.length < 2) throw new Error("Excel file has no data rows");

  const headerIdx = findHeaderRow(rows);
  const mapping = buildColumnMap(rows[headerIdx]);
  if (mapping.fields.name == null) {
    const found = rows[headerIdx].map((c) => cellStr(c)).filter(Boolean);
    throw new Error(`Excel must have a 'name' column. Found: ${found.join(", ") || "none"}`);
  }

  let dataStart = headerIdx + 1;
  if (dataStart < rows.length && isSubheaderRow(rows[dataStart], mapping)) {
    dataStart = headerIdx + 2;
  }

  const parsed: ParsedImportRow[] = [];
  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.some((c) => cellStr(c))) continue;
    const result = parseRow(row, i + 1, mapping);
    if (result) parsed.push(result);
  }
  return parsed;
}
