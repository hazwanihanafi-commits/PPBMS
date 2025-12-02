// frontend/pages/index.js
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900">
                PPBMS
              </div>
              <div className="text-xs text-gray-500">
                Postgraduate Progress & Benchmarking System
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="hidden md:inline-flex px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            General Login
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Hero text */}
          <div className="space-y-5">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
              IPPT · USM · Research Progress
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Monitor postgraduate{" "}
              <span className="text-purple-700">research progress</span>{" "}
              in one simple dashboard.
            </h1>

            <p className="text-gray-600 text-sm sm:text-base max-w-xl">
              Secure web platform for tracking MSc and PhD milestones,
              supervisor monitoring, and documentation — tailored for
              IPPT / USM research programmes.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/login?role=student"
                className="px-5 py-2.5 rounded-full bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
              >
                Login as Student
              </Link>
              <Link
                href="/login?role=supervisor"
                className="px-5 py-2.5 rounded-full bg-white border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition"
              >
                Login as Supervisor
              </Link>
              <Link
                href="/login?role=admin"
                className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 tex
