import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, setSession } from "../lib/api";

import logo from "../images/logo.png";
import familyBackground from "../images/family_background.png";

import "./login.css";

export default function Login() {
  const navigate = useNavigate();

  const [method, setMethod] = useState("email");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identity,
          password,
        }),
      });

      setSession(session);

      navigate("/dashboard");
    } catch (e) {
      setError(e.message || "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================================
          LEFT BRAND AREA
          ===================================================== */}

      <section className="login-left">

        <div className="login-left-content">

          {/* Logo */}
          <Link to="/" className="login-brand">
            <img
              src={logo}
              className="login-logo"
              alt="Prospr"
            />
          </Link>


          {/* Eyebrow */}
          <div className="login-eyebrow">
            <span className="eyebrow-dot"></span>
            FAMILY FINANCIAL OS
          </div>


          {/* Main heading */}
          <h1>
            Money works better
            <span>when families do.</span>
          </h1>


          {/* Description */}
          <p className="login-description">
            One simple place to understand your family’s money,
            spending, goals, and financial future.
          </p>


          {/* =================================================
              FEATURE CARDS
              ================================================= */}

          <div className="login-features">

            <div className="login-feature">

              <div className="feature-icon family-icon">
                👨‍👩‍👧
              </div>

              <div className="feature-content">
                <strong>
                  Family view
                </strong>

                <span>
                  See finances together
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="feature-icon insight-icon">
                ↗
              </div>

              <div className="feature-content">
                <strong>
                  Smart insights
                </strong>

                <span>
                  Understand spending changes
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="feature-icon goal-icon">
                ◎
              </div>

              <div className="feature-content">
                <strong>
                  Shared goals
                </strong>

                <span>
                  Plan what matters
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="feature-icon security-icon">
                ♡
              </div>

              <div className="feature-content">
                <strong>
                  Long-term security
                </strong>

                <span>
                  Build a stronger future
                </span>
              </div>

            </div>

          </div>


          {/* =================================================
              FAMILY IMAGE
              ================================================= */}

          <div className="family-card">

            <img
              src={familyBackground}
              alt="Family managing finances together"
            />

            <div className="family-card-overlay"></div>

            <div className="family-card-content">

              <span className="family-badge">
                Designed for families
              </span>

              <p>
                Because prosperity is better
                <br />
                together <span>♥</span>
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          RIGHT LOGIN AREA
          ===================================================== */}

      <main className="login-right">

        <div className="login-container">

          {/* Create account */}
          <div className="login-card-top">

            <span>
              New to Prospr?
            </span>

            <Link to="/create-account">
              Create an account
              <span className="create-arrow">→</span>
            </Link>

          </div>


          {/* Login card */}
          <form
            className="login-card"
            onSubmit={submit}
          >

            {/* Header */}
            <div className="login-header">

              <div className="welcome-icon">
                👋
              </div>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to continue managing your family’s finances.
              </p>

            </div>


            {/* Error */}
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* Email */}
            <div className="login-method-tabs" role="tablist">
              <button type="button" className={method === "mobile" ? "active" : ""} onClick={() => setMethod("mobile")}>Mobile number</button>
              <button type="button" className={method === "email" ? "active" : ""} onClick={() => setMethod("email")}>Email</button>
            </div>

            <div className="form-group">

              <label htmlFor="identity">
                {method === "mobile" ? "Mobile number" : "Email or username"}
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  {method === "mobile" ? "+91" : "@"}
                </span>

                <input
                  id="identity"
                  className="normal-login-input"
                  type={method === "mobile" ? "tel" : "text"}
                  inputMode={method === "mobile" ? "numeric" : "text"}
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder={method === "mobile" ? "Enter your mobile number" : "you@example.com or your username"}
                  autoComplete="username"
                  required
                />

              </div>

            </div>


            {/* Password */}
            <div className="form-group">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Contact your household creator
                </button>

              </div>

              <div className="input-wrapper">

                <span className="input-icon password-dots">
                  •••
                </span>

                <input
                  id="password"
                  className="normal-login-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

              </div>

            </div>


            {/* Continue */}
            <button
              type="submit"
              className="login-continue"
              disabled={busy}
            >

              {busy ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <span>
                    Continue
                  </span>

                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>


            {/* Security */}
            <div className="login-security">

              <div className="security-icon">
                ✓
              </div>

              <div className="security-content">

                <strong>
                  Your information is secure
                </strong>

                <span>
                  Your financial data is protected with bank-grade security.
                </span>

              </div>

            </div>


            {/* Footer */}
            <div className="login-footer">

              <span>
                © 2026 Prospr
              </span>

              <button type="button">
                Privacy
              </button>

              <button type="button">
                Terms
              </button>

              <span className="footer-secure">
                Secure login
              </span>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}
