import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setSession } from "../lib/api";
import logo from "../images/logo.png";
import familyBackground from "../images/family_background.png";
import "./login.css";

export default function ActivateAccount() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token") || "";

  async function submit(event) {
    event.preventDefault();
    if (!token) return setError("This activation link is incomplete. Ask your household creator for a new link.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setBusy(true); setError("");
    try {
      const session = await api("/auth/activate", { method: "POST", body: JSON.stringify({ token, password }) });
      setSession(session); navigate("/dashboard", { replace: true });
    } catch (e) { setError(e.message || "We could not activate this account."); }
    finally { setBusy(false); }
  }

  return <div className="login-page">
    <section className="login-left"><div className="login-left-content">
      <Link to="/login" className="login-brand"><img src={logo} className="login-logo" alt="Prospr" /></Link>
      <div className="login-eyebrow"><span className="eyebrow-dot" /> FAMILY FINANCIAL OS</div>
      <h1>Welcome to your<br /><span>family’s financial home.</span></h1>
      <p className="login-description">Set your password once, then securely participate in your household’s shared financial journey.</p>
      <div className="family-card"><img src={familyBackground} alt="Family together" /><div className="family-card-overlay" /></div>
    </div></section>
    <main className="login-right"><div className="login-container"><div className="login-card-top"><span>Already activated?</span><Link to="/login">Sign in <span className="create-arrow">→</span></Link></div>
      <form className="login-card" onSubmit={submit}><div className="login-header"><div className="welcome-icon">✦</div><h2>Activate your account</h2><p>Create a password to join your household.</p></div>
      {error && <div className="login-error">{error}</div>}
      <div className="form-group"><label htmlFor="new-password">Create password</label><div className="input-wrapper"><input id="new-password" className="normal-login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div></div>
      <div className="form-group"><label htmlFor="confirm-password">Confirm password</label><div className="input-wrapper"><input id="confirm-password" className="normal-login-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></div></div>
      <button className="login-continue" disabled={busy}>{busy ? "Activating…" : <>Activate account <span className="button-arrow">→</span></>}</button></form>
    </div></main>
  </div>;
}
