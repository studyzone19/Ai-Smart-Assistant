import { useState } from "react";
import { Search as SearchIcon, Loader2, ExternalLink, Globe } from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";

export default function Search() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);
    try {
      const { data } = await api.post("/search", { query });
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col glass rounded-2xl p-3 sm:p-5 min-h-0 overflow-y-auto border border-border">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <SearchIcon size={18} className="text-accent" />
        <div>
          <h2 className="font-semibold text-sm sm:text-base text-white">Live Web Search</h2>
          <p className="text-[11px] text-slate-400">Search current online sources with AI synthesis</p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-surface2 border border-border focus-within:border-accent/60 rounded-2xl px-3 py-1.5 sm:py-2 mb-4 transition-all"
      >
        <SearchIcon size={16} className="text-slate-500 shrink-0" />
        <input
          value={query}
          maxLength={500}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for recent news, facts, tutorials, or data..."
          className="flex-1 bg-transparent outline-none text-xs sm:text-sm py-1 text-white placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white text-xs sm:text-sm font-medium disabled:opacity-40 shrink-0 transition-all active:scale-95"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
        </button>
      </form>

      {error && (
        <div className="text-xs sm:text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 mb-4">
          {error}
        </div>
      )}

      {!answer && !loading && !error && (
        <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 gap-2.5 p-6">
          <div className="w-12 h-12 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-accent">
            <Globe size={24} />
          </div>
          <h3 className="font-semibold text-white text-sm sm:text-base">Explore the Web</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Ask any question to search real-time web results with grounded citations and links.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-slate-300 text-sm gap-3">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="font-medium text-xs sm:text-sm">Browsing the web and summarizing findings...</p>
        </div>
      )}

      {answer && (
        <div className="space-y-4">
          <div className="bg-surface2/60 border border-border rounded-2xl p-4 sm:p-5">
            <MarkdownView content={answer} />
          </div>

          {sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sources & References ({sources.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 bg-surface2/60 border border-border rounded-xl p-3 text-xs hover:border-accent/40 hover:bg-surface2 transition-all group"
                  >
                    <ExternalLink size={14} className="text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 font-medium truncate group-hover:text-white">{s.title || s.url}</p>
                      <p className="text-slate-500 text-[10px] truncate mt-0.5">{s.url}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
