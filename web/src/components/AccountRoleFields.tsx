import { COMMITTEE_ROLES } from "../lib/committee";
import {
  ACCOUNT_CATEGORIES,
  type AccountCategory,
  RESIDENT_SUB_TYPES,
  type ResidentSubType,
} from "../lib/userRoles";

export type TenantOwnerDraft = {
  tenant_owner_name: string;
  tenant_owner_phone: string;
  tenant_owner_flat_label: string;
};

type Props = {
  category: AccountCategory;
  residentSubType: ResidentSubType;
  committeeRole: string;
  tenantOwner: TenantOwnerDraft;
  flatLabel?: string | null;
  compact?: boolean;
  onCategoryChange: (category: AccountCategory) => void;
  onResidentSubTypeChange: (sub: ResidentSubType) => void;
  onCommitteeRoleChange: (role: string) => void;
  onTenantOwnerChange: (patch: Partial<TenantOwnerDraft>) => void;
};

const selectStyle = (compact?: boolean) =>
  compact ? { fontSize: "0.8rem", maxWidth: "9rem" } : undefined;

const inputStyle = (compact?: boolean) =>
  compact ? { fontSize: "0.8rem", width: "100%", maxWidth: "11rem" } : undefined;

export function AccountRoleFields({
  category,
  residentSubType,
  committeeRole,
  tenantOwner,
  flatLabel,
  compact,
  onCategoryChange,
  onResidentSubTypeChange,
  onCommitteeRoleChange,
  onTenantOwnerChange,
}: Props) {
  const showTenantFields =
    category === "RESIDENT" && residentSubType === "TENANT";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? "0.35rem" : "0.75rem",
        alignItems: compact ? "flex-end" : "stretch",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.35rem",
          flexWrap: "wrap",
          justifyContent: compact ? "flex-end" : "flex-start",
        }}
      >
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as AccountCategory)}
          style={selectStyle(compact)}
        >
          {ACCOUNT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {category === "RESIDENT" && (
          <select
            value={residentSubType}
            onChange={(e) => onResidentSubTypeChange(e.target.value as ResidentSubType)}
            style={selectStyle(compact)}
          >
            {RESIDENT_SUB_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {category === "COMMITTEE" && (
          <select
            value={committeeRole}
            onChange={(e) => onCommitteeRoleChange(e.target.value)}
            style={selectStyle(compact)}
          >
            {COMMITTEE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {showTenantFields && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            alignItems: compact ? "flex-end" : "stretch",
            width: compact ? "auto" : "100%",
          }}
        >
          {compact && (
            <span className="muted" style={{ fontSize: "0.7rem", textAlign: "right" }}>
              Tenant — enter flat owner details
            </span>
          )}
          <input
            type="text"
            placeholder="Original owner name"
            value={tenantOwner.tenant_owner_name}
            onChange={(e) => onTenantOwnerChange({ tenant_owner_name: e.target.value })}
            style={inputStyle(compact)}
            required
          />
          <input
            type="tel"
            placeholder="Owner mobile"
            value={tenantOwner.tenant_owner_phone}
            onChange={(e) => onTenantOwnerChange({ tenant_owner_phone: e.target.value })}
            style={inputStyle(compact)}
            required
          />
          <input
            type="text"
            placeholder="Owner flat"
            value={tenantOwner.tenant_owner_flat_label || flatLabel || ""}
            onChange={(e) => onTenantOwnerChange({ tenant_owner_flat_label: e.target.value })}
            style={inputStyle(compact)}
          />
        </div>
      )}
    </div>
  );
}
