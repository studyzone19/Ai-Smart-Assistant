import { ShieldCheck, LayoutDashboard, Users, BarChart3, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navs = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg text-slate-100 p-2 sm:p-4 overflow-hidden">
      <div className="flex items-center gap-2 pb-4 border-b border-white/5 mb-4 px-2">
        <ShieldCheck size={24} className="text-amber-400" />
        <div>
          <h2 className="font-semibold text-lg text-white leading-tight">Admin Dashboard</h2>
          <p className="text-[11px] sm:text-xs text-slate-400">Manage platform users & analytics</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
        {/* Sidebar Nav */}
        <div className="lg:w-56 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0">
          {navs.map((n) => (
            <NavLink
              key={n.name}
              to={n.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`
              }
            >
              <n.icon size={18} />
              {n.name}
            </NavLink>
          ))}
          <div className="lg:mt-auto pt-2 lg:border-t border-white/5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface border border-border rounded-2xl p-4 sm:p-6 overflow-y-auto min-h-0 shadow-sm relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
