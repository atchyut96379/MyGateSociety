import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../../api/client";
import type { BulkImportResponse, CreateUserResponse, Flat } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { AccountRoleFields } from "../../components/AccountRoleFields";
import { ADMIN_NAV } from "../../lib/nav";
import {
  type AccountCategory,
  accountToApi,
  type ResidentSubType,
  userToAccountDraft,
} from "../../lib/userRoles";

export default function AdminNewUser() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const editUserId = searchParams.get("userId");
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [importError, setImportError] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(editUserId));
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [created, setCreated] = useState<CreateUserResponse | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    api.flats(token).then(setFlats);
  }, [token]);

  useEffect(() => {
    api
      .health()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

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
    return <Navigate to="/admin/users" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/setup" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
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
        : await api.createUser(token, { ...body, name, phone });
      setCreated(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : editUserId ? "Failed to update login" : "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  }

  async function onImport(e: FormEvent) {
    e.preventDefault();
    if (!token || !fileRef.current?.files?.[0]) {
      setImportError("Choose an Excel file (.xlsx)");
      return;
    }
    setImporting(true);
    setImportError("");
    setImportResult(null);
    setImportProgress("");
    try {
      const res = await api.importUsers(token, fileRef.current.files[0], (done, total) => {
        setImportProgress(`Importing row ${done} of ${total}…`);
      });
      setImportResult(res);
      if (res.failed > 0 && res.created === 0) {
        const firstErr = res.results.find((r) => !r.ok)?.error;
        setImportError(firstErr ? `All rows failed. Example: ${firstErr}` : "All rows failed — check flat numbers.");
      }
      fileRef.current.value = "";
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Import failed";
      setImportError(msg);
    } finally {
      setImporting(false);
    }
  }

  if (created) {
    const c = created.credentials;
    return (
      <Shell title="User created" nav={ADMIN_NAV}>
        <div className="credentials-box">
          <h3 style={{ marginTop: 0 }}>Credential card — copy & send via WhatsApp</h3>
          <p>
            <strong>Name:</strong> {c.name}
            <br />
            <strong>Mobile:</strong> {c.phone}
            <br />
            <strong>Password:</strong> {c.password}
            <br />
            <strong>Role:</strong> {c.role}
            {c.committee_role && (
              <>
                <br />
                <strong>Committee:</strong> {c.committee_role.replace(/_/g, " ")}
              </>
            )}
            {c.flat_label && (
              <>
                <br />
                <strong>Flat:</strong> {c.flat_label}
              </>
            )}
          </p>
          <p className="muted">Resident must complete first-time profile setup on login.</p>
        </div>
        {editUserId ? (
          <Link to="/admin/users" className="btn" style={{ marginTop: "1rem" }}>
            Back to users
          </Link>
        ) : (
          <Link to="/admin/users/new" className="btn" style={{ marginTop: "1rem" }}>
            Create another
          </Link>
        )}
        <Link to="/admin/users" className="btn btn-secondary" style={{ marginTop: "0.5rem" }}>
          Back to users
        </Link>
      </Shell>
    );
  }

  if (prefillLoading) {
    return (
      <Shell title="Create login" nav={ADMIN_NAV}>
        <p className="muted">Loading user…</p>
      </Shell>
    );
  }

  return (
    <Shell title={editUserId ? `Create login — ${name}` : "Secretary — create login"} nav={ADMIN_NAV}>
      <div className="card" style={{ marginBottom: "1rem", background: "#ecfdf5", borderColor: "#6ee7b7" }}>
        <p style={{ margin: 0 }}>
          {editUserId ? (
            <>
              Set the <strong>role</strong> and save. The system applies the <strong>default office password</strong>{" "}
              (same rules as bulk import) and shows the credential card to share.
            </>
          ) : (
            <>
              Only the Secretary can create logins. Each user must complete{" "}
              <strong>profile + password setup</strong> on first login.
            </>
          )}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card">
        <h3 style={{ marginTop: 0 }}>{editUserId ? "Login details" : "Single user"}</h3>
        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            readOnly={Boolean(editUserId)}
          />
        </div>
        <div className="field">
          <label>Mobile</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            readOnly={Boolean(editUserId)}
          />
        </div>
        <div className="field">
          <label>Account type</label>
          <AccountRoleFields
            category={category}
            residentSubType={residentSubType}
            committeeRole={committeeRole}
            tenantOwner={tenantOwner}
            flatLabel={flats.find((f) => f.id === flatId)?.label}
            onCategoryChange={setCategory}
            onResidentSubTypeChange={setResidentSubType}
            onCommitteeRoleChange={setCommitteeRole}
            onTenantOwnerChange={(patch) => setTenantOwner((prev) => ({ ...prev, ...patch }))}
          />
        </div>
        <div className="field">
          <label>Flat</label>
          <select value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
            <option value="">Select flat</option>
            {flats.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}{f.is_merged ? " (duplex)" : ""}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading
            ? "Saving…"
            : editUserId
              ? "Save login & show password"
              : "Create user"}
        </button>
      </form>

      {!editUserId && <form onSubmit={onImport} className="card">
        <h3 style={{ marginTop: 0 }}>Bulk import (Excel)</h3>
        {apiOk === false && (
          <p className="error" style={{ marginTop: 0 }}>
            API not reachable from this browser ({typeof window !== "undefined" ? window.location.origin : ""}).
            In Azure Portal → App Service → Environment variables → set{" "}
            <code>CORS_ORIGINS</code> to include that URL, then restart the API.
          </p>
        )}
        {apiOk === true && (
          <p className="muted" style={{ margin: 0, color: "var(--primary)" }}>
            API connection OK
          </p>
        )}
        <p className="muted">
          Row 1: <code>name</code>, <code>phone</code>, <code>flat</code>, <code>Resident Type</code>{" "}
          (<code>Owner</code> or <code>Tenant</code>), <code>committee_role</code>, <code>email</code>.
          Data from row 2. Phone optional. Duplex: <code>109/110</code>.
          Multiple phones: <code>9876543210 / 9876543211</code>.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginBottom: "0.75rem" }}
          onClick={() => token && api.downloadUserImportTemplate(token)}
        >
          Download template (.xlsx)
        </button>
        <div className="field">
          <label>Excel file</label>
          <input ref={fileRef} type="file" accept=".xlsx,.xlsm" required />
        </div>
        {importProgress && <p className="muted">{importProgress}</p>}
        {importError && <p className="error">{importError}</p>}
        <button type="submit" className="btn btn-block" disabled={importing}>
          {importing ? importProgress || "Importing…" : "Upload & create users"}
        </button>
      </form>}

      {!editUserId && importResult && (
        <div className="card">
          <h3>Import result</h3>
          <p>
            <strong>{importResult.created}</strong> created,{" "}
            <strong>{importResult.failed}</strong> failed
          </p>
          {importResult.results.map((r) => (
            <div key={r.row} className="list-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <span>
                Row {r.row}: {r.name} ({r.phone})
                {r.ok ? " ✓" : ` — ${r.error}`}
              </span>
              {r.ok && r.password && (
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  Password: {r.password}
                  {r.flat_label ? ` · Flat ${r.flat_label}` : ""}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Link to="/admin/users" className="muted">← Back to users</Link>
    </Shell>
  );
}
