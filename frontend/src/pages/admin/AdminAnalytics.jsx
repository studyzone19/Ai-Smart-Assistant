import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics")
      .then(res => setData(res.data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm">Loading analytics...</div>;
  if (!data) return <div className="text-red-400 text-sm">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">System Analytics</h3>
        <p className="text-sm text-slate-400">Activity and usage trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New Users Trend */}
        <div className="bg-surface2/40 border border-border rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">New Users (Last 7 Days)</h4>
          <div className="space-y-3">
            {data.newUsersRecent?.length === 0 ? (
              <p className="text-xs text-slate-500">No new users in the last 7 days.</p>
            ) : (
              data.newUsersRecent?.map((item) => (
                <div key={item._id} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-slate-400">{item._id}</span>
                  <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, item.count * 10)}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-slate-300">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chats Trend */}
        <div className="bg-surface2/40 border border-border rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">New Chats (Last 7 Days)</h4>
          <div className="space-y-3">
            {data.chatsRecent?.length === 0 ? (
              <p className="text-xs text-slate-500">No new chats in the last 7 days.</p>
            ) : (
              data.chatsRecent?.map((item) => (
                <div key={item._id} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-slate-400">{item._id}</span>
                  <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, item.count * 2)}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium text-slate-300">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
