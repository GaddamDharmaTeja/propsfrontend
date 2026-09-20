import { useEffect, useState } from "react";
import { api, currentUser, setSession } from "../lib/api";
import "./app-pages.css";

const notificationOptions = ["Spending alerts", "Monthly summaries", "Financial tips and recommendations", "New features and updates"];

export default function Settings() {
  const sessionUser = currentUser() || {};
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({
    firstName: sessionUser.fullName?.split(" ")[0] || "",
    lastName: sessionUser.fullName?.split(" ").slice(1).join(" ") || "",
    email: sessionUser.email || "",
    mobile: sessionUser.mobile || "",
    gender: sessionUser.gender || "",
    dob: "",
  });
  const [settings, setSettings] = useState({ theme: "light", monthlyIncome: "", primaryBank: "", notifications: [], goals: [] });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/profile"), api("/settings")])
      .then(([user, prefs]) => {
        const names = String(user.fullName || "").split(" ");
        setProfile({
          firstName: names[0] || "",
          lastName: names.slice(1).join(" "),
          email: user.email || "",
          mobile: user.mobile || "",
          gender: user.gender || "",
          dob: "",
        });
        setSettings({
          theme: prefs.theme || "light",
          monthlyIncome: prefs.monthlyIncome || "",
          primaryBank: prefs.primaryBank || "",
          notifications: prefs.notifications || [],
          goals: prefs.goals || [],
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const user = await api("/profile", { method: "PUT", body: JSON.stringify(profile) });
      const existing = currentUser() || {};
      setSession({ token: localStorage.getItem("prospr_token"), user: { ...existing, ...user } });
      setMessage("Profile saved.");
    } catch (e) {
      setError(e.message);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const saved = await api("/settings", { method: "PUT", body: JSON.stringify(settings) });
      const theme = String(saved.theme || "light").toLowerCase();
      document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
      if (theme === "system") {
        document.documentElement.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      setMessage("Preferences saved.");
    } catch (e) {
      setError(e.message);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await api("/profile/password", { method: "PUT", body: JSON.stringify(password) });
      setPassword({ currentPassword: "", newPassword: "" });
      setMessage(result?.message || "Password updated.");
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleNote = (name) => {
    setSettings((old) => ({
      ...old,
      notifications: old.notifications.includes(name)
        ? old.notifications.filter((item) => item !== name)
        : [...old.notifications, name],
    }));
  };

  return (
    <section className="page">
      <div className="page-head"><div><h1>Settings</h1><p>Profile, preferences, security, and notifications for this household.</p></div></div>
      {error && <div className="banner">{error}</div>}
      {message && <div className="banner ok">{message}</div>}
      <div className="tabs">
        {[["profile", "Profile"], ["preferences", "Preferences"], ["security", "Security"], ["notifications", "Notifications"]].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => { setTab(id); setMessage(""); setError(""); }}>{label}</button>
        ))}
      </div>
      {tab === "profile" && (
        <form className="card form-grid" onSubmit={saveProfile}>
          <label>First name<input required value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></label>
          <label>Last name<input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></label>
          <label>Email<input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
          <label>Mobile<input value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} /></label>
          <label>Gender
            <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
              <option value="">Select</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>
          <label>Date of birth<input type="date" value={profile.dob} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} /></label>
          <div className="full"><button className="btn" type="submit">Save profile</button></div>
        </form>
      )}
      {tab === "preferences" && (
        <form className="card form-grid" onSubmit={saveSettings}>
          <label>Monthly household income<input value={settings.monthlyIncome} onChange={(e) => setSettings({ ...settings, monthlyIncome: e.target.value })} placeholder="250000" /></label>
          <label>Primary bank<input value={settings.primaryBank} onChange={(e) => setSettings({ ...settings, primaryBank: e.target.value })} /></label>
          <label>Theme
            <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <div className="full"><button className="btn" type="submit">Save preferences</button></div>
        </form>
      )}
      {tab === "security" && (
        <form className="card form-grid" onSubmit={savePassword}>
          <label>Current password<input required type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label>
          <label>New password<input required type="password" minLength={8} value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label>
          <div className="full"><button className="btn" type="submit">Update password</button></div>
        </form>
      )}
      {tab === "notifications" && (
        <form className="card" onSubmit={saveSettings}>
          <div className="check-list">
            {notificationOptions.map((name) => (
              <label key={name}><input type="checkbox" checked={settings.notifications.includes(name)} onChange={() => toggleNote(name)} />{name}</label>
            ))}
          </div>
          <button className="btn" type="submit">Save notifications</button>
        </form>
      )}
    </section>
  );
}
