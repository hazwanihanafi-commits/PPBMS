import React from "react";
import "./Welcome.css";

export default function Welcome({
  student,
  status,
  onStart,
  onLogout
}) {
  /* =====================================================
     PROGRESS
     ===================================================== */

  const progress = Math.min(
    100,
    Math.max(0, Number(status?.progress || 0))
  );

  const completed =
    status?.status === "Completed";

  /* =====================================================
     STUDENT INFORMATION
     ===================================================== */

  const name =
    student?.name ||
    student?.studentName ||
    "Postgraduate Student";

  const matricNo =
    student?.matricNo ||
    student?.matric ||
    student?.matricNumber ||
    "—";

  const programme =
    student?.programme ||
    student?.program ||
    "Postgraduate Programme";

  /* =====================================================
     WELCOME SECTIONS
     ===================================================== */

  const sections = [
    {
      number: "01",
      icon: "👋",
      title: "Welcome",
      description:
        "Start your PKTAAB postgraduate journey.",
      state:
        progress > 0
          ? "completed"
          : "current"
    },

    {
      number: "02",
      icon: "👥",
      title: "Meet the Team",
      description:
        "Meet the people supporting your academic journey.",
      state:
        progress >= 20
          ? "completed"
          : "next"
    },

    {
      number: "03",
      icon: "🎓",
      title: "Your Journey",
      description:
        "Understand your postgraduate pathway and milestones.",
      state:
        progress >= 40
          ? "completed"
          : "locked"
    },

    {
      number: "04",
      icon: "📊",
      title: "PPBMS",
      description:
        "Learn how to monitor your postgraduate progress.",
      state:
        progress >= 60
          ? "completed"
          : "locked"
    },

    {
      number: "05",
      icon: "🧬",
      title: "Research",
      description:
        "Explore your research environment and responsibilities.",
      state:
        progress >= 80
          ? "completed"
          : "locked"
    },

    {
      number: "06",
      icon: "📚",
      title: "Resources",
      description:
        "Find essential documents, forms and student support.",
      state:
        completed
          ? "completed"
          : "locked"
    }
  ];

  /* =====================================================
     NEXT SECTION
     ===================================================== */

  const nextSection =
    sections.find(
      (section) =>
        section.state === "current" ||
        section.state === "next"
    ) ||
    sections[sections.length - 1];

  /* =====================================================
     STATUS LABEL
     ===================================================== */

  const getStatusLabel = (state) => {
    if (state === "completed") {
      return "Completed";
    }

    if (state === "current") {
      return "Continue";
    }

    if (state === "next") {
      return "Next";
    }

    return "Locked";
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="orientation-page">

      {/* =================================================
          BACKGROUND DECORATION
          ================================================= */}

      <div className="bg-orb bg-orb-one" />
      <div className="bg-orb bg-orb-two" />


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="orientation-header">

        <div className="brand-area">

          <div className="brand-mark">
            PKTAAB
          </div>

          <div className="brand-divider" />

          <div className="brand-usm">
            USM
          </div>

        </div>


        <button
          type="button"
          className="logout-button"
          onClick={onLogout}
        >
          <span>
            Sign out
          </span>

          <span className="logout-icon">
            ↗
          </span>
        </button>

      </header>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="orientation-main">


        {/* =================================================
            HERO
            ================================================= */}

        <section className="welcome-hero">

          <div>

            {/* BRANDING */}

            <div className="hero-eyebrow">
              PKTAAB · UNIVERSITI SAINS MALAYSIA
            </div>


            {/* WELCOME */}

            <h1>

              Welcome,

              <span>
                {name}
              </span>

              <span className="wave">
                👋
              </span>

            </h1>


            {/* DESCRIPTION */}

            <p className="hero-description">

              Welcome to your postgraduate journey at{" "}

              <strong>
                Pusat Kanser Tun Abdullah Ahmad Badawi,
                Universiti Sains Malaysia.
              </strong>

            </p>

          </div>


          {/* =================================================
              STUDENT INFORMATION CARD
              ================================================= */}

          <div className="student-card">

            <div className="student-info">


              {/* MATRIC */}

              <div className="student-item">

                <span className="student-label">
                  MATRIC NO.
                </span>

                <strong>
                  {matricNo}
                </strong>

              </div>


              {/* PROGRAMME */}

              <div className="student-item programme-item">

                <span className="student-label">
                  PROGRAMME
                </span>

                <strong>
                  {programme}
                </strong>

              </div>

            </div>


            {/* STUDENT TYPE */}

            <div className="student-badge">

              POSTGRADUATE STUDENT

            </div>

          </div>

        </section>


        {/* =================================================
            PROGRESS
            ================================================= */}

        <section className="progress-card">


          <div className="progress-top">

            <div>

              <span className="section-kicker">
                YOUR ORIENTATION
              </span>

              <h2>
                Journey Progress
              </h2>

            </div>


            <div className="progress-number">
              {progress}%
            </div>

          </div>


          {/* PROGRESS BAR */}

          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`
              }}
            >

              <span />

            </div>

          </div>


          {/* PROGRESS CAPTION */}

          <div className="progress-bottom">

            <span>
              Keep going — you're doing great!
            </span>

            <span>
              {progress}% complete
            </span>

          </div>

        </section>


        {/* =================================================
            JOURNEY INTRO
            ================================================= */}

        <section className="journey-intro">

          <div>

            <span className="section-kicker">
              YOUR POSTGRADUATE JOURNEY
            </span>


            <h2>
              Everything you need,
              <br />
              in one place.
            </h2>


            <p>
              Take a few minutes to explore each
              section. You can return here anytime
              during your orientation.
            </p>

          </div>


          <div className="journey-symbol">

            <div>
              🎓
            </div>

            <div>
              🧬
            </div>

            <div>
              📊
            </div>

          </div>

        </section>


        {/* =================================================
            NEXT STEP
            ================================================= */}

        {!completed && (

          <section className="next-step-card">


            <div className="next-icon">
              {nextSection.icon}
            </div>


            <div className="next-content">

              <span className="next-label">
                YOUR NEXT STEP
              </span>


              <h3>
                {nextSection.title}
              </h3>


              <p>
                {nextSection.description}
              </p>

            </div>


            <button
              type="button"
              className="primary-button"
              onClick={onStart}
            >

              <span>
                Continue
              </span>

              <span className="button-arrow">
                →
              </span>

            </button>

          </section>

        )}


        {/* =================================================
            COMPLETED STATE
            ================================================= */}

        {completed && (

          <section className="completed-card">


            <div className="completed-icon">
              ✓
            </div>


            <div>

              <span className="next-label">
                ORIENTATION COMPLETE
              </span>


              <h3>
                Congratulations,
                {" "}
                {name.split(" ")[0]}!
              </h3>


              <p>
                You have completed your PKTAAB
                postgraduate orientation. You are
                now ready to continue your academic
                journey.
              </p>

            </div>

          </section>

        )}


        {/* =================================================
            SECTION GRID
            ================================================= */}

        <section className="sections-section">


          <div className="section-heading">

            <div>

              <span className="section-kicker">
                EXPLORE
              </span>


              <h2>
                Your Orientation
              </h2>

            </div>


            <span className="section-count">
              06 SECTIONS
            </span>

          </div>


          <div className="section-grid">


            {sections.map((section) => {

              const isLocked =
                section.state === "locked";

              const isCompleted =
                section.state === "completed";

              const isNext =
                section.state === "current" ||
                section.state === "next";


              return (

                <button
                  key={section.number}
                  type="button"

                  className={`
                    orientation-section-card
                    ${isLocked ? "is-locked" : ""}
                    ${isCompleted ? "is-completed" : ""}
                    ${isNext ? "is-next" : ""}
                  `}

                  onClick={() => {

                    if (!isLocked) {
                      onStart();
                    }

                  }}

                  disabled={isLocked}
                >


                  {/* CARD TOP */}

                  <div className="card-top">

                    <span className="card-number">
                      {section.number}
                    </span>


                    <span className="card-status">

                      {isCompleted
                        ? "✓"
                        : isLocked
                          ? "🔒"
                          : "→"}

                    </span>

                  </div>


                  {/* ICON */}

                  <div className="card-icon">
                    {section.icon}
                  </div>


                  {/* TITLE */}

                  <h3>
                    {section.title}
                  </h3>


                  {/* DESCRIPTION */}

                  <p>
                    {section.description}
                  </p>


                  {/* FOOTER */}

                  <div className="card-footer">

                    <span>
                      {getStatusLabel(
                        section.state
                      )}
                    </span>


                    <span>
                      {isLocked
                        ? "🔒"
                        : "→"}
                    </span>

                  </div>

                </button>

              );

            })}

          </div>

        </section>


        {/* =================================================
            HELP
            ================================================= */}

        <section className="help-card">


          <div className="help-icon">
            💬
          </div>


          <div className="help-content">

            <h3>
              Need help?
            </h3>


            <p>
              If you are unsure where to go or who
              to contact, your academic and
              postgraduate support team is here to
              help you.
            </p>

          </div>


          <div className="help-arrow">
            →
          </div>

        </section>


        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="orientation-footer">


          <div className="footer-brand">

            <strong>
              PKTAAB
            </strong>

            <span>
              ·
            </span>

            <span>
              Universiti Sains Malaysia
            </span>

          </div>


          <div className="footer-text">

            <span>
              Division of Academic & International
            </span>


            {/* NEW DEVELOPER CREDIT */}

            <div className="developer-credit">

              Developed by{" "}

              <strong>
                Hazwani Hanafi
              </strong>

              {" "}· 2026

            </div>

          </div>

        </footer>

      </main>

    </div>
  );
}
