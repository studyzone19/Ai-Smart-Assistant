import { useEffect, useState } from "react";
import { Users, MessageSquare, Activity, UserPlus, Zap } from "lucide-react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then(({ data }) => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-400 text-sm">Failed to load dashboard.</div>;

  const cards = [
    { label: "Total Users", value: stats.userCount, icon: Users, color: "text-blue-400" },
    { label: "Total Chats", value: stats.chatCount, icon: MessageSquare, color: "text-emerald-400" },
    { label: "Total Messages", value: stats.messageCount, icon: Activity, color: "text-purple-400" },
    { label: "New Users Today", value: stats.newUsersToday, icon: UserPlus, color: "text-amber-400" },
    { label: "Active Users", value: stats.activeUsers, icon: Zap, color: "text-teal-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Platform Overview</h3>
        <p className="text-sm text-slate-400">High level metrics across the system.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface2/60 border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-colors">
            <Icon size={24} className={`${color} mb-3`} />
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs font-medium text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
