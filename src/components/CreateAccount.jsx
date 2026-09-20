import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./create-account.css";


import familyBackground from "../images/family_background.png";
import { api, setSession } from "../lib/api";

function CreateAccount() {

    const navigate = useNavigate();

    // =====================================================
    // CURRENT STEP
    // =====================================================

    const [currentStep, setCurrentStep] = useState(1);


    // =====================================================
    // FAMILY MEMBERS
    // =====================================================

    const [familyMembers, setFamilyMembers] = useState([
        {
            id: 1,
            name: "",
            relationship: "Spouse",
            username: "",
            email: "",
            gender: "",
            dob: "",
            occupation: ""
        }
    ]);


    // =====================================================
    // FORM DATA
    // =====================================================

    const [formData, setFormData] = useState({

        // Your Details
        fullName: "",
        mobile: "",
        email: "",
        password: "",
        dob: "",
        gender: "",

        // Financial Information
        monthlyIncome: "",
        primaryBank: "",

        // Preferences
        goals: ["Save for a Home"],

        notifications: [
            "Spending alerts",
            "Monthly summaries",
            "Financial tips and recommendations"
        ],

        theme: "Light"
    });


    // =====================================================
    // TERMS
    // =====================================================

    const [termsAccepted, setTermsAccepted] = useState(false);


    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };


    // =====================================================
    // FAMILY MEMBER - ADD
    // =====================================================

    const addFamilyMember = () => {

        const newMember = {
            id: Date.now(),
            name: "",
            relationship: "Spouse",
            username: "",
            email: "",
            gender: "",
            dob: "",
            occupation: ""
        };

        setFamilyMembers((previousMembers) => [
            ...previousMembers,
            newMember
        ]);
    };


    // =====================================================
    // FAMILY MEMBER - REMOVE
    // =====================================================

    const removeFamilyMember = (id) => {

        setFamilyMembers((previousMembers) =>
            previousMembers.filter(
                (member) => member.id !== id
            )
        );
    };


    // =====================================================
    // FAMILY MEMBER - UPDATE
    // =====================================================

    const updateFamilyMember = (
        id,
        field,
        value
    ) => {

        setFamilyMembers((previousMembers) =>
            previousMembers.map((member) =>
                member.id === id
                    ? {
                        ...member,
                        [field]: value
                    }
                    : member
            )
        );
    };


    // =====================================================
    // GOAL SELECTION
    // =====================================================

    const handleGoalChange = (goal) => {

        setFormData((previousData) => ({
            ...previousData,
            goals: [goal]
        }));
    };


    // =====================================================
    // NOTIFICATION CHANGE
    // =====================================================

    const handleNotificationChange = (
        notification
    ) => {

        setFormData((previousData) => {

            const currentNotifications =
                previousData.notifications;

            const isSelected =
                currentNotifications.includes(
                    notification
                );

            let updatedNotifications;

            if (isSelected) {

                updatedNotifications =
                    currentNotifications.filter(
                        (item) =>
                            item !== notification
                    );

            } else {

                updatedNotifications = [
                    ...currentNotifications,
                    notification
                ];
            }

            return {
                ...previousData,
                notifications:
                    updatedNotifications
            };
        });
    };


    // =====================================================
    // THEME CHANGE
    // =====================================================

    const handleThemeChange = (theme) => {

        setFormData((previousData) => ({
            ...previousData,
            theme: theme
        }));
    };


    // =====================================================
    // NEXT
    // =====================================================

    const handleNext = () => {

        if (currentStep < 5) {

            setCurrentStep(
                (previousStep) =>
                    previousStep + 1
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };


    // =====================================================
    // BACK
    // =====================================================

    const handleBack = () => {

        if (currentStep > 1) {

            setCurrentStep(
                (previousStep) =>
                    previousStep - 1
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };


    // =====================================================
    // GO TO SPECIFIC STEP
    // Used by EDIT buttons on Review page
    // =====================================================

    const goToStep = (step) => {

        setCurrentStep(step);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =====================================================
    // CREATE ACCOUNT
    // =====================================================

    const handleCreateAccount = async () => {

        // Validate terms
        if (!termsAccepted) {

            alert(
                "Please agree to the Terms and Conditions and Privacy Policy."
            );

            return;
        }


        // =================================================
        // PREPARE ACCOUNT DATA
        // =================================================

        const accountData = {

            yourDetails: {

                fullName:
                    formData.fullName,

                mobile:
                    formData.mobile,

                email:
                    formData.email,

                password:
                    formData.password,

                dob:
                    formData.dob,

                gender:
                    formData.gender
            },


            familyMembers:
                familyMembers,


            financialInformation: {

                monthlyIncome:
                    formData.monthlyIncome,

                primaryBank:
                    formData.primaryBank
            },


            preferences: {

                goals:
                    formData.goals,

                notifications:
                    formData.notifications,

                theme:
                    formData.theme
            },


            termsAccepted:
                termsAccepted
        };

        try {
            const names = formData.fullName.trim().split(/\s+/);
            const session = await api("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    firstName: names[0] || "Member",
                    lastName: names.slice(1).join(" ") || "",
                    mobile: formData.mobile,
                    email: formData.email,
                    password: formData.password,
                    dob: formData.dob,
                    gender: formData.gender
                })
            });
            setSession(session);
            if (formData.primaryBank) {
                await api("/financial-accounts", { method: "POST", body: JSON.stringify({ institution: formData.primaryBank, accountName: "Primary account" }) });
            }
            const createdMembers = await Promise.all(familyMembers.filter(member => member.name.trim()).map(member => api("/family-members", { method: "POST", body: JSON.stringify({
                ...member,
                username: member.username || member.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") + member.id
            }) })));
            sessionStorage.setItem("prospr_activation_links", JSON.stringify(createdMembers.filter(member => member?.activationUrl).map(member => ({ name: member.name, link: member.activationUrl }))));
            await api("/settings", {
                method: "PUT",
                body: JSON.stringify({
                    theme: String(accountData.preferences.theme || "Light").toLowerCase(),
                    primaryBank: accountData.financialInformation.primaryBank,
                    monthlyIncome: String(accountData.financialInformation.monthlyIncome || ""),
                    goals: accountData.preferences.goals,
                    notifications: accountData.preferences.notifications
                })
            });
            await Promise.all((accountData.preferences.goals || []).filter(Boolean).map((title) => api("/goals", {
                method: "POST",
                body: JSON.stringify({ title, targetAmount: 0, savedAmount: 0, icon: "◎" })
            })));
        } catch (error) {
            alert(error.message || "Unable to create your account.");
            return;
        }


        // =================================================
        // NAVIGATE TO ACCOUNT CREATED PAGE
        // =================================================

        navigate("/account-created");
    };


    // =====================================================
    // PROGRESS STEPS
    // =====================================================

    const steps = [
        "Your Details",
        "Family Details",
        "Financial Info",
        "Preferences",
        "Review & Create"
    ];


    // =====================================================
    // RETURN
    // =====================================================

    return (

        <div className="create-account-page">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="account-left">

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

                <div className="family-illustration">

                    <img
                        src={familyBackground}
                        alt="Family"
                    />

                </div>


                {/* MESSAGE */}

                <div className="left-message">

                    <h1>
                        Stronger Finances.
                    </h1>

                    <h1>
                        Happier Families.
                    </h1>

                    <p>
                        Create your family account to get
                        a complete view of your finances,
                        detect lifestyle creep, plan together,
                        and build a more secure future.
                    </p>

                </div>


                {/* FEATURES */}

                <div className="left-features">

                    <div className="feature-item">

                        <div className="feature-icon">
                            ↗
                        </div>

                        <span>
                            Track all family finances
                        </span>

                    </div>


                    <div className="feature-item">

                        <div className="feature-icon red">
                            ▥
                        </div>

                        <span>
                            Detect lifestyle creep
                        </span>

                    </div>


                    <div className="feature-item">

                        <div className="feature-icon blue">
                            ◎
                        </div>

                        <span>
                            Plan shared goals
                        </span>

                    </div>


                    <div className="feature-item">

                        <div className="feature-icon yellow">
                            ♢
                        </div>

                        <span>
                            Build long-term security
                        </span>

                    </div>

                </div>

            </div>


            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="account-right">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="account-header">

                    <div>

                        <h1>
                            Create Your Prospr Account
                        </h1>

                        <p>
                            Let's get started with your family's
                            financial journey.
                        </p>

                    </div>


                    <div className="existing-account">

                        Already have an account?

                        <button
                            type="button"
                            className="text-link-button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Log in
                        </button>

                    </div>

                </div>


                {/* =================================================
                    PROGRESS
                ================================================= */}

                <div className="steps">

                    {steps.map(
                        (step, index) => {

                            const stepNumber =
                                index + 1;

                            return (

                                <div
                                    key={stepNumber}
                                    className={`
                                        step
                                        ${
                                            currentStep ===
                                            stepNumber
                                                ? "active"
                                                : ""
                                        }
                                        ${
                                            currentStep >
                                            stepNumber
                                                ? "completed"
                                                : ""
                                        }
                                    `}
                                >

                                    <span>

                                        {
                                            currentStep >
                                            stepNumber
                                                ? "✓"
                                                : stepNumber
                                        }

                                    </span>

                                    <small>
                                        {step}
                                    </small>

                                </div>

                            );
                        }
                    )}

                </div>


                {/* =================================================
                    STEP 1 - YOUR DETAILS
                ================================================= */}

                {currentStep === 1 && (

                    <section className="form-section">

                        <div className="section-title">

                            <h2>
                                1. Your Details
                                <span>
                                    (Primary Member)
                                </span>
                            </h2>

                            <p>
                                This will be the main account used
                                to manage the family profile.
                            </p>

                        </div>


                        <div className="form-grid">

                            {/* FULL NAME */}

                            <div className="form-field">

                                <label>
                                    Full Name <b>*</b>
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={
                                        formData.fullName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your full name"
                                />

                            </div>


                            {/* MOBILE */}

                            <div className="form-field">

                                <label>
                                    Mobile Number <b>*</b>
                                </label>

                                <div className="mobile-field">

                                    <select>
                                        <option>
                                            +91
                                        </option>
                                    </select>

                                    <input
                                        type="text"
                                        name="mobile"
                                        value={
                                            formData.mobile
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter mobile number"
                                    />

                                </div>

                            </div>


                            {/* EMAIL */}

                            <div className="form-field">

                                <label>
                                    Email Address <b>*</b>
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your email address"
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="form-field">

                                <label>
                                    Password <b>*</b>
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Create a strong password"
                                />

                            </div>


                            {/* DOB */}

                            <div className="form-field">

                                <label>
                                    Date of Birth <b>*</b>
                                </label>

                                <input
                                    type="date"
                                    name="dob"
                                    value={
                                        formData.dob
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>


                            {/* GENDER */}

                            <div className="form-field">

                                <label>
                                    Gender <b>*</b>
                                </label>

                                <select
                                    name="gender"
                                    value={
                                        formData.gender
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="">
                                        Select gender
                                    </option>

                                    <option value="Male">
                                        Male
                                    </option>

                                    <option value="Female">
                                        Female
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>

                                </select>

                            </div>

                        </div>

                    </section>

                )}


                {/* =================================================
                    STEP 2 - FAMILY DETAILS
                ================================================= */}

                {currentStep === 2 && (

                    <section className="form-section">

                        <div className="section-title">

                            <h2>
                                2. Family Details
                            </h2>

                            <p>
                                Add all family members to get
                                personalized insights and a complete
                                financial view.
                            </p>

                        </div>


                        {/* PRIMARY MEMBER */}

                        <div className="family-member">

                            <div className="member-header">

                                <div className="member-avatar">

                                    {formData.fullName
                                        ? formData.fullName
                                            .split(" ")
                                            .map(
                                                (name) =>
                                                    name.charAt(0)
                                            )
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()
                                        : "DC"}

                                </div>

                                <div className="member-info">

                                    <span className="primary-label">
                                        Primary Member (You)
                                    </span>

                                    <div className="member-name">

                                        {
                                            formData.fullName ||
                                            "Your Name"
                                        }

                                    </div>

                                    <div className="member-details">

                                        <span>
                                            {
                                                formData.gender ||
                                                "Gender"
                                            }
                                        </span>

                                        <span>
                                            •
                                        </span>

                                        <span>
                                            Primary Member
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* FAMILY MEMBERS */}

                        {familyMembers.map(
                            (member, index) => (

                                <div
                                    className="family-member"
                                    key={member.id}
                                >

                                    <div className="member-header">

                                        <div className="member-avatar">
                                            {index + 1}
                                        </div>


                                        <div className="member-info">

                                            <div className="member-name">

                                                {
                                                    member.name ||
                                                    `Family Member ${
                                                        index + 1
                                                    }`
                                                }

                                            </div>

                                        </div>


                                        <button
                                            type="button"
                                            className="remove-member-button"
                                            onClick={() =>
                                                removeFamilyMember(
                                                    member.id
                                                )
                                            }
                                        >
                                            🗑
                                        </button>

                                    </div>


                                    <div className="form-grid">

                                        {/* NAME */}

                                        <div className="form-field">

                                            <label>
                                                Full Name
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    member.name
                                                }
                                                onChange={(e) =>
                                                    updateFamilyMember(
                                                        member.id,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter name"
                                            />

                                        </div>

                                        <div className="form-field">
                                            <label>Username</label>
                                            <input type="text" value={member.username || ""} onChange={(e) => updateFamilyMember(member.id, "username", e.target.value)} placeholder="e.g. anaya.sharma" />
                                            <small>Used to sign in after activation.</small>
                                        </div>

                                        <div className="form-field">
                                            <label>Email (optional)</label>
                                            <input type="email" value={member.email || ""} onChange={(e) => updateFamilyMember(member.id, "email", e.target.value)} placeholder="member@example.com" />
                                        </div>


                                        {/* RELATIONSHIP */}

                                        <div className="form-field">

                                            <label>
                                                Relationship
                                            </label>

                                            <select
                                                value={
                                                    member.relationship
                                                }
                                                onChange={(e) =>
                                                    updateFamilyMember(
                                                        member.id,
                                                        "relationship",
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="Spouse">
                                                    Spouse
                                                </option>

                                                <option value="Child">
                                                    Child
                                                </option>

                                                <option value="Parent">
                                                    Parent
                                                </option>

                                                <option value="Sibling">
                                                    Sibling
                                                </option>

                                            </select>

                                        </div>


                                        {/* DOB */}

                                        <div className="form-field">

                                            <label>
                                                Date of Birth
                                            </label>

                                            <input
                                                type="date"
                                                value={
                                                    member.dob
                                                }
                                                onChange={(e) =>
                                                    updateFamilyMember(
                                                        member.id,
                                                        "dob",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </div>


                                        {/* GENDER */}

                                        <div className="form-field">

                                            <label>
                                                Gender
                                            </label>

                                            <select
                                                value={
                                                    member.gender
                                                }
                                                onChange={(e) =>
                                                    updateFamilyMember(
                                                        member.id,
                                                        "gender",
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                <option value="">
                                                    Select gender
                                                </option>

                                                <option value="Male">
                                                    Male
                                                </option>

                                                <option value="Female">
                                                    Female
                                                </option>

                                                <option value="Other">
                                                    Other
                                                </option>

                                            </select>

                                        </div>


                                        {/* OCCUPATION */}

                                        <div className="form-field">

                                            <label>
                                                Occupation
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    member.occupation
                                                }
                                                onChange={(e) =>
                                                    updateFamilyMember(
                                                        member.id,
                                                        "occupation",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Occupation"
                                            />

                                        </div>

                                    </div>

                                </div>

                            )
                        )}


                        {/* ADD FAMILY MEMBER */}

                        <button
                            type="button"
                            className="add-member-button"
                            onClick={
                                addFamilyMember
                            }
                        >
                            ＋ Add Another Family Member
                        </button>

                    </section>

                )}


                {/* =================================================
                    STEP 3 - FINANCIAL INFORMATION
                ================================================= */}

                {currentStep === 3 && (

                    <section className="form-section">

                        <div className="section-title">

                            <h2>
                                3. Financial Information
                            </h2>

                            <p>
                                Add your income and key financial
                                details to get better insights.
                            </p>

                            <p>
                                (Optional for now)
                            </p>

                        </div>


                        <div className="form-grid">

                            {/* INCOME */}

                            <div className="form-field">

                                <label>
                                    Monthly Household Income
                                </label>

                                <input
                                    type="number"
                                    name="monthlyIncome"
                                    value={
                                        formData.monthlyIncome
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter monthly income"
                                />

                            </div>


                            {/* BANK */}

                            <div className="form-field">

                                <label>
                                    Primary Bank
                                </label>

                                <select
                                    name="primaryBank"
                                    value={
                                        formData.primaryBank
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="">
                                        Select bank
                                    </option>

                                    <option value="HDFC Bank">
                                        HDFC Bank
                                    </option>

                                    <option value="ICICI Bank">
                                        ICICI Bank
                                    </option>

                                    <option value="State Bank of India">
                                        State Bank of India
                                    </option>

                                    <option value="Axis Bank">
                                        Axis Bank
                                    </option>

                                    <option value="Kotak Mahindra Bank">
                                        Kotak Mahindra Bank
                                    </option>

                                </select>

                            </div>

                        </div>

                    </section>

                )}


                {/* =================================================
                    STEP 4 - PREFERENCES
                ================================================= */}

                {currentStep === 4 && (

                    <section className="form-section">

                        <div className="section-title">

                            <h2>
                                4. Preferences
                            </h2>

                            <p>
                                Help us personalize your experience.
                            </p>

                        </div>


                        {/* FINANCIAL GOALS */}

                        <div className="preference-group">

                            <div className="preference-group-title">
                                Financial Goals
                            </div>


                            <div className="goal-options">

                                {[
                                    "Save for a Home",
                                    "Child Education",
                                    "Travel",
                                    "Buy a Car",
                                    "Retirement",
                                    "Other"
                                ].map((goal) => (

                                    <button
                                        key={goal}
                                        type="button"
                                        className={
                                            formData.goals.includes(
                                                goal
                                            )
                                                ? "goal-option active"
                                                : "goal-option"
                                        }
                                        onClick={() =>
                                            handleGoalChange(
                                                goal
                                            )
                                        }
                                    >
                                        {goal}
                                    </button>

                                ))}

                            </div>

                        </div>


                        {/* NOTIFICATIONS */}

                        <div className="preference-group">

                            <div className="preference-group-title">
                                Receive Notifications
                            </div>


                            {[
                                "Spending alerts",
                                "Monthly summaries",
                                "Financial tips and recommendations",
                                "New features and updates"
                            ].map(
                                (notification) => (

                                    <label
                                        className="checkbox-row"
                                        key={
                                            notification
                                        }
                                    >

                                        <input
                                            type="checkbox"
                                            checked={
                                                formData.notifications.includes(
                                                    notification
                                                )
                                            }
                                            onChange={() =>
                                                handleNotificationChange(
                                                    notification
                                                )
                                            }
                                        />

                                        <span>
                                            {
                                                notification
                                            }
                                        </span>

                                    </label>

                                )
                            )}

                        </div>


                        {/* THEME */}

                        <div className="preference-group">

                            <div className="preference-group-title">
                                Theme Preference
                            </div>


                            <div className="theme-options">

                                <button
                                    type="button"
                                    className={
                                        formData.theme ===
                                        "Light"
                                            ? "theme-option active"
                                            : "theme-option"
                                    }
                                    onClick={() =>
                                        handleThemeChange(
                                            "Light"
                                        )
                                    }
                                >
                                    ◯ &nbsp; Light
                                </button>


                                <button
                                    type="button"
                                    className={
                                        formData.theme ===
                                        "Dark"
                                            ? "theme-option active"
                                            : "theme-option"
                                    }
                                    onClick={() =>
                                        handleThemeChange(
                                            "Dark"
                                        )
                                    }
                                >
                                    ◐ &nbsp; Dark
                                </button>


                                <button
                                    type="button"
                                    className={
                                        formData.theme ===
                                        "System"
                                            ? "theme-option active"
                                            : "theme-option"
                                    }
                                    onClick={() =>
                                        handleThemeChange(
                                            "System"
                                        )
                                    }
                                >
                                    ▣ &nbsp; System
                                </button>

                            </div>

                        </div>

                    </section>

                )}


                {/* =================================================
                    STEP 5 - REVIEW
                ================================================= */}

                {currentStep === 5 && (

                    <section className="form-section">

                        <div className="section-title">

                            <h2>
                                5. Review & Create
                            </h2>

                            <p>
                                Please review your details before
                                creating your account.
                            </p>

                        </div>


                        <div className="review-grid">

                            {/* YOUR DETAILS */}

                            <div className="review-card">

                                <div className="review-card-header">

                                    <h3>
                                        Your Details
                                    </h3>

                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() =>
                                            goToStep(1)
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Name
                                    </label>

                                    <span>
                                        {
                                            formData.fullName ||
                                            "-"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Mobile
                                    </label>

                                    <span>
                                        {
                                            formData.mobile
                                                ? `+91 ${formData.mobile}`
                                                : "-"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Email
                                    </label>

                                    <span>
                                        {
                                            formData.email ||
                                            "-"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Date of Birth
                                    </label>

                                    <span>
                                        {
                                            formData.dob ||
                                            "-"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Gender
                                    </label>

                                    <span>
                                        {
                                            formData.gender ||
                                            "-"
                                        }
                                    </span>

                                </div>

                            </div>


                            {/* FAMILY MEMBERS */}

                            <div className="review-card">

                                <div className="review-card-header">

                                    <h3>
                                        Family Members
                                    </h3>

                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() =>
                                            goToStep(2)
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>


                                {familyMembers.map(
                                    (member) => (

                                        <div
                                            className="review-family-member"
                                            key={member.id}
                                        >

                                            <div className="review-family-name">

                                                {
                                                    member.name ||
                                                    "Family Member"
                                                }

                                            </div>

                                            <div className="review-family-details">

                                                <span>
                                                    {
                                                        member.relationship
                                                    }
                                                </span>

                                                <span>
                                                    •
                                                </span>

                                                <span>
                                                    {
                                                        member.gender ||
                                                        "-"
                                                    }
                                                </span>

                                                <span>
                                                    •
                                                </span>

                                                <span>
                                                    {
                                                        member.occupation ||
                                                        "-"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>


                            {/* FINANCIAL */}

                            <div className="review-card">

                                <div className="review-card-header">

                                    <h3>
                                        Financial Information
                                    </h3>

                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() =>
                                            goToStep(3)
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Monthly Income
                                    </label>

                                    <span>
                                        {
                                            formData.monthlyIncome
                                                ? `₹ ${formData.monthlyIncome}`
                                                : "-"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Primary Bank
                                    </label>

                                    <span>
                                        {
                                            formData.primaryBank ||
                                            "-"
                                        }
                                    </span>

                                </div>

                            </div>


                            {/* PREFERENCES */}

                            <div className="review-card">

                                <div className="review-card-header">

                                    <h3>
                                        Preferences
                                    </h3>

                                    <button
                                        type="button"
                                        className="edit-button"
                                        onClick={() =>
                                            goToStep(4)
                                        }
                                    >
                                        ✎
                                    </button>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Goals
                                    </label>

                                    <span>
                                        {
                                            formData.goals.length
                                                ? formData.goals.join(
                                                    ", "
                                                )
                                                : "-"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Notifications
                                    </label>

                                    <span>
                                        {
                                            formData.notifications.length
                                                ? formData.notifications.join(
                                                    ", "
                                                )
                                                : "None"
                                        }
                                    </span>

                                </div>


                                <div className="review-row">

                                    <label>
                                        Theme
                                    </label>

                                    <span>
                                        {
                                            formData.theme
                                        }
                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* TERMS */}

                        <label className="terms-row">

                            <input
                                type="checkbox"
                                checked={
                                    termsAccepted
                                }
                                onChange={(e) =>
                                    setTermsAccepted(
                                        e.target.checked
                                    )
                                }
                            />

                            <span>

                                I agree to the{" "}

                                <button
                                    type="button"
                                    className="inline-link"
                                    onClick={() =>
                                        navigate("/terms")
                                    }
                                >
                                    Terms and Conditions
                                </button>

                                {" "}and{" "}

                                <button
                                    type="button"
                                    className="inline-link"
                                    onClick={() =>
                                        navigate("/privacy")
                                    }
                                >
                                    Privacy Policy
                                </button>

                                {" "}*

                            </span>

                        </label>

                    </section>

                )}


                {/* =================================================
                    BOTTOM ACTIONS
                ================================================= */}

                <div className="form-actions">

                    {/* BACK / CANCEL */}

                    {currentStep > 1 ? (

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={
                                handleBack
                            }
                        >
                            ← Back
                        </button>

                    ) : (

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Cancel
                        </button>

                    )}


                    {/* NEXT / CREATE */}

                    {currentStep < 5 ? (

                        <button
                            type="button"
                            className="review-button"
                            onClick={
                                handleNext
                            }
                        >
                            Next →
                        </button>

                    ) : (

                        <button
                            type="button"
                            className="review-button"
                            onClick={
                                handleCreateAccount
                            }
                        >
                            Create Account
                        </button>

                    )}

                </div>

            </div>

        </div>
    );
}

export default CreateAccount;
