import { useState, useEffect } from "react";
import {
  Sparkles, Image as ImageIcon, Download, Copy, Check,
  Loader2, Wand2, Maximize2, Trash2, X, ZoomIn, SlidersHorizontal
} from "lucide-react";
import api from "../services/api";

const PROMPT_SUGGESTIONS = [
  "Majestic royal bengal tiger resting on mossy rocks in deep jungle, golden hour light, 8k portrait",
  "Cyberpunk neon street at night with glowing rain reflections and flying vehicles, cinematic",
  "Cute fluffy 3D baby dragon sitting on an open spellbook, soft volumetric lighting",
  "Modern minimalist startup logo mark, geometric gradients, sleek vector aesthetic",
  "Anime warrior standing on a mountain peak looking at floating cloud islands, Makoto Shinkai style",
  "Hyper-realistic portrait of an astronaut floating in deep space with colorful nebula reflection in visor",
];

const STYLES = [
  { id: "default", label: "✨ Universal HD", desc: "Best for all-round crisp visual quality" },
  { id: "photo", label: "📸 Photorealistic", desc: "Ultra-detailed 8K photography, real skin & textures" },
  { id: "anime", label: "🎌 Anime & Manga", desc: "Makoto Shinkai studio aesthetic & rich colors" },
  { id: "3d", label: "🧊 3D Octane Render", desc: "Unreal Engine 5 lighting, 3D depth & geometry" },
  { id: "cyberpunk", label: "👾 Cyberpunk Sci-Fi", desc: "Vibrant neon glow & moody cinematic contrast" },
  { id: "digital", label: "🎨 Digital Artwork", desc: "Fantasy concept art trending on ArtStation" },
];

const RATIOS = [
  { id: "1:1", label: "1:1 Square", desc: "Best for Avatars & Social" },
  { id: "16:9", label: "16:9 Landscape", desc: "Best for Wallpapers & Desktop" },
  { id: "9:16", label: "9:16 Portrait", desc: "Best for Phones & Stories" },
];

export default function Images() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photo"); // default to Photorealistic for best clarity
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        // quota fallback
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

    try {
      const { data } = await api.post("/images/generate", {
        prompt: prompt.trim(),
        aspectRatio,
        style: selectedStyle,
        enhance: autoEnhance,
      });

      if (data?.image?.data) {
        const imageUrl = `data:${data.image.mimeType || "image/jpeg"};base64,${data.image.data}`;
        const newImg = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: prompt.trim(),
          style: selectedStyle,
          ratio: aspectRatio,
          provider: data.image.provider || "Flux HD",
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setCurrentImage(newImg);
        saveToHistory(newImg);
      } else {
        setError("Could not generate image. Please try again with a more detailed prompt.");
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
    a.download = `ramai-hd-${Date.now()}.jpg`;
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  AI Image Studio
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ⚡ Flux Ultra HD
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Generate crystal-clear, high-definition visuals with photorealistic lighting</p>
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
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleGenerate} className="bg-surface border border-border rounded-2xl p-4 lg:p-5 shadow-sm space-y-4">
            {/* Prompt input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Describe what you want to create
                </label>
                <button
                  type="button"
                  onClick={() => setAutoEnhance((v) => !v)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                    autoEnhance
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-surface2 border-border text-slate-500"
                  }`}
                  title="Auto-adds professional lighting, texture, and 8K clarity tags"
                >
                  ✨ Auto HD Polish: {autoEnhance ? "ON" : "OFF"}
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A majestic white tiger with sapphire blue eyes sitting in a snow-covered bamboo forest, cinematic golden hour sunlight..."
                rows={3}
                className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Tip: Mention subjects, colors, lighting, and camera angle for best sharpness.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Wand2 size={12} className="text-purple-400" /> High-clarity prompt ideas:
              </p>
              <div className="flex flex-col gap-1.5">
                {PROMPT_SUGGESTIONS.slice(0, 3).map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="text-[11px] text-slate-300 bg-surface2 hover:bg-white/5 border border-border/80 px-2.5 py-1.5 rounded-lg text-left truncate transition-colors"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Clarity & Style Engine
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`py-2 px-2.5 text-left rounded-xl border transition-all ${
                      selectedStyle === st.id
                        ? "bg-purple-500/15 border-purple-500/60 text-purple-200 shadow-sm shadow-purple-500/10 ring-1 ring-purple-500/30"
                        : "bg-surface2/60 border-border text-slate-400 hover:text-slate-200 hover:bg-surface2"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-200">{st.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{st.desc}</p>
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-teal-500 hover:from-purple-500 hover:via-pink-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating High-Definition Image...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate HD Image
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Display / Result Area */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-4 lg:p-6 min-h-[460px] flex flex-col justify-center items-center relative overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-teal-400 animate-pulse flex items-center justify-center shadow-xl shadow-purple-500/30">
                    <Loader2 size={30} className="animate-spin text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">Rendering Ultra HD Visual...</p>
                  <p className="text-xs text-slate-400">Synthesizing fine textures, lighting, and 8K clarity</p>
                </div>
              </div>
            ) : currentImage ? (
              <div className="w-full flex flex-col items-center space-y-4">
                {/* Image Container with click to zoom */}
                <div
                  onClick={() => setLightboxOpen(true)}
                  className="relative group max-w-full rounded-2xl overflow-hidden border border-border/80 shadow-2xl cursor-pointer bg-slate-950 flex items-center justify-center"
                  title="Click to view full HD resolution"
                >
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    style={{ imageRendering: "auto" }}
                    className="max-h-[500px] w-auto object-contain rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-white flex items-center gap-1 shadow-lg">
                    <Maximize2 size={13} />
                    <span>View Fullscreen</span>
                  </div>
                </div>

                {/* Image Details & Action Bar */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        {currentImage.provider || "Flux 8K"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentImage.ratio} · {currentImage.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 truncate font-medium" title={currentImage.prompt}>
                      "{currentImage.prompt}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="p-2 rounded-xl bg-surface2 hover:bg-white/10 text-slate-300 border border-border transition-colors text-xs flex items-center gap-1"
                      title="Fullscreen preview"
                    >
                      <ZoomIn size={14} />
                      <span className="hidden sm:inline">Zoom</span>
                    </button>
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
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                    >
                      <Download size={14} />
                      <span>Download HD</span>
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
                    Type your prompt, pick a style (Photorealistic, Anime, 3D), and generate crystal-clear HD imagery.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Creations Gallery */}
          {history.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles size={13} className="text-purple-400" /> Recent Creations Gallery
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {history.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setCurrentImage(img)}
                    className={`group relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all hover:scale-105 bg-slate-950 ${
                      currentImage?.id === img.id ? "border-purple-400 ring-2 ring-purple-400/40" : "border-border"
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

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none cursor-zoom-out"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => downloadImage(currentImage)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download HD Image"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close Fullscreen"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className="max-h-[82vh] w-auto object-contain rounded-xl shadow-2xl border border-white/10"
            />
            <p className="mt-3 text-xs text-slate-300 text-center max-w-2xl px-4 truncate font-medium">
              "{currentImage.prompt}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
