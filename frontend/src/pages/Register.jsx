import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Bot, Zap, BookOpen, Code2, Download, Smartphone, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  { icon: Bot,      label: "AI Chat",      desc: "Smart conversations" },
  { icon: BookOpen, label: "Study Mode",   desc: "Notes & MCQs"        },
  { icon: Code2,    label: "Code Helper",  desc: "Debug & generate"    },
  { icon: Zap,      label: "Web Search",   desc: "Live internet AI"    },
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert("📲 To install this app on your phone:\n\n1. Tap the 3 dots (⋮) in Chrome or 'Share' in Safari\n2. Select 'Install app' or 'Add to Home screen'\n\nIt will install directly like an Android app!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-slate-50 overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-white p-12 relative overflow-hidden border-r border-slate-200 shadow-sm">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20 text-[#ffffff]">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base leading-tight">AI Smart Assistant</p>
            <p className="text-[11px] text-slate-500">Ask · Learn · Code · Create</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold text-slate-800 leading-tight">
            Start Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">
              AI Journey Today
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-sm leading-relaxed">
            Join thousands of students and developers using AI to learn faster and build smarter.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-slate-700 text-xs font-semibold">{label}</p>
                  <p className="text-slate-500 text-[10px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <p className="text-slate-400 text-xs">© 2026 AI Smart Assistant — Built by Ram Prajapati</p>
          <button
            type="button"
            onClick={handleInstallApp}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-600 transition-colors"
          >
            <Smartphone size={14} />
            <span>Install Web App</span>
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-10 relative overflow-y-auto">

        <div className="w-full max-w-[400px] relative z-10">

          {/* Logo — centered inside right panel */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20 text-[#ffffff]">
              <Sparkles size={22} />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 text-lg">AI Smart Assistant</p>
              <p className="text-xs text-slate-500 mt-0.5">Ask · Learn · Code · Create</p>
            </div>
          </div>

          {/* Heading — Centered */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Create account</h2>
            <p className="text-slate-500 text-sm">Free forever — no credit card required</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 block text-left">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  required
                  maxLength={80}
                  placeholder="Ram Prajapati"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none text-slate-800 placeholder-slate-400 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 block text-left">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none text-slate-800 placeholder-slate-400 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 block text-left">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  maxLength={72}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none text-slate-800 placeholder-slate-400 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-[#ffffff] rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 active:scale-[0.99] transition-all"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account…</>
              ) : (
                <><span>Create Account</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          {/* ── PW Style App Download / Install Card ── */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-violet-300 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-violet-500/20">
                  <Smartphone size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate flex items-center gap-1.5">
                    RamAI Mobile App
                    <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full">Free</span>
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">Install on Android & iPhone</p>
                </div>
              </div>

              {isInstalled ? (
                <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-semibold w-full sm:w-auto bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={15} /> Installed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 shadow-md shadow-violet-500/25 transition-all active:scale-95 cursor-pointer"
                  style={{ color: "#ffffff", background: "linear-gradient(to right, #7c3aed, #06b6d4)" }}
                >
                  <Download size={14} className="text-white" />
                  <span className="text-white font-bold" style={{ color: "#ffffff" }}>Download App</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
