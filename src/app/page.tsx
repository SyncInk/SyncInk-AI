'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Bot, User, Paperclip, X, Menu, Plus, MessageSquare, 
  Settings, Mic, Sparkles, FileText, LayoutGrid, Zap, Trash2, Edit2
} from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';

// Basic Speech Recognition wrapper
const useSpeechRecognition = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [onResult]);

  const toggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser.");
        return;
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return { isListening, toggle };
};

import dynamic from 'next/dynamic';

function ChatApp() {
  const [conversationId, setConversationId] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');

  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: conversationId,
    transport: typeof window !== 'undefined' ? new DefaultChatTransport({
      api: `/api/chat?conversationId=${conversationId}`
    }) : undefined,
    onFinish: () => {
      fetchHistory(); // refresh history for updated titles
    }
  } as any);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, toggle: toggleMic } = useSpeechRecognition((text) => {
    setInput((prev) => prev ? `${prev} ${text}` : text);
  });

  const fetchHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem('syncink_history');
      if (stored) {
        setHistory(JSON.parse(stored).sort((a:any, b:any) => b.updatedAt - a.updatedAt));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      try {
        const stored = localStorage.getItem('syncink_history');
        let hist = stored ? JSON.parse(stored) : [];
        let convIndex = hist.findIndex((c:any) => c.id === conversationId);
        
        let title = "New Conversation";
        if (convIndex >= 0 && hist[convIndex].title && hist[convIndex].title !== "New Conversation") {
          title = hist[convIndex].title;
        } else if ((messages[0] as any)?.content) {
          const content = (messages[0] as any).content;
          title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
        } else if (messages[0]?.parts) {
          const textPart = messages[0].parts.find((p:any) => p.type === 'text');
          const text = (textPart as any)?.text || 'Chat';
          title = text.substring(0, 40) + (text.length > 40 ? '...' : '');
        }

        const convObj = {
          id: conversationId,
          title,
          updatedAt: Date.now(),
          messages: messages
        };

        if (convIndex >= 0) {
          hist[convIndex] = convObj;
        } else {
          hist.unshift(convObj);
        }
        
        localStorage.setItem('syncink_history', JSON.stringify(hist));
        setHistory(hist.sort((a:any, b:any) => b.updatedAt - a.updatedAt));
      } catch (e) {
        console.error(e);
      }
    }
  }, [messages, conversationId]);

  // Initialize
  useEffect(() => {
    setIsMounted(true);
    fetchHistory();
    // Default to a new ID if none
    if (!conversationId) setConversationId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const loadConversation = (id: string) => {
    try {
      setConversationId(id);
      const stored = localStorage.getItem('syncink_history');
      if (stored) {
        const hist = JSON.parse(stored);
        const conv = hist.find((c:any) => c.id === id);
        if (conv) {
          setMessages(conv.messages || []);
        } else {
          setMessages([]);
        }
      }
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    setConversationId(crypto.randomUUID());
    setMessages([]);
    setInput('');
    setAttachments([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      const stored = localStorage.getItem('syncink_history');
      if (stored) {
        let hist = JSON.parse(stored);
        hist = hist.filter((c:any) => c.id !== id);
        localStorage.setItem('syncink_history', JSON.stringify(hist));
        setHistory(hist);
      }
      if (conversationId === id) startNewChat();
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const isProcessing = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (isProcessing) return;
    
    const parts: any[] = [];
    if (input.trim()) parts.push({ type: 'text', text: input });

    for (const file of attachments) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      if (file.type.startsWith('image/')) {
        parts.push({ type: 'image', image: dataUrl });
      } else {
        parts.push({ type: 'file', data: dataUrl, mimeType: file.type });
      }
    }
    
    // Pass parts directly to support attachments
    sendMessage({ role: 'user', parts } as any);
    setInput('');
    setAttachments([]);
    
    // Ensure history updates if it's a new chat
    if (messages.length === 0) {
      setTimeout(fetchHistory, 1500);
    }
  };

  if (!isMounted) return <div className="h-full w-full bg-[#020204]" />;

  return (
    <div className="h-full w-full flex bg-[#020204] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-hidden relative" suppressHydrationWarning>
      
      {/* Background Ambient Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 flex flex-col
        bg-white/[0.02] backdrop-blur-2xl border-r border-white/[0.05] shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative p-1.5 bg-white/5 rounded-xl border border-white/10 shadow-inner backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-xl blur-sm -z-10"></div>
              <img src="/logo.png" alt="SyncInk" className="w-6 h-6 object-cover rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-white/90">
              SyncInk <span className="font-light opacity-70">AI</span>
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2">
          <button onClick={startNewChat} className="w-full flex items-center space-x-3 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-100 border border-indigo-500/20 rounded-2xl transition-all shadow-sm hover:shadow-indigo-500/10 group">
            <Plus className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
          <div>
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 px-2">Recent</h3>
            <ul className="space-y-1">
              {history.length === 0 ? (
                <li className="px-3 py-2 text-white/30 text-xs">No conversations yet.</li>
              ) : (
                history.map((conv) => (
                  <li key={conv.id} className="group flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors hover:bg-white/5">
                    <button 
                      onClick={() => loadConversation(conv.id)}
                      className={`flex-1 flex items-center space-x-3 text-left truncate ${conversationId === conv.id ? 'text-indigo-300 font-medium' : 'text-white/60 hover:text-white'}`}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                    <button onClick={(e) => deleteConversation(e, conv.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-md transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-white/[0.05]">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center space-x-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm text-left">
            <Settings className="w-4 h-4 opacity-60" />
            <span>Settings</span>
          </button>
          <div onClick={() => setIsSettingsOpen(true)} className="mt-2 flex items-center space-x-3 px-3 py-2 text-white/80 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-inner">
              SI
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">SyncInk User</p>
              <p className="text-xs text-white/40 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="relative flex-1 flex flex-col h-full w-full min-w-0 bg-transparent">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-xl z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white/70 hover:text-white bg-white/5 rounded-lg border border-white/10">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white/90 tracking-wide">SyncInk <span className="font-light opacity-70">AI</span></span>
          <button onClick={startNewChat} className="p-2 text-white/70 hover:text-white bg-white/5 rounded-lg border border-white/10">
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto w-full scroll-smooth scrollbar-hide pb-40">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 md:px-8 space-y-10">
            
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-2xl rounded-full mix-blend-screen animate-pulse"></div>
                  <div className="relative p-1 bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
                    <img src="/logo.png" alt="SyncInk" className="w-20 h-20 object-cover rounded-2xl shadow-inner opacity-90" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-semibold text-center text-white tracking-tight drop-shadow-sm mb-2">
                  SyncInk AI
                </h2>
                <p className="text-lg text-white/50 tracking-wide font-medium mb-12">Create. Think. Sync.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  <button onClick={() => setInput("Write a beautiful poem about liquid glass UI...")} className="group relative p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg backdrop-blur-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                    <FileText className="w-5 h-5 text-indigo-400 mb-3 opacity-80" />
                    <h3 className="text-white/80 font-medium mb-1 text-sm">Write something</h3>
                    <p className="text-white/40 text-xs">Draft emails, essays, or code</p>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="group relative p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg backdrop-blur-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                    <LayoutGrid className="w-5 h-5 text-purple-400 mb-3 opacity-80" />
                    <h3 className="text-white/80 font-medium mb-1 text-sm">Analyze a file</h3>
                    <p className="text-white/40 text-xs">Summarize documents or data</p>
                  </button>
                  <button onClick={() => setInput("Generate 5 unique startup ideas for...")} className="group relative p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg backdrop-blur-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                    <Sparkles className="w-5 h-5 text-blue-400 mb-3 opacity-80" />
                    <h3 className="text-white/80 font-medium mb-1 text-sm">Generate ideas</h3>
                    <p className="text-white/40 text-xs">Brainstorm creative concepts</p>
                  </button>
                  <button onClick={() => setInput("What can you do for me?")} className="group relative p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg backdrop-blur-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                    <Zap className="w-5 h-5 text-teal-400 mb-3 opacity-80" />
                    <h3 className="text-white/80 font-medium mb-1 text-sm">Ask SyncInk AI</h3>
                    <p className="text-white/40 text-xs">Real-time answers and facts</p>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="flex-shrink-0 mr-4 hidden sm:block">
                      <div className="p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl shadow-sm">
                        <img src="/logo.png" alt="AI" className="w-7 h-7 object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {m.parts && m.parts.some((p:any) => p.type === 'image' || p.type === 'file') && (
                      <div className={`flex flex-wrap gap-2 mb-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.parts.map((p:any, i:number) => {
                          if (p.type === 'image') return <img key={i} src={p.image} className="max-w-[240px] max-h-[240px] rounded-2xl object-cover border border-white/10 shadow-lg" />;
                          if (p.type === 'file') return (
                            <div key={i} className="flex items-center px-4 py-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-sm text-white/80 shadow-sm">
                              <FileText className="w-4 h-4 mr-2 opacity-70" />
                              <span className="truncate max-w-[150px]">Attachment</span>
                            </div>
                          );
                          return null;
                        })}
                      </div>
                    )}
                    {((m.content) || (m.parts && m.parts.some((p:any) => p.type === 'text'))) && (
                      <div className={`
                        prose prose-invert max-w-none text-[15px]
                        ${m.role === 'user' 
                          ? 'bg-white/10 backdrop-blur-2xl text-white rounded-[2rem] rounded-tr-md px-6 py-4 border border-white/[0.08] shadow-lg' 
                          : 'text-white/90 prose-p:leading-relaxed prose-pre:bg-white/[0.03] prose-pre:backdrop-blur-xl prose-pre:border prose-pre:border-white/[0.05] prose-pre:shadow-inner prose-pre:rounded-2xl prose-headings:font-medium prose-a:text-indigo-400 mt-2'
                        }
                      `}>
                        <ReactMarkdown>
                          {m.content || (m.parts && m.parts.filter((p:any) => p.type === 'text').map((p:any) => p.text).join('\n')) || ''}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {error && (
              <div className="p-5 bg-red-500/10 backdrop-blur-2xl border border-red-500/20 rounded-3xl text-red-200 flex items-start space-x-3 shadow-xl">
                <div className="mt-0.5 opacity-80">⚠️</div>
                <div>
                  <strong className="block text-red-400 font-medium">Error</strong>
                  <span className="text-sm opacity-90">{error.message || 'Something went wrong.'}</span>
                </div>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex justify-start animate-in fade-in duration-500">
                <div className="flex-shrink-0 mr-4 hidden sm:block">
                  <div className="p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl shadow-sm animate-pulse">
                    <img src="/logo.png" alt="AI" className="w-7 h-7 object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 h-12 px-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] rounded-tl-md shadow-sm mt-2">
                  <div className="w-2 h-2 bg-indigo-400/80 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-indigo-400/80 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-10" />
          </div>
        </div>

        {/* Floating AI Composer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#020204] via-[#020204]/90 to-transparent pointer-events-none flex justify-center z-30">
          <div className="w-full max-w-3xl pointer-events-auto">
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2 animate-in slide-in-from-bottom-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl px-3 py-1.5 shadow-lg text-sm text-white/90">
                    <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors">
              <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => handleSubmit(e)}
              className="relative flex items-end bg-white/[0.04] backdrop-blur-[32px] border border-white/10 rounded-[2rem] shadow-2xl focus-within:bg-white/[0.06] focus-within:border-white/20 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.1)] transition-all duration-300 px-2 py-1.5"
            >
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              {/* Left Action Buttons */}
              <div className="flex items-center space-x-1 mb-1 ml-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center group" title="Attach file">
                  <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button type="button" onClick={toggleMic} className={`p-2 rounded-full transition-colors flex items-center justify-center group hidden sm:flex ${isListening ? 'text-red-400 bg-red-400/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`} title="Voice input">
                  <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                </button>
              </div>

              <textarea
                className="flex-1 bg-transparent text-white placeholder-white/40 py-3 px-3 mx-1 focus:outline-none resize-none min-h-[44px] max-h-[30vh] leading-relaxed font-medium tracking-wide scrollbar-hide text-[15px]"
                value={input || ''}
                placeholder="Message SyncInk AI..."
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if ((input.trim() || attachments.length > 0) && !isProcessing) handleSubmit();
                  }
                }}
                disabled={isProcessing}
                rows={1}
                style={{ height: input ? 'auto' : '44px' }}
              />

                {/* Right Action Button */}
                <div className="flex items-center mb-1 mr-1">
                  <button 
                    type="submit" 
                    disabled={isProcessing || (!input?.trim() && attachments.length === 0)} 
                    className="p-2 bg-white text-black rounded-full hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center group shadow-lg"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
              </form>
            <p className="text-center text-[11px] text-white/30 mt-3 font-medium tracking-wide">
              SyncInk AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Appearance</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500/50">
                  <option>System (Dark)</option>
                  <option>Dark Mode</option>
                  <option>Light Mode</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Default Model</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500/50">
                  <option>Gemini 3.5 Flash</option>
                  <option>Gemini 3.7 Flash</option>
                </select>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10">
                <button onClick={() => {
                  if (confirm("Clear all conversations?")) {
                    setHistory([]);
                    startNewChat();
                    setIsSettingsOpen(false);
                  }
                }} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors">
                  Clear All History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(ChatApp), { ssr: false });
