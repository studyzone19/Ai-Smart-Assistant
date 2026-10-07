import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext.jsx";
import { Download, ImageIcon, RefreshCw } from "lucide-react";
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

  // Keep the original URL completely intact - just add nologo if missing
  const buildSrc = (rawSrc, retry) => {
    if (!rawSrc) return rawSrc;
    try {
      const url = new URL(rawSrc);
      url.searchParams.set("nologo", "true");
      // Add a unique seed on retry so a fresh image is fetched
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

  return (
    <div className="relative my-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-full bg-[#1a1a1a] group/img">
      {/* Loading skeleton */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-slate-400">
          <ImageIcon size={36} className="opacity-40 animate-pulse" />
          <p className="text-xs animate-pulse">Generating image…</p>
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-slate-400">
          <ImageIcon size={36} className="opacity-20" />
          <p className="text-xs text-slate-500 text-center">Image generation timed out.<br />Click Retry to try again.</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Actual image — always rendered, hidden during load/error */}
      <img
        key={`${finalSrc}-${retryCount}`}
        src={finalSrc}
        alt={alt || "AI Generated Image"}
        loading="eager"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`block w-full max-h-[600px] object-contain transition-all duration-500 ${
          status === "loaded" ? "opacity-100" : "opacity-0 h-0 pointer-events-none"
        }`}
      />

      {/* User watermark */}
      {status === "loaded" && (
        <div className="absolute bottom-3 left-3 bg-black/75 text-white text-[11px] px-3 py-1 rounded-xl font-medium tracking-wide backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-1.5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span>Created for {userName}</span>
        </div>
      )}

      {/* Download button */}
      {status === "loaded" && (
        <a
          href={finalSrc}
          target="_blank"
          rel="noreferrer"
          className="absolute top-3 right-3 bg-black/75 hover:bg-black text-white p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 text-xs"
          title="Open / Download HD Image"
        >
          <Download size={13} /> HD
        </a>
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
