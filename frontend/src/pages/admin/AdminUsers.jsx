import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MoreHorizontal, Shield, User as UserIcon } from "lucide-react";
import api from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?page=${p}&limit=10&search=${s}`);
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, "");
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">User Management</h3>
          <p className="text-sm text-slate-400">View and manage registered accounts.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface2 border border-border focus:border-accent rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        </form>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-white/5">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface2 text-slate-400 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Chats</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: u.avatarColor || '#3b82f6', color: '#fff' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${
                      u.role === "admin" ? "border-amber-400/30 text-amber-400 bg-amber-400/10" : "border-slate-600 text-slate-400"
                    }`}>
                      {u.role === "admin" ? <Shield size={10} /> : <UserIcon size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="text-emerald-400 text-xs">Active</span>
                    ) : (
                      <span className="text-red-400 text-xs">Disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.totalChats}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/users/${u._id}`}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 shrink-0">
          <button
            disabled={page === 1}
            onClick={() => fetchUsers(page - 1)}
            className="px-3 py-1.5 rounded bg-surface2 hover:bg-white/10 text-xs text-slate-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => fetchUsers(page + 1)}
            className="px-3 py-1.5 rounded bg-surface2 hover:bg-white/10 text-xs text-slate-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
