import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { asArray, money, monthKey, today } from "../lib/format";
import "./app-pages.css";

export default function Budgets() {
  const month = today().slice(0, 7);
  const [budgets, setBudgets] = useState([]);
  const [spent, setSpent] = useState({});
  const [form, setForm] = useState({ category: "", amount: "", month });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/budgets"), api("/transactions")])
      .then(([budgetRows, transactions]) => {
        setBudgets(asArray(budgetRows));
        const totals = {};
        asArray(transactions).filter((row) => !row.income && monthKey(row.date) === month).forEach((row) => {
          const key = row.category || "Other";
          totals[key] = (totals[key] || 0) + Number(row.amount || 0);
        });
        setSpent(totals);
      })
      .catch((e) => setError(e.message));
  }, [month]);

  const save = async (event) => {
    event.preventDefault();
    try {
      const created = await api("/budgets", { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount), month: form.month || month }) });
      setBudgets((old) => [...old.filter((item) => !(item.category === created.category && item.month === created.month)), created]);
      setOpen(false);
      setForm({ category: "", amount: "", month });
    } catch (e) {
      setError(e.message);
    }
  };

  const updateAmount = async (budget) => {
    const next = window.prompt(`New budget for ${budget.category}`, String(budget.amount || ""));
    if (!next) return;
    try {
      const updated = await api(`/budgets/${budget.id}`, { method: "PUT", body: JSON.stringify({ ...budget, amount: Number(next) }) });
      setBudgets((old) => old.map((item) => item.id === updated.id ? updated : item));
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (budget) => {
    if (!window.confirm(`Remove the ${budget.category} budget?`)) return;
    try {
      await api(`/budgets/${budget.id}`, { method: "DELETE" });
      setBudgets((old) => old.filter((item) => item.id !== budget.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const monthBudgets = budgets.filter((item) => !item.month || item.month === month);
  const budgeted = monthBudgets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const used = monthBudgets.reduce((sum, item) => sum + (spent[item.category] || 0), 0);
  const ratio = budgeted > 0 ? Math.min(100, Math.round((used / budgeted) * 100)) : 0;

  return (
    <section className="page">
      <div className="page-head">
        <div><h1>Budgets</h1><p>Limits for {month}. Spent amounts come from this month’s transactions.</p></div>
        <button className="btn" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Add budget"}</button>
      </div>
      {error && <div className="banner">{error}</div>}
      <article className="card metric"><span>Overall</span><b>{ratio}% spent</b><div className="track"><i style={{ width: `${ratio}%` }} /></div><small className="muted">{money(used)} of {money(budgeted)}</small></article>
      {open && (
        <form className="card form-grid" onSubmit={save}>
          <label>Category<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Dining" /></label>
          <label>Budgeted ₹<input required type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Month<input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></label>
          <div className="full"><button className="btn" type="submit">Save budget</button></div>
        </form>
      )}
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Category</th><th>Budgeted</th><th>Spent</th><th>Remaining</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {monthBudgets.map((budget) => {
              const usedAmount = spent[budget.category] || 0;
              const remaining = Number(budget.amount || 0) - usedAmount;
              const over = remaining < 0;
              return (
                <tr key={budget.id}>
                  <td data-label="Category">{budget.category}</td>
                  <td data-label="Budgeted">{money(budget.amount)}</td>
                  <td data-label="Spent">{money(usedAmount)}</td>
                  <td data-label="Remaining">{money(remaining)}</td>
                  <td data-label="Status"><span className={`pill${over ? " bad" : ""}`}>{over ? "Over" : "On track"}</span></td>
                  <td data-label="Actions" className="row-actions">
                    <button className="btn-ghost" type="button" onClick={() => updateAmount(budget)}>Edit</button>
                    <button className="btn-danger" type="button" onClick={() => remove(budget)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {monthBudgets.length === 0 && <p className="empty">No budget for this month. Add one to start tracking.</p>}
      </div>
    </section>
  );
}
