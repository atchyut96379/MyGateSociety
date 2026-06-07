import { View } from "react-native";
import { COMMITTEE_ROLES } from "../lib/committee";
import {
  ACCOUNT_CATEGORIES,
  type AccountCategory,
  RESIDENT_SUB_TYPES,
  type ResidentSubType,
} from "../lib/userRoles";
import { Field, Muted } from "./ui";
import { SelectField } from "./SelectField";

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
  onCategoryChange: (category: AccountCategory) => void;
  onResidentSubTypeChange: (sub: ResidentSubType) => void;
  onCommitteeRoleChange: (role: string) => void;
  onTenantOwnerChange: (patch: Partial<TenantOwnerDraft>) => void;
};

export function AccountRoleFields({
  category,
  residentSubType,
  committeeRole,
  tenantOwner,
  flatLabel,
  onCategoryChange,
  onResidentSubTypeChange,
  onCommitteeRoleChange,
  onTenantOwnerChange,
}: Props) {
  const showTenantFields = category === "RESIDENT" && residentSubType === "TENANT";

  return (
    <View>
      <SelectField
        label="Account type"
        value={category}
        options={ACCOUNT_CATEGORIES}
        onChange={(v) => onCategoryChange(v as AccountCategory)}
      />

      {category === "RESIDENT" && (
        <SelectField
          label="Resident type"
          value={residentSubType}
          options={RESIDENT_SUB_TYPES}
          onChange={(v) => onResidentSubTypeChange(v as ResidentSubType)}
        />
      )}

      {category === "COMMITTEE" && (
        <SelectField
          label="Committee role"
          value={committeeRole}
          options={COMMITTEE_ROLES}
          onChange={onCommitteeRoleChange}
        />
      )}

      {showTenantFields && (
        <View>
          <Muted>Tenant — enter flat owner details</Muted>
          <Field
            label="Original owner name"
            value={tenantOwner.tenant_owner_name}
            onChangeText={(v) => onTenantOwnerChange({ tenant_owner_name: v })}
          />
          <Field
            label="Owner mobile"
            value={tenantOwner.tenant_owner_phone}
            onChangeText={(v) => onTenantOwnerChange({ tenant_owner_phone: v })}
            keyboardType="phone-pad"
          />
          <Field
            label="Owner flat"
            value={tenantOwner.tenant_owner_flat_label || flatLabel || ""}
            onChangeText={(v) => onTenantOwnerChange({ tenant_owner_flat_label: v })}
          />
        </View>
      )}
    </View>
  );
}
