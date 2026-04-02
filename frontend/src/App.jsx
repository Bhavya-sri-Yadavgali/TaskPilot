import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import API from "./services/api";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SkillManager from "./pages/SkillManager";
import StudyPlan from "./pages/StudyPlan";
import Progress from "./pages/Progress";
import FocusSession from "./pages/FocusSession";
import TodoList from "./pages/TodoList";

// 🔒 Protected Route
function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// 🚫 Prevent logged-in users from going back to login/register
function PublicRoute({ isAuthenticated, children }) {
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setIsVerifying(false);
        return;
      }

      try {
        // Verify token by fetching user profile
        await API.get("/auth/profile");
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Token verification failed:", err);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Verifying Access...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>

      {/* 🌐 Public Routes (No Sidebar) */}
      <Route
        path="/login"
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Register />
          </PublicRoute>
        }
      />


      {/* 🔐 Protected Routes (With Sidebar) */}
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
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
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

    </Routes>
  );
}

export default App;