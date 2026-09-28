export default function Completed({
  student,
  status,
  onView,
  onLogout
}) {

  const completedDate =
    status?.completedAt
      ? new Date(
          status.completedAt
        ).toLocaleDateString(
          "en-MY",
          {
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        )
      : "Completed";


  const studentName =
    student.studentName ||
    student.student_name ||
    "Student";


  const matric =
    student.matric ||
    student.student_id ||
    "-";


  const programme =
    student.programme ||
    "-";


  return (
    <div className="completed-page">

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


      <main className="completed-content">

        <div className="completion-orbit">

          <div className="completion-icon">
            ✓
          </div>

        </div>


        <div className="completion-kicker">
          ORIENTATION COMPLETE
        </div>


        <h1>
          You're ready,
          <br />
          <span>
            {studentName}
          </span>
          .
        </h1>


        <p className="completion-message">
          Congratulations! You have successfully
          completed the PKTAAB Postgraduate Student
          Orientation.
        </p>


        <div className="completion-card">

          <div className="completion-row">

            <span>
              STUDENT
            </span>

            <strong>
              {studentName}
            </strong>

          </div>


          <div className="completion-row">

            <span>
              MATRIC
            </span>

            <strong>
              {matric}
            </strong>

          </div>


          <div className="completion-row">

            <span>
              PROGRAMME
            </span>

            <strong>
              {programme}
            </strong>

          </div>


          <div className="completion-row">

            <span>
              STATUS
            </span>

            <strong className="completed-status">
              🟢 Completed
            </strong>

          </div>


          <div className="completion-row">

            <span>
              COMPLETED
            </span>

            <strong>
              {completedDate}
            </strong>

          </div>

        </div>


        <div className="completion-actions">

          <button
            className="primary-button"
            onClick={onView}
          >
            VIEW ORIENTATION
          </button>


          <a
            href="https://ppbms-frontend.onrender.com/"
            className="secondary-button"
          >
            GO TO PPBMS →
          </a>

        </div>


        <div className="completion-note">

          <span>
            🎓
          </span>

          <p>
            Your orientation completion has been
            recorded. You may revisit this orientation
            whenever you need a reminder of PKTAAB
            postgraduate resources.
          </p>

        </div>

      </main>

    </div>
  );
}
