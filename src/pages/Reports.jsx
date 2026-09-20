import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { asArray, downloadCsv, money, monthKey } from "../lib/format";
import "./app-pages.css";

export default function Reports() {
  const [tab, setTab] = useState("monthly");
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/transactions"), api("/family-members")])
      .then(([transactions, family]) => {
        setRows(asArray(transactions));
        setMembers(asArray(family));
      })
      .catch((e) => setError(e.message));
  }, []);

  const monthly = useMemo(() => {
    const map = {};
    rows.forEach((row) => {
      const key = monthKey(row.date) || "Unknown";
      map[key] = map[key] || { income: 0, expense: 0 };
      map[key][row.income ? "income" : "expense"] += Number(row.amount || 0);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const byCategory = useMemo(() => {
    const map = {};
    rows.filter((row) => !row.income).forEach((row) => {
      const key = row.category || "Other";
      map[key] = (map[key] || 0) + Number(row.amount || 0);
    });
    const total = Object.values(map).reduce((sum, value) => sum + value, 0) || 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, amount]) => [name, amount, Math.round((amount / total) * 100)]);
  }, [rows]);

  const byMember = useMemo(() => {
    const names = Object.fromEntries(members.map((member) => [member.id, member.name]));
    const map = {};
    rows.filter((row) => !row.income).forEach((row) => {
      const key = names[row.memberId] || "Household";
      map[key] = (map[key] || 0) + Number(row.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [rows, members]);

  const maxMonth = Math.max(...monthly.map(([, value]) => Math.max(value.income, value.expense)), 1);

  const exportReport = () => {
    if (tab === "monthly") {
      downloadCsv("prospr-monthly.csv", [["Month", "Income", "Expenses"], ...monthly.map(([month, value]) => [month, value.income, value.expense])]);
    } else if (tab === "category") {
      downloadCsv("prospr-categories.csv", [["Category", "Amount", "Percent"], ...byCategory]);
    } else {
      downloadCsv("prospr-members.csv", [["Member", "Amount"], ...byMember]);
    }
  };

  return (
    <section className="page">
      <div className="page-head">
        <div><h1>Reports</h1><p>Built from confirmed transactions. Nothing here is estimated.</p></div>
        <button className="btn" type="button" onClick={exportReport}>Export CSV</button>
      </div>
      {error && <div className="banner">{error}</div>}
      <div className="tabs">
        {[["monthly", "Monthly"], ["category", "Category wise"], ["member", "Member wise"]].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === "monthly" && (
        <article className="card">
          <h2>Income versus expenses</h2>
          <div className="bars">
            {monthly.map(([month, value]) => (
              <div key={month}>
                <i style={{ height: `${(value.expense / maxMonth) * 100}%`, background: "#e15b6a" }} />
                <i style={{ height: `${(value.income / maxMonth) * 100}%` }} />
                <span>{month.slice(2)}</span>
              </div>
            ))}
          </div>
          {monthly.length === 0 && <p className="empty">Import transactions to build a report.</p>}
        </article>
      )}
      {tab === "category" && (
        <article className="card">
          {byCategory.map(([name, amount, percent]) => (
            <div className="member-line" key={name}><span className="grow">{name}</span><span>{percent}%</span><strong>{money(amount)}</strong></div>
          ))}
          {byCategory.length === 0 && <p className="empty">No category data yet.</p>}
        </article>
      )}
      {tab === "member" && (
        <article className="card">
          {byMember.map(([name, amount]) => (
            <div className="member-line" key={name}><span className="grow">{name}</span><strong>{money(amount)}</strong></div>
          ))}
          {byMember.length === 0 && <p className="empty">No member data yet.</p>}
        </article>
      )}
    </section>
  );
}
