'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Settings,
  X,
  Menu,
  ChevronRight,
  Code2,
  FileText,
  Lightbulb,
  Zap,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

// Speech recognition wrapper
function useSpeechToText(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) onTranscript(text);
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [onTranscript]);

  const toggle = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
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

  return { isListening, toggle };
}

// Code Block with Copy Button
function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className ? className.replace(/language-/, '') : 'code';
  const codeString = String(children).replace(/\n$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-border bg-[#0a0c14] text-gray-100 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-border text-xs text-muted">
        <span className="font-mono uppercase tracking-wider text-[11px] text-indigo-400">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: number;
  messages: any[];
}

function MainChatApp() {
  const [conversationId, setConversationId] = useState<string>('');
  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; data: string }>>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('syncink_theme') as 'dark' | 'light' | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('syncink_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  // AI SDK useChat
  const { messages, setMessages, sendMessage, status, error, stop, clearError } = useChat({
    id: conversationId,
    transport:
      typeof window !== 'undefined'
        ? new DefaultChatTransport({
            api: `/api/chat?conversationId=${conversationId}`,
          })
        : undefined,
  } as any);

  const isGenerating = status === 'submitted' || status === 'streaming';

  // Speech to text
  const { isListening, toggle: toggleSpeech } = useSpeechToText((text) => {
    setInputPrompt((prev) => (prev ? `${prev} ${text}` : text));
  });

  // Load history from localStorage
  const loadHistoryFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem('syncink_conversations');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // Save messages to history
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      try {
        const raw = localStorage.getItem('syncink_conversations');
        let list: ConversationItem[] = raw ? JSON.parse(raw) : [];

        let firstUserText = 'New Conversation';
        for (const rawM of messages) {
          const m = rawM as any;
          if (m.role === 'user') {
            if (typeof m.content === 'string' && m.content.trim()) {
              firstUserText = m.content.trim();
              break;
            }
            if (Array.isArray(m.parts)) {
              const txt = m.parts.find((p: any) => p.type === 'text')?.text;
              if (txt) {
                firstUserText = String(txt).trim();
                break;
              }
            }
          }
        }

        const title =
          firstUserText.length > 38 ? firstUserText.substring(0, 38) + '...' : firstUserText;

        const idx = list.findIndex((c) => c.id === conversationId);
        const item: ConversationItem = {
          id: conversationId,
          title: idx >= 0 && list[idx].title !== 'New Conversation' ? list[idx].title : title,
          updatedAt: Date.now(),
          messages: messages,
        };

        if (idx >= 0) {
          list[idx] = item;
        } else {
          list.unshift(item);
        }

        localStorage.setItem('syncink_conversations', JSON.stringify(list));
        setHistory([...list]);
      } catch (e) {
        console.error('Failed to save conversation:', e);
      }
    }
  }, [messages, conversationId]);

  // Initial load
  useEffect(() => {
    loadHistoryFromStorage();
    const newId = crypto.randomUUID();
    setConversationId(newId);
  }, [loadHistoryFromStorage]);

  // Auto scroll messages to bottom inside chat container only (prevents window scrolling)
  useEffect(() => {
    if (messages.length > 0 && chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, status]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputPrompt]);

  const handleStartNewChat = () => {
    setConversationId(crypto.randomUUID());
    setMessages([]);
    setInputPrompt('');
    setAttachments([]);
    clearError?.();
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectConversation = (conv: ConversationItem) => {
    setConversationId(conv.id);
    setMessages(conv.messages || []);
    setInputPrompt('');
    setAttachments([]);
    clearError?.();
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      const updated = history.filter((c) => c.id !== id);
      localStorage.setItem('syncink_conversations', JSON.stringify(updated));
      setHistory(updated);
      if (conversationId === id) {
        handleStartNewChat();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllHistory = () => {
    if (!confirm('Delete all conversation history? This cannot be undone.')) return;
    try {
      localStorage.removeItem('syncink_conversations');
      setHistory([]);
      handleStartNewChat();
      setIsSettingsOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setAttachments((prev) => [...prev, { name: file.name, type: file.type, data }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if ((!query && attachments.length === 0) || isGenerating) return;

    clearError?.();

    if (attachments.length > 0) {
      const parts: any[] = [];
      if (query) parts.push({ type: 'text', text: query });
      attachments.forEach((att) => {
        if (att.type.startsWith('image/')) {
          parts.push({ type: 'image', image: att.data });
        } else {
          parts.push({ type: 'text', text: `[Attached Document: ${att.name}]` });
        }
      });
      sendMessage({ text: query, parts } as any);
    } else {
      sendMessage({ text: query });
    }

    setInputPrompt('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const copyMessageContent = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex h-full w-full bg-background text-foreground overflow-hidden relative selection:bg-indigo-500/25">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-600/10 dark:bg-indigo-600/15 blur-[140px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-violet-600/10 dark:bg-violet-600/15 blur-[140px] pointer-events-none -z-10 mix-blend-screen" />

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-72 md:w-68 flex flex-col
          bg-surface/80 dark:bg-[#07080c]/80 backdrop-blur-2xl border-r border-border
          transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 pt-5 pb-3 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 flex-shrink-0 border border-white/10">
              <img src="/logo.png" alt="SyncInk Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-base tracking-tight flex items-center space-x-1.5">
                <span>SyncInk</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-indigo-500/20 border border-indigo-500/25 text-foreground font-medium text-sm transition-all duration-200 shadow-sm hover:shadow group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1 rounded-lg bg-indigo-500 text-white shadow-sm">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-semibold tracking-wide">New Chat</span>
            </div>
            <span className="text-[10px] text-muted font-mono px-1.5 py-0.5 rounded bg-surface border border-border">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Recent Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
            Recent Conversations
          </div>

          {history.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted/70">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            history.map((item) => {
              const isSelected = item.id === conversationId;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectConversation(item)}
                  className={`
                    group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 font-semibold border border-indigo-500/20 shadow-sm'
                        : 'text-foreground/80 hover:bg-surface-hover hover:text-foreground'
                    }
                  `}
                >
                  <span className="truncate flex-1 pr-2">{item.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-400 rounded transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Menu */}
        <div className="p-3 border-t border-border/50 bg-surface/50 dark:bg-black/20 flex flex-col space-y-2">
          {/* Theme Switcher & Settings */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 text-xs text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* User Account Tile */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors border border-transparent hover:border-border"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              SI
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">SyncInk User</p>
              <p className="text-[10px] text-muted truncate">Free Tier · 24/7 Live</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat View Area */}
      <main className="relative flex-1 flex flex-col h-full w-full min-w-0 bg-transparent overflow-hidden">
        {/* Top Floating App Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/40 backdrop-blur-md bg-surface/30 z-20">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="SyncInk Logo" className="w-5 h-5 rounded-md object-cover shadow-sm" />
              <span className="font-semibold text-sm text-foreground">SyncInk Intelligence</span>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartNewChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border/50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Scrollable Messages Stream */}
        <div
          ref={chatScrollContainerRef}
          className="flex-1 overflow-y-auto w-full custom-scrollbar px-4 sm:px-6 md:px-8 pb-32 pt-4"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              /* Hero Empty State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center pt-8 animate-in fade-in duration-700">
                {/* Glowing SyncInk Emblem */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 to-violet-500/40 rounded-3xl blur-2xl animate-pulse-subtle -z-10" />
                  <div className="w-20 h-20 rounded-3xl bg-surface/90 dark:bg-white/[0.04] border border-border shadow-2xl backdrop-blur-2xl p-2 flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="SyncInk Logo" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                  SyncInk AI
                </h1>
                <p className="text-sm sm:text-base text-muted font-normal max-w-md mb-8">
                  Fast, elegant intelligence for writing, code, research, and deep thinking.
                </p>

                {/* Prompt Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  <button
                    onClick={() => handleSendMessage('Explain how quantum computers work in simple terms.')}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-indigo-400 mb-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Explain simply</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      How quantum computers work in simple terms
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Draft a high-impact product announcement email.')}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-violet-400 mb-1.5">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Draft an email</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      High-impact product launch announcement
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Write a clean Next.js React component for an animated navbar.')}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-cyan-400 mb-1.5">
                      <Code2 className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Write clean code</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Next.js component for an animated navbar
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Brainstorm 5 innovative startup ideas for 2026.')}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1.5">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Brainstorm ideas</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      5 innovative startup ideas in tech for 2026
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((m: any) => {
                const isUser = m.role === 'user';
                const messageText =
                  typeof m.content === 'string'
                    ? m.content
                    : Array.isArray(m.parts)
                    ? m.parts
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('\n')
                    : '';

                const imageParts = Array.isArray(m.parts)
                  ? m.parts.filter((p: any) => p.type === 'image')
                  : [];

                return (
                  <div
                    key={m.id}
                    className={`flex w-full animate-in fade-in duration-300 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex space-x-3 max-w-[88%] sm:max-w-[82%] ${
                        isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm flex-shrink-0 mt-1 border border-border/60">
                          <img src="/logo.png" alt="SyncInk AI" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div className="flex flex-col space-y-1.5 min-w-0">
                        {/* Attachments (if user sent images) */}
                        {imageParts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-1 justify-end">
                            {imageParts.map((img: any, idx: number) => (
                              <img
                                key={idx}
                                src={img.image}
                                alt="Attachment"
                                className="max-w-[200px] max-h-[160px] object-cover rounded-xl border border-border shadow"
                              />
                            ))}
                          </div>
                        )}

                        {/* Content Box */}
                        <div
                          className={`
                            px-4 py-3 text-sm leading-relaxed rounded-2xl
                            ${
                              isUser
                                ? 'bg-indigo-600 text-white rounded-br-sm shadow-md font-normal'
                                : 'bg-surface/90 dark:bg-white/[0.04] border border-border text-foreground rounded-tl-sm shadow-sm backdrop-blur-xl'
                            }
                          `}
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap break-words">{messageText}</div>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                              <ReactMarkdown
                                components={{
                                  code({ className, children }) {
                                    const isInline = !className;
                                    if (isInline) {
                                      return (
                                        <code className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-indigo-400 font-mono text-xs font-medium">
                                          {children}
                                        </code>
                                      );
                                    }
                                    return <CodeBlock className={className}>{children}</CodeBlock>;
                                  },
                                }}
                              >
                                {messageText}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>

                        {/* Assistant Message Actions Bar */}
                        {!isUser && messageText && (
                          <div className="flex items-center space-x-2 pt-1 pl-1 text-muted">
                            <button
                              onClick={() => copyMessageContent(m.id, messageText)}
                              className="flex items-center space-x-1 text-[11px] hover:text-foreground p-1 rounded transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedMessageId === m.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* AI Streaming Indicator */}
            {isGenerating && (
              <div className="flex items-center space-x-3 text-muted text-xs animate-in fade-in duration-300 pl-2">
                <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-border/60 animate-pulse">
                  <img src="/logo.png" alt="SyncInk AI" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center space-x-1.5 py-2 px-3 rounded-full bg-surface border border-border">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-medium text-[12px]">SyncInk is thinking...</span>
                </div>
              </div>
            )}

            {/* Error Message Pill */}
            {error && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs backdrop-blur-md animate-in fade-in duration-300">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error.message || 'An error occurred while generating. Please try again.'}</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div className="h-2" />
          </div>
        </div>

        {/* Floating Composer Area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none flex justify-center z-30">
          <div className="w-full max-w-3xl pointer-events-auto">
            {/* Attachment preview tags */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-2 animate-in slide-in-from-bottom-2 duration-200">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-surface border border-border text-xs text-foreground shadow-sm"
                  >
                    <Paperclip className="w-3 h-3 text-indigo-400" />
                    <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="p-0.5 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Glass Pill Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-end bg-surface/95 dark:bg-[#10121a]/95 backdrop-blur-2xl border border-border rounded-2xl shadow-xl hover:border-indigo-500/30 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.12)] transition-all duration-300 p-1.5"
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.txt,.md"
              />

              {/* Left Action Buttons */}
              <div className="flex items-center space-x-1 mb-1 ml-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                  title="Attach images or files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    isListening
                      ? 'text-red-400 bg-red-500/10 animate-pulse'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice typing'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Text Input Area */}
              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask SyncInk anything... (Shift+Enter for newline)"
                className="flex-1 bg-transparent py-2.5 px-3 text-sm text-foreground placeholder:text-muted focus:outline-none resize-none min-h-[40px] max-h-[160px] leading-relaxed custom-scrollbar font-normal"
              />

              {/* Right Send / Stop Button */}
              <div className="flex items-center mb-1 mr-1">
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={() => stop()}
                    className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                    title="Stop generation"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() && attachments.length === 0}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-md cursor-pointer"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Bottom Disclaimer */}
            <p className="text-center text-[11px] text-muted/70 mt-2 font-medium tracking-wide">
              SyncInk AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal Dialog */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Account & Settings</h3>
                <p className="text-xs text-muted">Manage your preferences and data</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Appearance */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-border/60">
                <div className="font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Appearance</span>
                  <span className="text-[11px] text-muted font-normal capitalize">{theme}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setTheme('light');
                      localStorage.setItem('syncink_theme', 'light');
                      document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', 'light');
                    }}
                    className={`p-2 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                      theme === 'light'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 font-semibold'
                        : 'border-border text-muted hover:text-foreground'
                    }`}
                  >
                    Light Theme
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                      localStorage.setItem('syncink_theme', 'dark');
                      document.documentElement.classList.add('dark');
                      document.documentElement.setAttribute('data-theme', 'dark');
                    }}
                    className={`p-2 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-semibold'
                        : 'border-border text-muted hover:text-foreground'
                    }`}
                  >
                    Dark Theme
                  </button>
                </div>
              </div>

              {/* Model Info */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-border/60">
                <div className="font-semibold text-foreground mb-1">Intelligence Engine</div>
                <p className="text-muted leading-relaxed text-[11px]">
                  SyncInk AI is powered by high-speed Gemini 3.6 Flash with real-time reasoning and zero-latency responses.
                </p>
              </div>

              {/* Data & History */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-border/60">
                <div className="font-semibold text-foreground mb-1">Privacy & Data</div>
                <p className="text-muted mb-3 text-[11px] leading-relaxed">
                  Your chat conversations are securely stored directly in your browser. Nothing is shared with 3rd parties.
                </p>
                <button
                  onClick={handleClearAllHistory}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Conversations</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted">
              <span>SyncInk AI v2.5</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted & Verified</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(MainChatApp), { ssr: false });
