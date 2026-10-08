import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowRight, Bot, Zap, BookOpen, Code2 } from "lucide-react";
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
  const { register } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-[100dvh] flex bg-[#0f0f0f] overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-gradient-to-br from-[#0d1117] via-[#111827] to-[#0d1117] p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">AI Smart Assistant</p>
            <p className="text-[11px] text-slate-500">Ask · Learn · Code · Create</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Start Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              AI Journey Today
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            Join thousands of students and developers using AI to learn faster and build smarter.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-violet-300" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-slate-500 text-[10px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">© 2026 AI Smart Assistant — Built by Ram Prajapati</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-10 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />

        <div className="w-full max-w-[400px] relative z-10">

          {/* Logo — centered inside right panel */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-lg">AI Smart Assistant</p>
              <p className="text-xs text-slate-500 mt-0.5">Ask · Learn · Code · Create</p>
            </div>
          </div>

          {/* Heading — Centered */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create account</h2>
            <p className="text-slate-400 text-sm">Free forever — no credit card required</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block text-left">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  required
                  maxLength={80}
                  placeholder="Ram Prajapati"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-violet-500/60 focus:bg-violet-500/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none text-white placeholder-slate-600 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block text-left">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-violet-500/60 focus:bg-violet-500/5 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none text-white placeholder-slate-600 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 block text-left">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  maxLength={72}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-violet-500/60 focus:bg-violet-500/5 rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none text-white placeholder-slate-600 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 active:scale-[0.99] transition-all duration-200"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account…</>
              ) : (
                <><span>Create Account</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
