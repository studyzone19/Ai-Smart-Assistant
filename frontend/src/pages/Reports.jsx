import { useState, useEffect } from "react";
import {
  ClipboardList, Sparkles, Loader2, Trash2, FileDown,
  BookOpen, PlusCircle, ChevronRight
} from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";

const TYPES = ["project", "college", "technical", "business", "research"];
const SECTIONS = ["introduction", "objectives", "methodology", "analysis", "findings", "conclusion", "futureScope"];
const SECTION_LABELS = {
  introduction: "Introduction",
  objectives: "Objectives",
  methodology: "Methodology",
  analysis: "Analysis & Findings",
  findings: "Key Findings",
  conclusion: "Conclusion",
  futureScope: "Future Scope & Recommendations",
};

export default function Reports() {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("project");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [active, setActive] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("generator"); // "generator" | "viewer"

  const load = async () => {
    try {
      const { data } = await api.get("/reports");
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setActiveMobileTab("viewer");
    try {
      const { data } = await api.post("/reports/generate", { topic, type, notes });
      setActive(data.report);
      setReports((prev) => [data.report, ...prev]);
      setTopic("");
      setNotes("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (r) => {
    setActive(r);
    setActiveMobileTab("viewer");
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
      if (active?._id === id) setActive(null);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadMarkdown = () => {
    if (!active) return;
    const md =
      `# ${active.topic}\n\n` +
      SECTIONS.map((s) => `## ${SECTION_LABELS[s]}\n\n${active.content?.[s] || ""}`).join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.topic.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-surface2/80 p-1 rounded-xl mb-2.5 border border-border shrink-0">
        <button
          onClick={() => setActiveMobileTab("generator")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "generator"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <PlusCircle size={14} />
          <span>Generator & Saved</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("viewer")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
            activeMobileTab === "viewer"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen size={14} />
          <span className="truncate max-w-[130px]">
            {active ? active.topic : "View Report"}
          </span>
          {active && activeMobileTab !== "viewer" && (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* Report Generator & Saved Reports */}
        <div
          className={`w-full lg:w-80 shrink-0 glass rounded-2xl p-4 space-y-3.5 overflow-y-auto ${
            activeMobileTab === "viewer" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-accent" />
            <h2 className="font-semibold text-sm text-white">AI Reports</h2>
          </div>
          <p className="text-xs text-slate-400">Generate structured academic, technical, or business reports.</p>

          <form onSubmit={handleGenerate} className="space-y-2.5">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Impact of AI on Healthcare"
                required
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Report Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)} Report
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Additional Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add special constraints, focus points, or data..."
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent resize-none text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl py-2.5 text-xs sm:text-sm font-medium disabled:opacity-60 shadow-sm active:scale-98 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <span>Generate Structured Report</span>
            </button>
          </form>

          {/* Saved Reports List */}
          <div className="border-t border-border pt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-1">
              Saved Reports ({reports.length})
            </p>
            {reports.map((r) => (
              <div
                key={r._id}
                onClick={() => handleSelectReport(r)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
                  active?._id === r._id
                    ? "bg-accent/20 border border-accent/40 text-white font-medium"
                    : "bg-surface2/50 hover:bg-surface2 text-slate-300"
                }`}
              >
                <span className="flex-1 truncate">{r.topic}</span>
                <button
                  onClick={(e) => handleDelete(r._id, e)}
                  title="Delete report"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={13} className="text-slate-600 lg:hidden" />
              </div>
            ))}
            {reports.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">No reports saved yet.</p>
            )}
          </div>
        </div>

        {/* Report Content View */}
        <div
          className={`flex-1 glass rounded-2xl p-4 sm:p-6 overflow-y-auto min-h-0 border border-border ${
            activeMobileTab === "generator" ? "hidden lg:block" : "block"
          }`}
        >
          {loading && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-300 text-sm gap-3">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="font-medium">Writing comprehensive structured report...</p>
            </div>
          )}

          {!active && !loading && (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 gap-2.5 p-6">
              <div className="w-12 h-12 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-accent">
                <ClipboardList size={24} />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">No Report Loaded</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Fill in a topic and generate, or choose an existing report from the saved list.
              </p>
            </div>
          )}

          {active && !loading && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <h2 className="text-base sm:text-xl font-bold text-white leading-tight">
                  {active.topic}
                </h2>
                <button
                  onClick={downloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-white text-xs font-medium w-fit active:scale-95 transition-all"
                >
                  <FileDown size={14} /> Export as Markdown
                </button>
              </div>

              {SECTIONS.map(
                (s) =>
                  active.content?.[s] && (
                    <section key={s} className="bg-surface2/40 border border-border rounded-xl p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">
                        {SECTION_LABELS[s]}
                      </h3>
                      <MarkdownView content={active.content[s]} />
                    </section>
                  )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
