import { useState, useEffect, useRef } from "react";
import {
  FileText, Upload, Loader2, Send, Image as ImageIcon, Trash2,
  FileCheck2, Sparkles, MessageSquare, AlertCircle
} from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [question, setQuestion] = useState("");
  const [qaLog, setQaLog] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [imageQuestion, setImageQuestion] = useState("");
  const [imageResult, setImageResult] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("files"); // "files" | "qa"
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const qaBottomRef = useRef(null);

  const loadDocs = async () => {
    try {
      const { data } = await api.get("/documents");
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    qaBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [qaLog, asking]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadDocs();
      if (data.document) {
        setActiveDoc(data.document);
        setActiveMobileTab("qa");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSelectDoc = (doc) => {
    setActiveDoc(doc);
    setQaLog([]);
    setActiveMobileTab("qa");
  };

  const handleAsk = async () => {
    if (!question.trim() || !activeDoc) return;
    setAsking(true);
    const q = question;
    setQuestion("");
    setQaLog((prev) => [...prev, { role: "user", content: q }]);
    try {
      const { data } = await api.post(`/documents/${activeDoc._id}/ask`, { question: q });
      setQaLog((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setQaLog((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err.response?.data?.message || "Failed to answer"}` },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/documents/${id}`);
      if (activeDoc?._id === id) {
        setActiveDoc(null);
        setQaLog([]);
      }
      loadDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageLoading(true);
    setImageResult("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", imageQuestion || "Describe and explain what is shown in this image in detail.");
    try {
      const { data } = await api.post("/documents/analyze-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageResult(data.answer);
    } catch (err) {
      setImageResult(`⚠️ ${err.response?.data?.message || "Failed to analyze image"}`);
    } finally {
      setImageLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-surface2/80 p-1 rounded-xl mb-2.5 border border-border shrink-0">
        <button
          onClick={() => setActiveMobileTab("files")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "files"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText size={14} />
          <span>Files & Vision ({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("qa")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all relative ${
            activeMobileTab === "qa"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare size={14} />
          <span className="truncate max-w-[120px]">
            {activeDoc ? activeDoc.originalName : "Document Chat"}
          </span>
          {activeDoc && activeMobileTab !== "qa" && (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* Documents & Image Upload Sidebar */}
        <div
          className={`w-full lg:w-80 shrink-0 glass rounded-2xl p-4 flex flex-col gap-3.5 overflow-y-auto ${
            activeMobileTab === "qa" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-accent" />
              <h2 className="font-semibold text-sm text-white">PDF & Doc Chat</h2>
            </div>
            <p className="text-xs text-slate-400 mb-2">Upload any PDF, DOCX, or CSV to query facts directly.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.csv"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 rounded-xl py-3 text-xs sm:text-sm text-slate-200 transition-colors"
            >
              {uploading ? <Loader2 size={16} className="animate-spin text-accent" /> : <Upload size={16} className="text-accent" />}
              <span className="font-medium">{uploading ? "Processing document..." : "Upload Document"}</span>
            </button>
          </div>

          <div className="space-y-1 flex-1 overflow-y-auto min-h-[100px] max-h-56 lg:max-h-none">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-1 mb-1">
              Uploaded Files
            </p>
            {documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => handleSelectDoc(doc)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                  activeDoc?._id === doc._id
                    ? "bg-accent/20 border border-accent/40 text-white"
                    : "bg-surface2/50 hover:bg-surface2 text-slate-300"
                }`}
              >
                <FileCheck2
                  size={15}
                  className={`shrink-0 ${
                    doc.status === "ready"
                      ? "text-emerald-400"
                      : doc.status === "failed"
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                />
                <span className="flex-1 truncate font-medium">{doc.originalName}</span>
                <button
                  onClick={(e) => handleDelete(doc._id, e)}
                  title="Delete file"
                  className="shrink-0 p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="p-3 text-center text-xs text-slate-500 bg-surface2/30 rounded-xl">
                No documents uploaded yet.
              </div>
            )}
          </div>

          {/* Image Understanding Module */}
          <div className="border-t border-border pt-3 mt-auto space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon size={17} className="text-accent" />
              <h3 className="font-semibold text-xs sm:text-sm text-white">Vision / Image AI</h3>
            </div>
            <input
              value={imageQuestion}
              onChange={(e) => setImageQuestion(e.target.value)}
              placeholder="Question about image (optional)"
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-accent text-white placeholder-slate-500"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => imageInputRef.current.click()}
              disabled={imageLoading}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border hover:border-accent/40 rounded-xl py-2.5 text-xs text-slate-300 hover:text-white bg-surface2/40 transition-colors"
            >
              {imageLoading ? <Loader2 size={14} className="animate-spin text-accent" /> : <Upload size={14} />}
              <span>{imageLoading ? "Analyzing visual data..." : "Upload photo to inspect"}</span>
            </button>
            {imageResult && (
              <div className="mt-2 bg-surface2 border border-border rounded-xl p-3 max-h-48 overflow-y-auto text-xs">
                <MarkdownView content={imageResult} />
              </div>
            )}
          </div>
        </div>

        {/* Q&A Panel */}
        <div
          className={`flex-1 flex flex-col glass rounded-2xl min-h-0 border border-border overflow-hidden ${
            activeMobileTab === "files" ? "hidden lg:flex" : "flex"
          }`}
        >
          {!activeDoc ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-400 gap-3 p-6">
              <div className="w-12 h-12 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-accent">
                <FileText size={24} />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">No Document Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Upload a document or select an existing one to ground AI responses directly in the text.
              </p>
              <button
                onClick={() => setActiveMobileTab("files")}
                className="lg:hidden mt-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-xl text-xs font-medium text-white"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {activeDoc.originalName}
                  </p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Document ready for Q&A
                  </p>
                </div>
                <button
                  onClick={() => setActiveMobileTab("files")}
                  className="lg:hidden text-xs text-accent hover:underline ml-2 shrink-0"
                >
                  Change Doc
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {qaLog.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 bg-surface2/30 rounded-xl border border-dashed border-border max-w-md mx-auto my-6">
                    💡 Ask any question! Answers will be strictly based on content retrieved from{" "}
                    <span className="text-white font-medium">{activeDoc.originalName}</span>.
                  </div>
                )}
                {qaLog.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-sm ${
                        m.role === "user"
                          ? "bg-accent/25 border border-accent/40 text-white rounded-br-sm"
                          : "bg-surface2 border border-border text-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <MarkdownView content={m.content} />
                      ) : (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm bg-surface2 border border-border rounded-xl px-3 py-2 w-fit">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    <span>Searching through document...</span>
                  </div>
                )}
                <div ref={qaBottomRef} />
              </div>

              <div className="p-2 sm:p-3 border-t border-border bg-[#0d0d17]/80">
                <div className="flex items-center gap-2 bg-surface2 border border-border focus-within:border-accent/60 rounded-2xl px-3 py-1.5 sm:py-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                    disabled={activeDoc.status !== "ready"}
                    placeholder={
                      activeDoc.status === "ready"
                        ? "Ask about this document..."
                        : "Document still indexing..."
                    }
                    className="flex-1 bg-transparent outline-none text-xs sm:text-sm py-1 text-white placeholder-slate-500"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!question.trim() || asking}
                    className="p-2 rounded-xl bg-gradient-to-br from-accent to-accent2 text-white disabled:opacity-40 shrink-0 active:scale-95"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
