import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { asArray } from "../lib/format";
import "./app-pages.css";

const CHOICES = [
  ["NECESSARY", "Necessary"],
  ["DISCRETIONARY", "Lifestyle creep"],
  ["MISCELLANEOUS", "Other"],
  ["REST", "Not counted"],
];

const empty = { name: "", classification: "NECESSARY", keyword: "" };

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => api("/categories").then((result) => setRows(asArray(result))).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const saveClassification = async (row, classification) => {
    setError("");
    setNotice("");
    try {
      const updated = await api("/categories", {
        method: "PUT",
        body: JSON.stringify({ name: row.name, classification, keyword: row.keyword || "" }),
      });
      setRows((old) => old.map((item) => item.name === row.name ? { ...item, ...updated } : item));
      setNotice(`${row.name} is now ${CHOICES.find(([id]) => id === classification)?.[1] || classification}. Existing transactions in this category were updated.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const create = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const created = await api("/categories", { method: "POST", body: JSON.stringify(form) });
      setRows((old) => [...old, created]);
      setForm(empty);
      setShowForm(false);
      setNotice(`${created.name} was added.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove the ${row.name} category?`)) return;
    setError("");
    try {
      await api(`/categories/${row.id}`, { method: "DELETE" });
      setRows((old) => old.filter((item) => item.id !== row.id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Categories</h1>
          <p>Mark spending as necessary, or add a category of your own. Necessary spending is left out of lifestyle creep.</p>
        </div>
        <button className="btn" type="button" onClick={() => setShowForm((open) => !open)}>{showForm ? "Close" : "New category"}</button>
      </div>
      {error && <div className="banner">{error}</div>}
      {notice && <div className="banner ok">{notice}</div>}
      {showForm && (
        <form className="card form-grid" onSubmit={create}>
          <label>Name<input required minLength={2} maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="School fees" /></label>
          <label>Classification
            <select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })}>
              {CHOICES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label>Match keyword<input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Optional, e.g. apollo" /></label>
          <div className="full"><button className="btn" type="submit">Save category</button></div>
        </form>
      )}
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Category</th><th>Classification</th><th>Keyword</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.name}>
                <td data-label="Category">{row.name}</td>
                <td data-label="Classification">
                  <select aria-label={`Classification for ${row.name}`} value={row.classification || "MISCELLANEOUS"} onChange={(e) => saveClassification(row, e.target.value)}>
                    {CHOICES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </td>
                <td data-label="Keyword">{row.keyword || "—"}</td>
                <td data-label="Remove">{row.custom ? <button className="btn-danger" type="button" onClick={() => remove(row)}>Remove</button> : "Built in"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">No categories yet.</p>}
      </div>
    </section>
  );
}
