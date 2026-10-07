import { useState } from "react";
import { Code2, Loader2, Sparkles, Terminal, Copy, Check } from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js",
  "HTML/CSS", "Java", "C++", "C", "SQL", "Go", "Rust"
];

const REQUEST_TYPES = [
  { value: "generate", label: "Generate" },
  { value: "debug", label: "Debug" },
  { value: "explain", label: "Explain" },
  { value: "optimize", label: "Optimize" },
];

export default function Code() {
  const [task, setTask] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [requestType, setRequestType] = useState("generate");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("input"); // "input" | "output"
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    setActiveMobileTab("output");

    try {
      const { data } = await api.post("/code/assist", { task, language, code, requestType });
      setResult(data.content);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-surface2/80 p-1 rounded-xl mb-2.5 border border-border shrink-0">
        <button
          onClick={() => setActiveMobileTab("input")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "input"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Code2 size={14} />
          <span>Editor & Prompt</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("output")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
            activeMobileTab === "output"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal size={14} />
          <span>Code Result</span>
          {result && activeMobileTab !== "output" && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* Code Input Form */}
        <form
          onSubmit={handleSubmit}
          className={`w-full lg:w-96 shrink-0 glass rounded-2xl p-4 space-y-3 overflow-y-auto ${
            activeMobileTab === "output" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Code2 size={18} className="text-accent" />
            <h2 className="font-semibold text-sm text-white">Coding Assistant</h2>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Generate clean code, debug syntax errors, or optimize algorithms.
          </p>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Action Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-1.5">
              {REQUEST_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setRequestType(t.value)}
                  className={`text-xs rounded-lg py-1.5 border font-medium transition-all ${
                    requestType === t.value
                      ? "bg-accent/25 border-accent/60 text-white shadow-sm"
                      : "border-border text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Language / Framework</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent text-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">What do you want to build or fix?</label>
            <textarea
              value={task}
              maxLength={12000}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
              required
              placeholder="e.g. Build an authentication middleware, or solve 2-sum in O(N)..."
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent resize-none text-white placeholder-slate-500"
            />
          </div>

          {(requestType === "debug" || requestType === "explain" || requestType === "optimize") && (
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Paste existing code snippet</label>
              <textarea
                value={code}
                maxLength={30000}
                onChange={(e) => setCode(e.target.value)}
                rows={5}
                placeholder="// Paste code here..."
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-accent resize-none text-slate-200 placeholder-slate-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm active:scale-98 transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Run AI Code Assistant
          </button>
        </form>

        {/* Code Output Panel */}
        <div
          className={`flex-1 glass rounded-2xl p-4 sm:p-5 overflow-y-auto min-h-0 border border-border ${
            activeMobileTab === "input" ? "hidden lg:block" : "block"
          }`}
        >
          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 mb-3">
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 gap-2.5 p-6">
              <div className="w-12 h-12 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-accent">
                <Terminal size={24} />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Ready to Code</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Select your language, describe what you need, and run the assistant to generate code with explanations.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-300 text-sm gap-3">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="font-medium">Synthesizing optimized code...</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs text-slate-400 font-mono">
                  {language} · {requestType.toUpperCase()}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
              <MarkdownView content={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
