import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SkillManager from "./pages/SkillManager";
import StudyPlan from "./pages/StudyPlan";
import Progress from "./pages/Progress";
import FocusSession from "./pages/FocusSession";
import TodoList from "./pages/TodoList";
import VerifyPage from "./pages/VerifyPage";

// 🔐 Check if user is logged in
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// 🔒 Protected Route
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

// 🚫 Prevent logged-in users from going back to login/register
function PublicRoute({ children }) {
  return !isAuthenticated() ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>

      {/* 🌐 Public Routes (No Sidebar) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route path="/verify/:token" element={<VerifyPage />} />

      {/* 🔐 Protected Routes (With Sidebar) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="skills" element={<SkillManager />} />
        <Route path="studyplan" element={<StudyPlan />} />
        <Route path="progress" element={<Progress />} />
        <Route path="focus" element={<FocusSession />} />
        <Route path="todos" element={<TodoList />} />
      </Route>

      {/* ❌ Fallback Route */}
      <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />

    </Routes>
  );
}

export default App;