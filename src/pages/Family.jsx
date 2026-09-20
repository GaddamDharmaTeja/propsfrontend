import { useEffect, useState } from "react";
import { api, currentUser } from "../lib/api";
import { asArray, initials } from "../lib/format";
import "./app-pages.css";

const emptyMember = { name: "", relationship: "Spouse", username: "", email: "", gender: "", dob: "", occupation: "" };

export default function Family() {
  const creator = currentUser()?.householdCreator;
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyMember);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  const load = () => api("/family-members").then((rows) => setMembers(asArray(rows))).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    setError("");
    const username = form.username || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
    const payload = { ...form, username };
    if (!payload.dob) delete payload.dob;
    try {
      if (editing) {
        const updated = await api(`/family-members/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
        setMembers((old) => old.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await api("/family-members", { method: "POST", body: JSON.stringify(payload) });
        setMembers((old) => [...old, created]);
        if (created.activationUrl) {
          setLink(created.activationUrl);
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(created.activationUrl);
        }
      }
      setForm(emptyMember);
      setEditing(null);
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const renew = async (member) => {
    setError("");
    try {
      const issued = await api(`/family-members/${member.id}/activation-link`, { method: "POST" });
      setLink(issued.activationUrl || "");
      if (issued.activationUrl && navigator.clipboard?.writeText) await navigator.clipboard.writeText(issued.activationUrl);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the household?`)) return;
    try {
      await api(`/family-members/${member.id}`, { method: "DELETE" });
      setMembers((old) => old.filter((item) => item.id !== member.id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Family members</h1>
          <p>Invite the people who share this household. Each adult activates their own login.</p>
        </div>
        {creator && <button className="btn" onClick={() => { setShowForm(true); setEditing(null); setForm(emptyMember); }}>Add member</button>}
      </div>
      {error && <div className="banner">{error}</div>}
      {link && <div className="banner ok">Activation link copied. Share it with this member: <code>{link}</code></div>}
      {showForm && (
        <form className="card form-grid" onSubmit={save}>
          <label>Full name<input required value={form.name} onChange={set("name")} /></label>
          <label>Relationship<input required value={form.relationship} onChange={set("relationship")} /></label>
          <label>Username<input value={form.username} onChange={set("username")} placeholder="letters and numbers" /></label>
          <label>Email<input type="email" value={form.email} onChange={set("email")} /></label>
          <label>Gender<input value={form.gender} onChange={set("gender")} /></label>
          <label>Date of birth<input type="date" value={form.dob || ""} onChange={set("dob")} /></label>
          <label className="full">Occupation<input value={form.occupation} onChange={set("occupation")} /></label>
          <div className="full row-actions">
            <button className="btn" type="submit">{editing ? "Save member" : "Create invite"}</button>
            <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="cards">
        {members.map((member) => (
          <article className="card" key={member.id}>
            <div className="member-line">
              <b className="avatar">{initials(member.name)}</b>
              <div className="grow">
                <strong>{member.name}</strong>
                <div className="muted">{member.relationship || "Member"}{member.occupation ? ` · ${member.occupation}` : ""}</div>
              </div>
              <span className={`pill${member.status === "ACTIVE" ? "" : " warn"}`}>{member.status === "ACTIVE" ? "Active" : "Pending"}</span>
            </div>
            <p className="muted">{member.email || "No email"}{member.username ? ` · @${member.username}` : ""}</p>
            {creator && (
              <div className="row-actions">
                <button className="btn-ghost" type="button" onClick={() => { setEditing(member.id); setForm({ ...emptyMember, ...member, dob: member.dob || "" }); setShowForm(true); }}>Edit</button>
                {member.status !== "ACTIVE" && <button className="btn-ghost" type="button" onClick={() => renew(member)}>Copy invite link</button>}
                <button className="btn-danger" type="button" onClick={() => remove(member)}>Remove</button>
              </div>
            )}
          </article>
        ))}
      </div>
      {members.length === 0 && <p className="empty">No family members yet.</p>}
    </section>
  );
}
