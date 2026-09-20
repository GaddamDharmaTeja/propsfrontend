import { useNavigate } from "react-router-dom";
import "./features.css";

function Features() {

    const navigate = useNavigate();

    const features = [
        {
            icon: "📊",
            title: "Track Spending",
            description:
                "Get a clear view of your family's spending and understand where your money goes.",
            items: [
                "Track daily and monthly spending",
                "Categorize your expenses",
                "View spending summaries",
                "Identify spending patterns"
            ]
        },
        {
            icon: "🎯",
            title: "Plan Goals",
            description:
                "Set financial goals together and create a clear plan to achieve them.",
            items: [
                "Create family financial goals",
                "Set target amounts",
                "Track your progress",
                "Plan for future expenses"
            ]
        },
        {
            icon: "👨‍👩‍👧",
            title: "Family Insights",
            description:
                "Understand your family's financial picture and make decisions together.",
            items: [
                "View family financial information",
                "Understand household spending",
                "Identify lifestyle changes",
                "Build shared financial awareness"
            ]
        },
        {
            icon: "🛡️",
            title: "Stay Secure",
            description:
                "Keep your financial information protected while managing your family's finances.",
            items: [
                "Secure account access",
                "Manage privacy preferences",
                "Control notifications",
                "Protect your financial information"
            ]
        }
    ];

    return (
        <div className="features-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="features-header">

                <div className="features-logo">

                    <div className="features-logo-leaf"></div>

                    <div>
                        <div className="features-logo-text">
                            Prospr
                        </div>

                        <div className="features-tagline">
                            Together for a brighter tomorrow
                        </div>
                    </div>

                </div>


                <div className="features-header-actions">

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate("/account-created")
                        }
                    >
                        ← Back
                    </button>

                    <button
                        type="button"
                        className="dashboard-button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        Go to Dashboard →
                    </button>

                </div>

            </header>


            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="features-hero">

                <div className="hero-badge">
                    ✨ Built for families
                </div>

                <h1>
                    Everything you need to
                    <span> build a brighter financial future.</span>
                </h1>

                <p>
                    Prospr brings your family's finances together
                    in one simple place, helping you understand
                    spending, plan goals, and make better financial
                    decisions together.
                </p>

            </section>


            {/* =====================================================
                FEATURES
            ===================================================== */}

            <section className="features-section">

                <div className="features-grid">

                    {features.map((feature) => (

                        <div
                            className="feature-card"
                            key={feature.title}
                        >

                            <div className="feature-card-icon">
                                {feature.icon}
                            </div>

                            <h2>
                                {feature.title}
                            </h2>

                            <p>
                                {feature.description}
                            </p>


                            <div className="feature-list">

                                {feature.items.map(
                                    (item) => (

                                        <div
                                            className="feature-list-item"
                                            key={item}
                                        >

                                            <span className="check-icon">
                                                ✓
                                            </span>

                                            <span>
                                                {item}
                                            </span>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            </section>


            {/* =====================================================
                LIFESTYLE CREEP
            ===================================================== */}

            <section className="lifestyle-section">

                <div className="lifestyle-content">

                    <div className="lifestyle-icon">
                        🔎
                    </div>

                    <div>

                        <h2>
                            Detect Lifestyle Creep
                        </h2>

                        <p>
                            Understand how your spending changes
                            over time and identify areas where your
                            expenses may be gradually increasing.
                        </p>

                    </div>

                </div>

            </section>


            {/* =====================================================
                CTA
            ===================================================== */}

            <section className="features-cta">

                <div className="cta-content">

                    <h2>
                        Ready to take control of your
                        family's finances?
                    </h2>

                    <p>
                        Start exploring Prospr and build a
                        stronger financial future together.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        Go to Dashboard →
                    </button>

                </div>

            </section>


            {/* =====================================================
                FOOTER
            ===================================================== */}

            <footer className="features-footer">

                <div className="footer-logo">
                    Prospr
                </div>

                <div>
                    Together for a brighter tomorrow
                </div>

            </footer>

        </div>
    );
}

export default Features;