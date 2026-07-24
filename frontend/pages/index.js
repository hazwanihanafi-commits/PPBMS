import Link from "next/link";
import { User, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#ede9fe] flex items-center justify-center p-6 relative overflow-hidden">

      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 opacity-30 blur-3xl animate-pulse bg-gradient-to-r from-purple-300 via-transparent to-indigo-300"></div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-[1200px] rounded-3xl bg-white/50 backdrop-blur-xl shadow-2xl border border-white/30 overflow-hidden relative z-10">

        {/* HEADER */}
        <header className="flex justify-between items-center px-8 py-5 border-b border-white/20 bg-white/40 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              P
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">PPBMS</h1>
              <p className="text-xs text-gray-600">
                Postgraduate Portfolio-Based Monitoring System
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="px-6 py-2 rounded-full bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition shadow-md"
          >
            Login
          </Link>
        </header>

        {/* HERO */}
        <section className="text-center px-6 py-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Monitor Postgraduate{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
              Research Progress
            </span>
          </h2>

          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            A centralized platform for MSc & PhD monitoring, supervisor oversight,
            and CQI reporting across programmes.
          </p>

          <p className="text-sm text-gray-500 mb-8">
            Used by postgraduate programmes at Universiti Sains Malaysia
          </p>

          <Link
            href="/login"
            className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition"
          >
            Get Started →
          </Link>
        </section>

        {/* FEATURES */}
        <section className="grid md:grid-cols-3 gap-6 px-8 pb-10 text-center">
          <Feature
            title="Real-time Monitoring"
            desc="Track student milestones and submissions instantly"
          />
          <Feature
            title="Supervisor Oversight"
            desc="Identify risks and monitor supervisees effectively"
          />
          <Feature
            title="CQI Analytics"
            desc="Generate insights for programme improvement"
          />
        </section>

        {/* PORTAL CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-16">
          <GlassCard
            title="Student"
            desc="Track milestones and upload research documents."
            href="/login"
            icon={<User size={22} />}
          />
          <GlassCard
            title="Supervisor"
            desc="Monitor supervisees and evaluate progress."
            href="/supervisor"
            icon={<Users size={22} />}
          />
          <GlassCard
            title="Admin"
            desc="Manage CQI reports and programme analytics."
            href="/admin/login"
            icon={<ShieldCheck size={22} />}
          />
        </section>

        {/* HOW PPBMS WORKS */}
<section className="px-8 pb-14">
  <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-lg">

    <h2 className="text-3xl font-bold text-center text-purple-700">
      How PPBMS Works
    </h2>

    <p className="text-center text-gray-600 mt-3 mb-8">
      Follow these simple workflows to manage postgraduate research progress.
    </p>

    <div className="grid md:grid-cols-2 gap-8">

      {/* Student */}
      <div className="bg-purple-50 rounded-2xl p-6 text-center shadow-sm">

        <h3 className="text-xl font-semibold text-purple-700 mb-4">
          👨‍🎓 Student Workflow
        </h3>

        <a
          href="/images/student-workflow.png"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/images/student-workflow.png"
            alt="Student Workflow"
            className="w-full rounded-xl border shadow-md hover:scale-105 transition"
          />
        </a>

        <p className="mt-4 text-sm text-gray-600">
          Update your research timeline, upload supporting documents and view supervisor feedback.
        </p>

      </div>

      {/* Supervisor */}
      <div className="bg-indigo-50 rounded-2xl p-6 text-center shadow-sm">

        <h3 className="text-xl font-semibold text-indigo-700 mb-4">
          👩‍🏫 Supervisor Workflow
        </h3>

        <a
          href="/images/supervisor-workflow.png"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/images/supervisor-workflow.png"
            alt="Supervisor Workflow"
            className="w-full rounded-xl border shadow-md hover:scale-105 transition"
          />
        </a>

        <p className="mt-4 text-sm text-gray-600">
          Review submissions, provide feedback, approve milestones and monitor supervisee progress.
        </p>

      </div>

    </div>

  </div>
</section>

        {/* RESOURCE DOCUMENTS */}
        <section className="px-8 pb-12">

          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-lg">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              {/* LEFT */}
              <div className="flex-1">

                <h2 className="text-3xl font-bold text-purple-700">
                  Academic Resource Documents
                </h2>

                <p className="mt-4 text-gray-600 leading-relaxed">
                  Access postgraduate academic forms, supervision logbooks,
                  Annual Progress Review (APR) templates, rubric forms,
                  monitoring documents, and programme guidance materials
                  through the official PPBMS resource repository.
                </p>

                <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">

                  <div className="bg-purple-50 rounded-2xl p-4">
                    <p className="font-semibold text-purple-700">
                      Development Plan & Learning Contract
                    </p>
                    <p className="text-gray-600 mt-1">
                      Research planning and supervisor agreement form.
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4">
                    <p className="font-semibold text-purple-700">
                      Student Supervision Logbook
                    </p>
                    <p className="text-gray-600 mt-1">
                      Weekly supervision and research activity records.
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4">
                    <p className="font-semibold text-purple-700">
                      Annual Progress Review (APR)
                    </p>
                    <p className="text-gray-600 mt-1">
                      Written report and presentation templates.
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-2xl p-4">
                    <p className="font-semibold text-purple-700">
                      PLO Rubric Forms
                    </p>
                    <p className="text-gray-600 mt-1">
                      MSc and PhD assessment rubrics and evaluation forms.
                    </p>
                  </div>

                </div>

              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-center justify-center">

                <a
                  href="https://drive.google.com/drive/folders/1Wnw9wS-pVNz1AOIRXkVYshuzjUxS15ei?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-3
                    bg-purple-600 hover:bg-purple-700
                    transition
                    text-white
                    px-8 py-4
                    rounded-2xl
                    font-semibold
                    shadow-lg
                  "
                >
                  📂 Open Resource Folder
                </a>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  Google Drive Resource Repository
                </p>

              </div>

            </div>

          </div>

        </section>

    
        {/* FOOTER */}
<footer className="text-center text-xs text-gray-400 py-6 border-t mt-10">
  © 2026 PPBMS · Universiti Sains Malaysia
  <br />
  Developed by Hazwani Ahmad Yusof (2025)
</footer>
      </div>
    </div>
  );
}

/* FEATURE BLOCK */
function Feature({ title, desc }) {
  return (
    <div className="p-4">
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

/* GLASS CARD */
function GlassCard({ title, desc, href, icon }) {
  return (
    <div className="group p-6 rounded-2xl bg-white/40 backdrop-blur-lg border border-white/40 shadow-md hover:shadow-2xl hover:-translate-y-2 transition duration-300 relative overflow-hidden">

      {/* HOVER GLOW */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-purple-100 to-indigo-100"></div>

      <div className="relative z-10">
        <div className="mb-3 text-purple-600">{icon}</div>

        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-gray-700 text-sm mb-4">{desc}</p>

        <Link
          href={href}
          className="text-purple-600 text-sm font-medium hover:underline"
        >
          Access Portal →
        </Link>
      </div>
    </div>
  );
}
