import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Settings as SettingsIcon, Save, Loader2, Check, Sun, Moon } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi (हिंदी)" },
  { value: "hinglish", label: "Hinglish (Hindi + Eng)" },
];
const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#84cc16"];

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useOutletContext();
  const [name, setName] = useState(user?.name || "");
  const [language, setLanguage] = useState(user?.preferredLanguage || "english");
  const [color, setColor] = useState(user?.avatarColor || "#8b5cf6");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.patch("/auth/me", { name, preferredLanguage: language, avatarColor: color });
      updateUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 glass rounded-2xl p-4 sm:p-6 max-w-xl border border-border overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-3 border-b border-white/10">
        <SettingsIcon size={20} className="text-accent" />
        <div>
          <h2 className="font-semibold text-sm sm:text-base text-white">Account & Preferences</h2>
          <p className="text-[11px] text-slate-400">Customize your profile, language, and theme colors</p>
        </div>
      </div>

      <section className="mb-5 rounded-xl border border-border bg-surface2/50 p-3.5 sm:p-4" aria-labelledby="appearance-title">
        <div className="mb-3">
          <h3 id="appearance-title" className="text-sm font-medium text-white">Appearance</h3>
          <p className="mt-0.5 text-xs text-slate-400">Choose how AI Smart Assistant looks on this device.</p>
        </div>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Color theme">
          <button type="button" onClick={() => theme !== "light" && toggleTheme()} aria-pressed={theme === "light"} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${theme === "light" ? "border-accent/60 bg-accent/15 text-white" : "border-border bg-surface text-slate-400 hover:text-white"}`}>
            <Sun size={16} /> White mode
          </button>
          <button type="button" onClick={() => theme !== "dark" && toggleTheme()} aria-pressed={theme === "dark"} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${theme === "dark" ? "border-accent/60 bg-accent/15 text-white" : "border-border bg-surface text-slate-400 hover:text-white"}`}>
            <Moon size={16} /> Dark mode
          </button>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 block">Your Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-accent text-white"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email Address (Read-only)</label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full bg-surface2/40 border border-border/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 block">Default AI Response Language</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <button
                type="button"
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={`text-xs rounded-xl py-2.5 px-3 border font-medium text-center transition-all ${
                  language === l.value
                    ? "bg-accent/25 border-accent/60 text-white shadow-sm"
                    : "border-border text-slate-400 hover:bg-white/5"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-2 block">Avatar Color Palette</label>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${
                  color === c ? "ring-2 ring-white ring-offset-2 ring-offset-bg scale-110" : "hover:scale-105 opacity-80"
                }`}
                style={{ background: c }}
              >
                {color === c && <Check size={14} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl px-6 py-2.5 text-sm font-medium disabled:opacity-60 shadow-sm active:scale-95 transition-all mt-4"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} className="text-emerald-300" />
          ) : (
            <Save size={16} />
          )}
          <span>{saved ? "Changes Saved!" : "Save Preferences"}</span>
        </button>
      </form>
    </div>
  );
}
