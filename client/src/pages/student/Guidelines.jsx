import React from "react";
import { Link } from "react-router-dom";

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col bg-[#071A33] text-white">

          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
              🎓
            </div>

            <span className="text-xl font-bold tracking-wide">
              EduFlow
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-8">

            <Link
              to="/"
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">▦</span>
              Dashboard
            </Link>

            <Link
              to="/student/supervisor"
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">♙</span>
              Supervisor
            </Link>

            <Link
              to="/student/guidelines"
              className="flex w-full items-center gap-4 rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20"
            >
              <span className="text-lg">▣</span>
              Guidelines
            </Link>

            <Link
              to="/student/submissions"
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">⇧</span>
              Submissions
            </Link>

            <Link
              to="/student/notifications"
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">♧</span>
              Notifications
            </Link>

            <Link
              to="/student/profile"
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">♙</span>
              Profile
            </Link>

          </nav>

          {/* Logout */}
          <div className="border-t border-white/10 p-4">
            <button className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/10">
              <span>↪</span>
              Logout
            </button>
          </div>

        </aside>

        {/* Main */}
        <main className="ml-64 min-h-screen flex-1">

          {/* Header */}
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Student Portal
              </h1>

              <p className="text-xs text-slate-400">
                Review guidelines and requirements for each milestone
              </p>
            </div>

            <div className="flex items-center gap-5">

              <button className="relative text-xl text-slate-500">
                ♧
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500"></span>
              </button>

              <div className="flex items-center gap-3">

                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    Alex Johnson
                  </p>

                  <p className="text-xs text-slate-400">
                    Final Year Student
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                  AJ
                </div>

              </div>
            </div>
          </header>

          {/* Content */}
          <section className="p-8">

            {/* Title */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800">
                Guidelines
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the instructions and requirements published by your supervisor.
              </p>
            </div>

            {/* Search */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Thesis Guidelines
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Follow each milestone carefully before submitting your work.
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Search guidelines..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  />

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔍
                  </span>
                </div>

              </div>
            </div>

            {/* Guidelines Cards */}
            <div className="space-y-5">

              {/* Chapter 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  <div className="flex gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                      01
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-800">
                          Chapter 1: Introduction
                        </h3>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                          Completed
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Guidelines for preparing the introduction and defining the research problem.
                      </p>
                    </div>

                  </div>

                  <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-blue-600 hover:border-blue-400">
                    View Guidelines →
                  </button>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Requirements
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Problem Statement
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Word Count
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      1,500 - 2,000 words
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Supervisor
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Dr. Sarah Jenkins
                    </p>
                  </div>

                </div>

              </div>

              {/* Chapter 2 */}
              <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  <div className="flex gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-sm font-bold text-white">
                      02
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold text-slate-800">
                          Chapter 2: Literature Review
                        </h3>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-500">
                          Changes Requested
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Review recent research, identify gaps, and critically analyze existing literature.
                      </p>
                    </div>

                  </div>

                  <button className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600">
                    View Guidelines →
                  </button>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Requirements
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Critical Literature Analysis
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Word Count
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      2,500 - 3,500 words
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Due Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Oct 15
                    </p>
                  </div>

                </div>

              </div>

              {/* Chapter 3 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                  <div className="flex gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                      03
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold text-slate-800">
                          Chapter 3: Methodology
                        </h3>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Upcoming
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Define your research methods, data collection techniques, and analysis approach.
                      </p>
                    </div>

                  </div>

                  <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600">
                    View Guidelines →
                  </button>

                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Requirements
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Research Design
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Not Started
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Supervisor
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Dr. Sarah Jenkins
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default Guidelines;