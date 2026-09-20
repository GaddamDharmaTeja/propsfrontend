import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { asArray, money, today } from "../lib/format";
import "./app-pages.css";

const blank = { title: "", targetAmount: "", savedAmount: "", targetDate: "", icon: "◎" };

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [tab, setTab] = useState("active");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/goals").then((rows) => setGoals(asArray(rows))).catch((e) => setError(e.message));
  }, []);

  const progress = (goal) => Number(goal.targetAmount) > 0 ? Math.min(100, Math.round((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100)) : 0;
  const visible = goals.filter((goal) => tab === "done" ? progress(goal) >= 100 : progress(goal) < 100);

  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, targetAmount: Number(form.targetAmount), savedAmount: Number(form.savedAmount || 0) };
    if (!payload.targetDate) delete payload.targetDate;
    try {
      if (editing) {
        const updated = await api(`/goals/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
        setGoals((old) => old.map((goal) => goal.id === updated.id ? updated : goal));
      } else {
        const created = await api("/goals", { method: "POST", body: JSON.stringify(payload) });
        setGoals((old) => [...old, created]);
      }
      setForm(blank);
      setEditing(null);
      setOpen(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (goal) => {
    if (!window.confirm(`Delete ${goal.title}?`)) return;
    try {
      await api(`/goals/${goal.id}`, { method: "DELETE" });
      setGoals((old) => old.filter((item) => item.id !== goal.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const addSaved = async (goal) => {
    const extra = window.prompt(`Add to ${goal.title} (₹)`, "1000");
    if (!extra) return;
    const savedAmount = Number(goal.savedAmount || 0) + Number(extra);
    if (!Number.isFinite(savedAmount)) return;
    try {
      const updated = await api(`/goals/${goal.id}`, { method: "PUT", body: JSON.stringify({ ...goal, savedAmount }) });
      setGoals((old) => old.map((item) => item.id === updated.id ? updated : item));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="page">
      <div className="page-head">
        <div><h1>Financial goals</h1><p>Track what the household is saving toward.</p></div>
        <button className="btn" onClick={() => { setOpen(true); setEditing(null); setForm({ ...blank, targetDate: today() }); }}>Add new goal</button>
      </div>
      {error && <div className="banner">{error}</div>}
      <div className="tabs">
        <button className={tab === "active" ? "active" : ""} type="button" onClick={() => setTab("active")}>Active goals</button>
        <button className={tab === "done" ? "active" : ""} type="button" onClick={() => setTab("done")}>Completed goals</button>
      </div>
      {open && (
        <form className="card form-grid" onSubmit={save}>
          <label>Name<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Target ₹<input required type="number" min="1" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></label>
          <label>Saved ₹<input type="number" min="0" value={form.savedAmount} onChange={(e) => setForm({ ...form, savedAmount: e.target.value })} /></label>
          <label>Target date<input type="date" value={form.targetDate || ""} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
          <div className="full row-actions">
            <button className="btn" type="submit">{editing ? "Update goal" : "Create goal"}</button>
            <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="cards">
        {visible.map((goal) => (
          <article className="card" key={goal.id}>
            <div className="page-head"><h2>{goal.title}</h2><b>{progress(goal)}%</b></div>
            <div className="track"><i style={{ width: `${progress(goal)}%` }} /></div>
            <p>{money(goal.savedAmount)} saved of {money(goal.targetAmount)}</p>
            <p className="muted">{goal.targetDate ? `Target ${goal.targetDate}` : "No target date"}</p>
            <div className="row-actions">
              <button className="btn" type="button" onClick={() => addSaved(goal)}>Add savings</button>
              <button className="btn-ghost" type="button" onClick={() => { setEditing(goal.id); setForm({ ...blank, ...goal, targetDate: goal.targetDate || "" }); setOpen(true); }}>Edit</button>
              <button className="btn-danger" type="button" onClick={() => remove(goal)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
      {visible.length === 0 && <p className="empty">Nothing in this list yet.</p>}
    </section>
  );
}
