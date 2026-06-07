import { useCallback, useMemo, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { CollectionDashboard } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { SelectField } from "../../components/SelectField";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";
import { shareBillReceipt } from "../../lib/receipt";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminCollectionScreen() {
  const { token } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<CollectionDashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const base = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      options.push({ value, label: monthLabel(value) });
    }
    return options;
  }, []);

  const load = useCallback(() => {
    if (token) api.collectionDashboard(token, month).then(setData);
  }, [token, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function generate() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await api.generateBills(token, month);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate bills");
    } finally {
      setBusy(false);
    }
  }

  async function markCash(billId: string) {
    if (!token) return;
    setPayingId(billId);
    setError("");
    try {
      await api.payBill(token, billId, "CASH");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record payment");
    } finally {
      setPayingId(null);
    }
  }

  async function downloadReceipt(billId: string) {
    if (!token) return;
    setReceiptId(billId);
    setError("");
    try {
      await shareBillReceipt(token, billId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open receipt");
    } finally {
      setReceiptId(null);
    }
  }

  const summary = data?.summary;
  const paidPct =
    summary && summary.flat_count > 0
      ? ((summary.flats_paid / summary.flat_count) * 100).toFixed(1)
      : "0";

  return (
    <Screen>
      <SelectField
        label="Billing period"
        value={month}
        options={monthOptions}
        onChange={setMonth}
      />

      {error ? <ErrorText>{error}</ErrorText> : null}

      {summary && (
        <Card>
          <Subtitle>Collection — {summary.month}</Subtitle>
          <Muted>Collected {inr(summary.collected)}</Muted>
          <Muted>Still pending {inr(summary.still_pending)}</Muted>
          <Muted>
            Flats paid {summary.flats_paid} / {summary.flat_count} ({paidPct}%)
          </Muted>
          <Button
            label={busy ? "Generating…" : "Generate bills for period"}
            onPress={generate}
            loading={busy}
          />
        </Card>
      )}

      {data?.rows.map((row) => (
        <Card key={row.id}>
          <Subtitle>Flat {row.flat_label ?? row.flat_id}</Subtitle>
          <Text style={{ fontWeight: "700" }}>{inr(row.amount)}</Text>
          <Muted>
            {row.status === "PAID" ? "Paid" : "Pending"}
            {row.resident_name ? ` · ${row.resident_name}` : ""}
            {row.resident_phone ? ` · ${row.resident_phone}` : ""}
          </Muted>
          {row.resident_type ? <Muted>Type: {row.resident_type}</Muted> : null}
          {row.status === "PAID" && row.paid_by_name ? (
            <Muted>Paid by: {row.paid_by_name}</Muted>
          ) : null}
          {row.transaction_id ? (
            <Muted>Txn: {row.transaction_id.slice(0, 10)}…</Muted>
          ) : null}
          {row.payment_method ? <Muted>Gateway: {row.payment_method}</Muted> : null}

          {row.status !== "PAID" && (
            <Button
              label={payingId === row.id ? "Saving…" : "Mark cash paid"}
              onPress={() => markCash(row.id)}
              disabled={payingId === row.id}
            />
          )}

          {row.status === "PAID" && (
            <>
              {row.paid_at && (
                <Muted>
                  Paid {new Date(row.paid_at).toLocaleDateString()}
                  {row.payment_method ? ` · ${row.payment_method}` : ""}
                </Muted>
              )}
              <Button
                label={receiptId === row.id ? "Opening…" : "Download receipt (PDF)"}
                variant="secondary"
                onPress={() => downloadReceipt(row.id)}
                disabled={receiptId === row.id}
              />
            </>
          )}
        </Card>
      ))}

      {!data?.rows.length && (
        <Card>
          <Muted>
            No bills for {monthLabel(month)}. Tap Generate bills for period to create maintenance entries.
          </Muted>
        </Card>
      )}
    </Screen>
  );
}
