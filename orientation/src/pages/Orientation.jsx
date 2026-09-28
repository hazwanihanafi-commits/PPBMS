import { useState } from "react";
import { completeOrientation } from "../api";

const modules = [
  {
    id: 1,
    title: "Welcome to PKTAAB",
    icon: "🏥",
    text: "Discover PKTAAB, Universiti Sains Malaysia and what it means to begin your postgraduate journey here."
  },
  {
    id: 2,
    title: "Meet Your Team",
    icon: "👥",
    text: "Get to know the Academic & International team and who to contact when you need assistance."
  },
  {
    id: 3,
    title: "Your Postgraduate Journey",
    icon: "🎓",
    text: "Understand your research journey, important milestones, supervision and postgraduate responsibilities."
  },
  {
    id: 4,
    title: "PPBMS — Your Student Portal",
    icon: "💻",
    text: "Learn how PPBMS helps you monitor your academic progress, submit documents and follow important milestones."
  },
  {
    id: 5,
    title: "Research Do's & Don'ts",
    icon: "🧬",
    text: "Learn the essential practices for responsible research, research ethics, documentation and academic integrity."
  },
  {
    id: 6,
    title: "Forms & Important Resources",
    icon: "📂",
    text: "Know where to find postgraduate forms, guidelines, templates and important documents."
  },
  {
    id: 7,
    title: "AduSiswa",
    icon: "📢",
    text: "Learn where to submit student feedback, complaints, suggestions and other student-related matters."
  },
  {
    id: 8,
    title: "Campus Essentials",
    icon: "🚌",
    text: "Explore useful information about campus facilities, transportation, accommodation and daily student needs."
  },
  {
    id: 9,
    title: "Communication & Support",
    icon: "💬",
    text: "Know how to stay connected with PKTAAB and where to get help when you need it."
  },
  {
    id: 10,
    title: "Final Checklist",
    icon: "✅",
    text: "Complete your final orientation checklist before starting your postgraduate journey."
  }
];

export default function Orientation({
  student,
  token,
  onComplete
}) {
  const [current, setCurrent] = useState(0);

  const [completedModules, setCompletedModules] =
    useState([]);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const module = modules[current];

  const totalModules = modules.length;

  const progress = Math.round(
    (completedModules.length / totalModules) * 100
  );


  function markComplete() {

    if (!completedModules.includes(module.id)) {

      setCompletedModules([
        ...completedModules,
        module.id
      ]);

    }

    if (current < totalModules - 1) {
      setCurrent(current + 1);
    }
  }


  async function finishOrientation() {

    setSaving(true);
    setError("");

    try {

      await completeOrientation(token, {
        email:
          student.email ||
          student.student_email,

        matric:
          student.matric ||
          student.student_id,

        studentName:
          student.studentName ||
          student.student_name,

        programme:
          student.programme,

        progress: 100
      });

      onComplete();

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Unable to save your orientation completion."
      );

    } finally {

      setSaving(false);

    }
  }


  return (
    <div className="orientation-page">

      {/* HEADER */}

      <header className="orientation-header">

        <div className="header-brand">
          PKTAAB
        </div>

        <div className="header-progress">

          <span>
            ORIENTATION
          </span>

          <strong>
            {progress}%
          </strong>

        </div>

      </header>


      {/* MAIN */}

      <main className="orientation-content">

        {/* SIDE NAV */}

        <aside className="module-sidebar">

          <div className="sidebar-title">
            YOUR JOURNEY
          </div>

          {modules.map((item, index) => {

            const isCurrent =
              index === current;

            const isDone =
              completedModules.includes(
                item.id
              );

            return (
              <button
                key={item.id}
                className={`module-nav ${
                  isCurrent
                    ? "active"
                    : ""
                } ${
                  isDone
                    ? "done"
                    : ""
                }`}
                onClick={() =>
                  setCurrent(index)
                }
              >

                <span className="module-number">
                  {isDone
                    ? "✓"
                    : String(index + 1).padStart(2, "0")}
                </span>

                <span className="module-name">
                  {item.title}
                </span>

              </button>
            );

          })}

        </aside>


        {/* CONTENT */}

        <section className="module-content">

          <div className="module-counter">
            MODULE {String(current + 1).padStart(2, "0")}
            {" "} / {String(totalModules).padStart(2, "0")}
          </div>


          <div className="module-icon">
            {module.icon}
          </div>


          <h1>
            {module.title}
          </h1>


          <p className="module-description">
            {module.text}
          </p>


          {/* PLACEHOLDER CONTENT */}

          <div className="module-card">

            {current === 0 && (
              <>
                <h2>
                  Your journey starts here
                </h2>

                <p>
                  Welcome to the Pusat Kanser Tun
                  Abdullah Ahmad Badawi (PKTAAB),
                  Universiti Sains Malaysia.
                </p>

                <p>
                  This orientation will introduce
                  you to the people, systems,
                  responsibilities and resources
                  that will support you throughout
                  your postgraduate journey.
                </p>
              </>
            )}


            {current === 1 && (
              <>
                <h2>
                  You are not on this journey alone.
                </h2>

                <p>
                  Meet the Academic & International
                  team and discover who to contact
                  for academic, administrative and
                  postgraduate matters.
                </p>

                <div className="info-box">
                  👥 Meet the PKTAAB team
                </div>
              </>
            )}


            {current === 2 && (
              <>
                <h2>
                  Understand your milestones
                </h2>

                <p>
                  Your postgraduate journey includes
                  planning, research, supervision,
                  progress monitoring, annual review,
                  thesis preparation and graduation.
                </p>

                <div className="info-box">
                  🎓 Plan → Research → Monitor → Complete
                </div>
              </>
            )}


            {current === 3 && (
              <>
                <h2>
                  PPBMS is your progress companion.
                </h2>

                <p>
                  Use PPBMS to monitor your academic
                  progress, submit required documents,
                  view milestones and stay updated
                  with postgraduate requirements.
                </p>

                <a
                  href="https://ppbms-frontend.onrender.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link"
                >
                  Open PPBMS →
                </a>
              </>
            )}


            {current === 4 && (
              <>
                <h2>
                  Research with integrity.
                </h2>

                <p>
                  Always follow approved research
                  procedures, maintain proper records,
                  protect participants and communicate
                  with your supervisor when you are
                  unsure.
                </p>

                <div className="dosdonts">

                  <div>
                    <strong>✓ DO</strong>
                    <span>
                      Keep research records updated.
                    </span>
                  </div>

                  <div>
                    <strong>✓ DO</strong>
                    <span>
                      Follow ethics approval.
                    </span>
                  </div>

                  <div>
                    <strong>✕ DON'T</strong>
                    <span>
                      Collect data without approval.
                    </span>
                  </div>

                </div>
              </>
            )}


            {current === 5 && (
              <>
                <h2>
                  Keep your important forms within reach.
                </h2>

                <p>
                  Your orientation resources should
                  help you locate postgraduate forms,
                  guidelines, templates and official
                  documents.
                </p>

                <div className="info-box">
                  📂 Forms & Guidelines
                </div>
              </>
            )}


            {current === 6 && (
              <>
                <h2>
                  AduSiswa
                </h2>

                <p>
                  AduSiswa provides a channel for
                  students to communicate feedback,
                  suggestions and student-related
                  matters through the appropriate
                  university process.
                </p>

                <div className="info-box">
                  📢 Know where to raise your concern.
                </div>
              </>
            )}


            {current === 7 && (
              <>
                <h2>
                  Get comfortable on campus.
                </h2>

                <p>
                  Familiarise yourself with campus
                  facilities, transportation,
                  accommodation and other services.
                </p>

                <a
                  href="https://reachapps.amdi.usm.my/tripschedule/"
                  target="_blank"
                  rel="noreferrer"
                  className="resource-link"
                >
                  🚌 View Shuttle Schedule →
                </a>
              </>
            )}


            {current === 8 && (
              <>
                <h2>
                  When in doubt, ask.
                </h2>

                <p>
                  Keep your communication channels
                  open with your supervisor, the
                  Academic & International team and
                  relevant university offices.
                </p>

                <div className="info-box">
                  💬 Communication is part of good research.
                </div>
              </>
            )}


            {current === 9 && (
              <>
                <h2>
                  You're ready to begin.
                </h2>

                <p>
                  Before you finish, make sure you
                  understand where to access PPBMS,
                  where to find important forms and
                  who to contact when you need help.
                </p>

                <div className="final-checklist">

                  <div>✓ I know how to access PPBMS</div>
                  <div>✓ I know where to find forms</div>
                  <div>✓ I understand my responsibilities</div>
                  <div>✓ I know where to get support</div>

                </div>

              </>
            )}

          </div>


          {/* ERROR */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* NAVIGATION */}

          <div className="module-actions">

            <button
              className="secondary-button"
              disabled={current === 0}
              onClick={() =>
                setCurrent(
                  current - 1
                )
              }
            >
              ← BACK
            </button>


            {current <
            totalModules - 1 ? (

              <button
                className="primary-button"
                onClick={markComplete}
              >
                {completedModules.includes(
                  module.id
                )
                  ? "NEXT MODULE →"
                  : "COMPLETE & CONTINUE →"}
              </button>

            ) : (

              <button
                className="primary-button"
                disabled={saving}
                onClick={finishOrientation}
              >
                {saving
                  ? "SAVING..."
                  : "🎉 COMPLETE ORIENTATION"}
              </button>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}
