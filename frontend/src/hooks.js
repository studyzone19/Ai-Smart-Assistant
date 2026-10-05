import { useState, useRef, useCallback, useEffect } from "react";

/**
 * useVoiceInput - wraps the browser SpeechRecognition API.
 * States: "idle" | "listening" | "processing" | "done" | "unsupported"
 */
export function useVoiceInput(onResult) {
  const [status, setStatus] = useState("idle");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("unsupported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => setStatus("listening");
    recognition.onspeechend = () => setStatus("processing");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 600);
    };
    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => setStatus((s) => (s === "listening" ? "idle" : s));

    recognitionRef.current = recognition;
  }, [onResult]);

  const start = useCallback(() => {
    if (recognitionRef.current && status === "idle") {
      try {
        recognitionRef.current.start();
      } catch (e) {
        /* already started */
      }
    }
  }, [status]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { status, start, stop };
}

/**
 * useVoiceOutput - wraps the browser SpeechSynthesis API.
 * Never auto-speaks; only speaks when play() is explicitly called.
 */
export function useVoiceOutput() {
  const [speakingId, setSpeakingId] = useState(null);
  const utterRef = useRef(null);

  const play = useCallback((text, id) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    utterRef.current = utter;
    setSpeakingId(id);
    window.speechSynthesis.speak(utter);
  }, []);

  const pause = useCallback(() => window.speechSynthesis?.pause(), []);
  const resume = useCallback(() => window.speechSynthesis?.resume(), []);
  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  return { speakingId, play, pause, resume, stop, supported: !!window.speechSynthesis };
}
