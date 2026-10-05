import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Send, Mic, Plus, Trash2, RefreshCw, Copy, Volume2, Pause, Square,
  MessageSquare, Pin, Loader2, History, X, Check, Sparkles,
  Pencil, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Edit3,
  ArrowDown, PanelLeft, SquarePen, Globe, Download
} from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";
import { useVoiceInput, useVoiceOutput } from "../hooks.js";

const AI_MODELS = [
  { id: "gemini-3.5-flash-lite", name: "ChatGPT 4o Flash", desc: "Fast & Smart" },
  { id: "gemini-1.5-pro", name: "ChatGPT 4o Pro", desc: "Deep Reasoning" },
  { id: "claude-3-haiku", name: "Claude 3.5 Sonnet", desc: "Coding Master" },
];

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingChatTitle, setEditingChatTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // New features state
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash-lite");
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const voiceOut = useVoiceOutput();
  const voiceIn = useVoiceInput((transcript) => {
    setInput((prev) => (prev ? prev + " " : "") + transcript);
  });

  const loadChats = useCallback(async () => {
    try {
      const { data } = await api.get("/chats");
      setChats(data.chats || []);
      setLoadingChats(false);
      return data.chats;
    } catch {
      setLoadingChats(false);
    }
  }, []);

  const loadMessages = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/chats/${id}/messages`);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (chatId) loadMessages(chatId);
    else setMessages([]);
  }, [chatId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 180);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeChat = chats.find((c) => c._id === chatId);

  const handleNewChat = async () => {
    try {
      const { data } = await api.post("/chats", { title: "New Chat", mode: "chat" });
      setChats((prev) => [data.chat, ...prev]);
      navigate(`/chat/${data.chat._id}`);
      setHistoryDrawerOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.delete(`/chats/${id}`);
      setChats((prev) => prev.filter((c) => c._id !== id));
      if (chatId === id) navigate("/chat");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (chat, e) => {
    e?.stopPropagation();
    try {
      const { data } = await api.patch(`/chats/${chat._id}`, { isPinned: !chat.isPinned });
      setChats((prev) =>
        prev
          .map((c) => (c._id === chat._id ? data.chat : c))
          .sort((a, b) => b.isPinned - a.isPinned)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTitle = async () => {
    if (!newTitle.trim() || !chatId) return;
    try {
      const { data } = await api.patch(`/chats/${chatId}`, { title: newTitle.trim() });
      setChats((prev) => prev.map((c) => (c._id === chatId ? data.chat : c)));
      setEditingChatTitle(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    let activeChatId = chatId;

    if (!activeChatId) {
      try {
        const { data } = await api.post("/chats", { title: "New Chat", mode: "chat" });
        activeChatId = data.chat._id;
        setChats((prev) => [data.chat, ...prev]);
        navigate(`/chat/${activeChatId}`, { replace: true });
      } catch {
        return;
      }
    }

    const content = input;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { _id: `tmp-${Date.now()}`, role: "user", content }]);

    try {
      const { data } = await api.post(`/chats/${activeChatId}/messages`, {
        content,
        model: selectedModel,
        isWebSearch,
      });
      setMessages((prev) => [
        ...prev.filter((m) => !m._id.startsWith("tmp-")),
        data.userMessage,
        data.assistantMessage,
      ]);
      if (autoSpeak && data.assistantMessage?.content) {
        voiceOut.play(data.assistantMessage.content, data.assistantMessage._id);
      }
      loadChats();
      outletCtx?.reloadChats?.();
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => !m._id.startsWith("tmp-")),
        {
          _id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${err.response?.data?.message || "Something went wrong."}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // ChatGPT-style Edit Prompt feature
  const startEditPrompt = (m) => {
    setEditingMessageId(m._id);
    setEditingText(m.content);
  };

  const cancelEditPrompt = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const submitEditPrompt = async (messageId) => {
    if (!editingText.trim() || !chatId || sending) return;
    setSending(true);
    const newContent = editingText.trim();
    setEditingMessageId(null);

    const targetIdx = messages.findIndex((m) => m._id === messageId);
    if (targetIdx !== -1) {
      setMessages(messages.slice(0, targetIdx + 1).map((m) => (m._id === messageId ? { ...m, content: newContent } : m)));
    }

    try {
      await api.post(`/chats/${chatId}/edit-message`, {
        messageId,
        content: newContent,
      });
      await loadMessages(chatId);
      loadChats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to edit message");
      loadMessages(chatId);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async (messageId) => {
    setSending(true);
    try {
      const { data } = await api.post(`/chats/${chatId}/regenerate`, { messageId });
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data.message : m)));
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/chats/${chatId}/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleFeedback = (msgId, type) => {
    setFeedback((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type,
    }));
  };

  const handleShare = () => {
    const text = messages.map((m) => `${m.role === "user" ? "You" : "AI"}: ${m.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex w-full h-full min-h-0 relative select-none bg-[#212121] overflow-hidden">
      {/* Mobile Chat History Drawer — ChatGPT exact style */}
      {historyDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setHistoryDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#171717] h-full flex flex-col z-10 overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
              <span className="font-semibold text-sm text-white">Chats</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="New Chat"
                >
                  <SquarePen size={16} />
                </button>
                <button
                  onClick={() => setHistoryDrawerOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {chats.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No chats yet.</p>
              )}
              {chats.map((c) => (
                <div
                  key={c._id}
                  onClick={() => { navigate(`/chat/${c._id}`); setHistoryDrawerOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                    chatId === c._id ? "bg-white/10 text-white" : "text-[#b4b4b4] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <MessageSquare size={14} className="shrink-0 opacity-60" />
                  <span className="flex-1 truncate">{c.title || "New Chat"}</span>
                  <button
                    onClick={(e) => handleTogglePin(c, e)}
                    className={c.isPinned ? "text-accent shrink-0" : "text-slate-600 shrink-0"}
                  >
                    <Pin size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteChat(c._id, e)}
                    className="text-slate-600 hover:text-red-400 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main ChatGPT Conversation Screen */}
      <div className="flex-1 flex flex-col min-h-0 h-full w-full relative select-text">
        {/* Top Header — ChatGPT exact style */}
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 bg-[#212121] shrink-0 z-10">
          {/* Menu button — mobile only (opens Layout drawer = nav tools) */}
          <button
            onClick={() => outletCtx?.openMobileMenu?.()}
            className="md:hidden shrink-0 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white active:scale-95 transition-all"
            title="Menu"
          >
            <PanelLeft size={20} />
          </button>

          {/* Center: Model Selector & Chat Title */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* Model Selector Dropdown (ChatGPT style) */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#2f2f2f] hover:bg-[#383838] text-white font-semibold text-xs sm:text-sm px-2.5 py-1 rounded-xl border border-white/10 outline-none cursor-pointer transition-colors"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#171717] text-white py-1">
                    {m.name} ({m.desc})
                  </option>
                ))}
              </select>
            </div>

            {editingChatTitle ? (
              <>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  className="flex-1 bg-surface border border-accent rounded-lg px-2 py-0.5 text-sm text-white outline-none min-w-0"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="shrink-0 p-1 text-emerald-400 hover:bg-white/5 rounded">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingChatTitle(false)} className="shrink-0 p-1 text-slate-400 hover:bg-white/5 rounded">
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1 min-w-0">
                <span className="text-xs text-slate-400 truncate">
                  {activeChat?.title || ""}
                </span>
                {activeChat && (
                  <button
                    onClick={() => { setNewTitle(activeChat.title); setEditingChatTitle(true); }}
                    title="Rename chat"
                    className="shrink-0 p-1 text-slate-500 hover:text-white rounded transition-colors"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Web Search Toggle + History (mobile) + Share + New Chat */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Live Web Search Button */}
            <button
              onClick={() => setIsWebSearch((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                isWebSearch
                  ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-sm"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle Live Web Search"
            >
              <Globe size={14} className={isWebSearch ? "animate-pulse text-cyan-400" : ""} />
              <span className="hidden sm:inline">{isWebSearch ? "Search On" : "Search"}</span>
            </button>

            {/* Auto Voice Speak Toggle */}
            <button
              onClick={() => setAutoSpeak((v) => !v)}
              className={`p-1.5 rounded-xl border transition-all ${
                autoSpeak
                  ? "bg-purple-500/20 border-purple-400/50 text-purple-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title={autoSpeak ? "Auto Voice Speak: ON" : "Auto Voice Speak: OFF"}
            >
              <Volume2 size={15} />
            </button>

            {/* Download PDF / Print Button */}
            {messages.length > 0 && (
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                title="Export / Download PDF"
              >
                <Download size={14} className="text-emerald-400" />
                <span>PDF</span>
              </button>
            )}
            <button
              onClick={() => setHistoryDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-slate-300 active:scale-95 transition-transform"
              title="Chat History"
            >
              <History size={18} />
            </button>

            {/* Share — desktop only */}
            {messages.length > 0 && (
              <button
                onClick={handleShare}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
                title="Share conversation"
              >
                {shareSuccess ? <Check size={15} className="text-emerald-400" /> : <Share2 size={16} />}
                <span className="hidden sm:inline">{shareSuccess ? "Copied!" : "Share"}</span>
              </button>
            )}

            {/* New Chat */}
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
          </div>
        </header>

        {/* Message Stream (Direct document canvas like ChatGPT) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 lg:px-24 py-4 sm:py-6 space-y-6"
        >
          {messages.length === 0 && (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center text-slate-400 gap-3 px-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent shadow-md">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">What can I help with?</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-3">
                {[
                  "Draw a futuristic sports car",
                  "Explain React Hooks simply",
                  "Create a study plan for exams",
                  "Help me debug my code",
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setInput(sample);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 text-xs text-left bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl text-slate-300 hover:text-white transition-all shadow-sm"
                  >
                    ✨ {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m._id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} group/msg w-full`}
            >
              {/* User Prompt (Sleek right-aligned capsule like ChatGPT) */}
              {m.role === "user" ? (
                editingMessageId === m._id ? (
                  /* Inline Edit Box */
                  <div className="w-full max-w-2xl bg-[#21212b] border border-accent/40 rounded-2xl p-3 shadow-xl space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full bg-[#181822] border border-border focus:border-accent rounded-xl p-2.5 text-sm text-white outline-none resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={cancelEditPrompt}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitEditPrompt(m._id)}
                        disabled={sending || !editingText.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent to-accent2 hover:opacity-95 text-white text-xs font-medium disabled:opacity-40 shadow-sm"
                      >
                        Save & Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  /* User Bubble with Hover Toolbar (Pencil & Copy) */
                  <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%]">
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#1a1a24] px-1.5 py-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => startEditPrompt(m)}
                        className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                        title="Edit message"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleCopy(m.content, m._id)}
                        className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                        title="Copy prompt"
                      >
                        {copiedId === m._id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="bg-[#2f2f3d] hover:bg-[#363646] text-white rounded-3xl px-4 py-2 text-sm sm:text-base leading-relaxed shadow-sm transition-colors">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                )
              ) : (
                /* Assistant AI Response (Clean canvas layout without grey card box, just like ChatGPT) */
                <div className="w-full space-y-2">
                  <div className="text-slate-100 leading-relaxed text-sm sm:text-base">
                    <MarkdownView content={m.content} />
                  </div>

                  {/* Search Sources Cards if web search was used */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-[11px] font-semibold text-cyan-400 mb-1.5 flex items-center gap-1">
                        <Globe size={12} /> Sources ({m.sources.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#2a2a2a] hover:bg-[#333] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs truncate max-w-[200px] border border-white/5 transition-colors"
                          >
                            [{idx + 1}] {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ChatGPT Toolbar beneath the response */}
                  {!m._id.startsWith("err-") && (
                    <div className="flex items-center gap-1.5 text-slate-400 pt-1">
                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(m.content, m._id)}
                        title="Copy response"
                        className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {copiedId === m._id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>

                      {/* Read Aloud */}
                      {voiceOut.speakingId === m._id ? (
                        <div className="flex items-center gap-1 bg-accent/20 px-2 py-0.5 rounded-full text-accent">
                          <button onClick={voiceOut.pause} title="Pause" className="hover:text-white p-0.5">
                            <Pause size={13} />
                          </button>
                          <button onClick={voiceOut.stop} title="Stop" className="hover:text-white p-0.5">
                            <Square size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => voiceOut.play(m.content, m._id)}
                          title="Read aloud"
                          className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}

                      {/* Regenerate */}
                      <button
                        onClick={() => handleRegenerate(m._id)}
                        title="Regenerate"
                        className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>

                      {/* Thumbs Up */}
                      <button
                        onClick={() => toggleFeedback(m._id, "up")}
                        title="Good response"
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${
                          feedback[m._id] === "up" ? "text-emerald-400" : "hover:text-white"
                        }`}
                      >
                        <ThumbsUp size={14} />
                      </button>

                      {/* Thumbs Down */}
                      <button
                        onClick={() => toggleFeedback(m._id, "down")}
                        title="Bad response"
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${
                          feedback[m._id] === "down" ? "text-red-400" : "hover:text-white"
                        }`}
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm py-2">
              <Loader2 size={16} className="animate-spin text-accent" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Floating Scroll-to-bottom Arrow Button (ChatGPT Style) */}
        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 sm:right-10 z-20 w-9 h-9 rounded-full bg-[#21212b] border border-white/10 text-white flex items-center justify-center shadow-xl hover:bg-[#2d2d3b] transition-all active:scale-95"
            title="Scroll to bottom"
          >
            <ArrowDown size={16} />
          </button>
        )}

        {/* ChatGPT Bottom Input Bar */}
        <div className="px-3 sm:px-4 pb-4 pt-2 bg-[#212121] shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex items-end gap-2 bg-[#2f2f2f] border border-transparent focus-within:border-white/10 rounded-2xl px-4 py-3 shadow-md transition-all">
              {/* Attach button */}
              <button
                type="button"
                onClick={() => navigate("/documents")}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors shrink-0 mb-0.5"
                title="Attach PDF or Image"
              >
                <Plus size={20} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  voiceIn.status === "listening"
                    ? "Listening to your voice..."
                    : "Message AI Assistant"
                }
                className="flex-1 bg-transparent resize-none outline-none text-sm sm:text-base py-0.5 text-white placeholder-[#8e8ea0] leading-relaxed max-h-36"
              />

              {/* Voice Input Mic */}
              {voiceIn.status !== "unsupported" && (
                <button
                  type="button"
                  onClick={voiceIn.status === "listening" ? voiceIn.stop : voiceIn.start}
                  className={`p-2 rounded-full shrink-0 transition-colors ${
                    voiceIn.status === "listening"
                      ? "bg-red-500/20 text-red-400 animate-pulse ring-1 ring-red-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
                  }`}
                  title="Voice input"
                >
                  <Mic size={18} />
                </button>
              )}

              {/* Send Button — ChatGPT style white circle */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-2 rounded-full bg-white text-black hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed shrink-0 active:scale-95 transition-all"
                title="Send message"
              >
                <Send size={15} />
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-[#8e8ea0] text-center select-none">
              AI Smart Assistant can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
