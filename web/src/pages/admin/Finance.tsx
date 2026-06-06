import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AccountsSummary, Expense, Transaction } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AdminFinance() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("MAINTENANCE");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidTo, setPaidTo] = useState("");

  function load() {
    if (!token) return;
    api.accountsSummary(token).then(setSummary);
    api.expenses(token).then(setExpenses);
    api.transactions(token).then(setTransactions);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createExpense(token, {
      title,
      category,
      amount: parseFloat(amount),
      expense_date: expenseDate,
      paid_to: paidTo || undefined,
    });
    setTitle("");
    setAmount("");
    setPaidTo("");
    load();
  }

  return (
    <Shell title="Finance" nav={ADMIN_NAV}>
      {summary && (
        <div className="grid-2">
          <div className="card">
            <p className="muted">Collected</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--primary)" }}>
              {inr(summary.total_collected)}
            </p>
          </div>
          <div className="card">
            <p className="muted">Expenses</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 700 }}>{inr(summary.total_expenses)}</p>
          </div>
          <div className="card">
            <p className="muted">Balance</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 700 }}>{inr(summary.balance)}</p>
          </div>
          <div className="card">
            <p className="muted">Pending bills</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 700 }}>{summary.pending_bills}</p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="card">
        <h3>Record expense</h3>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="SECURITY">Security</option>
            <option value="UTILITIES">Utilities</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Amount (₹)</label>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
        </div>
        <div className="field">
          <label>Paid to</label>
          <input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-block">Save expense</button>
      </form>

      <h3>Recent expenses</h3>
      {expenses.map((x) => (
        <div key={x.id} className="card">
          <strong>{x.title}</strong>
          <span className="badge" style={{ marginLeft: "0.5rem" }}>{x.category}</span>
          <p style={{ margin: "0.25rem 0", fontWeight: 600 }}>{inr(x.amount)}</p>
          <p className="muted" style={{ margin: 0 }}>
            {new Date(x.expense_date).toLocaleDateString()}
            {x.paid_to ? ` · ${x.paid_to}` : ""}
          </p>
        </div>
      ))}

      <h3>Ledger</h3>
      {transactions.map((t) => (
        <div key={t.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{t.description}</strong>
            <span>{inr(t.amount)}</span>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {t.type} · {t.method}
            {t.flat_label ? ` · Flat ${t.flat_label}` : ""}
            {" · "}{new Date(t.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </Shell>
  );
}
