"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RiRobotLine, RiSendPlaneLine, RiUserLine, RiVolumeUpLine, RiMicLine, RiDeleteBin2Line, RiAddLine } from "react-icons/ri";
import AuthModal from "@/components/AuthModal";
import {
  askRagAssistant,
  getChatSession,
  getChatSessions,
  saveChatSession,
  translateAssistantText,
  speakText,
  deleteChatSession,
} from "@/utils/api";

const LANGUAGES = [
  { code: "ur", label: "Urdu", speech: "ur-PK", dir: "rtl" },
  { code: "pa", label: "Punjabi", speech: "ur-PK", dir: "rtl" },
  { code: "en", label: "English", speech: "en-US", dir: "ltr" },
];

const getLanguage = (code) => LANGUAGES.find((language) => language.code === code) || LANGUAGES[0];

const makeTitle = (messages) => {
  const firstQuestion = messages.find((message) => message.sender === "user")?.text;
  return firstQuestion?.slice(0, 80) || "AgriSense chat";
};

export const ChatMessage = ({
  message,
  index,
  onSpeak,
  onTranslate,
  translating,
}) => {
  const isUser = message.sender === "user";
  const language = getLanguage(message.language || "en");
  const [translatedText, setTranslatedText] = useState(null);
  const hasReliableSources = !isUser && message.sources && message.sources.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`flex gap-3 max-w-[88%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className="flex-shrink-0">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${
            isUser ? "bg-emerald-600" : hasReliableSources ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-yellow-100 dark:bg-yellow-900/40"
          }`}>
            {isUser ? (
              <RiUserLine className="w-4 h-4 text-white" />
            ) : (
              <RiRobotLine className={`w-4 h-4 ${hasReliableSources ? "text-emerald-700 dark:text-emerald-300" : "text-yellow-700 dark:text-yellow-300"}`} />
            )}
          </div>
        </div>

        <div>
          <div
            dir={language.dir}
            className={`relative px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                ? "bg-emerald-600 text-white"
                : hasReliableSources
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-emerald-100 dark:border-gray-700"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-2 border-yellow-200 dark:border-yellow-700/50"
            }`}
          >
            {!isUser && !hasReliableSources && (
              <div className="mb-2 inline-block rounded bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                💡 General Knowledge (No Source Documents)
              </div>
            )}
            {!isUser && hasReliableSources && (
              <div className="mb-2 inline-block rounded bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                ✅ From OCR Documents
              </div>
            )}
            <p className="text-sm leading-7 break-words whitespace-pre-wrap">
              {translatedText || message.text}
            </p>
          </div>

          {!isUser && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSpeak({ ...message, text: translatedText || message.text })}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-gray-700 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-800"
              >
                <RiVolumeUpLine className="w-3.5 h-3.5" />
                Listen
              </button>

              {LANGUAGES.filter((item) => item.code !== message.language).map((item) => (
                <button
                  key={item.code}
                  onClick={() => onTranslate(message.id, item.code, setTranslatedText)}
                  disabled={translating === message.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {translating === message.id ? "Changing..." : `Change to ${item.label}`}
                </button>
              ))}
            </div>
          )}

          {!isUser && message.sources?.length > 0 && (
            <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">📄 Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.sources.slice(0, 5).map((source, idx) => (
                  <span key={idx} className="inline-block text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-700">
                    {source.source} <span className="text-emerald-600 dark:text-emerald-400">p.{source.page}</span>
                  </span>
                ))}
                {message.sources.length > 5 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    +{message.sources.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function AssistantContent() {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      sender: "ai",
      text: "السلام علیکم! فصل، کیڑے، بیماری، کھاد یا آبپاشی کے بارے میں سوال پوچھیں۔",
      language: "ur",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [inputLanguage, setInputLanguage] = useState("ur");
  const [inputTargetLanguage, setInputTargetLanguage] = useState("en");
  const [language, setLanguage] = useState("ur");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(null);
  const [inputTranslating, setInputTranslating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [savedSessions, setSavedSessions] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const aiReplyCount = useMemo(
    () => messages.filter((message) => message.sender === "ai").length - 1,
    [messages]
  );

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        const langMap = { ur: "ur-PK", pa: "ur-PK", en: "en-US" };
        recognitionRef.current.lang = langMap[inputLanguage] || "ur-PK";
        
        recognitionRef.current.onresult = (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = () => {
          setIsListening(false);
          setError("Voice input failed. Please try again.");
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [inputLanguage]);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      getChatSessions(savedToken)
        .then((data) => setSavedSessions(data.sessions || []))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  useEffect(() => {
    if (!user && aiReplyCount >= 2) {
      setShowAuthModal(true);
    }
  }, [aiReplyCount, user]);

  const persistMessages = async (nextMessages) => {
    if (!token) return;
    try {
      const data = await saveChatSession({
        token,
        sessionId,
        title: makeTitle(nextMessages),
        language,
        messages: nextMessages,
      });
      if (data.session?.id) {
        setSessionId(data.session.id);
      }
    } catch (err) {
      console.error("Failed to save chat session:", err);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "ai",
        text: "السلام علیکم! فصل، کیڑے، بیماری، کھاد یا آبپاشی کے بارے میں سوال پوچھیں۔",
        language: "ur",
        createdAt: new Date().toISOString(),
      },
    ]);
    setSessionId(null);
    setInput("");
    setLanguage("ur");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input.trim(),
      language: inputLanguage,
      createdAt: new Date().toISOString(),
    };
    const pendingMessages = [...messages, userMessage];
    setMessages(pendingMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await askRagAssistant({
        question: userMessage.text,
        language: inputLanguage,
        chatHistory: pendingMessages,
      });

      const aiMessage = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: response.answer,
        language: response.language,
        sources: response.sources || [],
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...pendingMessages, aiMessage];
      setMessages(nextMessages);
      setLanguage(response.language);
      await persistMessages(nextMessages);
    } catch (err) {
      setError(err.message || "RAG assistant is unavailable. Start the RAG API on port 8001.");
      setMessages([
        ...pendingMessages,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "Sorry, I could not reach the agriculture knowledge base right now. Please make sure the RAG server is running.",
          language: "en",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (messageId, targetLanguage, setTranslatedText) => {
    const message = messages.find((item) => item.id === messageId);
    if (!message) return;

    setTranslating(messageId);
    setError("");
    try {
      const result = await translateAssistantText({
        text: message.text,
        language: targetLanguage,
      });
      setTranslatedText(result.text);
    } catch (err) {
      setError(err.message || "Translation failed.");
    } finally {
      setTranslating(null);
    }
  };

  const speak = async (message) => {
    setError("");
    try {
      const audioBlob = await speakText({
        text: message.text,
        language: message.language,
      });

      // Play audio using Web Audio API
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (err) {
      setError(err.message || "Could not generate audio. Please try again.");
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setError("Voice input is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleAuthSuccess = async (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setShowAuthModal(false);
    try {
      await saveChatSession({
        token: userToken,
        sessionId,
        title: makeTitle(messages),
        language,
        messages,
      });
      const data = await getChatSessions(userToken);
      setSavedSessions(data.sessions || []);
    } catch (err) {
      setError("Logged in, but chat history could not be saved yet.");
    }
  };

  const handleDeleteChat = async (sessionIdToDelete) => {
    if (!token) return;
    
    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return;
    }

    try {
      setError("");
      await deleteChatSession({ token, sessionId: sessionIdToDelete });
      
      // Refresh the saved sessions list
      const data = await getChatSessions(token);
      setSavedSessions(data.sessions || []);
      
      // If the deleted chat was the current one, clear it
      if (sessionId === sessionIdToDelete) {
        startNewChat();
      }
    } catch (err) {
      setError(err.message || "Could not delete chat. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5 flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center">
              <RiRobotLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AgriSense RAG Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask from OCR agriculture PDFs in Urdu, Punjabi, or English
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RiAddLine className="w-4 h-4" />
              New Chat
            </button>
            {!user && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Login to save
              </button>
            )}
            {user && (
              <span className="rounded-xl bg-emerald-100 dark:bg-emerald-900/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                Saving for {user.name}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <main className="flex h-[calc(100vh-250px)] min-h-[560px] flex-col rounded-2xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  index={index}
                  onSpeak={speak}
                  onTranslate={handleTranslate}
                  translating={translating}
                />
              ))}
              {loading && (
                <div className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
                  Searching OCR documents and asking LLM...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-800 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={inputLanguage}
                    onChange={(e) => setInputLanguage(e.target.value)}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-100"
                  >
                    {LANGUAGES.map((item) => (
                      <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Input language</span>

                  <select
                    value={inputTargetLanguage}
                    onChange={(e) => setInputTargetLanguage(e.target.value)}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-100"
                    title="Translate input to"
                  >
                    {LANGUAGES.map((item) => (
                      <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={async () => {
                      if (!input.trim()) return;
                      setInputTranslating(true);
                      setError("");
                      try {
                        const result = await translateAssistantText({ text: input, language: inputTargetLanguage });
                        if (result && result.text) {
                          setInput(result.text);
                          setInputLanguage(inputTargetLanguage);
                        }
                      } catch (err) {
                        setError(err.message || "Translation failed.");
                      } finally {
                        setInputTranslating(false);
                      }
                    }}
                    disabled={inputTranslating || !input.trim()}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    {inputTranslating ? "Translating..." : "Translate"}
                  </button>

                  <span className="text-xs text-gray-500 dark:text-gray-400">Translate before sending</span>
                </div>
                
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    dir={getLanguage(inputLanguage).dir}
                    rows={2}
                    maxLength={800}
                    disabled={loading}
                    placeholder="اپنا سوال لکھیں... Type your farming question..."
                    className="min-h-12 flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={toggleVoiceInput}
                      disabled={loading}
                      className={`inline-flex items-center justify-center rounded-2xl px-3 py-3 text-sm font-semibold ${
                        isListening
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      }`}
                      title="Voice input"
                    >
                      <RiMicLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <RiSendPlaneLine className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="rounded-2xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white">Saved Chats</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Login after two replies to keep your chat history.
            </p>
            <div className="mt-4 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
              {savedSessions.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No saved chats yet.</p>
              )}
              {savedSessions.map((session) => (
                <div key={session.id} className="flex items-start gap-2">
                  <button
                    onClick={async () => {
                      setSessionId(session.id);
                      if (!token) return;
                      try {
                        const data = await getChatSession({ token, sessionId: session.id });
                        if (data.session?.messages?.length) {
                          const messagesWithIds = data.session.messages.map((msg) => ({
                            ...msg,
                            id: msg.id || crypto.randomUUID(),
                          }));
                          setMessages(messagesWithIds);
                          setLanguage(data.session.language || "ur");
                          setInputLanguage(data.session.language || "ur");
                        }
                      } catch (err) {
                        setError("Could not load that saved chat.");
                      }
                    }}
                    className="flex-1 rounded-xl border border-gray-100 dark:border-gray-800 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-800"
                  >
                    <span className="line-clamp-2">{session.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(session.id);
                    }}
                    title="Delete this chat"
                    className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <RiDeleteBin2Line className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
