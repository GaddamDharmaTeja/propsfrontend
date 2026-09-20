import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./account-created.css";

function AccountCreated() {

    const navigate = useNavigate();
    const [links] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem("prospr_activation_links") || "[]"); } catch { return []; }
    });

    return (

        <div className="account-created-page">

            <div className="account-created-container">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="account-created-left">

                    {/* LOGO */}

                    <div className="prospr-brand">

                        <div className="prospr-logo">

                            <div className="logo-leaf"></div>

                            <span className="logo-text">
                                Prospr
                            </span>

                        </div>

                        <div className="brand-tagline">
                            Together for a brighter tomorrow
                        </div>

                    </div>


                    {/* FAMILY IMAGE */}

                    <div className="success-family-image">

                        <img
                            src="/images/family_background.png"
                            alt="Family"
                        />

                    </div>

                </div>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <div className="account-created-right">

                    {/* TOP NAVIGATION */}

                    <div className="success-top">

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            Go to Dashboard →
                        </button>

                    </div>


                    {/* SUCCESS CONTENT */}

                    <div className="success-content">

                        <h1>
                            Account Created
                            <br />
                            Successfully!
                        </h1>


                        <h2>
                            Welcome to Prospr 🎉
                        </h2>


                        <p>
                            You're all set to manage your
                            family's finances, detect lifestyle
                            creep, and build a brighter future
                            together.
                        </p>

                        {links.length > 0 && <div className="activation-summary">
                            <b>Activate your family members</b>
                            <p>Each link works once and expires in 7 days. Copy and share it privately.</p>
                            {links.map(({ name, link }) => <div key={link}><span>{name}</span><button type="button" onClick={() => navigator.clipboard?.writeText(link)}>Copy activation link</button></div>)}
                        </div>}


                        {/* BUTTONS */}

                        <div className="success-buttons">

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/dashboard")
                                }
                            >
                                Go to Dashboard →
                            </button>


                            <button
                                type="button"
                                className="explore-button"
                                onClick={() =>
                                    navigate("/features")
                                }
                            >
                                Explore Features
                            </button>

                        </div>


                        {/* FEATURES */}

                        <div className="success-features">

                            <div className="success-feature">

                                <div className="success-icon">
                                    📊
                                </div>

                                <span>
                                    Track
                                    <br />
                                    Spending
                                </span>

                            </div>


                            <div className="success-feature">

                                <div className="success-icon">
                                    🎯
                                </div>

                                <span>
                                    Plan
                                    <br />
                                    Goals
                                </span>

                            </div>


                            <div className="success-feature">

                                <div className="success-icon">
                                    👨‍👩‍👧
                                </div>

                                <span>
                                    Family
                                    <br />
                                    Insights
                                </span>

                            </div>


                            <div className="success-feature">

                                <div className="success-icon">
                                    🛡️
                                </div>

                                <span>
                                    Stay
                                    <br />
                                    Secure
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AccountCreated;
