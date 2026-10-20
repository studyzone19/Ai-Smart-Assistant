import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Shield, User as UserIcon, MessageSquare, Activity, Calendar } from "lucide-react";
import api from "../../services/api";

export default function AdminUserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        api.get(`/admin/users/${id}`),
        api.get(`/admin/users/${id}/chats?page=1&limit=10`)
      ]);
      setUser(uRes.data.user);
      setChats(cRes.data.chats);
      setChatTotalPages(cRes.data.pagination.pages);
      setChatPage(cRes.data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async (p) => {
    try {
      const { data } = await api.get(`/admin/users/${id}/chats?page=${p}&limit=10`);
      setChats(data.chats);
      setChatTotalPages(data.pagination.pages);
      setChatPage(data.pagination.page);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async () => {
    try {
      const { data } = await api.patch(`/admin/users/${id}`, { isActive: !user.isActive });
      setUser(prev => ({ ...prev, isActive: data.user.isActive }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const toggleRole = async () => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const { data } = await api.patch(`/admin/users/${id}`, { role: newRole });
      setUser(prev => ({ ...prev, role: data.user.role }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading user data...</div>;
  if (!user) return <div className="p-8 text-center text-red-400">User not found</div>;

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-2">
      <div className="flex items-center gap-3 shrink-0">
        <Link to="/admin/users" className="p-2 bg-surface2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">User Details</h3>
          <p className="text-sm text-slate-400">Manage account & view chat history.</p>
        </div>
      </div>

      <div className="bg-surface2/50 border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg" style={{ backgroundColor: user.avatarColor || '#3b82f6', color: '#fff' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                {user.name}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${
                  user.role === "admin" ? "border-amber-400/30 text-amber-400 bg-amber-400/10" : "border-slate-600 text-slate-400"
                }`}>
                  {user.role === "admin" ? <Shield size={10} /> : <UserIcon size={10} />}
                  {user.role}
                </span>
                {!user.isActive && (
                  <span className="text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                    Disabled
                  </span>
                )}
              </h4>
              <p className="text-sm text-slate-400 mt-1">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleRole}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors border border-white/10"
            >
              {user.role === "admin" ? "Demote to User" : "Promote to Admin"}
            </button>
            <button
              onClick={toggleStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                user.isActive
                  ? "text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
                  : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20"
              }`}
            >
              {user.isActive ? "Deactivate Account" : "Activate Account"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          <div>
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Joined</p>
            <p className="text-sm font-medium text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Language</p>
            <p className="text-sm font-medium text-slate-200 capitalize">{user.preferredLanguage}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MessageSquare size={12}/> Total Chats</p>
            <p className="text-sm font-medium text-slate-200">{user.totalChats}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity size={12}/> Total Messages</p>
            <p className="text-sm font-medium text-slate-200">{user.totalMessages}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-bold text-white">Chat History</h4>
        <p className="text-xs text-slate-400">Read-only access to user's chat logs.</p>
        
        {chats.length === 0 ? (
          <div className="p-8 bg-surface2/30 rounded-xl border border-white/5 text-center text-slate-500 text-sm">
            This user has no chats yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {chats.map(chat => (
              <AdminChatViewer key={chat._id} chat={chat} />
            ))}
          </div>
        )}

        {chatTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button disabled={chatPage === 1} onClick={() => fetchChats(chatPage - 1)} className="px-3 py-1.5 rounded bg-surface2 hover:bg-white/10 text-xs text-slate-300 disabled:opacity-50">Prev</button>
            <span className="text-xs text-slate-400">Page {chatPage} of {chatTotalPages}</span>
            <button disabled={chatPage === chatTotalPages} onClick={() => fetchChats(chatPage + 1)} className="px-3 py-1.5 rounded bg-surface2 hover:bg-white/10 text-xs text-slate-300 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminChatViewer({ chat }) {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const { data } = await api.get(`/admin/chats/${chat._id}`);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface2/50 border border-white/5 rounded-xl p-4 flex flex-col group transition-colors">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-slate-200 group-hover:text-white transition-colors">{chat.title}</h5>
            {chat.isDeletedByUser && (
              <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                Deleted by User
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
            <span className="uppercase tracking-wider font-semibold">{chat.mode}</span>
            <span>•</span>
            <span>{chat.msgCount} messages</span>
            <span>•</span>
            <span>{new Date(chat.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button
           className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors"
           onClick={loadMessages}
        >
          {open ? "Close Messages" : "View Messages"}
        </button>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
          {loading ? (
            <p className="text-xs text-slate-400">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-slate-400">No messages in this chat.</p>
          ) : (
            messages.map(m => (
              <div key={m._id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} w-full`}>
                <div className={`px-4 py-2 text-sm rounded-2xl max-w-[85%] ${m.role === "user" ? "bg-accent/20 text-accent" : "bg-surface border border-white/5 text-slate-300"}`}>
                  <p className="text-[10px] opacity-60 mb-1 uppercase font-bold">{m.role}</p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
