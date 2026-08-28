import React from "react";

const Supervisor = () => {
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

            <button className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-white/10">
              <span>▦</span>
              Dashboard
            </button>

            <button className="flex w-full items-center gap-4 rounded-lg bg-blue-500 px-4 py-3 text-left text-sm font-medium text-white shadow-lg shadow-blue-500/20">
              <span>♙</span>
              Supervisor
            </button>

            <button className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-white/10">
              <span>▣</span>
              Guidelines
            </button>

            <button className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-white/10">
              <span>⇧</span>
              Submissions
            </button>

            <button className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-white/10">
              <span>♧</span>
              Notifications
            </button>

            <button className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-white/10">
              <span>♙</span>
              Profile
            </button>

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
                View your assigned supervisor's profile and contact information.
              </p>
            </div>

            <div className="flex items-center gap-5">

              {/* Notification */}
              <button className="relative text-xl text-slate-500">
                ♧
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500"></span>
              </button>

              {/* Student */}
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

          {/* Page */}
          <section className="p-8">

            {/* Title */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800">
                My Supervisor
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View your assigned supervisor's profile and contact information.
              </p>
            </div>

            {/* Supervisor Profile */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">

              {/* Top Profile */}
              <div className="flex flex-col gap-6 lg:flex-row">

                {/* Profile Image */}
                <div className="flex justify-center lg:w-64">
                  <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">

                    {/* Temporary image placeholder */}
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-6xl">
                      👩‍🏫
                    </div>

                  </div>
                </div>

                {/* Basic Information */}
                <div className="flex-1">

                  <div className="flex flex-col justify-between gap-4 md:flex-row">

                    <div>
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                        ASSIGNED SUPERVISOR
                      </span>

                      <h3 className="mt-3 text-2xl font-bold text-slate-800">
                        Dr. Sarah Jenkins
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Thesis Supervisor
                      </p>
                    </div>

                  </div>

                  {/* Contact Cards */}
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          📍
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Office Location
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            Science Building
                          </p>

                          <p className="text-xs text-slate-400">
                            Room 402
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          🕐
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Consultation Hours
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            Mon & Wed
                          </p>

                          <p className="text-xs text-slate-400">
                            2:00 PM - 4:00 PM
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* Divider */}
              <div className="my-8 border-t border-slate-200"></div>

              {/* Academic Background */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Academic Background
                  </h3>

                  <ul className="mt-4 space-y-3">

                    <li className="flex gap-3 text-sm text-slate-600">
                      <span className="text-blue-500">•</span>
                      <span>Ph.D. in Computer Science</span>
                    </li>

                    <li className="flex gap-3 text-sm text-slate-600">
                      <span className="text-blue-500">•</span>
                      <span>M.Sc. in Artificial Intelligence</span>
                    </li>

                    <li className="flex gap-3 text-sm text-slate-600">
                      <span className="text-blue-500">•</span>
                      <span>8+ years of academic research experience</span>
                    </li>

                  </ul>
                </div>

                {/* Research Areas */}
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Research Areas
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600">
                      AI Ethics
                    </span>

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600">
                      Human-Computer Interaction
                    </span>

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600">
                      Machine Learning
                    </span>

                  </div>
                </div>

              </div>

              {/* Quick Contact */}
              <div className="mt-8 rounded-xl bg-slate-50 p-5">

                <h3 className="text-base font-bold text-slate-800">
                  Quick Contact
                </h3>

                <div className="mt-4 flex flex-col gap-4 md:flex-row">

                  <a
                    href="mailto:s.jenkins@university.edu"
                    className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-sm hover:text-blue-600"
                  >
                    <span className="text-blue-500">✉</span>
                    s.jenkins@university.edu
                  </a>

                  <a
                    href="tel:+1234567890"
                    className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-sm hover:text-blue-600"
                  >
                    <span className="text-blue-500">☎</span>
                    +1 234 567 890
                  </a>

                </div>

              </div>

            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default Supervisor;