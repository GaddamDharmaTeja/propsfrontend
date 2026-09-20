import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, clearSession, currentUser } from "../lib/api";
import logo from "../images/logo.png";
import "./app-shell.css";

const nav = [
  ["/dashboard", "⌂", "Home"],
  ["/transactions", "↕", "Transactions"],
  ["/categories", "▣", "Categories"],
  ["/import-templates", "▤", "Import Templates"],
  ["/family", "♧", "Family"],
  ["/insights", "▥", "Insights"],
  ["/goals", "◎", "Goals"],
  ["/budgets", "▤", "Budgets"],
  ["/reports", "▧", "Reports"],
  ["/settings", "⚙", "Settings"],
];

export default function AppShell() {
  const navigate = useNavigate();
  const user = currentUser();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    let live = true;
    api("/settings")
      .then((settings) => {
        if (!live) return;
        const theme = String(settings?.theme || "light").toLowerCase();
        const resolved = theme === "system"
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : theme;
        document.documentElement.dataset.theme = resolved === "dark" ? "dark" : "light";
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const search = (event) => {
    event.preventDefault();
    const text = query.trim();
    navigate(text ? `/transactions?q=${encodeURIComponent(text)}` : "/transactions");
    setOpen(false);
  };

  const openNotes = async () => {
    const next = !notesOpen;
    setNotesOpen(next);
    if (!next) return;
    try {
      const summary = await api("/lifestyle-creep/summary");
      const lines = (summary?.categories || [])
        .filter((row) => Number(row.increasePct) > 0)
        .slice(0, 4)
        .map((row) => `${row.category} is ${row.increasePct}% above baseline`);
      setNotes(lines.length ? lines : ["No lifestyle-creep alerts yet. Import a statement to start measuring."]);
    } catch (error) {
      setNotes([error.message || "Unable to load alerts."]);
    }
  };

  return (
    <div className="app-shell">
      {open && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`app-sidebar${open ? " open" : ""}`}>
        <img src={logo} className="shell-logo" alt="Prospr" />
        <p className="shell-tagline">Together for a brighter tomorrow</p>
        <nav>
          {nav.map(([to, icon, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="shell-promise">Stronger Finances. Happier Families.</div>
        <button className="mobile-logout" onClick={() => { clearSession(); navigate("/login"); }}>Log out</button>
      </aside>
      <div className="app-content">
        <header className="app-header">
          <button className="nav-toggle" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
          <form onSubmit={search} className="search-form">
            <input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions, members, goals..." />
          </form>
          <div className="profile-chip">
            <button className="bell" aria-label="Notifications" onClick={openNotes}>🔔</button>
            <b>{user?.fullName?.split(" ").map((part) => part[0]).join("") || "P"}</b>
            <span>{user?.fullName || "Your family"}</span>
            <button onClick={() => { clearSession(); navigate("/login"); }}>Log out</button>
          </div>
        </header>
        {notesOpen && (
          <div className="notice-panel card">
            <strong>Alerts</strong>
            {notes.map((line) => <p key={line}>{line}</p>)}
            <button className="btn-ghost" onClick={() => { setNotesOpen(false); navigate("/insights"); }}>Open insights</button>
          </div>
        )}
        <main><Outlet /></main>
      </div>
    </div>
  );
}
