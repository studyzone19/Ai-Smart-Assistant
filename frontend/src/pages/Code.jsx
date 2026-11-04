import { useState, useEffect, useRef } from "react";
import {
  Code2, Loader2, Sparkles, Terminal, Copy, Check,
  Play, Eye, RefreshCw, FileCode, Edit3
} from "lucide-react";
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

  // Live Sandbox state
  const [viewMode, setViewMode] = useState("code"); // "code" | "preview"
  const [sandboxCode, setSandboxCode] = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isEditingSandbox, setIsEditingSandbox] = useState(false);
  const iframeRef = useRef(null);

  // Extract runnable code from AI markdown output
  const extractCode = (text) => {
    const codeBlockRegex = /```(?:html|css|javascript|js|jsx)?\s*\n([\s\S]*?)```/gi;
    const blocks = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push(match[1]);
    }
    if (blocks.length > 0) return blocks.join("\n\n");
    return text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    setViewMode("code");
    setConsoleLogs([]);
    setActiveMobileTab("output");

    try {
      const { data } = await api.post("/code/assist", { task, language, code, requestType });
      setResult(data.content);
      const extracted = extractCode(data.content);
      setSandboxCode(extracted);
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

  // Listen to messages from sandboxed iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.source === "ramai-sandbox") {
        if (e.data.type === "log") {
          setConsoleLogs((prev) => [...prev.slice(-20), { type: "log", text: e.data.message }]);
        } else if (e.data.type === "error") {
          setConsoleLogs((prev) => [...prev.slice(-20), { type: "error", text: e.data.message }]);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const buildSandboxSrcDoc = (src) => {
    const isFullHtml = /<html|<head|<body/i.test(src);
    const content = isFullHtml
      ? src
      : `
        <div id="root" style="padding: 16px;">
          ${src.includes("<") ? src : `<pre style="font-family: monospace; white-space: pre-wrap;">${src}</pre>`}
        </div>
      `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #0f172a; }
          </style>
          <script>
            (function() {
              const origLog = console.log;
              const origErr = console.error;
              console.log = function(...args) {
                origLog(...args);
                window.parent.postMessage({
                  source: 'ramai-sandbox',
                  type: 'log',
                  message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                }, '*');
              };
              console.error = function(...args) {
                origErr(...args);
                window.parent.postMessage({
                  source: 'ramai-sandbox',
                  type: 'error',
                  message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                }, '*');
              };
              window.onerror = function(msg, url, line) {
                window.parent.postMessage({
                  source: 'ramai-sandbox',
                  type: 'error',
                  message: msg + ' (Line ' + line + ')'
                }, '*');
              };
            })();
          </script>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
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
            Generate clean code, debug syntax errors, optimize algorithms, or run interactive live previews.
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
              placeholder="e.g. Build an interactive pricing card, a responsive navbar, or a timer component..."
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
          className={`flex-1 glass rounded-2xl p-4 sm:p-5 overflow-y-auto min-h-0 border border-border flex flex-col ${
            activeMobileTab === "input" ? "hidden lg:flex" : "flex"
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
              <h3 className="font-semibold text-white text-sm sm:text-base">Ready to Code & Test</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Select your language, describe what you need, and run the assistant to generate code and test with interactive Live Preview.
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
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Output Top Bar with View Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-1.5 bg-surface2/80 p-0.5 rounded-xl border border-border">
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "code"
                        ? "bg-accent/25 text-white border border-accent/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileCode size={13} />
                    <span>Code & Explanation</span>
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "preview"
                        ? "bg-teal-500/25 text-teal-200 border border-teal-500/40 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Play size={12} className="text-teal-400 fill-teal-400" />
                    <span>Live Preview</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* View Mode 1: Markdown View */}
              {viewMode === "code" && (
                <div className="flex-1 overflow-y-auto">
                  <MarkdownView content={result} />
                </div>
              )}

              {/* View Mode 2: Live Sandbox Preview */}
              {viewMode === "preview" && (
                <div className="flex-1 flex flex-col min-h-0 bg-surface2/40 border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-surface2 border-b border-border text-xs shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      <span className="font-mono text-slate-400 text-[11px] ml-1">Live Sandbox (HTML/CSS/JS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingSandbox((v) => !v)}
                        className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border transition-colors ${
                          isEditingSandbox
                            ? "bg-accent/20 border-accent/40 text-accent"
                            : "border-border text-slate-400 hover:text-white"
                        }`}
                      >
                        <Edit3 size={11} />
                        {isEditingSandbox ? "Hide Editor" : "Edit Code"}
                      </button>
                      <button
                        onClick={() => {
                          if (iframeRef.current) {
                            iframeRef.current.srcdoc = buildSandboxSrcDoc(sandboxCode);
                          }
                          setConsoleLogs([]);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border border-border text-slate-400 hover:text-white transition-colors"
                        title="Re-run sandbox"
                      >
                        <RefreshCw size={11} />
                        Re-run
                      </button>
                    </div>
                  </div>

                  {isEditingSandbox && (
                    <div className="p-2 bg-slate-950 border-b border-border shrink-0 max-h-40 overflow-y-auto">
                      <textarea
                        value={sandboxCode}
                        onChange={(e) => setSandboxCode(e.target.value)}
                        className="w-full h-32 bg-transparent text-xs font-mono text-emerald-400 outline-none resize-none"
                        placeholder="Edit code here and click Re-run..."
                      />
                    </div>
                  )}

                  {/* Sandbox iframe */}
                  <div className="flex-1 bg-white min-h-[300px]">
                    <iframe
                      ref={iframeRef}
                      title="Live Code Preview"
                      srcDoc={buildSandboxSrcDoc(sandboxCode)}
                      sandbox="allow-scripts allow-modals"
                      className="w-full h-full border-none"
                    />
                  </div>

                  {/* Console Log Bar */}
                  {consoleLogs.length > 0 && (
                    <div className="bg-slate-950 border-t border-border p-2 max-h-28 overflow-y-auto shrink-0 font-mono text-[11px]">
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Sandbox Console Logs</div>
                      {consoleLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`truncate ${log.type === "error" ? "text-red-400" : "text-emerald-400"}`}
                        >
                          &gt; {log.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
