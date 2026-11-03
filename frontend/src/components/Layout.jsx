import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  MessageSquare, GraduationCap, Code2, FileText,
  FileEdit, ClipboardList, Brain, Settings, ShieldCheck, LogOut,
  Menu, X, SquarePen, Trash2, Plus
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const toolItems = [
  { to: "/study",   label: "Learn",   icon: GraduationCap },
  { to: "/code",    label: "Code",    icon: Code2 },
  { to: "/resume",  label: "Resume",  icon: FileEdit },
  { to: "/reports", label: "Reports", icon: ClipboardList },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  // Start every app session in White mode; the Settings toggle can still switch themes live.
  const [theme, setTheme] = useState("light");

  const isChat = location.pathname.startsWith("/chat");
  const activeChatId = isChat ? location.pathname.split("/chat/")[1] : null;

  const handleLogout = () => { logout(); navigate("/login"); };
  const closeMenu = () => setMobileMenuOpen(false);
  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("ai_assistant_theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f1f5f9" : "#0b1220");
  }, [theme]);

  // Fetch chat history for sidebar
  const loadChats = useCallback(async () => {
    try {
      const { data } = await api.get("/chats");
      setChats(data.chats || []);
    } catch {
      setChats([]);
    }
  }, []);

  useEffect(() => {
    if (user) loadChats();
  }, [user, loadChats, location.pathname]); // reload when route changes (new chat created)

  const handleNewChat = async () => {
    try {
      const { data } = await api.post("/chats", { title: "New Chat", mode: "chat" });
      setChats((prev) => [data.chat, ...prev]);
      navigate(`/chat/${data.chat._id}`);
      closeMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.delete(`/chats/${id}`);
      setChats((prev) => prev.filter((c) => c._id !== id));
      if (activeChatId === id) navigate("/chat");
    } catch (err) {
      console.error(err);
    }
  };

  // ── Sidebar content (shared between desktop and mobile drawer) ──
  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 shrink-0">
        <span className="font-semibold text-sm tracking-tight text-white">AI Smart Assistant</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="New chat"
          >
            <SquarePen size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={17} />
            </button>
          )}
          {!onClose && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Collapse"
            >
              <Menu size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── CHAT HISTORY section ── */}
        <div className="px-2 pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
            Chat History
          </p>

          {chats.length === 0 ? (
            <p className="text-xs text-slate-600 px-2 py-2">No chats yet.</p>
          ) : (
            <div className="space-y-0.5">
              {chats.map((c) => (
                <div
                  key={c._id}
                  onClick={() => { navigate(`/chat/${c._id}`); onClose?.(); }}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
                    activeChatId === c._id
                      ? "bg-teal-400/10 text-teal-200 ring-1 ring-inset ring-teal-300/15"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                  }`}
                >
                  <MessageSquare size={13} className="shrink-0 opacity-50" />
                  <span className="flex-1 truncate text-sm">{c.title || "New Chat"}</span>
                  <button
                    onClick={(e) => handleDeleteChat(c._id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-0.5 rounded"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── TOOLS section ── */}
        <div className="px-2 pt-3 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1.5">
            Tools
          </p>
          <div className="space-y-0.5">
            {toolItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-teal-400/10 text-teal-200 ring-1 ring-inset ring-teal-300/15"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"}`
                }
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${isActive ? "bg-teal-400/10 text-teal-200 ring-1 ring-inset ring-teal-300/15" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"}`
                }
              >
                <ShieldCheck size={16} className="shrink-0 text-amber-400" />
                Admin
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Footer — Settings + User */}
      <div className="px-2 pb-3 pt-2 border-t border-white/5 space-y-0.5 shrink-0">
        <NavLink
          to="/settings"
          onClick={() => onClose?.()}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors
            ${isActive ? "bg-teal-400/10 text-teal-200 ring-1 ring-inset ring-teal-300/15" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"}`
          }
        >
          <Settings size={16} className="shrink-0" />
          Settings
        </NavLink>

        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          onClick={() => { navigate("/settings"); onClose?.(); }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ background: user?.avatarColor || "#8b5cf6" }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex bg-bg overflow-hidden text-slate-100">

      {/* ─── DESKTOP SIDEBAR ─── */}
      {sidebarOpen && (
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface border-r border-border/60 select-none">
          <SidebarContent onClose={null} />
        </aside>
      )}

      {/* Desktop sidebar collapsed — just a toggle button */}
      {!sidebarOpen && (
        <div className="hidden md:flex flex-col items-center pt-3 px-2 w-[52px] bg-surface border-r border-border/60 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Expand sidebar"
          >
            <Menu size={18} />
          </button>
        </div>
      )}

      {/* ─── MOBILE TOP BAR (non-chat pages only) ─── */}
      {!isChat && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 bg-surface/95 backdrop-blur-xl border-b border-border/60">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-white">AI Assistant</span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: user?.avatarColor || "#8b5cf6" }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </header>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className={`flex-1 min-w-0 flex flex-col overflow-hidden ${!isChat ? "pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0" : ""}`}>
        <Outlet context={{ openMobileMenu: () => setMobileMenuOpen(true), reloadChats: loadChats, theme, toggleTheme }} />
      </main>

      {/* ─── MOBILE DRAWER ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={closeMenu} />
          <div className="relative w-72 max-w-[85vw] bg-surface h-full flex flex-col z-10 overflow-hidden">
            <SidebarContent onClose={closeMenu} />
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAV (non-chat pages) ─── */}
      {!isChat && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around
          bg-surface/95 backdrop-blur-xl border-t border-border/60 px-1 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
          <NavLink to="/chat" className={({ isActive }) =>
            `flex flex-col items-center flex-1 py-1.5 text-[10px] gap-0.5 transition-colors
            ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <MessageSquare size={19} />
            <span>Chat</span>
          </NavLink>
          <NavLink to="/study" className={({ isActive }) =>
            `flex flex-col items-center flex-1 py-1.5 text-[10px] gap-0.5 transition-colors
            ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <GraduationCap size={19} />
            <span>Learn</span>
          </NavLink>
          <NavLink to="/code" className={({ isActive }) =>
            `flex flex-col items-center flex-1 py-1.5 text-[10px] gap-0.5 transition-colors
            ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <Code2 size={19} />
            <span>Code</span>
          </NavLink>
          <NavLink to="/resume" className={({ isActive }) =>
            `flex flex-col items-center flex-1 py-1.5 text-[10px] gap-0.5 transition-colors
            ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>
            <FileEdit size={19} />
            <span>Resume</span>
          </NavLink>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center flex-1 py-1.5 text-[10px] gap-0.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Menu size={19} />
            <span>More</span>
          </button>
        </nav>
      )}
    </div>
  );
}
