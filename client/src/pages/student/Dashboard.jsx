import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
      path: "/",
      active: true,
    },
    {
      name: "Supervisor",
      icon: "♙",
      path: "/student/supervisor",
    },
    {
      name: "Guidelines",
      icon: "▣",
      path: "/student/guidelines",
    },
    {
      name: "Submissions",
      icon: "⇧",
      path: "/student/submissions",
    },
    {
      name: "Notifications",
      icon: "♧",
      path: "/student/notifications",
    },
    {
      name: "Profile",
      icon: "♙",
      path: "/student/profile",
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
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                  item.active
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>

                {item.name}
              </Link>
            ))}
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
                Track your academic progress and feedback
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

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white">
                  AJ
                </div>

              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <section className="p-8">

            {/* Page Title */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800">
                Thesis Progression
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track your academic progress and feedback.
              </p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

              {/* Overall Progress */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Overall Progress
                </p>

                <div className="mt-5 flex items-center gap-5">

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[8px] border-blue-500">

                    <span className="text-lg font-bold text-slate-700">
                      69%
                    </span>

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-700">
                      Milestones achieved
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      4 of 6 completed
                    </p>

                  </div>

                </div>
              </div>

              {/* Current Milestone */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                  <p className="text-sm font-medium text-slate-500">
                    Current Milestone
                  </p>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-500">
                    Changes Requested
                  </span>

                </div>

                <h3 className="text-base font-bold text-slate-800">
                  Chapter 2: Literature Review
                </h3>

                <p className="mt-2 text-xs text-slate-400">
                  Due: Oct 15
                </p>

                <button className="mt-5 text-xs font-semibold text-blue-600 hover:underline">
                  View Details →
                </button>

              </div>

              {/* Pending Review */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Pending Review
                </p>

                <div className="mt-5 flex items-end gap-3">

                  <span className="text-4xl font-bold text-slate-800">
                    2
                  </span>

                  <span className="pb-1 text-xs text-slate-400">
                    submissions
                  </span>

                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Waiting for supervisor review
                </p>

              </div>

              {/* Approved */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Approved
                </p>

                <div className="mt-5 flex items-end gap-3">

                  <span className="text-4xl font-bold text-slate-800">
                    3
                  </span>

                  <span className="pb-1 text-xs text-slate-400">
                    milestones
                  </span>

                </div>

                <p className="mt-3 text-xs text-green-500">
                  ✓ Completed successfully
                </p>

              </div>

            </div>

            {/* Bottom Section */}
            <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-3">

              {/* Recent Feedback */}
              <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                  <div>

                    <h3 className="text-base font-bold text-slate-800">
                      Recent Feedback
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Latest comments from your supervisor
                    </p>

                  </div>

                  <button className="text-xs font-semibold text-blue-600">
                    View All
                  </button>

                </div>

                <div className="space-y-4">

                  {/* Feedback 1 */}
                  <div className="flex gap-4 rounded-xl border border-slate-100 p-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      SJ
                    </div>

                    <div className="flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-sm font-semibold text-slate-700">
                            Dr. Sarah Jenkins
                          </p>

                          <p className="text-xs text-slate-400">
                            Chapter 2: Literature Review
                          </p>

                        </div>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-500">
                          Changes Requested
                        </span>

                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        "Integrate recent findings on AI ethics in
                        academic publishing. The synthesis is strong,
                        but please expand the methodology critique."
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Oct 15, 2023
                      </p>

                    </div>
                  </div>

                  {/* Feedback 2 */}
                  <div className="flex gap-4 rounded-xl border border-slate-100 p-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                      SJ
                    </div>

                    <div className="flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-sm font-semibold text-slate-700">
                            Dr. Sarah Jenkins
                          </p>

                          <p className="text-xs text-slate-400">
                            Chapter 1: Final
                          </p>

                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                          Approved
                        </span>

                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        "Excellent clarity in the problem statement.
                        Approved to proceed."
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Sep 28, 2023
                      </p>

                    </div>
                  </div>

                </div>
              </div>

              {/* My Submissions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                  <div>

                    <h3 className="text-base font-bold text-slate-800">
                      My Submissions
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Recent milestone work
                    </p>

                  </div>

                  <button className="text-xs font-semibold text-blue-600">
                    View All
                  </button>

                </div>

                <div className="space-y-4">

                  <div className="rounded-xl border border-slate-100 p-4">

                    <div className="flex items-center justify-between">

                      <p className="text-sm font-semibold text-slate-700">
                        Chapter 2
                      </p>

                      <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-500">
                        Changes
                      </span>

                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Submitted Oct 10
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-100 p-4">

                    <div className="flex items-center justify-between">

                      <p className="text-sm font-semibold text-slate-700">
                        Chapter 1
                      </p>

                      <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-600">
                        Approved
                      </span>

                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Submitted Sep 28
                    </p>

                  </div>

                </div>

                {/* Quick Actions */}
                <div className="mt-6">

                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Quick Actions
                  </h3>

                  <div className="grid grid-cols-2 gap-3">

                    <Link
                      to="/student/supervisor"
                      className="rounded-xl border border-slate-200 p-3 text-center text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600"
                    >
                      👨‍🏫
                      <br />
                      View Supervisor
                    </Link>

                    <Link
                      to="/student/guidelines"
                      className="rounded-xl border border-slate-200 p-3 text-center text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600"
                    >
                      📚
                      <br />
                      View Guidelines
                    </Link>

                    <Link
                      to="/student/submissions"
                      className="rounded-xl bg-blue-500 p-3 text-center text-xs font-medium text-white hover:bg-blue-600"
                    >
                      ↑
                      <br />
                      Submit Work
                    </Link>

                    <Link
                      to="/student/submissions"
                      className="rounded-xl border border-slate-200 p-3 text-center text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600"
                    >
                      📈
                      <br />
                      View Progress
                    </Link>

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

export default Dashboard;