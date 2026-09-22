import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { asArray, money, monthKey, today } from "../lib/format";
import "./app-pages.css";

const blank = { description: "", amount: "", date: today(), category: "Other", income: false, memberId: "" };

export default function Transactions() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [month, setMonth] = useState("all");
  const [category, setCategory] = useState("all");
  const [member, setMember] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [preview, setPreview] = useState(null);
  const [pendingVerify, setPendingVerify] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("family");
  const query = (params.get("q") || "").toLowerCase();

  const load = async (scope = view) => {
    const [transactions, financial, family, categoryList, templateList] = await Promise.all([
      api(`/transactions?view=${scope}`),
      api("/financial-accounts"),
      api("/family-members"),
      api("/categories"),
      api("/import-templates").catch(() => []),
    ]);
    setRows(asArray(transactions));
    setAccounts(asArray(financial));
    setMembers(asArray(family));
    setCatalog(asArray(categoryList));
    setTemplates(asArray(templateList));
    if (!accountId && asArray(financial)[0]) setAccountId(asArray(financial)[0].id);
  };

  useEffect(() => {
    load(view).catch((e) => setError(e.message));
  }, [view]);

  useEffect(() => {
    const pendingId = params.get("pendingId");
    const savedTemplate = params.get("templateId");
    if (!pendingId || !savedTemplate) return undefined;
    let live = true;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const result = await api(`/imports/pending/${pendingId}/retry?templateId=${encodeURIComponent(savedTemplate)}`, {
          method: "POST",
        });
        if (!live) return;
        if (result?.needsVerification) {
          setPendingVerify(result);
          setError(result.message || "Still could not read this statement with that template.");
        } else {
          setPreview({ ...result, rows: asArray(result?.rows || result) });
          setTemplateId(savedTemplate);
          setPendingVerify(null);
        }
        setParams((old) => {
          const next = new URLSearchParams(old);
          next.delete("pendingId");
          next.delete("templateId");
          return next;
        }, { replace: true });
      } catch (e) {
        if (live) setError(e.message);
      } finally {
        if (live) setBusy(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const categories = [...new Set(rows.map((row) => row.category).filter(Boolean))];
  const months = [...new Set(rows.map((row) => monthKey(row.date)).filter((key) => /^\d{4}-\d{2}$/.test(key)))].sort().reverse();
  const matchesMember = (row, selected) => {
    if (selected === "all") return true;
    if (selected === "household") return !row.memberId;
    const person = members.find((item) => item.id === selected);
    if (!person) return String(row.memberId || "") === selected;
    const keys = new Set([person.id, person.accountId, person.name].filter(Boolean).map((value) => String(value).toLowerCase()));
    return [row.memberId, row.ownerId].some((value) => value && keys.has(String(value).toLowerCase()));
  };
  const visible = useMemo(() => rows.filter((row) => {
    if (tab === "expenses" && (row.income || row.internalTransfer)) return false;
    if (tab === "income" && (!row.income || row.internalTransfer)) return false;
    if (tab === "transfers" && !row.internalTransfer) return false;
    if (month !== "all" && monthKey(row.date) !== month) return false;
    if (category !== "all" && String(row.category || "").toLowerCase() !== category.toLowerCase()) return false;
    if (!matchesMember(row, member)) return false;
    if (query && !`${row.description} ${row.category} ${row.reference}`.toLowerCase().includes(query)) return false;
    return true;
  }), [rows, tab, month, category, member, query, members]);

  const totals = useMemo(() => {
    const counted = visible.filter((row) => !row.excluded && !row.internalTransfer);
    const income = counted.reduce((sum, row) => sum + (row.income ? Number(row.amount) || 0 : 0), 0);
    const spending = counted.reduce((sum, row) => sum + (row.income ? 0 : Number(row.amount) || 0), 0);
    const withBalance = [...rows]
      .filter((row) => row.closingBalance != null && row.closingBalance !== "")
      .sort((a, b) => {
        const byDate = String(a.date || "").localeCompare(String(b.date || ""));
        if (byDate !== 0) return byDate;
        return String(a.createdAt || a.id || "").localeCompare(String(b.createdAt || b.id || ""));
      });
    const latest = withBalance[withBalance.length - 1];
    const latestBalance = latest ? Number(latest.closingBalance) : null;
    const balance = latestBalance != null && Number.isFinite(latestBalance)
      ? latestBalance
      : income - spending;
    return { income, spending, balance, fromStatement: latestBalance != null && Number.isFinite(latestBalance) };
  }, [visible, rows]);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const created = await api("/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          income: Boolean(form.income),
          memberId: form.memberId || null,
        }),
      });
      setRows((old) => [created, ...old]);
      setForm(blank);
      setShowForm(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const classify = async (row, userClassification) => {
    setError("");
    try {
      const updated = await api(`/transactions/${row.id}/classification`, {
        method: "PATCH",
        body: JSON.stringify({ userClassification }),
      });
      setRows((old) => old.map((item) => item.id === updated.id ? updated : item));
    } catch (e) {
      setError(e.message);
    }
  };

  const assignCategory = async (row, category) => {
    setError("");
    try {
      const updated = await api(`/transactions/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...row, category }),
      });
      setRows((old) => old.map((item) => item.id === row.id ? updated : item));
    } catch (e) {
      setError(e.message);
    }
  };

  const categoryNames = [...new Set([...catalog.map((item) => item.name), ...rows.map((row) => row.category)].filter(Boolean))];
  const shownClassification = (row) => {
    if (row.userClassification) return row.userClassification;
    if (row.systemClassification === "NECESSARY") return "NECESSARY";
    if (row.systemClassification === "DISCRETIONARY") return "LIFESTYLE_CREEP";
    return "";
  };

  const hideReason = async (row) => {
    setError("");
    try {
      const updated = await api(`/transactions/${row.id}/privacy`, {
        method: "PATCH",
        body: JSON.stringify({ reasonHidden: !row.reasonHidden }),
      });
      setRows((old) => old.map((item) => item.id === updated.id ? updated : item));
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Remove this transaction?")) return;
    try {
      await api(`/transactions/${row.id}`, { method: "DELETE" });
      setRows((old) => old.filter((item) => item.id !== row.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const addAccount = async (event) => {
    event.preventDefault();
    const institution = new FormData(event.currentTarget).get("institution");
    try {
      const account = await api("/financial-accounts", {
        method: "POST",
        body: JSON.stringify({ institution, accountName: "Imported bank account" }),
      });
      setAccounts((old) => [...old, account]);
      setAccountId(account.id);
      event.currentTarget.reset();
    } catch (e) {
      setError(e.message);
    }
  };

  const parse = async () => {
    if (!file || !accountId) {
      setError("Select an account and a statement file first.");
      return;
    }
    setBusy(true);
    setError("");
    setPreview(null);
    setPendingVerify(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("accountId", accountId);
      if (password) body.append("statementPassword", password);
      if (templateId) body.append("templateId", templateId);
      const result = await api("/imports/parse", { method: "POST", body });
      if (result?.needsVerification) {
        setPendingVerify(result);
        setPassword("");
        return;
      }
      if (result?.templateId) {
        setTemplateId(String(result.templateId));
      }
      setPreview({ ...result, rows: asArray(result?.rows || result) });
      setPassword("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const selected = asArray(preview.rows).map((row) => ({
        ...row,
        include: !row.potentialDuplicate || window.confirm(`Import possible duplicate: ${row.description || "this transaction"}?`),
        duplicateAccepted: Boolean(row.potentialDuplicate),
      }));
      await api("/imports/confirm", {
        method: "POST",
        body: JSON.stringify({
          ...preview,
          accountId,
          mapping: templateId ? `template:${templateId}` : "automatic header mapping",
          rows: selected,
        }),
      });
      setPreview(null);
      setFile(null);
      setPendingVerify(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const dismissPending = async () => {
    if (!pendingVerify?.pendingImportId) {
      setPendingVerify(null);
      return;
    }
    try {
      await api(`/imports/pending/${pendingVerify.pendingImportId}`, { method: "DELETE" });
    } catch {
      /* ignore */
    }
    setPendingVerify(null);
  };

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Transactions</h1>
          <p>{query ? `Showing results for “${params.get("q")}”.` : view === "mine" ? "Transactions you uploaded or updated." : "Every household transaction."}</p>
        </div>
        <div className="row-actions">
          <div className="tabs" aria-label="Whose transactions">
            <button type="button" className={view === "mine" ? "active" : ""} onClick={() => setView("mine")}>My view</button>
            <button type="button" className={view === "family" ? "active" : ""} onClick={() => setView("family")}>Family view</button>
          </div>
          <button className="btn" onClick={() => setShowForm((open) => !open)}>{showForm ? "Close" : "Add transaction"}</button>
        </div>
      </div>
      {error && <div className="banner">{error}</div>}
      {showForm && (
        <form className="card form-grid" onSubmit={save}>
          <label>Description<input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>Amount<input required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryNames.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label>Member
            <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
              <option value="">Household</option>
              {members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="check-list">Type
            <select value={form.income ? "income" : "expense"} onChange={(e) => setForm({ ...form, income: e.target.value === "income" })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <div className="full"><button className="btn" type="submit">Save transaction</button></div>
        </form>
      )}
      <article className="card">
        <div className="page-head">
          <div><h2>Import bank history</h2><p>CSV, XLS, XLSX, or a text-based PDF. Unknown formats can be mapped under Import Templates.</p></div>
          <Link to="/import-templates">Manage templates</Link>
        </div>
        {accounts.length === 0 && (
          <form className="filters" onSubmit={addAccount}>
            <input name="institution" required placeholder="Bank name, e.g. HDFC Bank" />
            <button className="btn" type="submit">Add financial account</button>
          </form>
        )}
        <div className="filters">
          <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setPreview(null); }}>
            <option value="">Select account</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.institution} {account.accountName}</option>)}
          </select>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Automatic mapping</option>
            {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input type="file" accept=".csv,.xls,.xlsx,.pdf" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); setPendingVerify(null); }} />
          <input type="password" value={password} placeholder="Statement password, if any" onChange={(e) => setPassword(e.target.value)} />
          <button className="btn" type="button" disabled={busy} onClick={parse}>{busy ? "Reading..." : "Preview"}</button>
        </div>
        {pendingVerify && (
          <div className="banner verify-banner">
            <div>
              <strong>Needs format verification</strong>
              <p>{pendingVerify.message || "We could not recognize this statement format."}</p>
            </div>
            <div className="row-actions">
              <button
                className="btn"
                type="button"
                onClick={() => navigate(`/import-templates?pendingId=${pendingVerify.pendingImportId}`)}
              >
                Update format
              </button>
              <button className="btn-ghost" type="button" onClick={dismissPending}>Dismiss</button>
            </div>
          </div>
        )}
        {preview && (
          <div>
            <p>{asArray(preview.rows).length} rows ready.</p>
            <button className="btn" type="button" disabled={busy} onClick={confirm}>Confirm import</button>
          </div>
        )}
      </article>
      <div className="tabs">
        {[["all", "All"], ["expenses", "Expenses"], ["income", "Income"], ["transfers", "Transfers"]].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} type="button" onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="filters">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">All months</option>
          {months.map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={member} onChange={(e) => setMember(e.target.value)}>
          <option value="all">All members</option>
          <option value="household">Household</option>
          {members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <div className="metric-grid tx-totals">
        <article className="card metric">
          <div className="metric-head"><span>Total balance</span></div>
          <b className={totals.balance < 0 ? "expense" : "income"}>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(totals.balance) || 0)}
          </b>
          <small className="muted">{totals.fromStatement ? "Latest statement closing balance" : "Income − spending in this view"}</small>
        </article>
        <article className="card metric">
          <div className="metric-head"><span>Income</span></div>
          <b className="income">{money(totals.income)}</b>
          <small className="muted">In this view</small>
        </article>
        <article className="card metric">
          <div className="metric-head"><span>Spending</span></div>
          <b className="expense">{money(totals.spending)}</b>
          <small className="muted">In this view</small>
        </article>
      </div>
      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Member</th><th>Amount</th><th>Classification</th>{view === "mine" && <th>Reason</th>}<th></th></tr></thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td data-label="Date">{row.date}</td>
                <td data-label="Description">{row.description}{view === "mine" && row.reasonHidden ? <div className="muted">Hidden from family as Anonymous</div> : null}</td>
                <td data-label="Category">
                  <select value={row.category || "Other"} onChange={(e) => assignCategory(row, e.target.value)}>
                    {categoryNames.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </td>
                <td data-label="Member">{members.find((item) => item.id === row.memberId)?.name || "Household"}</td>
                <td data-label="Amount" className={row.income ? "income" : "expense"}>{row.income ? "+" : "-"}{money(row.amount)}</td>
                <td data-label="Classification">
                  <select value={shownClassification(row)} onChange={(e) => classify(row, e.target.value || null)}>
                    <option value="">System</option>
                    <option value="NECESSARY">Necessary</option>
                    <option value="LIFESTYLE_CREEP">Lifestyle creep</option>
                    <option value="NOT_SURE">Not sure</option>
                  </select>
                </td>
                {view === "mine" && (
                  <td data-label="Reason">
                    <button type="button" className="btn-ghost" onClick={() => hideReason(row)}>{row.reasonHidden ? "Show" : "Hide"}</button>
                  </td>
                )}
                <td><button type="button" className="btn-danger" onClick={() => remove(row)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="empty">No transactions match these filters.</p>}
      </div>
    </section>
  );
}
