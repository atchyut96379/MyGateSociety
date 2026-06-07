import type { User } from "../api/types";

export type AccountCategory = "RESIDENT" | "OWNER" | "COMMITTEE";
export type ResidentSubType = "OWNER" | "TENANT";

export const ACCOUNT_CATEGORIES: { value: AccountCategory; label: string }[] = [
  { value: "RESIDENT", label: "Resident" },
  { value: "OWNER", label: "Owner (in-house)" },
  { value: "COMMITTEE", label: "Committee member" },
];

export const RESIDENT_SUB_TYPES: { value: ResidentSubType; label: string }[] = [
  { value: "OWNER", label: "Owner" },
  { value: "TENANT", label: "Tenant" },
];

export function userToAccountDraft(user: User) {
  if (user.role === "COMMITTEE") {
    return {
      category: "COMMITTEE" as AccountCategory,
      residentSubType: "OWNER" as ResidentSubType,
      committee_role: user.committee_role || "PRESIDENT",
    };
  }
  if (user.resident_type === "TENANT") {
    return {
      category: "RESIDENT" as AccountCategory,
      residentSubType: "TENANT" as ResidentSubType,
      committee_role: "PRESIDENT",
    };
  }
  if (user.resident_type === "IN_HOUSE_OWNER") {
    return {
      category: "OWNER" as AccountCategory,
      residentSubType: "OWNER" as ResidentSubType,
      committee_role: "PRESIDENT",
    };
  }
  return {
    category: "RESIDENT" as AccountCategory,
    residentSubType: "OWNER" as ResidentSubType,
    committee_role: "PRESIDENT",
  };
}

export function accountToApi(
  category: AccountCategory,
  residentSubType: ResidentSubType
): { role: string; resident_type: string | null } {
  if (category === "COMMITTEE") {
    return { role: "COMMITTEE", resident_type: "IN_HOUSE_OWNER" };
  }
  if (category === "OWNER") {
    return { role: "RESIDENT", resident_type: "IN_HOUSE_OWNER" };
  }
  if (residentSubType === "TENANT") {
    return { role: "RESIDENT", resident_type: "TENANT" };
  }
  return { role: "RESIDENT", resident_type: "OUT_HOUSE_OWNER" };
}

export function accountDisplayLabel(
  role: string,
  residentType: string | null,
  committeeRole: string | null,
  committeeLabels: { value: string; label: string }[]
): string {
  if (role === "ADMIN") return "Secretary";
  if (role === "COMMITTEE" && committeeRole) {
    const match = committeeLabels.find((r) => r.value === committeeRole);
    return match ? `Committee · ${match.label}` : "Committee";
  }
  if (residentType === "TENANT") return "Resident · Tenant";
  if (residentType === "IN_HOUSE_OWNER") return "Owner (in-house)";
  if (residentType === "OUT_HOUSE_OWNER") return "Resident · Owner";
  if (role === "RESIDENT") return "Resident";
  if (role === "SECURITY") return "Guard";
  return role;
}
