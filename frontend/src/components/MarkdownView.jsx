import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext.jsx";
import { Download, ImageIcon, RefreshCw, Maximize2, ZoomIn, X, Sparkles } from "lucide-react";
import { isValidElement, useState } from "react";

const FLOW_EDGE = /(\w+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?\s*--?>\s*(?:\|([^|]+)\|\s*)?(\w+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?/g;
const FLOW_NODE = /\b(\w+)\s*(?:\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\})/g;

function FlowDiagram({ source }) {
  const labels = new Map();
  for (const line of source.split("\n")) {
    FLOW_NODE.lastIndex = 0;
    for (const match of line.matchAll(FLOW_NODE)) {
      const [, id, square, round, decision] = match;
      labels.set(id, (square || round || decision || id).replaceAll('"', "").trim());
    }
  }

  const edges = [];
  for (const line of source.split("\n")) {
    if (/^\s*(flowchart|graph)\s/i.test(line) || !line.includes("-->")) continue;
    FLOW_EDGE.lastIndex = 0;
    for (const match of line.matchAll(FLOW_EDGE)) {
      const [, fromId, fromSquare, fromRound, fromDecision, edgeLabel, toId, toSquare, toRound, toDecision] = match;
      const labelFor = (id, square, round, decision) => (square || round || decision || labels.get(id) || id).replaceAll('"', "").trim();
      labels.set(fromId, labelFor(fromId, fromSquare, fromRound, fromDecision));
      labels.set(toId, labelFor(toId, toSquare, toRound, toDecision));
      edges.push({ fromId, toId, from: labels.get(fromId), to: labels.get(toId), label: edgeLabel?.trim() });
      if (edges.length >= 8) break;
    }
    if (edges.length >= 8) break;
  }

  if (!edges.length) return null;
  const colors = ["teal", "blue", "violet", "amber", "rose", "cyan", "emerald", "indigo"];
  const isLinear = edges.every((edge, index) => index === 0 || edges[index - 1].toId === edge.fromId);
  const linearNodes = isLinear
    ? [edges[0].fromId, ...edges.map((edge) => edge.toId)].filter((id, index, all) => all.indexOf(id) === index)
    : null;
  return (
    <div className="flow-diagram" role="img" aria-label="Colorful step-by-step diagram">
      {isLinear ? linearNodes.map((id, index) => (
        <div className="flow-diagram-row" key={id}>
          <div className={`flow-diagram-node flow-${colors[index % colors.length]}`}>{labels.get(id) || id}</div>
          {index < linearNodes.length - 1 && <div className="flow-diagram-connector" aria-hidden="true">
            {edges[index]?.label && <span>{edges[index].label}</span>}
            <span className="flow-diagram-arrow">↓</span>
          </div>}
        </div>
      )) : edges.map((edge, index) => (
        <div className="flow-diagram-row" key={`${edge.fromId}-${edge.toId}-${index}`}>
          <div className={`flow-diagram-node flow-${colors[index % colors.length]}`}>{edge.from}</div>
          <div className="flow-diagram-connector" aria-hidden="true">
            {edge.label && <span>{edge.label}</span>}
            <span className="flow-diagram-arrow">↓</span>
          </div>
          <div className={`flow-diagram-node flow-${colors[(index + 1) % colors.length]}`}>{edge.to}</div>
        </div>
      ))}
    </div>
  );
}

function AIImage({ src, alt, userName }) {
  const [status, setStatus] = useState("loading"); // loading | loaded | error
  const [retryCount, setRetryCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isWiki = (src || "").includes("wikimedia.org") || (alt || "").includes("Wikipedia");

  // Enforce Flux 1024x1024 HD parameters on Pollinations image URLs
  const buildSrc = (rawSrc, retry) => {
    if (!rawSrc) return rawSrc;
    try {
      const url = new URL(rawSrc);
      if (url.hostname.includes("pollinations.ai")) {
        url.searchParams.set("model", "flux");
        url.searchParams.set("width", "1024");
        url.searchParams.set("height", "1024");
        url.searchParams.set("enhance", "true");
        url.searchParams.set("nologo", "true");
      }
      if (retry > 0) {
        url.searchParams.set("seed", String(Math.floor(Math.random() * 99999)));
      }
      return url.toString();
    } catch {
      return rawSrc;
    }
  };

  const finalSrc = buildSrc(src, retryCount);

  const handleRetry = () => {
    setStatus("loading");
    setRetryCount((c) => c + 1);
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(finalSrc);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanName = (alt || "image").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      a.download = `${cleanName}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(finalSrc, "_blank");
    }
  };

  return (
    <div className="relative my-5 mx-auto max-w-lg sm:max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f172a] group/img">
      {/* Loading skeleton */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-slate-400">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-teal-500/20 flex items-center justify-center border border-white/10">
            <ImageIcon size={28} className="text-teal-400 opacity-60 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-slate-200 animate-pulse">
              {isWiki ? "Loading Wikipedia Photograph…" : "Rendering 8K Flux Image…"}
            </p>
            <p className="text-[11px] text-slate-500">
              {isWiki ? "Fetching authentic high-resolution archive photo" : "Creating high-definition details & lighting"}
            </p>
          </div>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
            <div className="h-full w-full bg-gradient-to-r from-purple-500 via-pink-500 to-teal-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-slate-400">
          <ImageIcon size={36} className="opacity-20" />
          <p className="text-xs text-slate-400 text-center">Could not load image.<br />Click Retry to try again.</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs text-white transition-colors"
          >
            <RefreshCw size={12} /> Retry Image
          </button>
        </div>
      )}

      {/* Actual image — click to zoom in Lightbox */}
      <div
        onClick={() => status === "loaded" && setLightboxOpen(true)}
        className={`relative cursor-pointer select-none ${status === "loaded" ? "block" : "hidden"}`}
        title="Click to view full HD resolution"
      >
        <div className="overflow-hidden bg-slate-950 flex items-center justify-center max-h-[460px]">
          <img
            key={`${finalSrc}-${retryCount}`}
            src={finalSrc}
            alt={alt || "Image"}
            loading="eager"
            style={{ imageRendering: "auto" }}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className="block w-full max-h-[460px] object-cover sm:object-contain transition-all duration-300 group-hover/img:scale-[1.01]"
          />
        </div>

        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border border-white/15 flex items-center gap-1 shadow-lg">
          <Sparkles size={11} className={isWiki ? "text-cyan-400" : "text-emerald-400"} />
          <span className={isWiki ? "text-cyan-200" : "text-emerald-300"}>
            {isWiki ? "Wikipedia Verified" : "Flux Ultra HD"}
          </span>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
            className="bg-black/75 hover:bg-black text-white p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg text-xs flex items-center gap-1 transition-all"
            title="Zoom Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-purple-600 to-teal-500 hover:opacity-95 text-white px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Download HD Image"
          >
            <Download size={13} />
            <span>HD Download</span>
          </button>
        </div>

        {/* Bottom Caption — exact Google Gemini style */}
        {alt && (
          <div className="text-center py-2.5 px-4 text-xs text-slate-300 italic bg-slate-900/90 border-t border-white/10">
            {alt}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none cursor-zoom-out"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDownload}
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
              src={finalSrc}
              alt={alt || "Image"}
              className="max-h-[82vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/15"
            />
            {alt && (
              <p className="mt-3 text-xs text-slate-300 text-center max-w-2xl px-4 truncate font-medium">
                {alt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarkdownView({ content }) {
  const { user } = useAuth();
  const userName = user?.name || "AI Assistant";

  return (
    <div className="prose-ai text-xs sm:text-sm text-slate-200 overflow-x-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            if (isValidElement(children) && /language-mermaid/i.test(children.props.className || "")) return children;
            return <pre>{children}</pre>;
          },
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match?.[1]?.toLowerCase() === "mermaid") {
              const diagram = <FlowDiagram source={String(children).replace(/\n$/, "")} />;
              if (diagram) return diagram;
            }
            if (!inline && match) {
              return (
                <div className="my-2 rounded-xl overflow-x-auto border border-slate-700/60 max-w-full">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ borderRadius: 12, fontSize: "12px", margin: 0, padding: "12px" }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          },
          img({ node, src, alt }) {
            return <AIImage src={src} alt={alt} userName={userName} />;
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
