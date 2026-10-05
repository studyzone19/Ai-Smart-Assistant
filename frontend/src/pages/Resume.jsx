import { useState, useEffect } from "react";
import {
  FileEdit, Plus, Trash2, Sparkles, Loader2, Save,
  Check, ChevronRight, FileText
} from "lucide-react";
import api from "../services/api";

const emptyResume = {
  title: "My Professional Resume",
  personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" },
  skills: [],
  education: [{ degree: "", institution: "", year: "", score: "" }],
  projects: [{ name: "", description: "", techStack: [], link: "" }],
  experience: [],
  certifications: [],
  achievements: [],
};

const FIELD_LABELS = {
  fullName: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  location: "City, Country",
  linkedin: "LinkedIn Profile URL",
  github: "GitHub Profile URL",
  portfolio: "Portfolio Website URL",
};

export default function Resume() {
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState(emptyResume);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [genLoading, setGenLoading] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("editor"); // "list" | "editor"

  const load = async () => {
    try {
      const { data } = await api.get("/resume");
      setResumes(data.resumes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updatePersonal = (key) => (e) =>
    setForm((f) => ({
      ...f,
      personalInfo: { ...f.personalInfo, [key]: e.target.value },
    }));

  const updateListItem = (listKey, idx, field, value) => {
    setForm((f) => {
      const list = [...f[listKey]];
      list[idx] = { ...list[idx], [field]: value };
      return { ...f, [listKey]: list };
    });
  };

  const addListItem = (listKey, blank) =>
    setForm((f) => ({ ...f, [listKey]: [...f[listKey], blank] }));

  const removeListItem = (listKey, idx) =>
    setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== idx) }));

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setForm((f) => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
    setSkillInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const { data } = await api.post("/resume", form._id ? form : { ...form });
      setForm(data.resume);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (section) => {
    if (!form._id) {
      alert("Please save the resume first, then generate AI content.");
      return;
    }
    setGenLoading(section);
    try {
      const { data } = await api.post(`/resume/${form._id}/generate`, { section });
      setForm(data.resume);
      if (section !== "summary" && section !== "coverLetter") {
        alert(data.generated);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Generation failed");
    } finally {
      setGenLoading("");
    }
  };

  const loadResume = (r) => {
    setForm(r);
    setActiveMobileTab("editor");
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/resume/${id}`);
      load();
      if (form._id === id) setForm(emptyResume);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-surface2/80 p-1 rounded-xl mb-2.5 border border-border shrink-0">
        <button
          onClick={() => setActiveMobileTab("list")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "list"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText size={14} />
          <span>Saved Resumes ({resumes.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab("editor")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "editor"
              ? "bg-accent/25 text-white border border-accent/40 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileEdit size={14} />
          <span className="truncate max-w-[130px]">{form.title || "Resume Editor"}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* Saved Resumes List Sidebar */}
        <div
          className={`w-full lg:w-64 shrink-0 glass rounded-2xl p-4 space-y-2.5 overflow-y-auto ${
            activeMobileTab === "editor" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileEdit size={18} className="text-accent" />
            <h2 className="font-semibold text-sm text-white">Resumes</h2>
          </div>
          <p className="text-xs text-slate-400 mb-2">Build ATS-optimized resumes with AI.</p>

          <button
            onClick={() => {
              setForm(emptyResume);
              setActiveMobileTab("editor");
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 rounded-xl py-2.5 text-slate-200 transition-colors"
          >
            <Plus size={14} className="text-accent" /> New Resume
          </button>

          <div className="space-y-1 pt-1">
            {resumes.map((r) => (
              <div
                key={r._id}
                onClick={() => loadResume(r)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                  form._id === r._id
                    ? "bg-accent/20 border border-accent/40 text-white font-medium"
                    : "bg-surface2/50 hover:bg-surface2 text-slate-300"
                }`}
              >
                <span className="flex-1 truncate">{r.title || "Untitled Resume"}</span>
                <button
                  onClick={(e) => handleDelete(r._id, e)}
                  title="Delete resume"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={13} className="text-slate-600 lg:hidden" />
              </div>
            ))}
            {resumes.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No resumes saved yet.</p>
            )}
          </div>
        </div>

        {/* Resume Form Editor */}
        <div
          className={`flex-1 glass rounded-2xl p-4 sm:p-6 overflow-y-auto min-h-0 border border-border space-y-6 ${
            activeMobileTab === "list" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Header & Save Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Resume Document Title"
              className="text-base sm:text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-accent text-white"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-medium disabled:opacity-60 shadow-sm shrink-0 active:scale-95 transition-all"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={15} className="text-emerald-300" />
              ) : (
                <Save size={15} />
              )}
              <span>{saveSuccess ? "Saved!" : "Save Resume"}</span>
            </button>
          </div>

          {/* Personal Information */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {["fullName", "email", "phone", "location", "linkedin", "github", "portfolio"].map(
                (k) => (
                  <div key={k}>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                      {FIELD_LABELS[k] || k}
                    </label>
                    <input
                      value={form.personalInfo[k] || ""}
                      onChange={updatePersonal(k)}
                      placeholder={FIELD_LABELS[k]}
                      className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500"
                    />
                  </div>
                )
              )}
            </div>
          </section>

          {/* Summary Section */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                Professional Summary
              </h3>
              <button
                onClick={() => handleGenerate("summary")}
                disabled={genLoading === "summary"}
                className="text-xs flex items-center gap-1.5 text-accent hover:underline font-medium"
              >
                {genLoading === "summary" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                <span>Generate with AI</span>
              </button>
            </div>
            <textarea
              value={form.generatedSummary || ""}
              onChange={(e) => setForm((f) => ({ ...f, generatedSummary: e.target.value }))}
              rows={3}
              placeholder="A brief overview of your professional profile and goals..."
              className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500 leading-relaxed"
            />
          </section>

          {/* Skills Section */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">Skills</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.skills.map((s, i) => (
                <span
                  key={i}
                  className="text-xs bg-surface2 border border-border rounded-full px-3 py-1 flex items-center gap-1.5 text-slate-200"
                >
                  {s}
                  <button
                    onClick={() =>
                      setForm((f) => ({ ...f, skills: f.skills.filter((_, idx) => idx !== i) }))
                    }
                    className="text-slate-400 hover:text-red-400 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {form.skills.length === 0 && (
                <p className="text-xs text-slate-500">No skills added yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Type a skill (e.g. React, Python) and press Enter"
                className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3.5 py-2 bg-surface2 border border-border hover:bg-white/5 text-slate-200 text-xs rounded-xl font-medium"
              >
                Add
              </button>
            </div>
          </section>

          {/* Education Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">Education</h3>
              <button
                onClick={() =>
                  addListItem("education", { degree: "", institution: "", year: "", score: "" })
                }
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Plus size={13} /> Add Education
              </button>
            </div>
            {form.education.map((ed, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-surface2/40 border border-border rounded-xl relative"
              >
                <input
                  value={ed.degree}
                  onChange={(e) => updateListItem("education", i, "degree", e.target.value)}
                  placeholder="Degree / Course"
                  className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
                />
                <input
                  value={ed.institution}
                  onChange={(e) => updateListItem("education", i, "institution", e.target.value)}
                  placeholder="School / College / University"
                  className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
                />
                <input
                  value={ed.year}
                  onChange={(e) => updateListItem("education", i, "year", e.target.value)}
                  placeholder="Graduation Year (e.g. 2024)"
                  className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
                />
                <div className="flex gap-2">
                  <input
                    value={ed.score}
                    onChange={(e) => updateListItem("education", i, "score", e.target.value)}
                    placeholder="CGPA / Percentage"
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white"
                  />
                  <button
                    onClick={() => removeListItem("education", i)}
                    title="Remove entry"
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Projects Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">Projects</h3>
              <button
                onClick={() =>
                  addListItem("projects", { name: "", description: "", techStack: [], link: "" })
                }
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Plus size={13} /> Add Project
              </button>
            </div>
            {form.projects.map((p, i) => (
              <div
                key={i}
                className="space-y-2 p-3.5 bg-surface2/40 border border-border rounded-xl"
              >
                <div className="flex gap-2">
                  <input
                    value={p.name}
                    onChange={(e) => updateListItem("projects", i, "name", e.target.value)}
                    placeholder="Project Title"
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white font-medium"
                  />
                  <button
                    onClick={() => removeListItem("projects", i)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <textarea
                  value={p.description}
                  onChange={(e) => updateListItem("projects", i, "description", e.target.value)}
                  placeholder="Describe your role, key features, and impact..."
                  rows={2}
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500"
                />
                <input
                  value={(p.techStack || []).join(", ")}
                  onChange={(e) =>
                    updateListItem(
                      "projects",
                      i,
                      "techStack",
                      e.target.value.split(",").map((s) => s.trim())
                    )
                  }
                  placeholder="Tech Stack (comma separated, e.g. React, Node.js, Tailwind)"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500"
                />
              </div>
            ))}
            <button
              onClick={() => handleGenerate("projectDescriptions")}
              disabled={genLoading === "projectDescriptions"}
              className="text-xs flex items-center gap-1.5 text-accent hover:underline font-medium"
            >
              {genLoading === "projectDescriptions" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span>Generate ATS-friendly Project Bullets</span>
            </button>
          </section>

          {/* Cover Letter Section */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">Cover Letter</h3>
              <button
                onClick={() => handleGenerate("coverLetter")}
                disabled={genLoading === "coverLetter"}
                className="text-xs flex items-center gap-1.5 text-accent hover:underline font-medium"
              >
                {genLoading === "coverLetter" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>Generate with AI</span>
              </button>
            </div>
            <textarea
              value={form.generatedCoverLetter || ""}
              onChange={(e) => setForm((f) => ({ ...f, generatedCoverLetter: e.target.value }))}
              rows={6}
              placeholder="AI-generated cover letter based on your resume details..."
              className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-accent text-white placeholder-slate-500 leading-relaxed"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
