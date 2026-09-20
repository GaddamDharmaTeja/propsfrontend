import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/login";
import CreateAccount from "./components/CreateAccount";
import AccountCreated from "./components/AccountCreated";
import ActivateAccount from "./components/ActivateAccount";
import Features from "./pages/Features";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Family from "./pages/Family";
import Insights from "./pages/Insights";
import Goals from "./pages/Goals";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ImportTemplates from "./pages/ImportTemplates";
import { currentUser } from "./lib/api";

function Protected() {
    return currentUser() ? <AppShell /> : <Navigate to="/login" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public routes */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/account-created" element={<AccountCreated />} />
                <Route path="/features" element={<Features />} />
                <Route path="/activate" element={<ActivateAccount />} />

                {/* Protected routes */}
                <Route element={<Protected />}>

                    <Route path="/dashboard" element={<Home />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/family" element={<Family />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />

                    {/* Bank import templates */}
                    <Route
                        path="/import-templates"
                        element={<ImportTemplates />}
                    />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;