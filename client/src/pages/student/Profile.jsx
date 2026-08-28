import React from "react";
import { Link } from "react-router-dom";

const Profile = () => {
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

              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                2
              </span>
            </Link>

            <Link
              to="/student/profile"
              className="flex w-full items-center gap-4 rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20"
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
                Manage your personal information and account settings
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

          {/* Profile Content */}
          <section className="p-8">

            {/* Page Title */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800">
                My Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your personal information.
              </p>
            </div>

            {/* Profile Header Card */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-5">

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
                    AJ
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Alex Johnson
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Final Year Student
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Student ID: STU-2023-001
                    </p>
                  </div>

                </div>

                <button className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600">
                  Edit Profile
                </button>

              </div>

            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

              {/* Personal Information */}
              <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-800">
                    Personal Information
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Your basic student information.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Full Name
                    </label>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Alex Johnson
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Email Address
                    </label>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      alex.johnson@example.com
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Phone Number
                    </label>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      +252 63 0000000
                    </div>
                  </div>

                  {/* Student ID */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Student ID
                    </label>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      STU-2023-001
                    </div>
                  </div>

                  {/* Program */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Program
                    </label>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Computer Science
                    </div>
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Academic Year
                    </label>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      Final Year
                    </div>
                  </div>

                </div>

              </div>

              {/* Account Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <h3 className="text-base font-bold text-slate-800">
                  Account Status
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Your current account information.
                </p>

                <div className="mt-6 space-y-5">

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Account
                    </span>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                      Active
                    </span>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Role
                    </span>

                    <span className="text-sm font-semibold text-slate-700">
                      Student
                    </span>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Group
                    </span>

                    <span className="text-sm font-semibold text-slate-700">
                      Batch 2023
                    </span>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Supervisor
                    </span>

                    <span className="text-sm font-semibold text-slate-700">
                      Dr. Sarah Jenkins
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Academic Information */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  Academic Information
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Information related to your academic project.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-medium text-slate-400">
                    Project
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Student Supervisor System
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-medium text-slate-400">
                    Progress
                  </p>

                  <p className="mt-2 text-sm font-bold text-blue-600">
                    69% Complete
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-medium text-slate-400">
                    Completed Milestones
                  </p>

                  <p className="mt-2 text-sm font-bold text-green-600">
                    4 of 6
                  </p>
                </div>

              </div>

            </div>

            {/* Account Settings */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  Account Settings
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Manage your account preferences.
                </p>
              </div>

              <div className="space-y-4">

                <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50/30">

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Change Password
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Update your account password.
                    </p>
                  </div>

                  <span className="text-blue-600">
                    →
                  </span>

                </button>

                <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50/30">

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Email Notifications
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Manage your notification preferences.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                    Enabled
                  </span>

                </button>

              </div>

            </div>

          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;