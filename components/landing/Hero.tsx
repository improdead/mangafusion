import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Link as LinkIcon, Mic, ArrowUp, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/router';
import { getMangaPage } from './utils';

interface DraggableCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Internal component for handling drag logic
const DraggableCard: React.FC<DraggableCardProps> = ({ children, className, style }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    initialPos.current = { ...position };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      setPosition({
        x: initialPos.current.x + dx,
        y: initialPos.current.y + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className={className}
      style={{
        ...style,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : style?.zIndex, // Boost z-index when dragging
        touchAction: 'none',
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  );
};

export const Hero: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 (Nano Banana)");

  const models = [
    "Gemini 2.5 (Nano Banana)",
    "GPT-4o",
    "AnimagineXL 3.1",
    "FLUX.1 Schnell",
    "FLUX.1 Dev"
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      // Redirect to the builder/create page with the query
      router.push(`/create?q=${encodeURIComponent(query)}`);
    } catch (e) {
      console.error(e);
      alert("Sorry, something went wrong.");
      setIsLoading(false);
    }
  };
  
  // Configuration for the scattered images
  const decorations = [
    // Top Left Cluster
    { 
      src: 'cyberpunk', 
      pos: 'top-[-5%] left-[-2%]', 
      size: 'w-40 md:w-52', 
      visual: 'rotate-12 hover:rotate-6', 
      z: 0 
    },
    { 
      src: 'romance', 
      pos: 'top-[20%] left-[-6%]', 
      size: 'w-32 md:w-44', 
      visual: '-rotate-6 hover:rotate-0', 
      z: 1 
    },
    { 
      src: 'samurai', 
      pos: 'top-[45%] left-[-4%]', 
      size: 'w-36 md:w-48', 
      visual: 'rotate-6 hover:rotate-12', 
      z: 1 
    },
    { 
      src: 'fantasy', 
      pos: 'bottom-[15%] left-[-4%]', 
      size: 'w-36 md:w-48', 
      visual: 'rotate-3 hover:-rotate-2', 
      z: 0 
    },
    { 
      src: 'horror', 
      pos: 'bottom-[-5%] left-[5%]', 
      size: 'w-40 md:w-56', 
      visual: '-rotate-12 hover:-rotate-6', 
      z: 1 
    },
    { 
      src: 'isekai', 
      pos: 'bottom-[8%] left-[22%]', 
      size: 'w-32 md:w-44', 
      visual: '-rotate-6 hover:rotate-0', 
      z: 2 
    },
    { 
      src: 'music', 
      pos: 'top-[-12%] left-[28%]', 
      size: 'w-28 md:w-40', 
      visual: 'rotate-12 opacity-90', 
      z: 0 
    },
    { 
      src: 'psychological', 
      pos: 'top-[-15%] right-[32%]', 
      size: 'w-28 md:w-40', 
      visual: '-rotate-12 opacity-90', 
      z: 0 
    },
    { 
      src: 'sports', 
      pos: 'bottom-[-10%] left-[38%]', 
      size: 'w-32 md:w-48', 
      visual: 'rotate-6 blur-[1px] opacity-80', 
      z: 0 
    },
    { 
      src: 'mecha', 
      pos: 'bottom-[-8%] right-[38%]', 
      size: 'w-32 md:w-44', 
      visual: '-rotate-3 blur-[1px] opacity-80', 
      z: 0 
    },
    { 
      src: 'adventure', 
      pos: 'bottom-[-2%] right-[2%]', 
      size: 'w-44 md:w-64', 
      visual: 'rotate-6 hover:rotate-0', 
      z: 2 
    },
    { 
      src: 'thriller', 
      pos: 'bottom-[12%] right-[18%]', 
      size: 'w-32 md:w-44', 
      visual: 'rotate-3 hover:-rotate-3', 
      z: 2 
    },
    { 
      src: 'sliceoflife', 
      pos: 'bottom-[25%] right-[-5%]', 
      size: 'w-36 md:w-48', 
      visual: '-rotate-12 hover:-rotate-6', 
      z: 1 
    },
    { 
      src: 'cooking', 
      pos: 'top-[45%] right-[-4%]', 
      size: 'w-36 md:w-48', 
      visual: '-rotate-6 hover:-rotate-12', 
      z: 1 
    },
    { 
      src: 'mystery', 
      pos: 'top-[15%] right-[-4%]', 
      size: 'w-40 md:w-52', 
      visual: 'rotate-6 hover:rotate-12', 
      z: 0 
    },
    { 
      src: 'magicalgirl', 
      pos: 'top-[-8%] right-[5%]', 
      size: 'w-36 md:w-48', 
      visual: '-rotate-3 hover:rotate-0', 
      z: 0 
    },
  ];

  return (
    <div className="relative w-full min-h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] pt-20">
      
      {/* Main Content */}
      <div className="relative z-5 text-center max-w-4xl px-4 flex flex-col items-center pointer-events-none">
        
        {/* Hero Headline with Cute Effect */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.1] pointer-events-auto relative">
          Your next 
          <span className="relative inline-block mx-4 text-gray-900">
             obsession
             {/* Cute Scribble Circle */}
             <svg className="absolute w-[130%] h-[140%] -top-[15%] -left-[15%] text-accent-yellow pointer-events-none -z-10 opacity-80" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 45.5C15.5 45.5 26.5 16 95.5 16C164.5 16 186 41 186 55C186 69 154.5 92.5 90 92.5C25.5 92.5 11 65.5 23 47.5" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" className="animate-pulse" />
             </svg>
             
             {/* Cute Anime Character Doodle */}
             <svg className="absolute -top-20 -right-16 w-32 h-32 md:w-40 md:h-40 text-[#5B8DEF] pointer-events-none z-20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Head Shape */}
                <path d="M60 80 C40 100 40 150 70 170 C100 190 150 180 160 140 C170 100 140 60 100 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="white"/>
                {/* Hair Spikes */}
                <path d="M60 80 L50 50 L80 65 L90 30 L110 60 L130 40 L140 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                {/* Eyes */}
                <path d="M80 110 Q90 120 100 110" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <path d="M130 110 Q140 120 150 110" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                {/* Mouth (Cute w) */}
                <path d="M105 140 Q115 150 125 140" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                {/* Blush */}
                <path d="M70 130 L80 135" stroke="#FF9999" strokeWidth="3" strokeLinecap="round"/>
                <path d="M150 130 L160 135" stroke="#FF9999" strokeWidth="3" strokeLinecap="round"/>
             </svg>

             {/* Cute Sparkle */}
             <svg className="absolute -top-6 -right-8 w-8 h-8 text-black animate-bounce" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
             </svg>
          </span>
          <br/>
          starts with 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600"> Tanoshi.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-xl leading-relaxed font-medium pointer-events-auto">
          The AI-powered companion that understands your taste better than you do. Discover, track, and obsess.
        </p>

        {/* AI Input Section */}
        <div className="w-full max-w-2xl mx-auto relative z-20 pointer-events-auto mt-2">
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2 transition-all focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus-within:border-gray-200 group relative">
            
            {/* Top Input Area */}
            <div className="flex items-start gap-3 px-4 pt-3 pb-2">
              <Sparkles className="w-5 h-5 text-gray-400 mt-1.5 flex-shrink-0" />
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                    }
                }}
                placeholder="Describe your vibe (e.g., 'Cyberpunk with kittens')..." 
                className="w-full min-h-[56px] outline-none rounded-md border-stone-300 text-gray-600 text-lg resize-none placeholder:text-gray-300 bg-transparent py-1 leading-relaxed"
                rows={1}
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
                
									<div className={`absolute top-full left-0 mt-2 w-full sm:w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2 duration-200
										${isModelMenuOpen 
											? "opacity-100 scale-100 translate-y-0" 
											: "opacity-0 scale-95 -translate-y-2 pointer-events-none"
										}`}>
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
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
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

      {/* Scattered Images Ring */}
      {decorations.map((item, idx) => (
        <div 
          key={idx}
          className={`absolute ${item.pos} ${item.size}`}
          style={{ zIndex: item.z }}
        >
          <DraggableCard className="w-full h-full" style={{ zIndex: item.z }}>
            <div className={`w-full h-full transition-transform duration-500 ease-out hover:scale-105 shadow-2xl rounded-lg overflow-hidden ${item.visual} bg-white border-4 border-white`}>
              <div className="relative w-full h-full bg-white">
                <img 
                  src={getMangaPage(item.src)} 
                  alt="Manga Page" 
                  className="w-full h-full object-cover select-none pointer-events-none grayscale contrast-125" 
                />
                <div className="absolute inset-0 border-[0.5px] border-black/10 rounded-lg pointer-events-none"></div>
              </div>
            </div>
          </DraggableCard>
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};
