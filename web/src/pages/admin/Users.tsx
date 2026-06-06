import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../../api/client";
import type { User } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { AccountRoleFields, type TenantOwnerDraft } from "../../components/AccountRoleFields";
import { Shell } from "../../components/Shell";
import { COMMITTEE_ROLES } from "../../lib/committee";
import { ADMIN_NAV } from "../../lib/nav";
import {
  type AccountCategory,
  accountDisplayLabel,
  accountToApi,
  type ResidentSubType,
  userToAccountDraft,
} from "../../lib/userRoles";

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

export default function AdminUsers() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("residents");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, RoleDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const canManage = Boolean(user?.is_main_admin && !user.must_change_password);

  const residents = useMemo(
    () => users.filter((u) => u.role !== "SECURITY"),
    [users]
  );
  const guards = useMemo(
    () => users.filter((u) => u.role === "SECURITY"),
    [users]
  );
  const visible = tab === "guards" ? guards : residents;

  function loadUsers() {
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
  }

  useEffect(() => {
    loadUsers();
  }, [token]);

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
    <Shell title="Users" nav={ADMIN_NAV}>
      <div className="tab-bar" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={tab === "residents" ? "tab active" : "tab"}
          onClick={() => setTab("residents")}
        >
          Residents & committee ({residents.length})
        </button>
        <button
          type="button"
          className={tab === "guards" ? "tab active" : "tab"}
          onClick={() => setTab("guards")}
        >
          Guards ({guards.length})
        </button>
      </div>

      {tab === "residents" && canManage && (
        <Link to="/admin/users/new" className="btn" style={{ marginBottom: "1rem" }}>
          + New login / Excel import
        </Link>
      )}
      {tab === "guards" && canManage && (
        <Link to="/admin/guards/new" className="btn" style={{ marginBottom: "1rem" }}>
          + Create guard
        </Link>
      )}
      {user?.is_main_admin && user.must_change_password && (
        <p className="muted">Complete profile setup before managing user logins.</p>
      )}

      <div className="card">
        <h3>
          {tab === "guards" ? `Gate security (${guards.length})` : `Residents & accounts (${residents.length})`}
        </h3>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="muted">
            {tab === "guards"
              ? "No guards yet. Create a gate security login."
              : "No residents yet. Import from Excel or create logins."}
          </p>
        ) : (
          visible.map((u) => {
            const draft = drafts[u.id];
            const editable = canManage && !u.is_main_admin && u.role !== "SECURITY";
            const isGuard = u.role === "SECURITY";
            return (
              <div key={u.id} className="list-row" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{u.name}</strong>
                  <br />
                  <span className="muted">
                    {u.phone}
                    {u.flat_label ? ` · Flat ${u.flat_label}` : ""}
                    {isGuard ? " · Gate console" : ""}
                  </span>
                  {rowError[u.id] && (
                    <p className="error" style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
                      {rowError[u.id]}
                    </p>
                  )}
                </div>

                {editable && draft ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                      alignItems: "flex-end",
                      flexShrink: 0,
                      maxWidth: "14rem",
                    }}
                  >
                    <AccountRoleFields
                      compact
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
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.55rem" }}
                        disabled={savingId === u.id}
                        onClick={() => applyRoleChange(u)}
                      >
                        {savingId === u.id ? "…" : "Change role"}
                      </button>
                      <Link
                        to={`/admin/users/new?userId=${u.id}`}
                        className="btn"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem" }}
                      >
                        Create login
                      </Link>
                    </div>
                  </div>
                ) : (
                  <span className={`badge ${isGuard ? "badge-amber" : "badge-blue"}`}>
                    {accountDisplayLabel(u.role, u.resident_type, u.committee_role, COMMITTEE_ROLES)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </Shell>
  );
}
