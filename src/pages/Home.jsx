import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, currentUser } from "../lib/api";
import { asArray, initials, money, monthKey, signedPct } from "../lib/format";
import familyArtwork from "../images/family_background.png";
import "./app-pages.css";

export default function Home() {
  const user = currentUser();
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("family");
  const [open, setOpen] = useState("");

  useEffect(() => {
    let live = true;
    setOpen("");
    Promise.all([
      api(`/dashboard?view=${view}`),
      api(`/transactions?view=${view}`),
    ])
      .then(([dash, transactions]) => {
        if (!live) return;
        setData(dash || {});
        setRows(asArray(transactions));
      })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [view]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const categories = Object.entries(data?.categoryBreakdown || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 6);
  const max = Math.max(...categories.map(([, value]) => Number(value) || 0), 1);
  const goals = asArray(data?.goals);
  const onTrack = goals.filter((goal) => Number(goal.targetAmount) > 0 && Number(goal.savedAmount) / Number(goal.targetAmount) >= 0.5).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const month = data?.month || "";
  const counted = rows.filter((row) => {
    if (row.excluded || row.internalTransfer) return false;
    return !month || monthKey(row.date) === month;
  });
  const incomeRows = counted.filter((row) => row.income);
  const spendRows = counted.filter((row) => !row.income);
  const balance = data?.balance;
  const income = data?.income;
  const spending = data?.spending;
  const savings = data?.savings;
  const opening = balance != null && savings != null
    ? Number(balance) - Number(savings)
    : null;

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>{greeting}{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}</h1>
          <p>{view === "mine" ? "Transactions you uploaded or updated" : "Every household transaction"} for {data?.month || "this month"}.</p>
        </div>
        <div className="row-actions">
          <div className="tabs" aria-label="Whose finances">
            <button type="button" className={view === "mine" ? "active" : ""} onClick={() => setView("mine")}>My view</button>
            <button type="button" className={view === "family" ? "active" : ""} onClick={() => setView("family")}>Family view</button>
          </div>
          <Link className="btn" to="/transactions">Import or add</Link>
        </div>
      </div>
      {error && <div className="banner">{error}</div>}
      <div className="metric-grid home-metrics">
        <article className={open === "balance" ? "card metric selected" : "card metric"}>
          <div className="metric-head">
            <span>Total balance</span>
            <button className={open === "balance" ? "card-symbol active" : "card-symbol"} type="button" aria-expanded={open === "balance"} aria-label="Why balance differs from savings" title="Why these numbers differ" onClick={() => setOpen(open === "balance" ? "" : "balance")}>☰</button>
          </div>
          <b>{balanceLabel(balance)}</b>
          <small className="muted">Statement closing balance</small>
        </article>
        <Metric id="income" open={open} setOpen={setOpen} label="Total income" value={income} change={data?.incomeChangePct} />
        <Metric id="spending" open={open} setOpen={setOpen} label="Total spending" value={spending} change={data?.spendingChangePct} invert />
        <Metric id="savings" open={open} setOpen={setOpen} label="Total savings" value={savings} change={data?.savingsChangePct} />
        <article className={open === "goals" ? "card metric selected" : "card metric"}>
          <div className="metric-head">
            <span>Active goals</span>
            <button className={open === "goals" ? "card-symbol active" : "card-symbol"} type="button" aria-expanded={open === "goals"} aria-label="Show goals" title="Show goals" onClick={() => setOpen(open === "goals" ? "" : "goals")}>☰</button>
          </div>
          <b>{onTrack} of {goals.length} on track</b>
          <Link to="/goals">View goals</Link>
        </article>
      </div>
      {open === "goals" && (
        <article className="card metric-panel">
          <h2>Goals</h2>
          {goals.length === 0 && <p className="empty">No goals yet.</p>}
          {goals.map((goal) => (
            <div className="member-line" key={goal.id || goal.title}>
              <span className="grow">{goal.title}</span>
              <strong>{money(goal.savedAmount)} of {money(goal.targetAmount)}</strong>
            </div>
          ))}
        </article>
      )}
      {(open === "balance" || open === "income" || open === "spending" || open === "savings") && (
        <MetricExplainPopup
          kind={open}
          balance={balance}
          income={income}
          spending={spending}
          savings={savings}
          opening={opening}
          incomeRows={incomeRows}
          spendRows={spendRows}
          counted={counted}
          onClose={() => setOpen("")}
        />
      )}
      <div className="dash-grid">
        <article className="card">
          <div className="page-head"><h2>Spending overview</h2><b>{money(spending)}</b></div>
          {categories.length === 0 ? <p className="empty">Import a statement to see categories.</p> : (
            <div className="bars">
              {categories.map(([name, value]) => (
                <div key={name}><i style={{ height: `${Math.max(8, (Number(value) / max) * 100)}%` }} /><span>{name}</span></div>
              ))}
            </div>
          )}
        </article>
        <article className="card">
          <div className="page-head"><h2>Family</h2><Link to="/family">Manage</Link></div>
          {asArray(data?.memberSpend).length === 0 && <p className="empty">Spending will appear by member after imports.</p>}
          {asArray(data?.memberSpend).map((member) => (
            <div className="member-line" key={member.name}>
              <b className="avatar">{initials(member.name)}</b>
              <span className="grow">{member.name}</span>
              <strong>{money(member.amount)}</strong>
            </div>
          ))}
        </article>
        <article className="card">
          <div className="page-head"><h2>Insights</h2><Link to="/insights">Review</Link></div>
          {asArray(data?.insights).map((line) => <p className="insight-line" key={line}>{line}</p>)}
          {asArray(data?.insights).length === 0 && <p className="empty">Insights appear after two months of spending.</p>}
        </article>
        <article className="card">
          <div className="page-head"><h2>Recent transactions</h2><Link to="/transactions">View all</Link></div>
          {asArray(data?.recentTransactions).map((row) => (
            <div className="member-line" key={row.id || row.description}>
              <span className="grow"><b>{row.description}</b><small className="muted"> {row.category} · {row.date}</small></span>
              <span className={row.income ? "income" : "expense"}>{row.income ? "+" : "-"}{money(row.amount)}</span>
            </div>
          ))}
          {asArray(data?.recentTransactions).length === 0 && <p className="empty">No transactions this month.</p>}
        </article>
        <article className="card">
          <div className="page-head"><h2>Your goals</h2><Link className="btn-ghost" to="/goals">Add goal</Link></div>
          {goals.slice(0, 3).map((goal) => {
            const pct = Number(goal.targetAmount) > 0 ? Math.min(100, Math.round((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100)) : 0;
            return (
              <div key={goal.id || goal.title} className="goal-line" style={{ display: "grid" }}>
                <div className="page-head"><span>{goal.title}</span><b>{pct}%</b></div>
                <div className="track"><i style={{ width: `${pct}%` }} /></div>
                <small className="muted">{money(goal.savedAmount)} of {money(goal.targetAmount)}</small>
              </div>
            );
          })}
          {goals.length === 0 && <p className="empty">No goals yet.</p>}
        </article>
        <article className="card wellness">
          <img src={familyArtwork} alt="Family planning together" />
          <h2>Financial wellness is a family journey.</h2>
          <p>Plan together. Grow together.</p>
          <Link className="btn" to="/insights">Explore insights</Link>
        </article>
      </div>
    </section>
  );
}

function MetricExplainPopup({
  kind,
  balance,
  income,
  spending,
  savings,
  opening,
  incomeRows,
  spendRows,
  counted,
  onClose,
}) {
  const titles = {
    balance: "Total balance",
    income: "Total income",
    spending: "Total spending",
    savings: "Total savings",
  };
  const showDiff = kind === "balance" || kind === "savings";
  const listRows = kind === "income" ? incomeRows : kind === "spending" ? spendRows : kind === "savings" ? counted : null;

  return (
    <div className="metric-popup-backdrop" role="presentation" onClick={onClose}>
      <div
        className="metric-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metric-popup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="page-head">
          <h2 id="metric-popup-title">{titles[kind]}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">Close</button>
        </div>

        {kind === "balance" && (
          <>
            <p><strong>{balanceLabel(balance)}</strong> is cash left in the account at the end of your statement (closing balance).</p>
            <p className="muted">It is not “how much you saved this month.”</p>
          </>
        )}
        {kind === "income" && (
          <p><strong>{money(income)}</strong> is money that came in this period (credits / deposits).</p>
        )}
        {kind === "spending" && (
          <p><strong>{money(spending)}</strong> is money that went out this period (debits / withdrawals).</p>
        )}
        {kind === "savings" && (
          <p><strong>{money(savings)}</strong> is income − spending for this period only. It does not ask how much is in the bank.</p>
        )}

        {showDiff && (
          <div className="metric-diff">
            <h3>Why balance and savings differ</h3>
            <p>Your account did not start this period at ₹0. Savings only measures the change; balance is what is left after that change.</p>
            <ul className="metric-diff-list">
              <li><span>Opening (start of statement)</span><strong>{balanceLabel(opening)}</strong></li>
              <li><span>Total income</span><strong>{money(income)}</strong></li>
              <li><span>Total spending</span><strong>{money(spending)}</strong></li>
              <li><span>Total savings (income − spending)</span><strong>{money(savings)}</strong></li>
              <li className="metric-diff-result"><span>Total balance (closing)</span><strong>{balanceLabel(balance)}</strong></li>
            </ul>
            <p className="metric-diff-eq muted">
              Opening {balanceLabel(opening)} + savings {money(savings)} ≈ balance {balanceLabel(balance)}
            </p>
          </div>
        )}

        {listRows && (
          <TransactionPanel
            title={kind === "savings" ? "Transactions in this period" : `${titles[kind]} transactions`}
            rows={listRows}
            total={kind === "income" ? income : kind === "spending" ? spending : savings}
            savings={kind === "savings"}
          />
        )}
      </div>
    </div>
  );
}

function balanceLabel(value) {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function Metric({ id, open, setOpen, label, value, change, invert }) {
  const number = Number(change) || 0;
  const good = invert ? number <= 0 : number >= 0;
  const shown = open === id;
  return (
    <article className={shown ? "card metric selected" : "card metric"}>
      <div className="metric-head">
        <span>{label}</span>
        <button className={shown ? "card-symbol active" : "card-symbol"} type="button" aria-expanded={shown} aria-label={`Explain ${label}`} title={`Explain ${label}`} onClick={() => setOpen(shown ? "" : id)}>☰</button>
      </div>
      <b>{money(value)}</b>
      <small className={good ? "up" : "down"}>{signedPct(change)} from last month</small>
    </article>
  );
}

function TransactionPanel({ title, rows, total, savings }) {
  const ordered = [...rows].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const summed = rows.reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0);
  return (
    <article className="card metric-panel">
      <div className="page-head">
        <h2>{title}</h2>
        <b>{ordered.length} · {savings ? money(total) : money(summed)}</b>
      </div>
      {ordered.length === 0 ? <p className="empty">No transactions in this total.</p> : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
            <tbody>
              {ordered.map((row) => (
                <tr key={row.id || `${row.date}-${row.description}-${row.amount}`}>
                  <td data-label="Date">{row.date}</td>
                  <td data-label="Description">{row.description}</td>
                  <td data-label="Category">{row.category || "Other"}</td>
                  <td data-label="Amount" className={row.income ? "income" : "expense"}>{row.income ? "+" : "-"}{money(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
