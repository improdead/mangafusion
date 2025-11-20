import React from 'react';
import { getMangaPage } from './utils';

interface HighlightProps {
  title: string;
  subtitle: string;
  tags: string[];
  imageId: string;
  direction?: 'left' | 'right';
}

export const HighlightSection: React.FC<HighlightProps> = ({ title, subtitle, tags, imageId, direction = 'left' }) => {
  const bgWord = title.split(' ')[0]; // "Semantic" or "Infinite"

  return (
    <div className="max-w-[1400px] mx-auto px-4 mb-8">
      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden min-h-[500px] flex items-center">
        
        {/* Massive Background Typography */}
        <div 
          className={`absolute top-0 ${direction === 'left' ? 'left-0' : 'right-0'} w-full h-full overflow-hidden pointer-events-none select-none`}
        >
          <span 
            className="text-[180px] md:text-[240px] font-black leading-none text-gray-50/80 tracking-tighter absolute top-[-40px] left-[-20px] opacity-80"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {bgWord}
          </span>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-12 p-8 md:p-16 items-center">
          
          {/* Text Section */}
          <div className={`${direction === 'right' ? 'md:order-2 md:pl-12' : 'md:pr-12'}`}>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">
              {subtitle}
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              {title}
            </h2>
            
            <div className="flex flex-wrap gap-3">
              {tags.map((tag, i) => (
                <span 
                  key={i} 
                  className="px-4 py-2 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-sm text-gray-600 font-medium hover:border-black transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Image Visualization Section */}
          <div className={`relative h-[400px] flex items-center justify-center ${direction === 'right' ? 'md:order-1' : ''}`}>
             
             {/* "Semantic Search" Specific Visuals (Floating pages look) */}
             {imageId === 'semantic-search-viz' && (
                <div className="relative w-full h-full flex items-center justify-center perspective-1000">
                   <div className="absolute w-64 h-80 bg-white shadow-2xl rounded-xl transform -rotate-12 -translate-x-16 translate-y-8 border border-gray-100 flex items-center justify-center overflow-hidden">
                      <img src={getMangaPage('action')} className="w-full h-full object-cover opacity-20" alt="bg" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                   </div>
                   <div className="absolute w-72 h-96 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-lg transform rotate-6 translate-x-4 border border-gray-50 overflow-hidden">
                       {/* Mock Content */}
                       <div className="p-6">
                          <div className="w-12 h-12 bg-gray-100 rounded-full mb-6"></div>
                          <div className="h-4 w-3/4 bg-gray-100 rounded mb-3"></div>
                          <div className="h-4 w-1/2 bg-gray-100 rounded mb-8"></div>
                          <div className="w-full h-40 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                             <img src={getMangaPage('fantasy')} className="w-full h-full object-cover mix-blend-multiply opacity-50" alt="content" />
                          </div>
                       </div>
                       <div className="absolute top-4 right-4">
                          <div className="text-[10px] text-gray-300 font-mono">analysis_v2.pdf</div>
                       </div>
                   </div>
                   
                   {/* Floating Badge */}
                   <div className="absolute top-1/4 right-0 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100 transform rotate-12">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                         <span className="text-xs font-bold">Match 98%</span>
                      </div>
                   </div>
                </div>
             )}

             {/* "Infinite Canvas" Specific Visuals (Long strip scroll look) */}
             {imageId === 'infinite-reader-ui' && (
                <div className="relative w-full h-full flex items-center justify-center perspective-1000">
                    {/* Strip 1 */}
                    <div className="absolute w-56 h-[120%] bg-white shadow-xl border border-gray-100 transform -rotate-6 -translate-x-12 overflow-hidden top-[-10%]">
                       <img src={getMangaPage('adventure')} className="w-full h-1/3 object-cover" alt="panel1" />
                       <div className="h-4 bg-white"></div>
                       <img src={getMangaPage('scifi')} className="w-full h-1/3 object-cover" alt="panel2" />
                       <div className="h-4 bg-white"></div>
                       <img src={getMangaPage('mystery')} className="w-full h-1/3 object-cover" alt="panel3" />
                    </div>

                    {/* Strip 2 (Focus) */}
                    <div className="absolute w-64 h-[110%] bg-white shadow-2xl border border-gray-100 transform rotate-3 translate-x-16 overflow-hidden top-[-5%] z-10">
                       <img src={getMangaPage('action', 400, 600)} className="w-full h-full object-cover grayscale" alt="strip" />
                       
                       {/* UI Overlays */}
                       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full flex gap-4 shadow-lg">
                          <div className="w-4 h-4 rounded-full border-2 border-white/50"></div>
                          <div className="w-20 h-1.5 bg-white/20 rounded-full self-center">
                             <div className="w-1/2 h-full bg-white rounded-full"></div>
                          </div>
                       </div>
                    </div>
                </div>
             )}

          </div>
        </div>
      </div>
    </div>
  );
};