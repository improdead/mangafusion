import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Navbar } from '../components/landing/Navbar';
import { ArrowUp, Send, Sparkles, Loader2, User, Bot, Link as LinkIcon, Mic, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';

export default function CreatePage() {
  const router = useRouter();
  const { q } = router.query;
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string | any}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  // New states for model selector
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 (Nano Banana)");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models = [
    "Gemini 2.5 (Nano Banana)",
    "GPT-4o",
    "AnimagineXL 3.1",
    "FLUX.1 Schnell",
    "FLUX.1 Dev"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to handle initial query from URL
  useEffect(() => {
    if (router.isReady && q && typeof q === 'string' && messages.length === 0) {
      const initialQuery = q as string;
      // Prevent double submission if already submitting
      if (!isLoading) {
        setInput(initialQuery);
        // Automatically send the initial query
        handleSend(initialQuery);
      }
    }
  }, [router.isReady, q]); 

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message immediately
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg as any]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/builder/refine', { prompt: text });
      const result = response.data;
      
      setConfig(result);
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-brand-dark font-sans selection:bg-purple-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-24 px-4 pb-6 flex flex-col lg:flex-row gap-6 h-[calc(100vh-1rem)] lg:h-screen lg:pt-28 lg:pb-8">
        
        {/* Chat Column */}
        <div className="flex-1 flex flex-col bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden h-[600px] lg:h-auto transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">Builder AI</h2>
                        <p className="text-xs text-gray-500 font-medium">Brainstorming & Refining</p>
                    </div>
                </div>
                {isLoading && <span className="text-xs font-medium text-purple-600 animate-pulse bg-purple-50 px-3 py-1 rounded-full">Thinking...</span>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                         <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 rotate-12">
                            <Bot className="w-8 h-8 text-gray-400" />
                         </div>
                         <p className="text-gray-500 font-medium">Start by describing your manga idea...</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                             msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-purple-600 text-white'
                        }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>

                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm leading-relaxed text-[15px] ${
                            msg.role === 'user' 
                            ? 'bg-white border border-gray-100 text-gray-800 rounded-tr-sm' 
                            : 'bg-purple-50/50 border border-purple-100 text-gray-800 rounded-tl-sm'
                        }`}>
                            {msg.role === 'assistant' && typeof msg.content === 'object' ? (
                                <div>
                                    <p className="mb-3 font-medium text-purple-900">I've drafted a concept based on your idea:</p>
                                    <div className="text-sm bg-white p-3 rounded-xl border border-purple-100 shadow-sm text-gray-600 flex flex-col gap-1 group cursor-default hover:border-purple-300 transition-colors">
                                        <span className="font-bold text-gray-900">{msg.content.title}</span>
                                        <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">{msg.content.tone}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                     <div className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-sm text-gray-500 font-medium">Analyzing tropes & patterns...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-5 bg-white border-t border-gray-50">
                <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 transition-all focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus-within:border-gray-200 group relative">
                    
                    {/* Top Input Area */}
                    <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                      <Sparkles className="w-5 h-5 text-gray-400 mt-1.5 flex-shrink-0" />
                      <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(input);
                            }
                        }}
                        placeholder="Describe your vibe (e.g., 'Cyberpunk with kittens')..." 
                        className="w-full min-h-[56px] outline-none text-gray-600 text-lg resize-none placeholder:text-gray-300 bg-transparent py-1 leading-relaxed"
                        rows={1}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-2 pb-2 gap-3 sm:gap-0 relative">
                      
                      {/* Model Selector Dropdown */}
                      <div className="relative w-full sm:w-auto">
                        <button 
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors w-full sm:w-auto justify-center sm:justify-start border border-transparent hover:border-gray-200"
                        >
                            <span className="truncate max-w-[150px]">{selectedModel}</span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isModelMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-full sm:w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="py-1">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recommended</div>
                                    {models.slice(0, 2).map((model) => (
                                        <button 
                                            key={model}
                                            onClick={() => { setSelectedModel(model); setIsModelMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group"
                                        >
                                            <span className={selectedModel === model ? 'text-black font-medium' : 'text-gray-600'}>{model}</span>
                                            {selectedModel === model && <Check className="w-4 h-4 text-black" />}
                                        </button>
                                    ))}
                                    
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Open Source</div>
                                    
                                    {models.slice(2).map((model) => (
                                        <button 
                                            key={model}
                                            onClick={() => { setSelectedModel(model); setIsModelMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group"
                                        >
                                            <span className={selectedModel === model ? 'text-black font-medium' : 'text-gray-600'}>{model}</span>
                                            {selectedModel === model && <Check className="w-4 h-4 text-black" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                      </div>
                      
                      {/* Backdrop for dropdown */}
                      {isModelMenuOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsModelMenuOpen(false)}></div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                         <div className="flex items-center gap-1">
                            <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                              <LinkIcon className="w-4 h-4" />
                              <span className="hidden sm:inline">Attach</span>
                            </button>
                            
                            <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                              <Mic className="w-4 h-4" />
                              <span className="hidden sm:inline">Voice</span>
                            </button>
                         </div>

                         <button 
                            onClick={() => handleSend(input)}
                            disabled={isLoading || !input.trim()}
                            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium transition-all shadow-lg ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0A0A0A] hover:bg-black hover:shadow-xl hover:-translate-y-0.5'}`}
                         >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Start Creating</span>
                                    <ArrowUp className="w-4 h-4" />
                                </>
                            )}
                         </button>
                      </div>
                    </div>

                  </div>
            </div>
        </div>

        {/* Configuration/Preview Column */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-[600px] lg:h-auto transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
             <div className="p-5 border-b border-gray-50 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                    <h2 className="font-bold text-gray-900 text-lg">Episode Config</h2>
                </div>
                {config && (
                    <button 
                        className="group flex items-center gap-2 text-xs bg-gray-900 text-white px-4 py-2 rounded-full font-medium hover:bg-black transition-all shadow-lg shadow-gray-200 hover:-translate-y-0.5"
                        onClick={() => alert("Start Generation! (Link to Planner flow)")}
                    >
                        <span>Start Generation</span>
                        <Sparkles className="w-3 h-3 text-yellow-400 group-hover:animate-spin" />
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-[#FDFDFD]">
                {config ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        
                        {/* Title Card */}
                        <div className="text-center space-y-2 pb-4 border-b border-dashed border-gray-200">
                            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2">Working Title</div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">{config.title}</h1>
                        </div>
                        
                        {/* Logline */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                Logline
                            </label>
                            <p className="text-gray-700 text-lg leading-relaxed font-medium font-serif italic opacity-90">"{config.description}"</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Genres</label>
                                <div className="flex flex-wrap gap-2">
                                    {config.genre_tags?.map((tag: string) => (
                                        <span key={tag} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-default">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Tone & Vibe</label>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                        <span className="text-gray-400">Tone:</span> {config.tone}
                                    </div>
                                    <div className="text-sm text-gray-600 leading-snug">
                                        <span className="text-gray-400 font-medium">Visuals:</span> {config.visual_vibe}
                                    </div>
                                </div>
                            </div>
                         </div>

                         <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cast Members</label>
                                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-500">{config.cast?.length || 0} Characters</span>
                            </div>
                            
                            <div className="grid gap-4">
                                {config.cast?.map((char: any, i: number) => (
                                    <div key={i} className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-50 flex items-center justify-center text-purple-600 font-bold text-lg shrink-0 shadow-inner">
                                            {char.name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-gray-900">{char.name}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-wide text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{char.role}</div>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{char.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                         
                         <div className="pt-6 border-t border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">AI Generated Concept • Verify before production</p>
                         </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center rotate-3">
                            <Sparkles className="w-10 h-10 text-gray-200" />
                        </div>
                        <p className="font-medium text-sm">Enter a prompt to generate a configuration.</p>
                    </div>
                )}
            </div>
        </div>
        
      </main>
    </div>
  );
}

