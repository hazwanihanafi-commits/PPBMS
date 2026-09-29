export default function Welcome({
  student,
  status,
  onStart,
  onLogout
}) {

  const progressData =
  status?.progress;

let progress = 0;

if (
  typeof progressData === "number"
) {

  progress = progressData;

} else if (
  progressData &&
  typeof progressData === "object"
) {

  const values =
    Object.values(progressData);

  const completedCount =
    values.filter(
      value =>
        String(value)
          .toLowerCase()
          .includes("completed")
    ).length;

  progress =
    values.length > 0
      ? Math.round(
          (completedCount /
            values.length) *
            100
        )
      : 0;
}

  const completed =
    status?.status === "Completed";

  const studentName =
    student?.student_name ||
    student?.studentName ||
    student?.["Student Name"] ||
    student?.name ||
    "Postgraduate Student";

  const matric =
    student?.student_id ||
    student?.matric ||
    student?.["Matric"] ||
    student?.matricNo ||
    student?.["Matric No."] ||
    "—";

  const programme =
    student?.programme ||
    student?.Programme ||
    "—";


  return (
    <div className="orientation-shell">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="orientation-header">

        <div className="header-brand">
          PKTAAB
        </div>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          Sign out
        </button>

      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="welcome-main">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="hero-section">

          <div className="hero-copy">

            <div className="eyebrow">
              PKTAAB • USM
            </div>


            <h1>

              Welcome,

              <br />

              <span>
                {studentName}
              </span>

              👋

            </h1>


            <p>
              Welcome to your postgraduate
              journey at the Pusat Kanser
              Tun Abdullah Ahmad Badawi,
              Universiti Sains Malaysia.
            </p>


            {/* =================================================
                STUDENT MINI CARD
                ================================================= */}

            <div className="student-mini-card">

              <div>

                <small>
                  MATRIC
                </small>

                <strong>
                  {matric}
                </strong>

              </div>


              <div>

                <small>
                  PROGRAMME
                </small>

                <strong>
                  {programme}
                </strong>

              </div>

            </div>


            {/* =================================================
                START BUTTON
                ================================================= */}

            <button
              className="hero-button"
              onClick={onStart}
            >

              {completed
                ? "VIEW ORIENTATION →"
                : progress > 0
                ? "CONTINUE ORIENTATION →"
                : "START ORIENTATION →"}

            </button>

          </div>


          {/* =================================================
              VISUAL
              ================================================= */}

          <div className="hero-visual">

            <div className="portal-circle">

              <span>
                PKTAAB
              </span>

            </div>


            <div className="floating-card card-one">

              🎓

              <span>
                Your journey
              </span>

            </div>


            <div className="floating-card card-two">

              🧬

              <span>
                Your research
              </span>

            </div>


            <div className="floating-card card-three">

              📚

              <span>
                Your progress
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            PROGRESS
            ================================================= */}

        <section className="progress-section">

          <div className="progress-header">

            <div>

              <span>
                ORIENTATION PROGRESS
              </span>

              <strong>
                {progress}%
              </strong>

            </div>


            <div>

              {completed
                ? "🟢 Completed"
                : progress > 0
                ? "In progress"
                : "Not started"}

            </div>

          </div>


          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`
              }}
            />

          </div>

        </section>


        {/* =================================================
            ORIENTATION MAP
            ================================================= */}

        <section className="orientation-map">

          <div>

            <span>
              01
            </span>

            <p>
              Welcome
            </p>

          </div>


          <div>

            <span>
              02
            </span>

            <p>
              Meet the Team
            </p>

          </div>


          <div>

            <span>
              03
            </span>

            <p>
              Your Journey
            </p>

          </div>


          <div>

            <span>
              04
            </span>

            <p>
              PPBMS
            </p>

          </div>


          <div>

            <span>
              05
            </span>

            <p>
              Research
            </p>

          </div>


          <div>

            <span>
              06
            </span>

            <p>
              Resources
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}
