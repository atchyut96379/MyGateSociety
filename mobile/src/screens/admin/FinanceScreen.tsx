import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { AccountsSummary, Expense, Transaction } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";
import { colors } from "../../theme";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function AdminFinanceScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("MAINTENANCE");
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api.accountsSummary(token).then(setSummary);
      api.expenses(token).then(setExpenses);
      api.transactions(token).then(setTransactions);
    }, [token])
  );

  async function addExpense() {
    if (!token || !title.trim() || !amount) return;
    setError("");
    try {
      await api.createExpense(token, {
        title: title.trim(),
        category,
        amount: parseFloat(amount),
        expense_date: new Date().toISOString().slice(0, 10),
      });
      setTitle("");
      setAmount("");
      api.accountsSummary(token).then(setSummary);
      api.expenses(token).then(setExpenses);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Record expense</Subtitle>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Field label="Category" value={category} onChangeText={setCategory} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Save expense" onPress={addExpense} />
      </Card>
      {summary && (
        <Card>
          <Muted>Society balance</Muted>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>
            {inr(summary.balance)}
          </Text>
          <Muted>
            Collected {inr(summary.total_collected)} · Expenses {inr(summary.total_expenses)}
          </Muted>
          <Muted>{summary.pending_bills} pending bills · {summary.flat_count} flats</Muted>
        </Card>
      )}

      <Subtitle>Recent collections</Subtitle>
      {transactions.slice(0, 10).map((t) => (
        <Card key={t.id}>
          <Text style={{ fontWeight: "600" }}>{t.description}</Text>
          <Muted>
            {inr(t.amount)} · {t.method}
            {t.flat_label ? ` · Flat ${t.flat_label}` : ""}
          </Muted>
        </Card>
      ))}

      <Subtitle>Recent expenses</Subtitle>
      {expenses.slice(0, 10).map((e) => (
        <Card key={e.id}>
          <Text style={{ fontWeight: "600" }}>{e.title}</Text>
          <Muted>
            {inr(e.amount)} · {e.category} · {e.expense_date}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}
