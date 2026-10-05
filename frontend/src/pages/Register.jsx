import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm glass rounded-3xl p-6 sm:p-8 border border-border shadow-2xl">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-md">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">AI Smart Assistant</p>
            <p className="text-[11px] text-slate-400">Ask · Learn · Code · Create</p>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">Create an account</h1>
        <p className="text-xs text-slate-400 mb-5">Get started with AI chat, study, code and tools.</p>

        {error && (
          <div className="mb-4 text-xs sm:text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Full Name</label>
            <input
              required
              placeholder="Ram Prajapati"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface2 border border-border focus:border-accent rounded-xl px-3.5 py-2.5 text-sm outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface2 border border-border focus:border-accent rounded-xl px-3.5 py-2.5 text-sm outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface2 border border-border focus:border-accent rounded-xl px-3.5 py-2.5 text-sm outline-none text-white placeholder-slate-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-md active:scale-98 transition-all mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Create Account</span>}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
