'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { useChat } from '@ai-sdk/react';
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs';
import { DefaultChatTransport } from 'ai';

class RootErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state: {error: Error | null} = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Caught by RootErrorBoundary:", error, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-red-950 text-white p-8">
          <h1 className="text-3xl font-bold mb-4">CRITICAL CRASH</h1>
          <pre className="bg-black/50 p-6 rounded-xl overflow-auto w-full max-w-4xl text-xs text-red-200 whitespace-pre-wrap">
            {err.message}{'\n\n'}
            {err.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
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
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  Lightbulb,
  Zap,
  Globe,
  Brain,
  Volume2,
  VolumeX,
  Download,
  Pin,
  PinOff,
  Edit2,
  CheckCheck,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  UserCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import { SidebarUserTile, TopBarAuthButton } from '@/components/AuthSection';

// Speech-to-Text hook
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

// Text-to-Speech hook
function useTextToSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speak = (id: string, rawText: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = rawText
      .replace(/<thought>[\s\S]*?<\/thought>/g, '')
      .replace(/```[\s\S]*?```/g, 'code snippet')
      .replace(/[*_#`~\[\]]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  return { speakingId, speak, stop };
}

// Code Block with Copy Action
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
        <span className="font-mono uppercase tracking-wider text-[11px] text-indigo-400 font-semibold">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10 cursor-pointer"
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

// Deep Reasoning Thinking Accordion
function ThoughtAccordion({ thought }: { thought: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] overflow-hidden text-xs backdrop-blur-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-indigo-400 dark:text-indigo-300 font-medium hover:bg-indigo-500/[0.05] transition-colors cursor-pointer"
      >
        <span className="flex items-center space-x-2">
          <Brain className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          <span className="font-semibold tracking-wide">Deep Reasoning Process</span>
        </span>
        <div className="flex items-center space-x-1.5 text-[11px] text-muted">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-3.5 py-2.5 text-muted leading-relaxed font-mono text-[11px] whitespace-pre-wrap border-t border-indigo-500/15 bg-black/10 dark:bg-black/20">
          {thought}
        </div>
      )}
    </div>
  );
}

interface UserProfile {
  name: string;
  email: string;
  plan: 'SyncInk Pro' | 'Free Tier';
  avatarUrl?: string;
  provider: 'google' | 'discord' | 'github' | 'email' | 'guest';
}

interface ConversationItem {
  id: string;
  title: string;
  updatedAt: number;
  messages: any[];
  isPinned?: boolean;
}

type IntelligenceMode = 'fast' | 'deep' | 'web' | 'creative';

const MODES: { id: IntelligenceMode; label: string; icon: any; desc: string }[] = [
  { id: 'fast', label: 'SyncInk Fast', icon: Zap, desc: 'Ultra-fast sub-second responses' },
  { id: 'web', label: 'Web Search', icon: Globe, desc: 'Live Google search grounding & citations' },
  { id: 'deep', label: 'Deep Reason', icon: Brain, desc: 'Step-by-step logic & problem-solving' },
  { id: 'creative', label: 'Creative Studio', icon: Sparkles, desc: 'Rich prose, copy & brainstorming' },
];

function MainChatApp() {
  const [conversationId, setConversationId] = useState<string>('');
  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Auth Form State
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeMode, setActiveMode] = useState<IntelligenceMode>('fast');
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; data: string }>>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Inline rename state
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text to speech
  const { speakingId, speak, stop: stopSpeech } = useTextToSpeech();

  // Speech to text
  const { isListening, toggle: toggleSpeech } = useSpeechToText((text) => {
    setInputPrompt((prev) => (prev ? `${prev} ${text}` : text));
  });

  // Initialize theme, user, and preferences
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

      const savedUser = localStorage.getItem('syncink_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      const savedInstructions = localStorage.getItem('syncink_custom_instructions') || '';
      setCustomInstructions(savedInstructions);

      const handleOpenAuth = () => setIsAuthModalOpen(true);
      window.addEventListener('syncink:open-auth-modal', handleOpenAuth);
      return () => window.removeEventListener('syncink:open-auth-modal', handleOpenAuth);
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
  const effectiveMode = isWebSearchActive ? 'web' : activeMode;
  const { messages, setMessages, sendMessage, status, error, stop, clearError } = useChat({
    id: conversationId,
    transport:
      typeof window !== 'undefined'
        ? new DefaultChatTransport({
            api: `/api/chat?conversationId=${conversationId}&mode=${effectiveMode}&webSearch=${isWebSearchActive}`,
          })
        : undefined,
  } as any);

  const isGenerating = status === 'submitted' || status === 'streaming';

  // Load history from localStorage
  const loadHistoryFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem('syncink_conversations');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(
            parsed.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return b.updatedAt - a.updatedAt;
            })
          );
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
        const existing = idx >= 0 ? list[idx] : null;

        const item: ConversationItem = {
          id: conversationId,
          title: existing && existing.title !== 'New Conversation' ? existing.title : title,
          updatedAt: Date.now(),
          messages: messages,
          isPinned: existing?.isPinned ?? false,
        };

        if (idx >= 0) {
          list[idx] = item;
        } else {
          list.unshift(item);
        }

        localStorage.setItem('syncink_conversations', JSON.stringify(list));
        setHistory(
          list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
          })
        );
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

  // Auto scroll messages to bottom inside container ONLY
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
    stopSpeech();
    setConversationId(crypto.randomUUID());
    setMessages([]);
    setInputPrompt('');
    setAttachments([]);
    clearError?.();
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectConversation = (conv: ConversationItem) => {
    stopSpeech();
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

  const togglePinConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const updated = history.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c));
      localStorage.setItem('syncink_conversations', JSON.stringify(updated));
      setHistory(
        updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const startRename = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingChatId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      const updated = history.map((c) => (c.id === id ? { ...c, title: editingTitle.trim() } : c));
      localStorage.setItem('syncink_conversations', JSON.stringify(updated));
      setHistory(updated);
      setEditingChatId(null);
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

  const exportCurrentChat = () => {
    if (messages.length === 0) {
      alert('No messages to export.');
      return;
    }

    const currentConv = history.find((c) => c.id === conversationId);
    const title = currentConv?.title || 'SyncInk_AI_Chat';

    let markdown = `# ${title}\n\n*Exported from SyncInk AI on ${new Date().toLocaleString()}*\n\n---\n\n`;

    for (const rawM of messages) {
      const m = rawM as any;
      const isUser = m.role === 'user';
      const sender = isUser ? '👤 User' : '⚡ SyncInk AI';
      const text =
        typeof m.content === 'string'
          ? m.content
          : Array.isArray(m.parts)
          ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n')
          : '';

      markdown += `### ${sender}\n\n${text}\n\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    stopSpeech();

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
    const clean = text.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
    navigator.clipboard.writeText(clean);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Auth Handlers
  const handleSocialLogin = (provider: 'google' | 'discord' | 'github') => {
    const profileNames: Record<string, string> = {
      google: 'Google User',
      discord: 'SyncInk Pioneer',
      github: 'GitHub Developer',
    };

    const newProfile: UserProfile = {
      name: profileNames[provider] || 'SyncInk Member',
      email: `${provider}_user@syncink.dev`,
      plan: 'SyncInk Pro',
      provider,
    };

    setUser(newProfile);
    localStorage.setItem('syncink_user', JSON.stringify(newProfile));
    window.dispatchEvent(new Event('storage'));
    setIsAuthModalOpen(false);
    setAuthError('');
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const newProfile: UserProfile = {
      name: authName.trim() || authEmail.split('@')[0],
      email: authEmail.trim(),
      plan: 'SyncInk Pro',
      provider: 'email',
    };

    setUser(newProfile);
    localStorage.setItem('syncink_user', JSON.stringify(newProfile));
    window.dispatchEvent(new Event('storage'));
    setIsAuthModalOpen(false);
    setAuthError('');
    setAuthPassword('');
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('syncink_user');
    window.dispatchEvent(new Event('storage'));
    setIsSettingsOpen(false);
  };



  return (
    <RootErrorBoundary>
      <SignedIn>
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
            className="md:hidden p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
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
          <div className="px-2 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-[10px] text-muted/60">{history.length}</span>
          </div>

          {history.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted/70">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            history.map((item) => {
              const isSelected = item.id === conversationId;
              const isEditing = editingChatId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => !isEditing && handleSelectConversation(item)}
                  className={`
                    group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 font-semibold border border-indigo-500/20 shadow-sm'
                        : 'text-foreground/80 hover:bg-surface-hover hover:text-foreground'
                    }
                  `}
                >
                  {isEditing ? (
                    <div className="flex items-center space-x-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(e, item.id);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        autoFocus
                        className="flex-1 bg-surface border border-indigo-500/50 rounded px-2 py-0.5 text-xs text-foreground focus:outline-none"
                      />
                      <button
                        onClick={(e) => saveRename(e, item.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1.5 truncate flex-1 pr-1">
                        {item.isPinned && <Pin className="w-3 h-3 text-indigo-400 flex-shrink-0 rotate-45" />}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                        <button
                          onClick={(e) => togglePinConversation(e, item.id)}
                          className="p-1 text-muted hover:text-indigo-400 rounded"
                          title={item.isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          {item.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => startRename(e, item)}
                          className="p-1 text-muted hover:text-foreground rounded"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(e, item.id)}
                          className="p-1 text-muted hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
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

          {/* User Account Tile / Real Clerk Auth */}
          <SidebarUserTile onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      </aside>

      {/* Main Chat View Area */}
      <main className="relative flex-1 flex flex-col h-full w-full min-w-0 bg-transparent overflow-hidden">
        {/* Top Floating App Bar */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 backdrop-blur-md bg-surface/30 z-20">
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
            {/* Mode Indicator & Selector */}
            <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-surface border border-border text-xs">
              {MODES.map((m) => {
                const Icon = m.icon;
                const isActive = activeMode === m.id && !isWebSearchActive;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMode(m.id);
                      if (m.id === 'web') setIsWebSearchActive(true);
                      else setIsWebSearchActive(false);
                    }}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                    title={m.desc}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label.replace('SyncInk ', '')}</span>
                  </button>
                );
              })}
            </div>

            {/* Real Clerk Auth Button */}
            <TopBarAuthButton />

            {/* Export Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={exportCurrentChat}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border/50 transition-colors cursor-pointer"
                title="Export chat as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Export</span>
              </button>
            )}

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
          className="flex-1 overflow-y-auto w-full custom-scrollbar px-4 sm:px-6 md:px-8 pb-36 pt-4"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              /* Hero Empty State */
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center pt-6 animate-in fade-in duration-700">
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
                  Supercharged with Google Search Grounding, Deep Reasoning, and High-Speed Code Generation.
                </p>

                {/* Prompt Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  <button
                    onClick={() => {
                      setIsWebSearchActive(true);
                      handleSendMessage('What are the latest 2026 gaming and tech releases announced recently?');
                    }}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-cyan-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-cyan-400 mb-1.5">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Live Web Search</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Latest 2026 tech and game releases with Google Grounding
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMode('deep');
                      handleSendMessage('Analyze how to design a fault-tolerant microservices distributed system step by step.');
                    }}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-indigo-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-indigo-400 mb-1.5">
                      <Brain className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Deep Reasoning</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Step-by-step logic breakdown for complex architectures
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Write a high-performance React component for a glassy search modal.')}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-violet-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-violet-400 mb-1.5">
                      <Code2 className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Write Clean Code</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      High-performance React glassy component with copy support
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMode('creative');
                      handleSendMessage('Write a compelling, cinematic story opening about an AI finding its creator.');
                    }}
                    className="p-4 rounded-2xl bg-surface/60 dark:bg-white/[0.02] hover:bg-surface dark:hover:bg-white/[0.06] border border-border hover:border-emerald-500/30 transition-all duration-200 shadow-sm hover:shadow-md group text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-semibold text-foreground">Creative Studio</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Cinematic storytelling with rich vocabulary and tone
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((rawM: any) => {
                const m = rawM as any;
                const isUser = m.role === 'user';
                const rawContent =
                  typeof m.content === 'string'
                    ? m.content
                    : Array.isArray(m.parts)
                    ? m.parts
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('\n')
                    : '';

                // Extract <thought>...</thought> if present
                const thoughtMatch = rawContent.match(/<thought>([\s\S]*?)<\/thought>/);
                const thoughtText = thoughtMatch ? thoughtMatch[1].trim() : null;
                const messageText = rawContent.replace(/<thought>[\s\S]*?<\/thought>/, '').trim();

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
                      className={`flex space-x-3 max-w-[88%] sm:max-w-[84%] ${
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

                        {/* Deep Reasoning Thought Accordion (if present) */}
                        {!isUser && thoughtText && <ThoughtAccordion thought={thoughtText} />}

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

                            <button
                              onClick={() => speak(m.id, messageText)}
                              className={`flex items-center space-x-1 text-[11px] p-1 rounded transition-colors cursor-pointer ${
                                speakingId === m.id
                                  ? 'text-indigo-400 font-semibold'
                                  : 'hover:text-foreground'
                              }`}
                              title={speakingId === m.id ? 'Stop speaking' : 'Read aloud'}
                            >
                              {speakingId === m.id ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-red-400" />
                                  <span className="text-red-400">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>Listen</span>
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
                <div className="flex items-center space-x-2 py-2 px-3.5 rounded-full bg-surface border border-border shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span className="font-medium text-[12px]">
                    {isWebSearchActive
                      ? 'Searching Google live & generating...'
                      : activeMode === 'deep'
                      ? 'SyncInk is reasoning step-by-step...'
                      : 'SyncInk is generating response...'}
                  </span>
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
                      className="p-0.5 hover:text-red-400 transition-colors cursor-pointer"
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
                {/* Attach Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                  title="Attach images or files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Web Search Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsWebSearchActive(!isWebSearchActive)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                    isWebSearchActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm font-semibold'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                  title={isWebSearchActive ? 'Live Web Search Active' : 'Enable Live Web Search'}
                >
                  <Globe className={`w-4 h-4 ${isWebSearchActive ? 'animate-pulse' : ''}`} />
                  {isWebSearchActive && <span className="text-[10px] hidden sm:inline">Search</span>}
                </button>

                {/* Voice Input Button */}
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
                placeholder={
                  isWebSearchActive
                    ? 'Search the web live with SyncInk... (Shift+Enter for newline)'
                    : activeMode === 'deep'
                    ? 'Ask for deep reasoning & step-by-step logic...'
                    : 'Ask SyncInk anything... (Shift+Enter for newline)'
                }
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
            <div className="flex items-center justify-center space-x-3 text-[11px] text-muted/70 mt-2 font-medium tracking-wide">
              <span>SyncInk AI can make mistakes. Verify important information.</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline flex items-center space-x-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3 h-3 inline" />
                <span>Gemini 3.6 Engine</span>
              </span>
            </div>
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
                <p className="text-xs text-muted">Manage your preferences, engine & data</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Profile Card if Logged In */}
              {user ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm flex items-center space-x-1.5">
                        <span>{user.name}</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold border border-indigo-500/30">
                          {user.plan}
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-muted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">Sign In to SyncInk</h4>
                    <p className="text-[11px] text-muted">Sync conversations and access Pro modes.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

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

              {/* Custom AI Persona / Instructions */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-border/60">
                <div className="font-semibold text-foreground mb-1">Custom System Persona</div>
                <p className="text-muted text-[11px] mb-2">
                  Instruct SyncInk how to behave (e.g. &quot;Be extremely concise&quot;, &quot;Expert Python Engineer&quot;).
                </p>
                <textarea
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    localStorage.setItem('syncink_custom_instructions', e.target.value);
                  }}
                  placeholder="Enter custom instructions..."
                  rows={2}
                  className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-indigo-500/50 resize-none font-normal"
                />
              </div>

              {/* Engine Specs */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-border/60">
                <div className="font-semibold text-foreground mb-1">Intelligence Features</div>
                <ul className="text-muted space-y-1 text-[11px]">
                  <li>• <strong>Google Search Grounding:</strong> Real-time internet access enabled</li>
                  <li>• <strong>Deep Reasoning:</strong> Step-by-step logic breakdown</li>
                  <li>• <strong>Audio Read Aloud:</strong> Native speech synthesis engine</li>
                  <li>• <strong>Export:</strong> One-click Markdown export</li>
                </ul>
              </div>

              {/* Data & History */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-border/60">
                <div className="font-semibold text-foreground mb-1">Privacy & Data</div>
                <p className="text-muted mb-3 text-[11px] leading-relaxed">
                  Your chat conversations are stored only inside your browser. No personal logs are stored on the server.
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

            <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
              <span>SyncInk AI Pro v3.0</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified & Encrypted</span>
              </span>
            </div>
          </div>
        </div>
      )}

        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <SignIn />
        </div>
      </SignedOut>
    </RootErrorBoundary>
  );
}

export default dynamic(() => Promise.resolve(MainChatApp), { ssr: false });
