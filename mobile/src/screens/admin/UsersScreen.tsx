import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ApiError, api } from "../../api/client";
import type { User } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import {
  AccountRoleFields,
  type TenantOwnerDraft,
} from "../../components/AccountRoleFields";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";
import { COMMITTEE_ROLES } from "../../lib/committee";
import {
  type AccountCategory,
  accountDisplayLabel,
  accountToApi,
  type ResidentSubType,
  userToAccountDraft,
} from "../../lib/userRoles";
import type { AdminStackParamList } from "../../navigation/types";
import { colors } from "../../theme";

type Tab = "residents" | "guards";

type RoleDraft = {
  category: AccountCategory;
  residentSubType: ResidentSubType;
  committee_role: string;
  tenantOwner: TenantOwnerDraft;
};

const IMPORT_PLACEHOLDER_OWNER = "owner (update in office)";

function draftFromUser(u: User): RoleDraft {
  const base = userToAccountDraft(u);
  const placeholderOwner =
    !u.tenant_owner_name ||
    u.tenant_owner_name.trim().toLowerCase() === IMPORT_PLACEHOLDER_OWNER;
  return {
    category: base.category,
    residentSubType: base.residentSubType,
    committee_role: base.committee_role,
    tenantOwner: {
      tenant_owner_name: placeholderOwner ? "" : u.tenant_owner_name || "",
      tenant_owner_phone: placeholderOwner ? "" : u.tenant_owner_phone || "",
      tenant_owner_flat_label: u.tenant_owner_flat_label || u.flat_label || "",
    },
  };
}

function buildUpdateBody(target: User, draft: RoleDraft): Record<string, unknown> {
  const { role, resident_type } = accountToApi(draft.category, draft.residentSubType);
  const body: Record<string, unknown> = {
    role,
    resident_type,
    flat_id: target.flat_id,
  };
  if (role === "COMMITTEE") {
    body.committee_role = draft.committee_role;
  }
  if (resident_type === "TENANT") {
    body.tenant_owner_name = draft.tenantOwner.tenant_owner_name;
    body.tenant_owner_phone = draft.tenantOwner.tenant_owner_phone;
    body.tenant_owner_flat_label =
      draft.tenantOwner.tenant_owner_flat_label || target.flat_label;
  }
  return body;
}

export function AdminUsersScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("residents");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, RoleDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const canManage = Boolean(user?.is_main_admin && !user.must_change_password);

  const residents = useMemo(() => users.filter((u) => u.role !== "SECURITY"), [users]);
  const guards = useMemo(() => users.filter((u) => u.role === "SECURITY"), [users]);
  const visible = tab === "guards" ? guards : residents;

  const loadUsers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .users(token)
      .then((list) => {
        setUsers(list);
        const next: Record<string, RoleDraft> = {};
        for (const u of list) {
          next[u.id] = draftFromUser(u);
        }
        setDrafts(next);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  async function applyRoleChange(target: User) {
    if (!token || !canManage || target.is_main_admin) return;
    const draft = drafts[target.id];
    if (!draft) return;

    setSavingId(target.id);
    setRowError((prev) => ({ ...prev, [target.id]: "" }));
    try {
      await api.updateUserRole(token, target.id, buildUpdateBody(target, draft));
      loadUsers();
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [target.id]: err instanceof ApiError ? err.message : "Could not update role",
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Screen>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "residents" && styles.tabActive]}
          onPress={() => setTab("residents")}
        >
          <Text style={[styles.tabText, tab === "residents" && styles.tabTextActive]}>
            Residents ({residents.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "guards" && styles.tabActive]}
          onPress={() => setTab("guards")}
        >
          <Text style={[styles.tabText, tab === "guards" && styles.tabTextActive]}>
            Guards ({guards.length})
          </Text>
        </Pressable>
      </View>

      {canManage && tab === "residents" && (
        <Button
          label="+ New login"
          onPress={() => navigation.navigate("CreateUser", {})}
        />
      )}
      {canManage && tab === "guards" && (
        <Button label="+ Create guard" onPress={() => navigation.navigate("CreateGuard")} />
      )}

      {user?.is_main_admin && user.must_change_password && (
        <Card>
          <Muted>Complete profile setup before managing user logins.</Muted>
        </Card>
      )}

      {loading && (
        <Card>
          <Muted>Loading…</Muted>
        </Card>
      )}

      {!loading && visible.length === 0 && (
        <Card>
          <Muted>
            {tab === "guards"
              ? "No guards yet. Create a gate security login."
              : "No residents yet. Create logins from the button above."}
          </Muted>
        </Card>
      )}

      {visible.map((u) => {
        const draft = drafts[u.id];
        const editable = canManage && !u.is_main_admin && u.role !== "SECURITY";
        const isGuard = u.role === "SECURITY";

        return (
          <Card key={u.id}>
            <Subtitle>{u.name}</Subtitle>
            <Muted>
              {u.phone}
              {u.flat_label ? ` · Flat ${u.flat_label}` : ""}
              {isGuard ? " · Gate console" : ""}
            </Muted>

            {rowError[u.id] ? <ErrorText>{rowError[u.id]}</ErrorText> : null}

            {editable && draft ? (
              <View style={styles.editBlock}>
                <AccountRoleFields
                  category={draft.category}
                  residentSubType={draft.residentSubType}
                  committeeRole={draft.committee_role}
                  tenantOwner={draft.tenantOwner}
                  flatLabel={u.flat_label}
                  onCategoryChange={(category) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: { ...prev[u.id], category },
                    }))
                  }
                  onResidentSubTypeChange={(residentSubType) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: { ...prev[u.id], residentSubType },
                    }))
                  }
                  onCommitteeRoleChange={(committee_role) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: { ...prev[u.id], committee_role },
                    }))
                  }
                  onTenantOwnerChange={(patch) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [u.id]: {
                        ...prev[u.id],
                        tenantOwner: { ...prev[u.id].tenantOwner, ...patch },
                      },
                    }))
                  }
                />
                <View style={styles.actions}>
                  <Button
                    label={savingId === u.id ? "Saving…" : "Change role"}
                    variant="secondary"
                    onPress={() => applyRoleChange(u)}
                    disabled={savingId === u.id}
                  />
                  <Button
                    label="Create login"
                    onPress={() => navigation.navigate("CreateUser", { userId: u.id })}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.badge}>
                {accountDisplayLabel(
                  u.role,
                  u.resident_type,
                  u.committee_role,
                  COMMITTEE_ROLES
                )}
              </Text>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: { fontWeight: "600", color: colors.text, fontSize: 13 },
  tabTextActive: { color: "#fff" },
  editBlock: { marginTop: 8 },
  actions: { gap: 8, marginTop: 8 },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#e8f4ff",
    color: "#1d4ed8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
});
