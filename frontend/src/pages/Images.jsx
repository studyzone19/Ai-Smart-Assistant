import { useState, useEffect } from "react";
import {
  Sparkles, Image as ImageIcon, Download, Copy, Check,
  Loader2, RefreshCw, Wand2, Maximize2, Trash2
} from "lucide-react";
import api from "../services/api";

const PROMPT_SUGGESTIONS = [
  "Cyberpunk neon street at night with glowing rain reflections",
  "Cute futuristic robot reading a book in a cozy library, 3D render",
  "Majestic snow-covered mountain temple during golden hour sunrise",
  "Modern minimalist startup logo mark, sleek gradient, vector style",
  "Anime warrior standing on a cliff overlooking a fantasy floating island",
  "Hyper-realistic portrait of an astronaut looking at galaxy nebula",
];

const STYLES = [
  { id: "default", label: "Default", suffix: "" },
  { id: "photo", label: "Photorealistic", suffix: ", 8k resolution, ultra-detailed, photorealistic, cinematic lighting" },
  { id: "anime", label: "Anime / Manga", suffix: ", anime aesthetic, Makoto Shinkai style, vibrant colors, clean linework" },
  { id: "3d", label: "3D Render", suffix: ", Unreal Engine 5 render, octane render, 3D isometric, volumetric light" },
  { id: "cyberpunk", label: "Cyberpunk", suffix: ", cyberpunk aesthetic, neon lights, dark moody atmosphere, highly detailed" },
  { id: "digital", label: "Digital Art", suffix: ", digital concept art, trending on ArtStation, vivid colors, fantasy" },
];

const RATIOS = [
  { id: "1:1", label: "1:1 Square", desc: "Best for Avatars & Social" },
  { id: "16:9", label: "16:9 Landscape", desc: "Best for Wallpapers & Desktop" },
  { id: "9:16", label: "9:16 Portrait", desc: "Best for Phone & Stories" },
];

export default function Images() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("default");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ramai_image_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = (imgObj) => {
    setHistory((prev) => {
      const updated = [imgObj, ...prev.filter((i) => i.id !== imgObj.id)].slice(0, 12);
      try {
        localStorage.setItem("ramai_image_history", JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("ramai_image_history");
    } catch {
      // ignore
    }
  };

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");

    const styleObj = STYLES.find((s) => s.id === selectedStyle);
    const fullPrompt = prompt.trim() + (styleObj?.suffix || "");

    try {
      const { data } = await api.post("/images/generate", {
        prompt: fullPrompt,
        aspectRatio,
      });

      if (data?.image?.data) {
        const imageUrl = `data:${data.image.mimeType || "image/png"};base64,${data.image.data}`;
        const newImg = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: prompt.trim(),
          style: selectedStyle,
          ratio: aspectRatio,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setCurrentImage(newImg);
        saveToHistory(newImg);
      } else {
        setError("Could not generate image. Please try again with a different prompt.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (img) => {
    if (!img?.url) return;
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `ramai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg overflow-y-auto">
      {/* Top Banner */}
      <div className="px-4 lg:px-8 py-5 border-b border-border bg-surface/30 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  AI Image Studio
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Creative
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Transform your imagination into high-resolution visuals</p>
              </div>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 self-start sm:self-center"
            >
              <Trash2 size={13} />
              Clear Gallery
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Controls */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleGenerate} className="bg-surface border border-border rounded-2xl p-4 lg:p-5 shadow-sm space-y-4">
            {/* Prompt input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Describe the image you want to create
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A glowing crystal butterfly resting on a bioluminescent flower, cinematic lighting..."
                rows={3}
                className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-all"
              />
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Wand2 size={12} className="text-purple-400" /> Quick ideas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.slice(0, 3).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="text-[11px] text-slate-300 bg-surface2 hover:bg-white/5 border border-border/80 px-2.5 py-1 rounded-lg text-left truncate max-w-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Art Style</label>
              <div className="grid grid-cols-3 gap-1.5">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                      selectedStyle === st.id
                        ? "bg-purple-500/15 border-purple-500/60 text-purple-200 shadow-sm shadow-purple-500/10"
                        : "bg-surface2/60 border-border text-slate-400 hover:text-slate-200 hover:bg-surface2"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-1.5">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                      aspectRatio === r.id
                        ? "bg-teal-500/15 border-teal-500/60 text-teal-200"
                        : "bg-surface2/60 border-border text-slate-400 hover:text-slate-200 hover:bg-surface2"
                    }`}
                  >
                    <p className="text-xs font-medium">{r.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-teal-500 hover:from-purple-500 hover:via-pink-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Masterpiece...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Image
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Display / Result Area */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-4 lg:p-6 min-h-[420px] flex flex-col justify-center items-center relative overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 animate-pulse flex items-center justify-center shadow-xl shadow-purple-500/30">
                    <Loader2 size={30} className="animate-spin text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">Creating your image...</p>
                  <p className="text-xs text-slate-400">Dreaming up pixels and rendering lighting details</p>
                </div>
              </div>
            ) : currentImage ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative group max-w-full rounded-xl overflow-hidden border border-border/80 shadow-2xl">
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="max-h-[480px] w-auto object-contain rounded-xl"
                  />
                </div>

                <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <p className="text-xs text-slate-300 truncate max-w-xs font-medium" title={currentImage.prompt}>
                    "{currentImage.prompt}"
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyPrompt(currentImage.prompt)}
                      className="p-2 rounded-xl bg-surface2 hover:bg-white/10 text-slate-300 border border-border transition-colors text-xs flex items-center gap-1"
                      title="Copy prompt"
                    >
                      {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                      <span className="hidden sm:inline">Copy Prompt</span>
                    </button>
                    <button
                      onClick={() => downloadImage(currentImage)}
                      className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                    >
                      <Download size={14} />
                      Download HD
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-slate-500">
                  <ImageIcon size={28} />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-semibold text-slate-300">Ready to Create</p>
                  <p className="text-xs text-slate-500">
                    Type a prompt on the left and choose a style to generate high-resolution visuals instantly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Creations Gallery */}
          {history.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-400" /> Recent Creations
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {history.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setCurrentImage(img)}
                    className={`group relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all hover:scale-105 ${
                      currentImage?.id === img.id ? "border-purple-400 ring-2 ring-purple-400/30" : "border-border"
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={16} className="text-white drop-shadow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
