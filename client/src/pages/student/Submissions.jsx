import React from "react";
import { Link } from "react-router-dom";

const Submissions = () => {
  const submissions = [
    {
      chapter: "Chapter 2: Literature Review",
      version: "Version 2",
      date: "Oct 10, 2023",
      status: "Changes Requested",
      statusColor: "red",
      feedback:
        "Please expand the methodology critique and integrate recent findings on AI ethics.",
      file: "Chapter-2-Literature-Review.pdf",
    },
    {
      chapter: "Chapter 1: Introduction",
      version: "Version 1",
      date: "Sep 28, 2023",
      status: "Approved",
      statusColor: "green",
      feedback:
        "Excellent clarity in the problem statement. Approved to proceed.",
      file: "Chapter-1-Introduction.pdf",
    },
  ];

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
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">▣</span>
              Guidelines
            </Link>

            <Link
              to="/student/submissions"
              className="flex w-full items-center gap-4 rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20"
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

        {/* Main Content */}
        <main className="ml-64 min-h-screen flex-1">

          {/* Header */}
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                Student Portal
              </h1>

              <p className="text-xs text-slate-400">
                Manage your milestone submissions
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
            <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  My Submissions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Track your submitted work, feedback, and review status.
                </p>
              </div>

              <button className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600">
                + Submit New Work
              </button>

            </div>

            {/* Summary Cards */}
            <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total Submissions
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-800">
                  2
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Approved
                </p>

                <p className="mt-3 text-3xl font-bold text-green-600">
                  1
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Changes Requested
                </p>

                <p className="mt-3 text-3xl font-bold text-red-500">
                  1
                </p>
              </div>

            </div>

            {/* Submission List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  Submission History
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Your latest milestone submissions and supervisor feedback.
                </p>
              </div>

              <div className="space-y-5">

                {submissions.map((submission, index) => (

                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm"
                  >

                    {/* Top */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div className="flex gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                          📄
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-800">
                            {submission.chapter}
                          </h4>

                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                            <span>{submission.version}</span>
                            <span>•</span>
                            <span>Submitted {submission.date}</span>
                          </div>
                        </div>

                      </div>

                      {/* Status */}
                      {submission.statusColor === "green" ? (
                        <span className="w-fit rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-600">
                          ✓ Approved
                        </span>
                      ) : (
                        <span className="w-fit rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-500">
                          Changes Requested
                        </span>
                      )}

                    </div>

                    {/* File */}
                    <div className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-3">
                        <span className="text-xl">📎</span>

                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {submission.file}
                          </p>

                          <p className="text-xs text-slate-400">
                            PDF Document
                          </p>
                        </div>
                      </div>

                      <button className="text-xs font-semibold text-blue-600 hover:underline">
                        View File →
                      </button>

                    </div>

                    {/* Feedback */}
                    <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          SJ
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Dr. Sarah Jenkins
                          </p>

                          <p className="text-xs text-slate-400">
                            Supervisor Feedback
                          </p>
                        </div>

                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {submission.feedback}
                      </p>

                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap gap-3">

                      <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600">
                        View Details
                      </button>

                      {submission.status === "Changes Requested" && (
                        <button className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600">
                          Resubmit Work
                        </button>
                      )}

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default Submissions;