import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { CreateUserResponse, Flat } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { AccountRoleFields } from "../../components/AccountRoleFields";
import { SelectField } from "../../components/SelectField";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";
import {
  type AccountCategory,
  accountToApi,
  type ResidentSubType,
  userToAccountDraft,
} from "../../lib/userRoles";
import type { AdminStackParamList } from "../../navigation/types";
import { colors } from "../../theme";

export function AdminCreateUserScreen() {
  const { token, user } = useAuth();
  const route = useRoute<RouteProp<AdminStackParamList, "CreateUser">>();
  const editUserId = route.params?.userId;

  const [flats, setFlats] = useState<Flat[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<AccountCategory>("OWNER");
  const [residentSubType, setResidentSubType] = useState<ResidentSubType>("OWNER");
  const [flatId, setFlatId] = useState("");
  const [committeeRole, setCommitteeRole] = useState("PRESIDENT");
  const [tenantOwner, setTenantOwner] = useState({
    tenant_owner_name: "",
    tenant_owner_phone: "",
    tenant_owner_flat_label: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(editUserId));
  const [created, setCreated] = useState<CreateUserResponse | null>(null);

  useEffect(() => {
    if (token) api.flats(token).then(setFlats);
  }, [token]);

  useEffect(() => {
    if (!token || !editUserId) return;
    setPrefillLoading(true);
    api
      .user(token, editUserId)
      .then((u) => {
        const draft = userToAccountDraft(u);
        setName(u.name);
        setPhone(u.phone);
        setCategory(draft.category);
        setResidentSubType(draft.residentSubType);
        setFlatId(u.flat_id || "");
        setCommitteeRole(u.committee_role || "PRESIDENT");
        setTenantOwner({
          tenant_owner_name: u.tenant_owner_name || "",
          tenant_owner_phone: u.tenant_owner_phone || "",
          tenant_owner_flat_label: u.tenant_owner_flat_label || u.flat_label || "",
        });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load user");
      })
      .finally(() => setPrefillLoading(false));
  }, [token, editUserId]);

  if (!user?.is_main_admin) {
    return (
      <Screen>
        <Card>
          <Muted>Only the main Secretary can create resident logins on mobile.</Muted>
        </Card>
      </Screen>
    );
  }

  if (user.must_change_password) {
    return (
      <Screen>
        <Card>
          <Muted>Complete profile setup before creating logins.</Muted>
        </Card>
      </Screen>
    );
  }

  async function submit() {
    if (!token) return;
    if (!editUserId && !name.trim()) {
      setError("Enter name");
      return;
    }
    if (!flatId) {
      setError("Select a flat");
      return;
    }
    if (category === "RESIDENT" && residentSubType === "TENANT") {
      if (!tenantOwner.tenant_owner_name.trim() || !tenantOwner.tenant_owner_phone.trim()) {
        setError("Enter tenant owner name and mobile");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const { role, resident_type } = accountToApi(category, residentSubType);
      const body: Record<string, unknown> = { role, resident_type };
      if (role === "RESIDENT" || role === "COMMITTEE") {
        body.flat_id = flatId;
      }
      if (role === "COMMITTEE") body.committee_role = committeeRole;
      if (resident_type === "TENANT") {
        body.tenant_owner_name = tenantOwner.tenant_owner_name;
        body.tenant_owner_phone = tenantOwner.tenant_owner_phone;
        body.tenant_owner_flat_label =
          tenantOwner.tenant_owner_flat_label ||
          flats.find((f) => f.id === flatId)?.label;
      }

      const res = editUserId
        ? await api.updateUserLogin(token, editUserId, body)
        : await api.createUser(token, { ...body, name: name.trim(), phone: phone.trim() || undefined });
      setCreated(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : editUserId
            ? "Failed to update login"
            : "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  }

  if (prefillLoading) {
    return (
      <Screen>
        <Card>
          <Muted>Loading user…</Muted>
        </Card>
      </Screen>
    );
  }

  if (created) {
    const c = created.credentials;
    return (
      <Screen>
        <Card>
          <Subtitle>{editUserId ? "Login updated" : "Resident created"}</Subtitle>
          <Text>Name: {c.name}</Text>
          <Text>Mobile: {c.phone}</Text>
          <Text>Password: {c.password}</Text>
          <Text>Role: {c.role}</Text>
          {c.committee_role ? <Text>Committee: {c.committee_role.replace(/_/g, " ")}</Text> : null}
          {c.flat_label ? <Text>Flat: {c.flat_label}</Text> : null}
          <Muted>Share login details with the resident. They must complete profile setup on first login.</Muted>
        </Card>
      </Screen>
    );
  }

  const selectedFlat = flats.find((f) => f.id === flatId);

  return (
    <Screen>
      <Card>
        <Subtitle>{editUserId ? `Create login — ${name}` : "New resident login"}</Subtitle>
        <Muted>
          {editUserId
            ? "Set the role and save. The system applies the default office password and shows the credential card."
            : "Each user must complete profile and password setup on first login."}
        </Muted>
      </Card>

      <Card>
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          editable={!editUserId}
        />
        <Field
          label={editUserId ? "Mobile" : "Mobile (optional — auto-generated if blank)"}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!editUserId}
        />

        <AccountRoleFields
          category={category}
          residentSubType={residentSubType}
          committeeRole={committeeRole}
          tenantOwner={tenantOwner}
          flatLabel={selectedFlat?.label}
          onCategoryChange={setCategory}
          onResidentSubTypeChange={setResidentSubType}
          onCommitteeRoleChange={setCommitteeRole}
          onTenantOwnerChange={(patch) => setTenantOwner((prev) => ({ ...prev, ...patch }))}
        />

        <SelectField
          label="Flat"
          value={flatId}
          placeholder="Select flat"
          options={flats.map((f) => ({
            value: f.id,
            label: f.is_merged ? `${f.label} (duplex)` : f.label,
          }))}
          onChange={setFlatId}
        />

        <Muted>Or tap a flat below</Muted>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {flats.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFlatId(f.id)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: flatId === f.id ? colors.primary : "#fff",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: flatId === f.id ? "#fff" : colors.text }}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button
          label={
            loading
              ? "Saving…"
              : editUserId
                ? "Save login & show password"
                : "Create user"
          }
          onPress={submit}
          loading={loading}
        />
      </Card>

      {!editUserId && (
        <Card>
          <Muted>
            Excel bulk import is available on www.marvelrocks.in on a computer (download template and upload).
          </Muted>
        </Card>
      )}
    </Screen>
  );
}
