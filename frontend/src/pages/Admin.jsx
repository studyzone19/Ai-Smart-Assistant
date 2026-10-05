import { useEffect, useState } from "react";
import { ShieldCheck, Users, MessageSquare, FileText, Activity, Check, X } from "lucide-react";
import api from "../services/api";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data.stats)).catch(console.error);
    api.get("/admin/users").then(({ data }) => setUsers(data.users)).catch(console.error);
  }, []);

  const toggleActive = async (u) => {
    try {
      const { data } = await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? data.user : x)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      const { data } = await api.patch(`/admin/users/${u._id}`, { role: newRole });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? data.user : x)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const cards = stats
    ? [
        { label: "Total Users", value: stats.userCount, icon: Users },
        { label: "Total Chats", value: stats.chatCount, icon: MessageSquare },
        { label: "Total Messages", value: stats.messageCount, icon: Activity },
        { label: "Documents", value: stats.documentCount, icon: FileText },
      ]
    : [];

  return (
    <div className="flex-1 glass rounded-2xl p-4 sm:p-6 overflow-y-auto min-h-0 border border-border space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <ShieldCheck size={20} className="text-amber-400" />
        <div>
          <h2 className="font-semibold text-sm sm:text-base text-white">Administrator Control Panel</h2>
          <p className="text-[11px] text-slate-400">System analytics, users, and security settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["overview", "users"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-4 py-1.5 rounded-xl border font-medium capitalize transition-all ${
              tab === t
                ? "bg-accent/25 border-accent/60 text-white shadow-sm"
                : "border-border text-slate-400 hover:bg-white/5"
            }`}
          >
            {t === "overview" ? "Analytics Overview" : `User Accounts (${users.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-surface2/60 border border-border rounded-xl p-3.5 sm:p-4">
                <Icon size={18} className="text-accent mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {stats && (
            <div className="bg-surface2/60 border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI Service Activity by Endpoint
              </p>
              <div className="space-y-2">
                {stats.usageByAction?.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 text-xs">
                    <span className="w-24 sm:w-28 text-slate-300 font-medium capitalize truncate">
                      {u._id}
                    </span>
                    <div className="flex-1 bg-surface rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent2 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(10, u.count * 8))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-400 font-mono">{u.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2.5">
          {users.map((u) => (
            <div
              key={u._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface2/60 border border-border rounded-xl p-3.5 sm:px-4 sm:py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-xs sm:text-sm text-white truncate">{u.name}</p>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                      u.role === "admin"
                        ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                        : "border-slate-600 text-slate-400"
                    }`}
                  >
                    {u.role}
                  </span>
                  {!u.isActive && (
                    <span className="text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.2 rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-white/5 self-end sm:self-auto">
                <button
                  onClick={() => toggleRole(u)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-accent font-medium transition-colors"
                >
                  {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    u.isActive
                      ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                      : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  }`}
                >
                  {u.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
