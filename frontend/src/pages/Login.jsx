import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center px-4 py-6 sm:py-8 overflow-x-hidden overflow-y-auto">
      <div className="pointer-events-none absolute -top-32 -left-28 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative w-full max-w-md glass rounded-[28px] p-6 sm:p-10 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">AI Smart Assistant</p>
            <p className="text-[11px] text-slate-400">Ask · Learn · Code · Create</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Welcome back</h1>
        <p className="text-sm text-slate-400 mb-6">Sign in to access your chats, notes and tools.</p>

        {error && (
          <div className="mb-4 text-xs sm:text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email address</label>
            <input
              type="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-700/80 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 rounded-xl px-3.5 py-3 text-sm outline-none text-white placeholder-slate-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Password</label>
            <input
              type="password"
              required
              maxLength={72}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-700/80 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10 rounded-xl px-3.5 py-3 text-sm outline-none text-white placeholder-slate-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:brightness-110 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-teal-950/30 active:scale-[0.99] transition-all mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Sign In</span>}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-sm text-slate-400 mt-7 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
