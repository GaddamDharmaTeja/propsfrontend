import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { asArray, money } from "../lib/format";
import "./app-pages.css";

const labels = {
  STABLE: "Stable",
  MODERATE_CREEP: "Moderate creep",
  SIGNIFICANT_CREEP: "Significant creep",
  INSUFFICIENT_DATA: "Need more history",
  PROVISIONAL: "Provisional",
};

export default function Insights() {
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ category: "Dining", amount: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState("");

  const load = () => Promise.all([
    api("/lifestyle-creep/summary"),
    api("/lifestyle-creep/history?months=6"),
    api("/transactions"),
    api("/categories"),
  ]).then(([creep, trend, rows, categoryList]) => {
    setSummary(creep);
    setHistory(asArray(trend?.months || trend));
    setTransactions(asArray(rows));
    setCatalog(asArray(categoryList));
  });

  useEffect(() => {
    let live = true;
    load().catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  const saveBaseline = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/lifestyle-creep/baselines", {
        method: "PUT",
        body: JSON.stringify({ category: draft.category, monthlyAmount: draft.amount }),
      });
      setSummary(await api("/lifestyle-creep/summary"));
      setDraft({ ...draft, amount: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const clearBaseline = async (category) => {
    setError("");
    try {
      await api(`/lifestyle-creep/baselines?category=${encodeURIComponent(category)}`, { method: "DELETE" });
      setSummary(await api("/lifestyle-creep/summary"));
    } catch (e) {
      setError(e.message);
    }
  };

  const categories = asArray(summary?.categories);
  const contributions = asArray(summary?.contributions);
  const maxHistory = Math.max(...history.map((row) => Number(row.lci) || 0), 1);
  const spendByCategory = {};
  transactions.filter((row) => !row.income).forEach((row) => {
    spendByCategory[row.category || "Other"] = (spendByCategory[row.category || "Other"] || 0) + Number(row.amount || 0);
  });

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Insights</h1>
          <p>Lifestyle creep compares this month with your own baseline, not with anyone else’s.</p>
        </div>
      </div>
      {error && <div className="banner">{error}</div>}
      <div className="tabs">
        {[["overview", "Overview"], ["trends", "Spending trends"], ["categories", "Category analysis"], ["creep", "Lifestyle creep"]].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} type="button" onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {(tab === "overview" || tab === "creep") && (
        <div className="metric-grid">
          <MetricCard
            id="index"
            open={open}
            setOpen={setOpen}
            label="Lifestyle creep index"
            value={Number(summary?.lci || 0).toFixed(1)}
            note={labels[summary?.status] || "Calculating"}
            noteClass={summary?.status === "STABLE" ? "up" : "down"}
            why={`This is ${Number(summary?.lci || 0).toFixed(1)}, so the status is ${labels[summary?.status] || "Stable"}. Stable is under 20. Moderate creep is 20 to 50. Significant creep is 50 or more. A category under its baseline counts as zero, so spending less can still be Stable.`}
          >
            <CompareTable rows={categories} />
          </MetricCard>
          <MetricCard
            id="baseline"
            open={open}
            setOpen={setOpen}
            label="Baseline spend"
            value={money(summary?.baselineSpend)}
            note={summary?.manualBaseline ? "Amount you entered" : summary?.provisional ? "Provisional, under 60 days" : "Two-month average"}
            why={summary?.manualBaseline
              ? `Baseline spend is ${money(summary?.baselineSpend)} because you entered a monthly amount for these categories.`
              : summary?.provisional
                ? `Baseline spend is ${money(summary?.baselineSpend)}. History covers ${Number(summary?.usableDays) || 0} days, under 60, so each category is scaled to a 30-day month and then added up.`
                : `Baseline spend is ${money(summary?.baselineSpend)}. Each category uses the average of the previous two months.`}
          >
            <CompareTable rows={categories} />
          </MetricCard>
          <MetricCard
            id="current"
            open={open}
            setOpen={setOpen}
            label="Current discretionary"
            value={money(summary?.currentSpend)}
            why={`Current discretionary is ${money(summary?.currentSpend)}. It is this month’s lifestyle spending only. Necessary costs such as rent, groceries, and healthcare are left out.`}
          >
            <CompareTable rows={categories} />
            <p className="muted">Household lifestyle payments</p>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Who</th><th>Amount</th><th>Reason</th></tr></thead>
                <tbody>
                  {contributions.map((row, index) => (
                    <tr key={`${row.date}-${row.description}-${index}`}>
                      <td data-label="Date">{row.date}</td>
                      <td data-label="Description">{row.description}</td>
                      <td data-label="Category">{row.category}</td>
                      <td data-label="Who">{row.who}</td>
                      <td data-label="Amount">{money(row.amount)}</td>
                      <td data-label="Reason">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {contributions.length === 0 && <p className="empty">No lifestyle payments this month.</p>}
          </MetricCard>
          <MetricCard
            id="delta"
            open={open}
            setOpen={setOpen}
            label="Creep delta"
            value={money(summary?.creepDelta)}
            why={`Creep delta is ${money(summary?.creepDelta)}. ${money(summary?.currentSpend)} current − ${money(summary?.baselineSpend)} baseline = ${money(summary?.creepDelta)}. A minus means this month is below the baseline.`}
          >
            <CompareTable rows={categories} />
          </MetricCard>
        </div>
      )}
      {(tab === "overview" || tab === "creep") && (
        <form className="card form-grid" onSubmit={saveBaseline}>
          <div className="full">
            <h2>Add a baseline</h2>
            <p className="muted">Enter the monthly amount this category usually costs. Prospr compares this month with that amount until you clear it.</p>
          </div>
          <label>Category
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {[...new Set([
                ...["Dining", "Shopping", "Entertainment", "Subscriptions", "Travel"],
                ...catalog.filter((item) => item.classification === "DISCRETIONARY").map((item) => item.name),
                ...categories.map((row) => row.category),
              ])].map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label>Monthly amount<input required type="number" min="0" step="1" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="3000" /></label>
          <div className="full"><button className="btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save baseline"}</button></div>
        </form>
      )}
      {(tab === "overview" || tab === "creep" || tab === "categories") && (
        <article className="card table-wrap">
          <h2>Category versus baseline</h2>
          <table className="data">
            <thead><tr><th>Category</th><th>Baseline</th><th>Current</th><th>Change</th></tr></thead>
            <tbody>
              {categories.map((row) => (
                <tr key={row.category}>
                  <td data-label="Category">{row.category}</td>
                  <td data-label="Baseline">{money(row.baseline)}{row.baselineSource === "MANUAL" ? <button className="btn-ghost" type="button" onClick={() => clearBaseline(row.category)}>Clear</button> : null}</td>
                  <td data-label="Current">{money(row.current)}</td>
                  <td data-label="Change" className={Number(row.increasePct) > 0 ? "expense" : "income"}>{Number(row.increasePct) > 0 ? "+" : ""}{row.increasePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && <p className="empty">Import more history to unlock category creep.</p>}
        </article>
      )}
      {(tab === "overview" || tab === "trends") && (
        <article className="card">
          <h2>Monthly index</h2>
          <div className="bars">
            {history.map((row) => (
              <div key={row.month}><i style={{ height: `${Math.max(6, (Number(row.lci) / maxHistory) * 100)}%` }} /><span>{String(row.month).slice(5)}</span></div>
            ))}
          </div>
          {history.length === 0 && <p className="empty">No trend yet.</p>}
        </article>
      )}
      {tab === "categories" && (
        <article className="card">
          <h2>All-time category spend</h2>
          {Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]).map(([name, amount]) => (
            <div className="member-line" key={name}><span className="grow">{name}</span><strong>{money(amount)}</strong></div>
          ))}
        </article>
      )}
    </section>
  );
}

function MetricCard({ id, open, setOpen, label, value, note, noteClass, why, children }) {
  const shown = open === id;
  return (
    <>
      <article className={shown ? "card metric selected" : "card metric"}>
        <div className="metric-head">
          <span>{label}</span>
          <button className={shown ? "card-symbol active" : "card-symbol"} type="button" aria-expanded={shown} aria-label={`Show ${label} transactions`} title={`Show ${label} transactions`} onClick={() => setOpen(shown ? "" : id)}>☰</button>
        </div>
        <b>{value}</b>
        {note && <small className={noteClass || "muted"}>{note}</small>}
      </article>
      {shown && (
        <div className="card metric-panel">
          <h2>{label}</h2>
          <p>{why}</p>
          {children}
        </div>
      )}
    </>
  );
}

function CompareTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead><tr><th>Category</th><th>Baseline</th><th>Current</th><th>Compare</th></tr></thead>
        <tbody>
          {rows.map((row) => {
            const gap = Number(row.current || 0) - Number(row.baseline || 0);
            return (
              <tr key={row.category}>
                <td data-label="Category">{row.category}</td>
                <td data-label="Baseline">{money(row.baseline)}</td>
                <td data-label="Current">{money(row.current)}</td>
                <td data-label="Compare" className={gap > 0 ? "expense" : "income"}>{money(gap)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="empty">No lifestyle categories to compare yet.</p>}
    </div>
  );
}
