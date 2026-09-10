import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  Send, 
  Camera, 
  Mic, 
  Bot, 
  User, 
  Check, 
  ShoppingBag, 
  PanelLeftClose, 
  PanelLeft, 
  MessageSquare, 
  ShieldCheck, 
  Pill, 
  Upload, 
  X, 
  RefreshCw, 
  ChevronDown,
  Image as ImageIcon,
  Clock,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../utils/imageCompressor';
import { Product } from '../types';
import { PRODUCTS } from '../data/mockData';
import { LogoSvg } from './Logo';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageName?: string;
  recommendedProducts?: Product[];
}

interface ChatThread {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

interface AiChatPageProps {
  initialQuery?: string;
  onBackToHome: () => void;
  onAddToCart: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
}

const DEFAULT_PROMPTS = [
  {
    title: 'Find My Routine',
    desc: 'Get a simple daily routine for clear, glowing skin.',
    query: 'Recommend a simple 3-step daily routine for clear, glowing skin using The Avenue Thirty products.'
  },
  {
    title: 'Glass Skin Bundle Details',
    desc: 'Everything inside the Flawless Glass Skin Bundle and how to use it.',
    query: 'Tell me what is inside the Flawless Glass Skin Bundle and how to use it.'
  },
  {
    title: 'SPF Guidance',
    desc: 'Which sunscreen suits my skin tone and routine.',
    query: 'Which SPF 50+ sunscreen should I use for daily protection and melasma prevention?'
  },
  {
    title: 'Style Match',
    desc: 'Match a bag or bracelet to your outfit aesthetic.',
    query: 'I am wearing a neutral minimalist outfit. Which bag or jewellery piece from The Avenue Thirty would complement it?'
  }
];

const QUICK_ACTIONS = [
  {
    title: 'Browse Skincare',
    icon: Pill,
    query: 'Show me skincare products from The Avenue Thirty'
  },
  {
    title: 'Explore Accessories',
    icon: ShoppingBag,
    query: 'Show me accessories and bags from The Avenue Thirty'
  },
  {
    title: 'Clearance Deals',
    icon: ShieldCheck,
    query: 'Do you have any clearance deals or discounted items?'
  },
  {
    title: 'Glass Skin Routine',
    icon: Sparkle,
    query: 'I want a glass skin routine. What products do you recommend?'
  }
];

const STORAGE_KEY_THREADS = 'av30-chat-threads';
const STORAGE_KEY_ACTIVE = 'av30-chat-active-thread';

export const AiChatPage: React.FC<AiChatPageProps> = ({
  initialQuery = '',
  onBackToHome,
  onAddToCart,
  cartCount,
  onOpenCart,
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Avenue Shopping Assistant 3.6 (Flash)');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Load threads from localStorage on mount
  useEffect(() => {
    try {
      const storedThreads = localStorage.getItem(STORAGE_KEY_THREADS);
      const storedActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
      
      let loadedThreads: ChatThread[] = [];
      if (storedThreads) {
        loadedThreads = JSON.parse(storedThreads);
      }
      
      if (loadedThreads.length === 0) {
        const newThread: ChatThread = {
          id: `thread-${Date.now()}`,
          title: 'New Chat',
          date: 'Today',
          messages: []
        };
        loadedThreads = [newThread];
      }
      
      setThreads(loadedThreads);
      
      const activeId = storedActive && loadedThreads.some(t => t.id === storedActive) 
        ? storedActive 
        : loadedThreads[0].id;
      setActiveThreadId(activeId);
      setMessages(loadedThreads.find(t => t.id === activeId)?.messages || []);
    } catch {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: 'New Chat',
        date: 'Today',
        messages: []
      };
      setThreads([newThread]);
      setActiveThreadId(newThread.id);
      setMessages([]);
    }
  }, []);

  // Persist threads to localStorage
  const persistThreads = (updatedThreads: ChatThread[], activeId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(updatedThreads));
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeId);
    } catch {
      // localStorage full or unavailable
    }
  };

  // Process initial query on load
  useEffect(() => {
    if (initialQuery.trim() && messages.length === 0) {
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: initialQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([userMsg]);
      fetchAiResponse(initialQuery, [userMsg]);
    }
  }, [initialQuery]);

  const fetchAiResponse = async (userQuery: string, currentHistory: Message[]) => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint: userQuery }),
      });

      const data = await res.json();

      let aiText = '';
      let recommended: Product[] = [];

      if (data.fallback) {
        aiText = data.error
          ? `I ran into an issue: ${data.error}. Please try again in a moment.`
          : "I'm having trouble reaching the shopping assistant right now. Please try again shortly.";
      } else {
        aiText = data.reply || data.text || '';
        const ids: string[] = data.recommended_product_ids || [];
        recommended = PRODUCTS.filter((p) => ids.includes(p.id));
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: recommended.length > 0 ? recommended : undefined,
      };
      
      const updatedMessages = [...currentHistory, aiMsg];
      setMessages(updatedMessages);
      
      // Update thread messages and persist
      setThreads(prev => {
        const updated = prev.map(t => 
          t.id === activeThreadId 
            ? { ...t, messages: updatedMessages, date: 'Today' }
            : t
        );
        persistThreads(updated, activeThreadId);
        return updated;
      });
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm having trouble connecting right now. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      const updatedMessages = [...currentHistory, aiMsg];
      setMessages(updatedMessages);
      
      setThreads(prev => {
        const updated = prev.map(t => 
          t.id === activeThreadId 
            ? { ...t, messages: updatedMessages }
            : t
        );
        persistThreads(updated, activeThreadId);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = overrideQuery ?? input;
    if ((!queryText.trim() && !selectedImageName) || isLoading) return;

    const fullText = selectedImageName 
      ? `[Lampiran Foto Kulit: ${selectedImageName}] ${queryText.trim() || 'Mohon periksa dan analisis kondisi kulit pada foto ini.'}`
      : queryText.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText.trim() || (selectedImageName ? 'Analisis foto kulit' : ''),
      imageName: selectedImageName || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setSelectedImageName(null);
    setSelectedImagePreview(null);

    // Update thread title if this is the first message
    setThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === activeThreadId && t.messages.length === 0) {
          return {
            ...t,
            title: userMsg.text.slice(0, 30) + (userMsg.text.length > 30 ? '...' : ''),
            messages: updatedMessages,
            date: 'Today'
          };
        }
        return t;
      });
      persistThreads(updated, activeThreadId);
      return updated;
    });

    fetchAiResponse(fullText, updatedMessages);
  };

  const handleNewChat = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Chat',
      date: 'Today',
      messages: []
    };
    setThreads(prev => {
      const updated = [newThread, ...prev];
      persistThreads(updated, newThread.id);
      return updated;
    });
    setActiveThreadId(newThread.id);
    setMessages([]);
    setInput('');
    setSelectedImageName(null);
    setSelectedImagePreview(null);
  };

  const handlePromptClick = (promptQuery: string) => {
    handleSend(undefined, promptQuery);
  };

  const handleQuickActionClick = (query: string) => {
    handleSend(undefined, query);
  };

  const handleThreadSwitch = (threadId: string) => {
    setActiveThreadId(threadId);
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setMessages(thread.messages);
    }
    localStorage.setItem(STORAGE_KEY_ACTIVE, threadId);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, or WebP).');
        return;
      }

      try {
        const compressed = await compressImage(file);
        setSelectedImageName(file.name);
        setSelectedImagePreview(compressed.base64);
        setMessages([]);
      } catch {
        alert('Could not process that image. Please try another file.');
      }
    }
  };

  const handleAddToCartClick = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#FAF9F6] text-[#1A1A1A] font-sans overflow-hidden" data-lenis-prevent>
      
      {/* Hidden File Upload Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Left Sidebar (ChatGPT / Gemini Style) */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full bg-[#1A1A1A] text-white flex flex-col justify-between border-r border-white/10 shrink-0 relative z-20 overflow-hidden"
          >
            {/* Top Sidebar Header */}
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={onBackToHome}
                  className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span>Back to Store</span>
                </button>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors md:hidden"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* + New Chat Button */}
               <button
                  onClick={handleNewChat}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-start transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-neutral-300" />
                    <span>New Chat</span>
                  </div>
                </button>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 no-scrollbar" data-lenis-prevent>
              <div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2 block mb-2">
                   AI Shopping History
                 </span>
                <div className="space-y-1">
                  {threads.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThreadSwitch(t.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                        activeThreadId === t.id
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      <span className="truncate flex-1">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2 block mb-2">
                   Avenue Quick Actions
                 </span>
                 <div className="space-y-1">
                   {QUICK_ACTIONS.map((action, idx) => (
                     <button
                       key={idx}
                       onClick={() => handlePromptClick(action.query)}
                       className="w-full text-left px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                     >
                       <action.icon className="w-3.5 h-3.5 text-neutral-400" />
                       <span>{action.title}</span>
                     </button>
                   ))}
                 </div>
              </div>
            </div>

             {/* Bottom Sidebar User Info */}
             <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
               <div className="flex items-center gap-2.5">
                 <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-semibold text-white">
                   AV
                 </div>
                 <div>
                   <h5 className="text-xs font-medium text-white">Avenue Guest</h5>
                   <p className="text-[10px] text-neutral-400">Shopping Assistant</p>
                 </div>
               </div>
               <ShieldCheck className="w-4 h-4 text-neutral-400" />
             </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#F4F4F5] relative z-10 min-w-0">
        
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:px-6 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Open Sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <button
              onClick={onBackToHome}
              className="hover:opacity-80 transition-opacity cursor-pointer p-0.5 flex items-center justify-center"
              aria-label="Home"
            >
               <LogoSvg fill="#18181B" className="h-[18px] w-auto" />
            </button>
          </div>

          {/* Right Top Bar Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-full hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
               title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#18181B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
               )}
            </button>
            </div>
          </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6" data-lenis-prevent>
          
          {/* Welcome Screen when Chat is empty */}
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto min-h-[70vh] flex flex-col justify-center items-center text-center py-10 px-4 space-y-8 animate-fade-in">
               <div className="space-y-3">
                 <div className="w-14 h-14 rounded-2xl bg-[#18181B] text-white flex items-center justify-center mx-auto shadow-md border border-neutral-700">
                   <Sparkles className="w-7 h-7" />
                 </div>
                 <h2 className="text-2xl sm:text-3xl font-light text-[#18181B] tracking-tight">
                   Hello, what are you shopping for today?
                 </h2>
                 <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                   The Avenue Thirty Personal Shopping Assistant can help you discover skincare, bags, jewellery, and more — upload a photo or ask away.
                 </p>
               </div>

              {/* Prompt Suggestions Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {DEFAULT_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(p.query);
                    }}
                    className="p-4 bg-white hover:bg-neutral-100/70 border border-neutral-200 hover:border-neutral-400 rounded-2xl transition-all shadow-2xs group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-[#18181B] group-hover:text-black transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Message Thread */}
          {messages.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-4 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* AI Avatar */}
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[88%] sm:max-w-[80%]`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#18181B] text-white rounded-tr-xs font-sans'
                          : 'bg-white text-[#18181B] border border-neutral-200 rounded-tl-xs font-sans'
                      }`}
                    >
                      {/* Attached Image Preview if User uploaded */}
                      {msg.imageName && (
                        <div className="mb-3 p-2 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center gap-2 text-neutral-800">
                          <ImageIcon className="w-4 h-4 text-neutral-600" />
                          <span className="text-xs font-medium truncate">{msg.imageName}</span>
                        </div>
                      )}

                      {/* Text formatted */}
                      <div className="whitespace-pre-line space-y-2">
                        {msg.text}
                      </div>
                    </div>

                    {/* Recommended Products Embed Widget inside AI message */}
                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200 inline-flex">
                          <ShieldCheck className="w-4 h-4 text-neutral-700" />
                           <span>Verified Avenue Recommendation</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {msg.recommendedProducts.map((prod) => (
                            <div
                              key={prod.id}
                              className="bg-white border border-neutral-200 rounded-2xl p-3.5 flex flex-col justify-between hover:border-neutral-400 transition-all group shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-16 h-16 object-cover rounded-xl border border-neutral-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                                    {prod.category}
                                  </span>
                                  <h4 className="font-semibold text-xs text-[#18181B] truncate mt-1">{prod.name}</h4>
                                  <p className="text-[11px] font-bold text-[#18181B] mt-0.5">
                                    ${prod.priceMonthly.toFixed(2)} {prod.category === 'Prescription' ? '/mo' : ''}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddToCartClick(prod)}
                                className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  addedProductId === prod.id
                                    ? 'bg-neutral-700 text-white'
                                    : 'bg-[#18181B] text-white hover:bg-neutral-800'
                                }`}
                              >
                                {addedProductId === prod.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Added to Cart</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>Add to Cart</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-neutral-400 block px-1">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-neutral-300 text-neutral-800 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* AI Thinking / Generating state */}
              {isLoading && (
                <div className="flex gap-3 max-w-3xl mx-auto items-center">
                  <div className="w-8 h-8 rounded-xl bg-[#18181B] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl text-xs text-neutral-600 flex items-center gap-2.5 shadow-2xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-800" />
                     <span>Avenue AI is analyzing your request and matching products...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* Bottom Floating Prompt Input Box */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#F4F4F5] via-[#F4F4F5]/90 to-transparent shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            
            {/* Attached File Preview Badge */}
            {selectedImageName && (
              <div className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-800 text-xs px-3 py-1.5 rounded-full shadow-2xs animate-fade-in">
                <Upload className="w-3.5 h-3.5 text-neutral-600" />
                <span className="font-medium max-w-[200px] truncate">{selectedImageName}</span>
                <button
                  onClick={() => {
                    setSelectedImageName(null);
                    setSelectedImagePreview(null);
                  }}
                  className="ml-1 text-neutral-500 hover:text-black font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Prompt Card Box */}
            <form
              onSubmit={handleSend}
              className="bg-white border border-neutral-300 focus-within:border-neutral-800 rounded-[24px] p-3 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-all"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                 placeholder="Ask about products, routines, or style matches..."
                className="w-full bg-transparent text-[#18181B] placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none resize-none px-2 py-1 max-h-36"
              />

              {/* Bottom Action Bar inside Prompt Box */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-[#18181B] text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-neutral-700" />
                   <span className="hidden sm:inline">Upload Photo</span>
                </button>

                {/* Right Action Icons: Mic & Send */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePromptClick('Consultation via audio and active voice input')}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                    title="Audio Mic"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedImageName) || isLoading}
                    className="w-8 h-8 rounded-full bg-[#18181B] hover:bg-neutral-800 disabled:opacity-30 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>

              <p className="text-[10px] text-center text-neutral-400">
               The Avenue Thirty AI provides shopping guidance and product suggestions. For medical concerns, consult a licensed healthcare provider.
             </p>

          </div>
        </div>

      </div>

    </div>
  );
};
