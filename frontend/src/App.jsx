import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Chat from "./pages/Chat.jsx";
import Study from "./pages/Study.jsx";
import Code from "./pages/Code.jsx";
import Documents from "./pages/Documents.jsx";
import Search from "./pages/Search.jsx";
import Resume from "./pages/Resume.jsx";
import Reports from "./pages/Reports.jsx";
import Memory from "./pages/Memory.jsx";
import Settings from "./pages/Settings.jsx";
import Admin from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminUserDetails from "./pages/admin/AdminUserDetails.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading AI Smart Assistant...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:chatId" element={<Chat />} />
        <Route path="study" element={<Study />} />
        <Route path="code" element={<Code />} />
        <Route path="documents" element={<Navigate to="/chat" replace />} />
        <Route path="search" element={<Search />} />
        <Route path="resume" element={<Resume />} />
        <Route path="reports" element={<Reports />} />
        <Route path="memory" element={<Navigate to="/chat" replace />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminOnly><Admin /></AdminOnly>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetails />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
