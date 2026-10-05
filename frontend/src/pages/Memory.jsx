import { useEffect, useState } from "react";
import { Brain, Plus, Trash2, Power, Pencil, Check, X } from "lucide-react";
import api from "../services/api";

const CATEGORIES = ["preference", "project", "language", "skill", "other"];

export default function Memory() {
  const [memories, setMemories] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/memory");
      setMemories(data.memories || []);
      setEnabled(data.memoryEnabled);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const { data } = await api.post("/memory", { content: newContent, category: newCategory });
      setMemories((prev) => [data.memory, ...prev]);
      setNewContent("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add memory");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/memory/${id}`);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (m) => {
    try {
      const { data } = await api.patch(`/memory/${m._id}`, { isActive: !m.isActive });
      setMemories((prev) => prev.map((x) => (x._id === m._id ? data.memory : x)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const { data } = await api.patch("/memory/toggle", { enabled: !enabled });
      setEnabled(data.memoryEnabled);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setEditValue(m.content);
  };

  const saveEdit = async (id) => {
    try {
      const { data } = await api.patch(`/memory/${id}`, { content: editValue });
      setMemories((prev) => prev.map((x) => (x._id === id ? data.memory : x)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete all stored memories? This cannot be undone.")) return;
    try {
      await api.delete("/memory");
      setMemories([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 glass rounded-2xl p-3.5 sm:p-5 min-h-0 overflow-y-auto border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-accent" />
          <h2 className="font-semibold text-sm sm:text-base text-white">AI Memory Bank</h2>
        </div>
        <button
          onClick={handleToggleEnabled}
          className={`flex items-center justify-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border font-medium w-fit transition-all ${
            enabled
              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 shadow-sm"
              : "border-border text-slate-500 bg-surface2/50"
          }`}
        >
          <Power size={13} /> Memory System {enabled ? "Active" : "Disabled"}
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-4 max-w-xl">
        Memories help your AI assistant remember your coding preferences, projects, and personal context across sessions.
      </p>

      {/* Add Memory Form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="e.g. Always write code in TypeScript and use Tailwind CSS"
          className="flex-1 bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500"
        />
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-xs sm:text-sm outline-none focus:border-accent text-white capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm active:scale-95 transition-all"
          >
            <Plus size={16} /> <span>Save Memory</span>
          </button>
        </div>
      </form>

      {/* Memory Cards */}
      <div className="space-y-2">
        {memories.map((m) => (
          <div
            key={m._id}
            className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-surface2/60 border border-border rounded-xl p-3 sm:px-3.5 sm:py-3 transition-opacity ${
              !m.isActive ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-accent2 bg-accent2/10 border border-accent2/20 rounded-full px-2.5 py-0.5">
                {m.category}
              </span>
            </div>

            {editingId === m._id ? (
              <div className="flex-1 flex items-center gap-2 w-full">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs sm:text-sm outline-none focus:border-accent text-white"
                />
                <button onClick={() => saveEdit(m._id)} className="p-1.5 text-emerald-400 hover:bg-white/5 rounded">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-white/5 rounded">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <p className="flex-1 text-xs sm:text-sm text-slate-200 leading-relaxed">{m.content}</p>
                <div className="flex items-center gap-2 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-0 border-white/5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(m)}
                    title={m.isActive ? "Deactivate" : "Activate"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      m.isActive ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-white/5"
                    }`}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => startEdit(m)}
                    title="Edit memory"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(m._id)}
                    title="Delete memory"
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {memories.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 bg-surface2/30 rounded-xl border border-dashed border-border">
            No memories added yet. Add a rule or preference above!
          </div>
        )}
      </div>

      {memories.length > 0 && (
        <button
          onClick={handleClearAll}
          className="mt-5 text-xs text-red-400 hover:text-red-300 font-medium"
        >
          Clear all memories
        </button>
      )}
    </div>
  );
}
