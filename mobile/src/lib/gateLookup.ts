import type { GateLookup } from "../api/types";

export function recordStr(record: Record<string, unknown>, key: string): string | null {
  const v = record[key];
  if (v == null) return null;
  return String(v);
}

export function lookupTitle(lookup: GateLookup): string {
  const r = lookup.record;
  if (lookup.type === "visitor") return recordStr(r, "guest_name") ?? "Visitor";
  if (lookup.type === "delivery") return recordStr(r, "company") ?? "Delivery";
  if (lookup.type === "staff") return recordStr(r, "name") ?? "Staff";
  if (lookup.type === "kids_exit") return recordStr(r, "child_name") ?? "Kids exit";
  return lookup.type;
}

export function lookupRecordId(lookup: GateLookup): string | null {
  return recordStr(lookup.record, "id");
}
