import { useState } from "react";
import { GraduationCap, Loader2, Sparkles, BookOpen, Settings2 } from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";

const REQUEST_TYPES = [
  { value: "notes", label: "Notes" },
  { value: "important_questions", label: "Questions" },
  { value: "mcqs", label: "MCQs" },
  { value: "flashcards", label: "Flashcards" },
  { value: "revision", label: "Revision" },
  { value: "practice_test", label: "Practice Test" },
];

export default function Study() {
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    level: "undergraduate",
    difficulty: "medium",
    requestType: "notes",
  });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("setup"); // "setup" | "output"

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.topic.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    // Switch to output tab automatically on mobile so user sees the progress
    setActiveMobileTab("output");

    try {
      const { data } = await api.post("/study/generate", form);
      setResult(data.content);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-surface2/80 p-1 rounded-xl mb-2.5 border border-border shrink-0">
        <button
          onClick={() => setActiveMobileTab("setup")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "setup"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Settings2 size={14} />
          <span>Setup Topic</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("output")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
            activeMobileTab === "output"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen size={14} />
          <span>Notes & Output</span>
          {result && activeMobileTab !== "output" && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* Input Setup Form */}
        <form
          onSubmit={handleGenerate}
          className={`w-full lg:w-80 shrink-0 glass rounded-2xl p-4 space-y-3 overflow-y-auto ${
            activeMobileTab === "output" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={18} className="text-accent" />
            <h2 className="font-semibold text-sm text-white">Study Mode</h2>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Notes, MCQs, flashcards & revision help generated for your subject.
          </p>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Subject</label>
            <input
              value={form.subject}
              onChange={update("subject")}
              placeholder="e.g. Data Structures, Biology, History"
              required
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Topic</label>
            <input
              value={form.topic}
              onChange={update("topic")}
              placeholder="e.g. Binary Search Trees, Photosynthesis"
              required
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Level</label>
              <select
                value={form.level}
                onChange={update("level")}
                className="w-full bg-surface2 border border-border rounded-xl px-2.5 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
              >
                <option value="school">School</option>
                <option value="undergraduate">College / UG</option>
                <option value="postgraduate">Master / PG</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={update("difficulty")}
                className="w-full bg-surface2 border border-border rounded-xl px-2.5 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">Output Format</label>
            <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-2 gap-1.5">
              {REQUEST_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setForm((f) => ({ ...f, requestType: t.value }))}
                  className={`text-[11px] sm:text-xs rounded-lg px-2 py-2 border font-medium transition-all ${
                    form.requestType === t.value
                      ? "bg-accent/25 border-accent/60 text-white shadow-sm"
                      : "border-border text-slate-400 hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm active:scale-98 transition-all mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generate Study Material
          </button>
        </form>

        {/* Results Panel */}
        <div
          className={`flex-1 glass rounded-2xl p-4 sm:p-5 overflow-y-auto min-h-0 border border-border ${
            activeMobileTab === "setup" ? "hidden lg:block" : "block"
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
                <GraduationCap size={24} />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Ready to Study</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Fill in your subject and topic on the left, then click Generate to get instant exam-ready material.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-300 text-sm gap-3">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="font-medium">Crafting comprehensive study notes...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-semibold text-sm sm:text-base text-white truncate">
                  {form.topic} ({form.subject})
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs text-accent hover:underline shrink-0"
                >
                  Copy All
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
