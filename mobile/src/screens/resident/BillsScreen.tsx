import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Bill, PaymentConfig } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";
import { payBillWithRazorpay } from "../../lib/razorpay";
import { shareBillReceipt } from "../../lib/receipt";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BillsScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Bill[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.myBills(token).then(setItems);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    api.paymentConfig().then(setPaymentConfig).catch(() => setPaymentConfig(null));
  }, []);

  const pending = items.filter((b) => b.status !== "PAID");

  async function payNow(bill: Bill) {
    if (!token || !user) return;
    setPayingId(bill.id);
    setError("");
    try {
      await payBillWithRazorpay(token, bill.id, {
        name: user.name,
        phone: user.phone,
        email: user.email,
      });
      await shareBillReceipt(token, bill.id);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) return;
      setError(err instanceof ApiError ? err.message : "Payment failed. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

  async function openReceipt(billId: string) {
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

  if (!user?.flat_id) {
    return (
      <Screen>
        <Card>
          <Muted>
            No flat is linked to your account. Contact the society office to assign your flat before paying maintenance.
          </Muted>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {pending.length > 0 && (
        <Card>
          <Subtitle>Maintenance pending — Flat {user.flat_label}</Subtitle>
          <Muted>
            {pending.length} unpaid bill{pending.length > 1 ? "s" : ""}. Pay now to get your receipt instantly.
          </Muted>
        </Card>
      )}

      {paymentConfig?.enabled && paymentConfig.mode === "test" && (
        <Card>
          <Muted>
            Test payment mode — no real money is charged until live Razorpay keys are enabled.
          </Muted>
        </Card>
      )}

      {paymentConfig?.enabled && paymentConfig.mode === "live" && (
        <Card>
          <Muted>Secure online payment — UPI, cards, and net banking via Razorpay.</Muted>
        </Card>
      )}

      {paymentConfig && !paymentConfig.enabled && pending.length > 0 && (
        <Muted>Online payment is not configured. Contact the society office to pay.</Muted>
      )}

      {error ? <ErrorText>{error}</ErrorText> : null}

      {items.map((b) => (
        <Card key={b.id}>
          <Subtitle>{b.month}</Subtitle>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>{inr(b.amount)}</Text>
          <Muted>
            {b.status === "PAID" ? "Paid" : "Pending"} · Due{" "}
            {new Date(b.due_date).toLocaleDateString()}
          </Muted>
          {b.description ? <Muted>{b.description}</Muted> : null}

          {b.status !== "PAID" && paymentConfig?.enabled && (
            <Button
              label={payingId === b.id ? "Opening payment…" : "Pay now"}
              onPress={() => payNow(b)}
              loading={payingId === b.id}
            />
          )}

          {b.status === "PAID" && b.paid_at && (
            <>
              <Muted>
                Paid {new Date(b.paid_at).toLocaleString()}
                {b.payment_method ? ` · ${b.payment_method}` : ""}
              </Muted>
              <Button
                label={receiptId === b.id ? "Opening…" : "Download receipt"}
                variant="secondary"
                onPress={() => openReceipt(b.id)}
                disabled={receiptId === b.id}
              />
            </>
          )}
        </Card>
      ))}

      {items.length === 0 && (
        <Card>
          <Muted>No maintenance bills yet.</Muted>
        </Card>
      )}
    </Screen>
  );
}
