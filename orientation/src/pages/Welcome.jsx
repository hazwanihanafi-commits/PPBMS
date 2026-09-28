export default function Welcome({
  student,
  status,
  onStart,
  onLogout
}) {

  const progress =
    status?.progress || 0;

  const completed =
    status?.status === "Completed";


  return (
    <div className="orientation-shell">

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


      <main className="welcome-main">

        <section className="hero-section">

          <div className="hero-copy">

            <div className="eyebrow">
              PKTAAB • USM
            </div>

            <h1>
              Welcome,
              <br />
              <span>
                {student.student_name}
              </span>
              👋
            </h1>

            <p>
              Welcome to your postgraduate
              journey at the Pusat Kanser
              Tun Abdullah Ahmad Badawi,
              Universiti Sains Malaysia.
            </p>


            <div className="student-mini-card">

              <div>
                <small>
                  MATRIC
                </small>

                <strong>
                  {student.student_id}
                </strong>
              </div>


              <div>
                <small>
                  PROGRAMME
                </small>

                <strong>
                  {student.programme}
                </strong>
              </div>

            </div>


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


          <div className="hero-visual">

            <div className="portal-circle">
              <span>PKTAAB</span>
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


        <section className="orientation-map">

          <div>
            <span>01</span>
            <p>Welcome</p>
          </div>

          <div>
            <span>02</span>
            <p>Meet the Team</p>
          </div>

          <div>
            <span>03</span>
            <p>Your Journey</p>
          </div>

          <div>
            <span>04</span>
            <p>PPBMS</p>
          </div>

          <div>
            <span>05</span>
            <p>Research</p>
          </div>

          <div>
            <span>06</span>
            <p>Resources</p>
          </div>

        </section>

      </main>

    </div>
  );
}
