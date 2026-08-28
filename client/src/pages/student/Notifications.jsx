import React from "react";
import { Link } from "react-router-dom";

const Notifications = () => {
  const notifications = [
    {
      icon: "✓",
      title: "Submission Approved",
      message:
        "Your Chapter 1 submission has been approved by Dr. Sarah Jenkins.",
      time: "2 hours ago",
      type: "success",
      unread: true,
    },
    {
      icon: "!",
      title: "Changes Requested",
      message:
        "Your Chapter 2 submission requires some changes. Please review the supervisor feedback.",
      time: "Yesterday",
      type: "warning",
      unread: true,
    },
    {
      icon: "📚",
      title: "New Guideline Published",
      message:
        "A new guideline for Chapter 3: Methodology has been published by your supervisor.",
      time: "2 days ago",
      type: "info",
      unread: false,
    },
    {
      icon: "↑",
      title: "Submission Received",
      message:
        "Your Chapter 2 submission has been successfully submitted and is waiting for review.",
      time: "3 days ago",
      type: "info",
      unread: false,
    },
    {
      icon: "👨‍🏫",
      title: "Supervisor Assigned",
      message:
        "Dr. Sarah Jenkins has been assigned as your project supervisor.",
      time: "1 week ago",
      type: "info",
      unread: false,
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
              className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <span className="text-lg">⇧</span>
              Submissions
            </Link>

            <Link
              to="/student/notifications"
              className="flex w-full items-center gap-4 rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20"
            >
              <span className="text-lg">♧</span>
              Notifications

              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-blue-600">
                2
              </span>
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
                Stay updated with your project activities
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
                  Notifications
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View updates and important messages about your project.
                </p>
              </div>

              <button className="text-sm font-semibold text-blue-600 hover:underline">
                Mark all as read
              </button>

            </div>

            {/* Summary */}
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  All Notifications
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-800">
                  5
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Unread
                </p>

                <p className="mt-3 text-3xl font-bold text-blue-600">
                  2
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Recent Updates
                </p>

                <p className="mt-3 text-3xl font-bold text-green-600">
                  3
                </p>
              </div>

            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  Recent Notifications
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Your latest project and supervisor updates.
                </p>
              </div>

              <div className="space-y-3">

                {notifications.map((notification, index) => (

                  <div
                    key={index}
                    className={`flex gap-4 rounded-xl border p-4 transition hover:shadow-sm ${
                      notification.unread
                        ? "border-blue-100 bg-blue-50/40"
                        : "border-slate-100 bg-white"
                    }`}
                  >

                    {/* Icon */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        notification.type === "success"
                          ? "bg-green-100 text-green-600"
                          : notification.type === "warning"
                          ? "bg-red-100 text-red-500"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {notification.icon}
                    </div>

                    {/* Message */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2">

                          <h4 className="text-sm font-bold text-slate-700">
                            {notification.title}
                          </h4>

                          {notification.unread && (
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          )}

                        </div>

                        <span className="text-xs text-slate-400">
                          {notification.time}
                        </span>

                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {notification.message}
                      </p>

                      {/* Action */}
                      <button className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                        View Details →
                      </button>

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

export default Notifications;