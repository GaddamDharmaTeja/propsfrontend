import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, currentUser } from "../lib/api";
import { asArray, initials, money, signedPct } from "../lib/format";
import familyArtwork from "../images/family_background.png";
import "./app-pages.css";

export default function Home() {
  const user = currentUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("family");

  useEffect(() => {
    let live = true;
    api(`/dashboard?view=${view}`)
      .then((result) => { if (live) setData(result || {}); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [view]);

  const categories = Object.entries(data?.categoryBreakdown || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 6);
  const max = Math.max(...categories.map(([, value]) => Number(value) || 0), 1);
  const goals = asArray(data?.goals);
  const onTrack = goals.filter((goal) => Number(goal.targetAmount) > 0 && Number(goal.savedAmount) / Number(goal.targetAmount) >= 0.5).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
      <div className="metric-grid">
        <Metric label="Total income" value={data?.income} change={data?.incomeChangePct} />
        <Metric label="Total spending" value={data?.spending} change={data?.spendingChangePct} invert />
        <Metric label="Total savings" value={data?.savings} change={data?.savingsChangePct} />
        <article className="card metric">
          <span>Active goals</span>
          <b>{onTrack} of {goals.length} on track</b>
          <Link to="/goals">View goals</Link>
        </article>
      </div>
      <div className="dash-grid">
        <article className="card">
          <div className="page-head"><h2>Spending overview</h2><b>{money(data?.spending)}</b></div>
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

function Metric({ label, value, change, invert }) {
  const number = Number(change) || 0;
  const good = invert ? number <= 0 : number >= 0;
  return (
    <article className="card metric">
      <span>{label}</span>
      <b>{money(value)}</b>
      <small className={good ? "up" : "down"}>{signedPct(change)} from last month</small>
    </article>
  );
}
