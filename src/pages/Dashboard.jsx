import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const menuItems = [
  ["📊", "Dashboard", "/dashboard"],
  ["💳", "Transactions", "/transactions"],
  ["🏦", "Bank Accounts", "/accounts"],
  ["🎯", "Goals", "/goals"],
  ["💰", "Investments", "/investments"],
  ["🏠", "Loans & Liabilities", "/loans"],
  ["🛡️", "Insurance", "/insurance"],
  ["📈", "Lifestyle Creep", "/lifestyle-creep"],
  ["👨‍👩‍👧", "Family", "/family"],
];

const transactions = [
  { icon: "🛒", name: "Grocery Store", category: "Groceries", date: "Today", amount: "-₹4,250" },
  { icon: "⛽", name: "Fuel Station", category: "Transport", date: "Yesterday", amount: "-₹2,100" },
  { icon: "🍽️", name: "Restaurant", category: "Dining", date: "Yesterday", amount: "-₹1,850" },
  { icon: "💼", name: "Salary Credit", category: "Income", date: "2 days ago", amount: "+₹2,50,000", income: true },
  { icon: "🛍️", name: "Amazon", category: "Shopping", date: "3 days ago", amount: "-₹3,299" },
];

const goals = [
  { icon: "🏠", name: "Save for a Home", current: "₹18,00,000", target: "₹30,00,000", progress: 60 },
  { icon: "🎓", name: "Child Education", current: "₹6,50,000", target: "₹10,00,000", progress: 65 },
  { icon: "✈️", name: "Family Vacation", current: "₹80,000", target: "₹1,50,000", progress: 53 },
];

const spendingCategories = [
  ["Groceries", "28%", "₹21,950", "green"],
  ["Dining", "16%", "₹12,540", "orange"],
  ["Transport", "12%", "₹9,410", "blue"],
  ["Bills & Utilities", "11%", "₹8,620", "purple"],
  ["Shopping", "10%", "₹7,830", "pink"],
  ["Healthcare", "8%", "₹6,270", "yellow"],
  ["Others", "15%", "₹11,700", "gray"],
];

function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("This Month");

  const go = (path) => navigate(path);

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-leaf" />
          <div>
            <div className="dashboard-logo-name">Prospr</div>
            <div className="dashboard-logo-tagline">Together for a brighter tomorrow</div>
          </div>
        </div>

        <div className="family-profile">
          <div className="family-avatar">DT</div>
          <div>
            <div className="family-name">dharma teja</div>
            <div className="family-label">Family Owner</div>
          </div>
        </div>

        <nav className="dashboard-menu">
          {menuItems.map(([icon, label, path]) => (
            <button
              key={label}
              className={`menu-item ${label === "Dashboard" ? "active" : ""}`}
              onClick={() => go(path)}
            >
              <span>{icon}</span>
              <em>{label}</em>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="menu-item" onClick={() => go("/settings")}>
            <span>⚙️</span><em>Settings</em>
          </button>
          <button className="menu-item logout" onClick={() => go("/login")}>
            <span>↪</span><em>Logout</em>
          </button>
        </div>

        <div className="sidebar-quote">
          <span>🌱</span>
          <p>Small steps together<br />create a brighter<br />tomorrow.</p>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="search-box">
            <span>⌕</span>
            <input placeholder="Search transactions, members, goals..." />
          </div>

          <div className="header-actions">
            <button className="month-picker">▣ &nbsp; September 2026 &nbsp;⌄</button>
            <button className="notification-button" aria-label="Notifications">♧<i /></button>
            <div className="header-profile">
              <div className="header-avatar">DT</div>
              <strong>dharma teja</strong>
              <span>⌄</span>
            </div>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <h1>Good Morning, dharma! <span>👋</span></h1>
            <p>Here's a snapshot of your family's financial health.</p>
          </div>
          <blockquote>“Financial clarity for<br />happier tomorrows.”</blockquote>
        </section>

        <section className="summary-grid">
          <div className="summary-card income-card">
            <div className="summary-card-header"><span>↗</span><label>Total Income</label></div>
            <h2>₹1,24,500</h2>
            <p>This month</p>
            <b>↑ 12% from last month</b>
          </div>

          <div className="summary-card spending-summary">
            <div className="summary-card-header"><span>▣</span><label>Total Spending</label></div>
            <h2>₹78,320</h2>
            <p>This month</p>
            <b>↑ 8% from last month</b>
          </div>

          <div className="summary-card savings-card">
            <div className="summary-card-header"><span>◉</span><label>Total Savings</label></div>
            <h2>₹46,180</h2>
            <p>This month</p>
            <b>↑ 20% from last month</b>
          </div>

          <div className="summary-card goals-summary">
            <div className="summary-card-header"><span>◎</span><label>Active Goals</label></div>
            <h2>3 goals</h2>
            <p>₹28,50,000 target</p>
            <div className="mini-progress"><div style={{ width: "42%" }} /></div>
            <small>42% complete</small>
          </div>
        </section>

        <section className="top-grid">
          <div className="dashboard-card spending-card">
            <div className="card-header">
              <div><h2>Spending Overview</h2><p>Where your family spent this month</p></div>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option>This Month</option>
                <option>Last Month</option>
                <option>Last 6 Months</option>
              </select>
            </div>

            <div className="spending-overview">
              <div className="donut-wrap">
                <div className="donut"><div><strong>₹78,320</strong><span>Total Spend</span></div></div>
              </div>
              <div className="category-list">
                {spendingCategories.map(([name, percent, amount, tone]) => (
                  <div className="category-row" key={name}>
                    <span className={`category-dot ${tone}`} />
                    <label>{name}</label>
                    <small>{percent}</small>
                    <strong>{amount}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card trend-card">
            <div className="card-header">
              <div><h2>Monthly Trend</h2><p>Income vs spending</p></div>
              <div className="chart-legend"><span><i className="income-dot" /> Income</span><span><i className="spend-dot" /> Spending</span></div>
            </div>
            <div className="trend-chart">
              <div className="y-labels"><span>₹2.0L</span><span>₹1.5L</span><span>₹1.0L</span><span>₹50K</span><span>0</span></div>
              <div className="bars-area">
                {[["Apr", 58, 43], ["May", 64, 45], ["Jun", 68, 49], ["Jul", 76, 55], ["Aug", 83, 57], ["Sep", 86, 63]].map(([m, inc, spend]) => (
                  <div className="month-bars" key={m}>
                    <div className="bar income-bar" style={{ height: `${inc}%` }} />
                    <div className="bar spend-bar" style={{ height: `${spend}%` }} />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-card family-card">
            <div className="card-header"><h2>Family Members</h2><button className="view-all-button" onClick={() => go("/family")}>View All →</button></div>
            {[
              ["DT", "dharma teja", "You", "owner"],
              ["TI", "timmappa", "Sibling", "member"],
              ["RS", "rani", "Spouse", "member"],
              ["YS", "yamini", "Dependent", "member"],
            ].map(([initials, name, role, type]) => (
              <div className="member-row" key={name}>
                <div className="member-avatar">{initials}</div>
                <div><strong>{name}</strong><span>{role}</span></div>
                <em className={type}>{type === "owner" ? "Owner" : "Member"}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="lower-grid">
          <div className="dashboard-card transactions-card">
            <div className="card-header">
              <div><h2>Recent Transactions</h2><p>Your latest household activity</p></div>
              <button className="view-all-button" onClick={() => go("/transactions")}>View All →</button>
            </div>
            <div className="transaction-table">
              <div className="transaction-head"><span>Date</span><span>Description</span><span>Category</span><span>Amount</span></div>
              {transactions.map((tx) => (
                <div className="transaction-row" key={`${tx.name}-${tx.date}`}>
                  <span>{tx.date}</span>
                  <div className="tx-name"><i>{tx.icon}</i><strong>{tx.name}</strong></div>
                  <span className={`category-pill ${tx.category.toLowerCase().replace(/\s/g, "-")}`}>{tx.category}</span>
                  <strong className={tx.income ? "transaction-income" : "transaction-amount"}>{tx.amount}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card insights-card">
            <div className="card-header"><h2>Insights for You</h2><button className="view-all-button" onClick={() => go("/insights")}>View All →</button></div>
            <div className="insight-item"><span className="insight-icon warning">↗</span><div><strong>Lifestyle spending increased by ₹6,800 this month</strong><p>Mainly in Dining (+₹2,400) and Shopping (+₹3,100).</p></div></div>
            <div className="insight-item"><span className="insight-icon good">💡</span><div><strong>Great progress on your Emergency Fund!</strong><p>You're 42% closer to your target.</p></div></div>
            <div className="insight-item"><span className="insight-icon info">ⓘ</span><div><strong>You have 3 subscriptions</strong><p>Consider reviewing unused subscriptions to save more.</p></div></div>
          </div>

          <div className="dashboard-card goals-card">
            <div className="card-header"><h2>Your Goals</h2><button className="view-all-button" onClick={() => go("/goals")}>View All →</button></div>
            {goals.map((goal) => (
              <div className="goal-item" key={goal.name}>
                <div className="goal-icon">{goal.icon}</div>
                <div className="goal-content">
                  <div className="goal-top"><strong>{goal.name}</strong><span>{goal.progress}%</span></div>
                  <small>{goal.current} / {goal.target}</small>
                  <div className="progress-bar"><div className="progress-value" style={{ width: `${goal.progress}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="quick-action-grid">
            <button onClick={() => go("/transactions")}><span>＋</span>Add Transaction</button>
            <button onClick={() => go("/accounts")}><span>🏦</span>Add Bank Account</button>
            <button onClick={() => go("/goals")}><span>🎯</span>Create Goal</button>
            <button onClick={() => go("/family")}><span>👨‍👩‍👧</span>Manage Family</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
