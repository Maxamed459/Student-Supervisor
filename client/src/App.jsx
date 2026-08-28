import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/student/Dashboard";
import Supervisor from "./pages/student/Supervisor";
import Guidelines from "./pages/student/Guidelines";
import Submissions from "./pages/student/Submissions";
import Notifications from "./pages/student/Notifications";
import Profile from "./pages/student/Profile";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route
          path="/student/supervisor"
          element={<Supervisor />}
        />

        <Route
          path="/student/guidelines"
          element={<Guidelines />}
        />

        <Route
          path="/student/submissions"
          element={<Submissions />}
        />

        <Route
          path="/student/notifications"
          element={<Notifications />}
        />

        <Route
          path="/student/profile"
          element={<Profile />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;