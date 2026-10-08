import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Send, Mic, Plus, Trash2, RefreshCw, Copy, Volume2, Pause, Square,
  MessageSquare, Pin, Loader2, History, X, Check,
  Pencil, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Edit3,
  ArrowDown, PanelLeft, SquarePen, Globe, Download, BookOpen, Code2, Lightbulb, PenLine, Paperclip
} from "lucide-react";
import api from "../services/api";
import MarkdownView from "../components/MarkdownView.jsx";
import { useVoiceInput, useVoiceOutput } from "../hooks.js";

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [filePreviews, setFilePreviews] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [composerError, setComposerError] = useState("");
  const [responseStyle, setResponseStyle] = useState("notes");
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
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

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
    if (!attachedImage?.type.startsWith("image/")) { setFilePreviewUrl(""); return; }
    const url = URL.createObjectURL(attachedImage);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachedImage]);

  useEffect(() => {
    let cancelled = false;
    const createdUrls = [];
    const attachmentMessages = messages.filter((message) => message.attachment && !message._id.startsWith("tmp-"));
    Promise.all(attachmentMessages.map(async (message) => {
      try {
        const { data } = await api.get(`/documents/messages/${message._id}/attachment`, { responseType: "blob" });
        const url = URL.createObjectURL(data);
        createdUrls.push(url);
        return [message._id, url];
      } catch { return [message._id, ""]; }
    })).then((entries) => {
      if (cancelled) return;
      setFilePreviews(Object.fromEntries(entries));
    });
    return () => { cancelled = true; createdUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [messages]);

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
    if ((!input.trim() && !attachedImage) || sending) return;
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

    const content = input.trim();
    const file = attachedImage;
    setComposerError("");
    setUploadProgress(0);
    setSending(true);
    setMessages((prev) => [...prev, { _id: `tmp-${Date.now()}`, role: "user", content: file ? `File: ${file.name}
${content || "Explain this file in notes."}` : content }]);

    try {
      let data;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("chatId", activeChatId);
        formData.append("question", content);
        formData.append("responseStyle", responseStyle);
        ({ data } = await api.post("/documents/analyze-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => { if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total)); },
        }));
      } else {
        ({ data } = await api.post(`/chats/${activeChatId}/messages`, { content, isWebSearch }));
      }
      setMessages((prev) => [
        ...prev.filter((m) => !m._id.startsWith("tmp-")),
        data.userMessage,
        data.assistantMessage,
      ]);
      if (autoSpeak && data.assistantMessage?.content) {
        voiceOut.play(data.assistantMessage.content, data.assistantMessage._id);
      }
      setInput("");
      setAttachedImage(null);
      setResponseStyle("notes");
      setUploadProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = "";
      loadChats();
      outletCtx?.reloadChats?.();
    } catch (err) {
      const status = err.response?.status;
      const message = status === 413
        ? "This file is larger than the 15 MB upload limit. Choose a smaller file."
        : err.response?.data?.message || (err.request ? "Could not reach the server. Check your connection and retry." : "Upload failed. Please try again.");
      setComposerError(message);
      setMessages((prev) => prev.filter((item) => !item._id.startsWith("tmp-")));
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setAttachedImage(null);
      setComposerError("This file is larger than the 15 MB limit. Choose a smaller file.");
      event.target.value = "";
      return;
    }
    setAttachedImage(file);
    setComposerError("");
    setShowAttachMenu(false);
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
    <div className="flex-1 flex w-full h-full min-h-0 relative select-none bg-bg overflow-hidden">
      {/* Mobile Chat History Drawer — ChatGPT exact style */}
      {historyDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setHistoryDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-surface h-full flex flex-col z-10 overflow-hidden">
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
                    chatId === c._id ? "bg-teal-400/10 text-teal-200 ring-1 ring-inset ring-teal-300/15" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
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
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-bg/95 shrink-0 z-10">
          {/* Menu button — mobile only (opens Layout drawer = nav tools) */}
          <button
            onClick={() => outletCtx?.openMobileMenu?.()}
            className="md:hidden shrink-0 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white active:scale-95 transition-all"
            title="Menu"
          >
            <PanelLeft size={20} />
          </button>

          {/* Center: Chat Title */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
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
                  ? "bg-teal-500/15 border-teal-400/40 text-teal-200 shadow-sm"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle Live Web Search"
            >
              <Globe size={14} className={isWebSearch ? "animate-pulse text-teal-300" : ""} />
              <span className="hidden sm:inline">{isWebSearch ? "Search On" : "Search"}</span>
            </button>

            {/* Auto Voice Speak Toggle */}
            <button
              onClick={() => setAutoSpeak((v) => !v)}
              className={`p-1.5 rounded-xl border transition-all ${
                autoSpeak
                  ? "bg-blue-500/15 border-blue-400/40 text-blue-200"
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
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center px-3 sm:px-4 py-5 sm:py-10">
              <div className="flex h-[76px] w-[76px] shrink-0 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-[22px] border border-accent/30 bg-slate-950 p-1 shadow-lg shadow-blue-500/15">
                <img src="/icons/icon-512.png?v=2" alt="RamAI logo" className="h-full w-full object-contain" />
              </div>
              <p className="mt-4 sm:mt-6 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Your AI workspace</p>
              <h1 className="mt-2 text-xl sm:text-3xl font-semibold tracking-tight leading-tight text-white">What would you like to work on?</h1>
              <p className="mt-2 max-w-lg text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400">Ask a question, explore an idea, or get help with your next task.</p>
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl mt-5 sm:mt-8 text-left">
                {[
                  { title: "Explore an idea", prompt: "Help me explore this idea: ", detail: "Brainstorm, plan, and make connections.", Icon: Lightbulb },
                  { title: "Learn something", prompt: "Explain this topic simply: ", detail: "Get a clear explanation at your level.", Icon: BookOpen },
                  { title: "Write or create", prompt: "Help me write: ", detail: "Shape a draft, message, or creative project.", Icon: PenLine },
                  { title: "Solve a problem", prompt: "Help me solve this problem: ", detail: "Work through code or a tricky question.", Icon: Code2 },
                ].map(({ title, prompt, detail, Icon }) => (
                  <button
                    key={title}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="group flex items-start gap-2 sm:gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface2 hover:shadow-md"
                  >
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-colors group-hover:bg-accent/15">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="min-w-0"><span className="block text-xs sm:text-sm font-medium text-slate-100">{title}</span><span className="mt-1 block text-[10px] sm:text-xs leading-4 sm:leading-5 text-slate-400">{detail}</span></span>
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
                  <div className="w-full max-w-2xl bg-surface border border-accent/40 rounded-2xl p-3 shadow-xl space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full bg-surface2 border border-border focus:border-accent rounded-xl p-2.5 text-sm text-white outline-none resize-none"
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
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5 bg-surface px-1.5 py-1 rounded-xl border border-border">
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

                    <div className="bg-surface2 hover:bg-surface text-white rounded-3xl px-4 py-2 text-sm sm:text-base leading-relaxed shadow-sm transition-colors">
                      {m.attachment && (
                        <a href={filePreviews[m._id] || undefined} target="_blank" rel="noreferrer" download={m.attachment.originalName} className="mb-2 block max-w-full overflow-hidden rounded-xl border border-white/10 bg-black/10">
                          {m.attachment.mimeType?.startsWith("image/") && filePreviews[m._id]
                            ? <img src={filePreviews[m._id]} alt={m.attachment.originalName} className="max-h-64 max-w-full object-contain" />
                            : <span className="flex items-center gap-2 px-3 py-2 text-xs"><Paperclip size={14} />{m.attachment.originalName} · {(m.attachment.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>}
                        </a>
                      )}
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
                      <p className="text-[11px] font-semibold text-teal-300 mb-1.5 flex items-center gap-1">
                        <Globe size={12} /> Sources ({m.sources.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-surface2 hover:bg-surface text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs truncate max-w-[200px] border border-border transition-colors"
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
            className="absolute bottom-24 right-6 sm:right-10 z-20 w-9 h-9 rounded-full bg-surface border border-border text-white flex items-center justify-center shadow-xl hover:bg-surface2 transition-all active:scale-95"
            title="Scroll to bottom"
          >
            <ArrowDown size={16} />
          </button>
        )}

        {/* ChatGPT Bottom Input Bar */}
        <div className="px-2 sm:px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 bg-bg shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {attachedImage && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-slate-300">
              {filePreviewUrl ? <img src={filePreviewUrl} alt={`Preview of ${attachedImage.name}`} className="h-14 w-14 rounded-lg object-cover" /> : <Paperclip size={18} className="shrink-0 text-teal-300" />}
              <span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-100">{attachedImage.name}</span><span className="text-slate-500">{(attachedImage.size / (1024 * 1024)).toFixed(2)} MB · {attachedImage.type || "File"}</span></span>
              <label className="flex shrink-0 items-center gap-1.5 text-slate-400">Answer style<select aria-label="Answer style" value={responseStyle} onChange={(event) => setResponseStyle(event.target.value)} className="max-w-24 rounded-md border border-border bg-surface2 px-1.5 py-1 text-slate-100 outline-none focus:border-teal-400/60"><option value="notes">Notes</option><option value="steps">Step by step</option><option value="summary">Summary</option><option value="keyterms">Key terms</option></select></label>
              <button type="button" onClick={() => { setAttachedImage(null); setComposerError(""); if (imageInputRef.current) imageInputRef.current.value = ""; }} aria-label="Remove attached file" className="rounded-md p-1 hover:bg-white/10 hover:text-white"><X size={15} /></button>
            </div>}
            <div className="flex items-end gap-2 bg-surface border border-border focus-within:border-teal-400/50 focus-within:ring-4 focus-within:ring-teal-400/5 rounded-2xl px-4 py-3 shadow-lg transition-all">
              {/* Attach button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAttachMenu((open) => !open)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors mb-0.5"
                  title="Add photos and files"
                  aria-label="Add photos and files"
                  aria-expanded={showAttachMenu}
                  disabled={sending}
                >
                  <Plus size={20} />
                </button>
                {showAttachMenu && (
                  <div role="menu" onKeyDown={(event) => { if (event.key === "Escape") setShowAttachMenu(false); }} className="absolute bottom-full left-0 z-50 mb-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-2xl">
                    <p className="px-3 pb-2 pt-1 text-xs font-medium text-slate-400">Add</p>
                    <button type="button" role="menuitem" onClick={() => { setShowAttachMenu(false); imageInputRef.current?.click(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-100 transition-colors hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50">
                      <Paperclip size={17} className="shrink-0 text-slate-400" />
                      <span><span className="block font-medium">Add photos &amp; files</span><span className="mt-0.5 block text-xs text-slate-400">Upload from your device</span></span>
                    </button>
                  </div>
                )}
              </div>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,.pdf,.docx,.xlsx,.pptx,.txt,.csv,.md,.json,.html,.htm,.xml,.log,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.css,.sql" className="hidden" onChange={handleFileSelect} />

              <textarea
                ref={textareaRef}
                maxLength={12000}
                aria-label="Message AI Assistant"
                disabled={sending}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  voiceIn.status === "listening"
                    ? "Listening to your voice..."
                    : "Message AI Assistant"
                }
                className="chat-message-input flex-1 bg-transparent resize-none outline-none text-sm sm:text-base py-0.5 text-white placeholder-slate-500 leading-relaxed max-h-36"
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
                disabled={(!input.trim() && !attachedImage) || sending}
                className="p-2 rounded-full bg-teal-400 text-slate-950 hover:bg-teal-300 disabled:opacity-20 disabled:cursor-not-allowed shrink-0 active:scale-95 transition-all"
                title="Send message"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>


            {sending && attachedImage && <div role="status" aria-live="polite" className="space-y-1 px-1"><div className="flex justify-between text-[11px] text-slate-400"><span>{uploadProgress >= 100 ? "Reading file and preparing your answer…" : "Uploading file…"}</span><span>{uploadProgress}%</span></div><div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${Math.max(uploadProgress, 5)}%` }} /></div></div>}
            {composerError && <div role="alert" className="flex flex-wrap items-center gap-2 px-1 text-xs text-red-300"><span className="flex-1">{composerError} Your text and file are still here.</span><button type="button" onClick={handleSend} disabled={sending} className="inline-flex items-center gap-1 rounded-lg border border-red-300/20 px-2 py-1 font-medium hover:bg-red-400/10 disabled:opacity-50"><RefreshCw size={12} /> Retry</button></div>}


          </div>
        </div>
      </div>
    </div>
  );
}
