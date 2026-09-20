import "./create-account.css";

function ReviewAccount() {

    return (
        <div className="account-right">

            <div className="account-header">

                <div>
                    <h1>Review & Create</h1>

                    <p>
                        Please review your details before creating your account.
                    </p>
                </div>

            </div>


            {/* Progress */}

            <div className="steps">

                <div className="step completed">
                    <span>✓</span>
                    <small>Your Details</small>
                </div>

                <div className="step completed">
                    <span>✓</span>
                    <small>Family Details</small>
                </div>

                <div className="step completed">
                    <span>✓</span>
                    <small>Financial Info</small>
                </div>

                <div className="step completed">
                    <span>✓</span>
                    <small>Preferences</small>
                </div>

                <div className="step active">
                    <span>5</span>
                    <small>Review & Create</small>
                </div>

            </div>


            {/* Review Cards */}

            <div className="review-grid">

                {/* Your Details */}

                <div className="review-card">

                    <div className="review-card-header">

                        <h3>Your Details</h3>

                        <button className="edit-member-button">
                            ✎
                        </button>

                    </div>

                    <div className="review-row">
                        <label>Name</label>
                        <span>Dharmateja Chinna</span>
                    </div>

                    <div className="review-row">
                        <label>Mobile</label>
                        <span>+91 98765 43210</span>
                    </div>

                    <div className="review-row">
                        <label>Email</label>
                        <span>teja@gmail.com</span>
                    </div>

                    <div className="review-row">
                        <label>Date of Birth</label>
                        <span>15/08/1998</span>
                    </div>

                    <div className="review-row">
                        <label>Gender</label>
                        <span>Male</span>
                    </div>

                </div>


                {/* Family Members */}

                <div className="review-card">

                    <div className="review-card-header">
                        <h3>Family Members</h3>

                        <button className="edit-member-button">
                            ✎
                        </button>
                    </div>

                    <div className="review-row">
                        <label>DC</label>
                        <span>
                            Dharmateja Chinna (You)
                        </span>
                    </div>

                    <div className="review-row">
                        <label>SP</label>
                        <span>
                            Spouse
                        </span>
                    </div>

                    <div className="review-row">
                        <label>C1</label>
                        <span>
                            Child
                        </span>
                    </div>

                </div>


                {/* Financial Information */}

                <div className="review-card">

                    <div className="review-card-header">
                        <h3>Financial Information</h3>

                        <button className="edit-member-button">
                            ✎
                        </button>
                    </div>

                    <div className="review-row">
                        <label>Monthly Income</label>
                        <span>₹2,50,000</span>
                    </div>

                    <div className="review-row">
                        <label>Primary Bank</label>
                        <span>HDFC Bank</span>
                    </div>

                    <div className="review-row">
                        <label>Home Owner</label>
                        <span>Yes</span>
                    </div>

                    <div className="review-row">
                        <label>Loans/EMIs</label>
                        <span>Yes</span>
                    </div>

                    <div className="review-row">
                        <label>Investments</label>
                        <span>No</span>
                    </div>

                </div>


                {/* Preferences */}

                <div className="review-card">

                    <div className="review-card-header">
                        <h3>Preferences</h3>

                        <button className="edit-member-button">
                            ✎
                        </button>
                    </div>

                    <div className="review-row">
                        <label>Goals</label>
                        <span>Save for a Home</span>
                    </div>

                    <div className="review-row">
                        <label>Notifications</label>
                        <span>
                            Spending alerts,
                            Monthly summaries
                        </span>
                    </div>

                    <div className="review-row">
                        <label>Theme</label>
                        <span>Light</span>
                    </div>

                </div>

            </div>


            {/* Terms */}

            <div className="checkbox-row">

                <input
                    type="checkbox"
                    id="terms"
                />

                <label htmlFor="terms">
                    I agree to the{" "}
                    <a href="/terms">
                        Terms and Conditions
                    </a>
                    {" "}and{" "}
                    <a href="/privacy">
                        Privacy Policy
                    </a>
                </label>

            </div>


            {/* Create Account */}

            <div className="form-actions">

                <button
                    type="button"
                    className="cancel-button"
                    onClick={() => window.history.back()}
                >
                    ← Back
                </button>

                <button
                    type="button"
                    className="review-button"
                >
                    Create Account
                </button>

            </div>

        </div>
    );
}

export default ReviewAccount;