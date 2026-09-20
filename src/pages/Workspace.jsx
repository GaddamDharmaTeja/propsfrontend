import { useEffect, useState } from "react";
import { api, currentUser } from "../lib/api";
import familyArtwork from "../images/family_background.png";
import "./workspace.css";

/* =========================================================
   HELPERS
   ========================================================= */

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const title = {
  dashboard: "Good Morning",
  transactions: "Transactions",
  family: "Family Members",
  insights: "Insights",
  goals: "Financial Goals",
  budgets: "Budgets",
  reports: "Reports",
  settings: "Settings",
};

/*
 * Always return an array.
 *
 * Supports API responses such as:
 *
 * []
 *
 * { data: [] }
 *
 * { content: [] }
 *
 * { items: [] }
 *
 * { results: [] }
 */
const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.content)) {
    return value.content;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

/*
 * Safely get an array from dashboard data.
 */
const safeArray = (value) => (Array.isArray(value) ? value : []);

/*
 * Safely convert object values to numbers.
 */
const safeNumber = (value) => Number(value) || 0;


/* =========================================================
   WORKSPACE
   ========================================================= */

export default function Workspace({ view }) {
  const [data, setData] = useState({});
  const [items, setItems] = useState([]);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [file, setFile] = useState(null);
  const [statementPassword, setStatementPassword] = useState("");
  const [accountId, setAccountId] = useState("");

  const [preview, setPreview] = useState(null);

  const [activationLink, setActivationLink] = useState("");

  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState([]);
const [templateId, setTemplateId] = useState("");
const [loadingTemplates, setLoadingTemplates] = useState(false);

  const endpoint =
    view === "family" ? "/family-members" : `/${view}`;


  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {
    let live = true;

    setLoading(true);
    setError("");
    // A preview belongs to one exact file/account/password combination.
    // Never leave an older statement on screen if the next parse fails.
    setPreview(null);

    let request;

    if (view === "dashboard") {
      request = Promise.all([
        api("/dashboard"),
        api("/financial-accounts"),
      ]);
    } else if (view === "transactions") {
      request = Promise.all([
        api("/transactions"),
        api("/financial-accounts"),
      ]);
    } else {
      request = api(endpoint);
    }

    request
      .then((result) => {
        if (!live) {
          return;
        }

        /* =================================================
           DASHBOARD
           ================================================= */

        if (view === "dashboard") {
          const dashboardResponse = result?.[0] || {};

          const dashboardData =
            dashboardResponse?.data &&
            typeof dashboardResponse.data === "object" &&
            !Array.isArray(dashboardResponse.data)
              ? dashboardResponse.data
              : dashboardResponse;

          setData({
            income: safeNumber(dashboardData?.income),

            spending: safeNumber(dashboardData?.spending),

            savings: safeNumber(dashboardData?.savings),

            goals: safeArray(dashboardData?.goals),

            familyMembers: safeArray(
              dashboardData?.familyMembers
            ),

            insights: safeArray(dashboardData?.insights),

            recentTransactions: safeArray(
              dashboardData?.recentTransactions
            ),

            categoryBreakdown:
              dashboardData?.categoryBreakdown &&
              typeof dashboardData.categoryBreakdown === "object" &&
              !Array.isArray(dashboardData.categoryBreakdown)
                ? dashboardData.categoryBreakdown
                : {},
          });

          setItems(asArray(result?.[1]));

          return;
        }


        /* =================================================
           TRANSACTIONS
           ================================================= */

        if (view === "transactions") {
          setItems(asArray(result?.[0]));

          /*
           * Financial accounts are stored in data because
           * the transaction import section uses them.
           */
          setData(asArray(result?.[1]));

          return;
        }


        /* =================================================
           FAMILY / GOALS / BUDGETS / ETC.
           ================================================= */

        setItems(asArray(result));
      })
      .catch((e) => {
        if (live) {
          setError(
            e?.message ||
              "Unable to load your financial data."
          );
        }
      })
      .finally(() => {
        if (live) {
          setLoading(false);
        }
      });

    return () => {
      live = false;
    };
  }, [view, endpoint]);


  const loadImportTemplates = async () => {
    try {
        setLoadingTemplates(true);

        const data = await api("/import-templates");

        setTemplates(Array.isArray(data) ? data : []);

    } catch (error) {
        console.error("Unable to load import templates:", error);
        setTemplates([]);
    } finally {
        setLoadingTemplates(false);
    }
};

  /* =======================================================
     SAVE GENERIC FORM
     ======================================================= */

  const save = async (event) => {
    event.preventDefault();

    setError("");

    try {
      const values = Object.fromEntries(
        new FormData(event.currentTarget)
      );

      const created = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(values),
      });

      setItems((old) => [
        ...safeArray(old),
        created,
      ]);

      if (view === "family" && created?.activationUrl) {
        setActivationLink(created.activationUrl);
      }

      setShowForm(false);
    } catch (e) {
      setError(
        e?.message ||
          "Unable to save the information."
      );
    }
  };

  const copyActivationLink = async (memberId) => {
    setError("");
    try {
      const issued = await api(`/family-members/${memberId}/activation-link`, { method: "POST" });
      const link = issued?.activationUrl || "";
      setActivationLink(link);
      if (link && navigator.clipboard?.writeText) await navigator.clipboard.writeText(link);
    } catch (e) { setError(e?.message || "Unable to create an activation link."); }
  };


  /* =======================================================
     ADD FINANCIAL ACCOUNT
     ======================================================= */

  const addAccount = async (event) => {
    event.preventDefault();

    setError("");

    try {
      const formData = new FormData(
        event.currentTarget
      );

      const institution =
        formData.get("institution");

      const account = await api(
        "/financial-accounts",
        {
          method: "POST",

          body: JSON.stringify({
            institution,

            accountName:
              "Imported bank account",
          }),
        }
      );

      setData((old) => [
        ...asArray(old),
        account,
      ]);

      setAccountId(account?.id || "");
    } catch (e) {
      setError(
        e?.message ||
          "Unable to add financial account."
      );
    }
  };


  /* =======================================================
     PARSE STATEMENT
     ======================================================= */

  const parse = async () => {
    if (!file || !accountId) {
      setError(
        "Select an account and statement file first."
      );

      return;
    }

    setError("");

    try {
      const body = new FormData();

      body.append("file", file);

      body.append(
        "accountId",
        accountId
      );

      if (statementPassword) {
        body.append(
          "statementPassword",
          statementPassword
        );
      }

      const result = await api(
        "/imports/parse",
        {
          method: "POST",
          body,
        }
      );

      /*
       * Normalize preview response.
       */
      const normalizedPreview =
        result &&
        typeof result === "object"
          ? {
              ...result,

              rows: safeArray(
                result.rows ||
                  result.data ||
                  result.items
              ),
            }
          : {
              rows: [],
            };

      setPreview(normalizedPreview);

      setStatementPassword("");
    } catch (e) {
      setError(
        e?.message ||
          "Unable to parse the statement."
      );
    }
  };


  /* =======================================================
     CONFIRM IMPORT
     ======================================================= */

  const confirm = async () => {
    if (!preview) {
      return;
    }

    try {
      const rows = safeArray(
        preview.rows
      );

      const selectedRows = rows.map(
        (row) => ({
          ...row,

          include:
            !row.potentialDuplicate ||
            window.confirm(
              `Import possible duplicate: ${
                row.description || "this transaction"
              }?`
            ),
          duplicateAccepted: Boolean(row.potentialDuplicate),
        })
      );

      await api(
        "/imports/confirm",
        {
          method: "POST",

          body: JSON.stringify({
            ...preview,

            accountId,

            mapping:
              "automatic header mapping",

            rows: selectedRows,
          }),
        }
      );

      setPreview(null);

      setFile(null);

      const transactionResponse =
        await api("/transactions");

      setItems(
        asArray(transactionResponse)
      );
    } catch (e) {
      setError(
        e?.message ||
          "Unable to confirm imported transactions."
      );
    }
  };

  const removeTransaction = async (transaction) => {
    if (!window.confirm("Remove this transaction? Use this to remove an old corrupted import before re-importing the statement.")) return;
    try {
      await api(`/transactions/${transaction.id || transaction._id}`, { method: "DELETE" });
      setItems((old) => safeArray(old).filter((item) => (item?.id || item?._id) !== (transaction.id || transaction._id)));
    } catch (e) { setError(e?.message || "Unable to remove the transaction."); }
  };


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="state">
        Loading your household data…
      </div>
    );
  }


  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {
    return (
      <div className="notice error">
        <span>{error}</span>

        <button
          type="button"
          onClick={() => setError("")}
        >
          ×
        </button>
      </div>
    );
  }


  /* =======================================================
     DASHBOARD
     ======================================================= */

  if (view === "dashboard") {
    return (
      <Dashboard
        data={data}
        accounts={items}
      />
    );
  }


  /* =======================================================
     TRANSACTIONS
     ======================================================= */

  if (view === "transactions") {
    const accounts = asArray(data);

    return (
      <section>
        <Heading
          title={title[view]}
          text="View, import, and manage household income and expenses."
          action="Add transaction"
          onAction={() => setShowForm(true)}
        />

        <div className="import-card">
          <h3>Import bank history</h3>

          <p>
            Upload CSV, XLS, XLSX, or selectable-text PDF.
            Original files are discarded after parsing.
          </p>


          {/* ADD ACCOUNT */}

          {accounts.length === 0 && (
            <form
              className="import-controls"
              onSubmit={addAccount}
            >
              <input
                name="institution"
                placeholder="Bank name, e.g. HDFC Bank"
                required
              />

              <button className="primary">
                Add financial account
              </button>
            </form>
          )}


          {/* IMPORT CONTROLS */}

          <div className="import-controls">

            <select
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setPreview(null);
                setError("");
              }}
            >
              <option value="">
                Select financial account
              </option>

              {accounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.institution}{" "}
                  {account.accountName}
                </option>
              ))}
            </select>


            <input
              type="file"
              accept=".csv,.xls,.xlsx,.pdf"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
                setError("");
              }}
            />


            {file?.name
              ?.toLowerCase()
              .endsWith(".pdf") && (
              <input
                type="password"
                value={statementPassword}
                onChange={(event) => {
                  setStatementPassword(event.target.value);
                  setPreview(null);
                  setError("");
                }}
                placeholder="PDF statement password"
                autoComplete="off"
              />
            )}


            <button
              type="button"
              className="primary"
              onClick={parse}
            >
              Preview import
            </button>
          </div>


          {file?.name
            ?.toLowerCase()
            .endsWith(".pdf") && (
            <small className="password-note">
              The password is used only to open this PDF
              and is never saved.
            </small>
          )}


          {/* PREVIEW */}

          {preview && (
            <div className="preview">

              <h4>
                {safeArray(preview.rows).length}{" "}
                parsed rows — review required
              </h4>

              <TransactionTable
                items={safeArray(
                  preview.rows
                )}
              />

              <button
                type="button"
                className="primary"
                onClick={confirm}
              >
                Confirm selected rows
              </button>
            </div>
          )}
        </div>


        {showForm && (
          <TransactionForm
            save={save}
          />
        )}


        <div className="surface">
          <TransactionTable
            items={items}
            onDelete={removeTransaction}
          />
        </div>
      </section>
    );
  }


  /* =======================================================
     FAMILY / GOALS / BUDGETS
     ======================================================= */

  if (
    ["family", "goals", "budgets"].includes(view)
  ) {
    const safeItems = safeArray(items);
    // Sessions created before household roles were added do not contain the
    // flag. Treat those legacy primary accounts as creators until they sign in
    // again and receive the richer profile.
    const isCreator = currentUser()?.householdCreator !== false;

    return (
      <section>

        <Heading
          title={title[view]}
          text={
            view === "family"
              ? "Manage your household profiles and spending assignments."
              : "Plan your family's financial future."
          }
          action={view === "family" && !isCreator ? null : `Add ${view.slice(0, -1)}`}
          onAction={() => setShowForm(true)}
        />

        {activationLink && view === "family" && (
          <div className="surface activation-link" role="status">
            <b>Activation link created</b>
            <p>Share this once with the family member. It expires in 7 days.</p>
            <div><code>{activationLink}</code><button className="primary" type="button" onClick={() => navigator.clipboard?.writeText(activationLink)}>Copy link</button></div>
          </div>
        )}


        {showForm && (
          <GenericForm
            view={view}
            save={save}
          />
        )}


        <div className="cards">

          {safeItems.map((item, index) => {

            const name =
              item?.name ||
              item?.title ||
              item?.category ||
              "Unnamed";

            const secondary =
              item?.relationship ||
              item?.occupation ||
              `${money(
                item?.savedAmount
              )} of ${money(
                item?.targetAmount ||
                  item?.amount
              )}`;

            return (
              <article
                className="surface item-card"
                key={
                  item?.id ||
                  item?._id ||
                  index
                }
              >

                <div className="avatar">
                  {String(name)
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <b>{name}</b>

                  <p>
                    {secondary}
                  </p>
                  {view === "family" && <small className={`member-status ${String(item?.status || "PENDING").toLowerCase()}`}>{item?.status === "ACTIVE" ? "Active account" : "Pending activation"}{item?.username ? ` · @${item.username}` : ""}</small>}
                </div>

                {view === "family" && isCreator && (
                  <div className="member-actions">
                    {item?.status !== "ACTIVE" && <button className="outline-button" type="button" onClick={() => copyActivationLink(item.id || item._id)}>Copy activation link</button>}
                    <button className="outline-button" type="button" onClick={() => {
                      const email = window.prompt("Family member email (optional)", item?.email || "");
                      if (email === null) return;
                      const username = window.prompt("Family member username", item?.username || "");
                      if (username === null || !username.trim()) return;
                      api(`/family-members/${item.id || item._id}`, { method: "PUT", body: JSON.stringify({ ...item, email, username: username.trim() }) })
                        .then((updated) => setItems((old) => safeArray(old).map((value) => (value?.id || value?._id) === (updated?.id || updated?._id) ? updated : value)))
                        .catch((e) => setError(e?.message || "Unable to update the family member."));
                    }}>Update email / username</button>
                  </div>
                )}

              </article>
            );
          })}

        </div>

      </section>
    );
  }


  /* =======================================================
     INSIGHTS / REPORTS / SETTINGS
     ======================================================= */

  return (
    <section>

      <Heading
        title={title[view]}
        text="Your financial data is calculated from confirmed transactions."
      />

      {view === "insights" ? (
        <Insights />
      ) : (
        <div className="surface empty">

          <h3>
            {title[view]}
          </h3>

          <p>
            This workspace is ready for your
            financial data. Import a bank statement
            or add transactions to populate it.
          </p>

        </div>
      )}

    </section>
  );
}


/* =========================================================
   HEADING
   ========================================================= */

function Heading({
  title,
  text,
  action,
  onAction,
}) {
  return (
    <div className="page-heading">

      <div>
        <h1>{title}</h1>

        <p>{text}</p>
      </div>

      {action && (
        <button
          className="primary"
          onClick={onAction}
        >
          ＋ {action}
        </button>
      )}

    </div>
  );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  data = {},
  accounts = [],
}) {

  const goals = safeArray(
    data?.goals
  );

  const familyMembers = safeArray(
    data?.familyMembers
  );

  const insights = safeArray(
    data?.insights
  );

  const recentTransactions =
    safeArray(
      data?.recentTransactions
    );

  const categoryBreakdown =
    data?.categoryBreakdown &&
    typeof data.categoryBreakdown === "object" &&
    !Array.isArray(data.categoryBreakdown)
      ? data.categoryBreakdown
      : {};


  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "prospr_user"
        ) || "{}"
      );
    } catch {
      return {};
    }
  })();


  const firstName =
    user?.fullName
      ?.split(" ")
      ?.[0] ||
    "there";


  const categoryValues =
    Object.values(
      categoryBreakdown
    ).map(safeNumber);


  const maxCategoryValue =
    Math.max(
      1,
      ...categoryValues
    );


  return (
    <section>

      {/* =================================================
          PAGE HEADING
         ================================================= */}

      <div className="page-heading">

        <div>

          <h1>
            Good Morning,{" "}
            {firstName}!{" "}
            <span>👋</span>
          </h1>

          <p>
            Here’s a snapshot of your
            family’s financial health.
          </p>

        </div>


        <em className="dashboard-quote">
          “Small steps together
          <br />
          create a brighter tomorrow.”
        </em>

      </div>


      {/* =================================================
          METRICS
         ================================================= */}

      <div className="metric-grid">

        <Metric
          label="Total Income"
          value={data?.income}
          tone="green"
        />

        <Metric
          label="Total Spending"
          value={data?.spending}
          tone="red"
        />

        <Metric
          label="Total Savings"
          value={data?.savings}
          tone="blue"
        />

        <Metric
          label="Active Goals"
          value={`${goals.length} goals`}
          tone="gold"
        />

      </div>


      {/* =================================================
          DASHBOARD GRID
         ================================================= */}

      <div className="dashboard-grid">


        {/* ===============================================
            SPENDING
           =============================================== */}

        <div className="surface spending-panel">

          <div className="panel-title">

            <h2>
              Spending Overview
            </h2>

            <select defaultValue="month">
              <option value="month">
                This Month
              </option>
            </select>

          </div>


          <strong className="headline-number">
            {money(data?.spending)}
          </strong>


          <div className="bars">

            {Object.entries(
              categoryBreakdown
            ).map(
              ([name, value], index) => {

                const numericValue =
                  safeNumber(value);

                const percentage =
                  Math.min(
                    100,
                    (numericValue /
                      maxCategoryValue) *
                      100
                  );

                return (
                  <div
                    className={`bar-${index}`}
                    key={name}
                  >

                    <i
                      style={{
                        height:
                          `${percentage}%`,
                      }}
                    />

                    <span>
                      {name}
                    </span>

                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* ===============================================
            FAMILY MEMBERS
           =============================================== */}

        <div className="surface family-panel">

          <div className="panel-title">

            <h2>
              Family Members
            </h2>

            <span>
              View All →
            </span>

          </div>


          {familyMembers.length > 0 ? (

            familyMembers
              .slice(0, 3)
              .map((member, index) => (

                <div
                  className="member-row"
                  key={
                    member?.id ||
                    member?._id ||
                    index
                  }
                >

                  <b>
                    {String(
                      member?.name ||
                        "FM"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </b>


                  <span>

                    {member?.name ||
                      "Family member"}

                    <small>
                      {member?.relationship ||
                        member?.occupation ||
                        "Family member"}
                    </small>

                  </span>

                </div>

              ))

          ) : (

            <p>
              Add family members to see
              a shared view.
            </p>

          )}

        </div>


        {/* ===============================================
            INSIGHTS
           =============================================== */}

        <div className="surface insights-panel">

          <div className="panel-title">

            <h2>
              Insights for You
            </h2>

            <span>
              View All →
            </span>

          </div>


          {insights.length > 0 ? (

            insights.map(
              (insight, index) => (

                <p
                  className="insight"
                  key={index}
                >
                  💡{" "}
                  {String(insight)}
                </p>

              )
            )

          ) : (

            <p className="insight">
              💡 Import more transaction
              history to unlock spending
              insights.
            </p>

          )}

        </div>


        {/* ===============================================
            RECENT TRANSACTIONS
           =============================================== */}

        <div className="surface recent-panel">

          <div className="panel-title">

            <h2>
              Recent Transactions
            </h2>

            <span>
              View All →
            </span>

          </div>


          <TransactionTable
            items={
              recentTransactions
            }
          />

        </div>


        {/* ===============================================
            GOALS
           =============================================== */}

        <div className="surface goals-panel">

          <div className="panel-title">

            <h2>
              Your Goals
            </h2>

            <span>
              View All →
            </span>

          </div>


          {goals.length > 0 ? (

            goals.map(
              (goal, index) => {

                const saved =
                  safeNumber(
                    goal?.savedAmount
                  );

                const target =
                  safeNumber(
                    goal?.targetAmount
                  );

                const percentage =
                  Math.min(
                    100,
                    target > 0
                      ? (saved /
                          target) *
                          100
                      : 0
                  );

                return (
                  <p
                    className="goal-row"
                    key={
                      goal?.id ||
                      goal?._id ||
                      index
                    }
                  >

                    <b>
                      {goal?.title ||
                        "Financial goal"}
                    </b>

                    <small>
                      {money(saved)} of{" "}
                      {money(target)}
                    </small>

                    <i>
                      <u
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />
                    </i>

                  </p>
                );
              }
            )

          ) : (

            <p>
              Add a goal to start
              planning together.
            </p>

          )}

        </div>


        {/* ===============================================
            WELLNESS
           =============================================== */}

        <div className="wellness-panel">

          <img
            src={familyArtwork}
            alt="Family financial wellness"
          />

          <div className="wellness-overlay" />

          <div className="wellness-content">

            <span className="wellness-badge">
              FAMILY FINANCIAL OS
            </span>

            <h2>
              Financial wellness
              <br />
              is a family journey.
            </h2>

            <p>
              Plan together.
              Grow together.
            </p>

            <button className="primary">
              Explore Insights →
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   METRIC
   ========================================================= */

function Metric({
  label,
  value,
  tone,
}) {
  return (
    <article
      className={`metric ${tone}`}
    >

      <span>
        {label}
      </span>

      <b>
        {typeof value === "number"
          ? money(value)
          : value || "0"}
      </b>

      <small>
        This month
      </small>

    </article>
  );
}


/* =========================================================
   TRANSACTION TABLE
   ========================================================= */

function TransactionTable({
  items,
  onDelete,
}) {

  const safeItems =
    safeArray(items);

  return (
    <div className="transaction-table">

      <div className="table-head">

        <span>
          Date
        </span>

        <span>
          Description
        </span>

        <span>
          Debit
        </span>

        <span>
          Credit
        </span>

        <span>
          Balance
        </span>

        <span>
          Category
        </span>

      </div>


      {safeItems.length === 0 ? (

        <div className="table-empty">
          No transactions found.
        </div>

      ) : (

        safeItems.map(
          (transaction, index) => (

            <div
              className="table-row"
              key={
                transaction?.id ||
                transaction?._id ||
                index
              }
            >

              <span>
                {transaction?.date ||
                  "—"}
              </span>

              <b>
                {transaction?.description ||
                  "Unnamed transaction"}
              </b>

              <strong className="expense">{(transaction?.debitAmount != null || !transaction?.income) ? `-${money(transaction?.debitAmount ?? transaction?.amount)}` : "—"}</strong>
              <strong className="income">{(transaction?.creditAmount != null || transaction?.income) ? `+${money(transaction?.creditAmount ?? transaction?.amount)}` : "—"}</strong>
              <span>{transaction?.closingBalance != null ? money(transaction.closingBalance) : "—"}</span>
              <span>{transaction?.category || "Other"}</span>
              {onDelete && <button className="delete-transaction" type="button" onClick={() => onDelete(transaction)}>Remove</button>}

            </div>

          )
        )

      )}

    </div>
  );
}


/* =========================================================
   TRANSACTION FORM
   ========================================================= */

function TransactionForm({
  save,
}) {
  return (
    <form
      className="surface form-grid"
      onSubmit={save}
    >

      <h3>
        Add transaction
      </h3>

      <input
        name="description"
        placeholder="Description"
        required
      />

      <input
        name="amount"
        type="number"
        step=".01"
        placeholder="Amount"
        required
      />

      <input
        name="date"
        type="date"
        required
      />

      <select name="category">
        <option>
          Groceries
        </option>

        <option>
          Dining
        </option>

        <option>
          Transport
        </option>

        <option>
          Utilities
        </option>

        <option>
          Other
        </option>
      </select>

      <label>
        <input
          name="income"
          type="checkbox"
        />

        Income
      </label>

      <button className="primary">
        Save transaction
      </button>

    </form>
  );
}


/* =========================================================
   GENERIC FORM
   ========================================================= */

function GenericForm({
  view,
  save,
}) {

  return (
    <form
      className="surface form-grid"
      onSubmit={save}
    >

      <h3>
        Add{" "}
        {view.slice(0, -1)}
      </h3>


      {view === "family" ? (

        <>
          <input
            name="name"
            placeholder="Full name"
            required
          />

          <input
            name="relationship"
            placeholder="Relationship (Parent, sibling, child…)"
            required />

          <input name="username" placeholder="Unique username" required pattern="[A-Za-z0-9._-]{3,40}" />

          <input name="email" type="email" placeholder="Email (optional)" />

          <input
            name="occupation"
            placeholder="Occupation"
          />
        </>

      ) : view === "goals" ? (

        <>
          <input
            name="title"
            placeholder="Goal name"
            required
          />

          <input
            name="targetAmount"
            type="number"
            placeholder="Target amount"
            required
          />

          <input
            name="savedAmount"
            type="number"
            placeholder="Amount saved"
            required
          />
        </>

      ) : (

        <>
          <input
            name="category"
            placeholder="Category"
            required
          />

          <input
            name="month"
            type="month"
            required
          />

          <input
            name="amount"
            type="number"
            placeholder="Monthly budget"
            required
          />
        </>

      )}


      <button className="primary">
        Save
      </button>

    </form>
  );
}


/* =========================================================
   INSIGHTS
   ========================================================= */

function Insights() {

  return (
    <div className="cards">

      <article className="surface">

        <h3>
          Import history to unlock insights
        </h3>

        <p>
          Once your household has confirmed
          transaction history, Prospr highlights
          the categories and merchants affecting
          your month.
        </p>

      </article>

    </div>
  );
}
