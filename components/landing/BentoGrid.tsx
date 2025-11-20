import React from 'react';
import { ArrowRight, ScanLine, Globe2, BrainCircuit } from 'lucide-react';
import { getMangaCover } from './utils';

export const BentoGrid: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Visual Search Card */}
      <div className="bg-white rounded-[2rem] p-8 flex flex-col justify-between h-64 md:h-80 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
        <div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
            <ScanLine className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Visual Match</span>
          <h3 className="text-xl font-bold mt-2 text-gray-900 leading-snug">
            Find manga by art style.
          </h3>
          <p className="text-gray-500 text-sm mt-2">
            Upload a panel, finding the source instantly.
          </p>
        </div>
        <div className="relative h-16 w-full overflow-hidden rounded-lg opacity-50 group-hover:opacity-100 transition-opacity">
            <img src={getMangaCover('artstyle-analysis', 400, 100)} className="w-full h-full object-cover grayscale" alt="Visual Search" />
        </div>
      </div>

      {/* Global Database Card (Main Feature) */}
      <div className="bg-white rounded-[2rem] p-6 md:col-span-2 relative overflow-hidden group h-64 md:h-80 shadow-sm">
         <div className="absolute top-6 left-8 z-10 max-w-xs">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Global Index</span>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">One Search, <br/>Every Publisher.</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Tanoshi indexes legal sources from Shueisha, Kodansha, and indie platforms into one unified AI interface.
            </p>
         </div>
         
         {/* Decorative Grid of logos/covers */}
         <div className="absolute right-0 bottom-0 w-1/2 h-full flex gap-3 translate-y-12 translate-x-8 rotate-[-5deg] opacity-80">
             <div className="flex flex-col gap-3 animate-[float_8s_ease-in-out_infinite]">
                <img src={getMangaCover('cover1')} className="w-32 h-48 object-cover rounded-xl shadow-md" alt="Manga" />
                <img src={getMangaCover('cover2')} className="w-32 h-48 object-cover rounded-xl shadow-md" alt="Manga" />
             </div>
             <div className="flex flex-col gap-3 translate-y-8 animate-[float_10s_ease-in-out_infinite]">
                <img src={getMangaCover('cover3')} className="w-32 h-48 object-cover rounded-xl shadow-md" alt="Manga" />
                <img src={getMangaCover('cover4')} className="w-32 h-48 object-cover rounded-xl shadow-md" alt="Manga" />
             </div>
         </div>
      </div>

      {/* Translation Card */}
      <div className="bg-[#111111] rounded-[2rem] p-6 text-white flex flex-col justify-between h-48 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
           <div className="flex justify-between items-start">
               <span className="text-xs opacity-70 uppercase tracking-wider">Real-time</span>
               <Globe2 className="w-5 h-5 opacity-50" />
           </div>
           <h3 className="text-lg font-bold mt-2">Smart<br/>Translation</h3>
        </div>
        <p className="text-sm text-gray-400 relative z-10">Read raw chapters in your native language instantly.</p>
        
        {/* Abstract Globe Decor */}
        <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 rounded-full border-8 border-white/10 group-hover:scale-110 transition-transform"></div>
        <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 rounded-full border-8 border-white/5"></div>
      </div>

      {/* AI Recommendations Card */}
      <div className="bg-white rounded-[2rem] p-6 flex flex-col justify-between h-48 shadow-sm group hover:bg-accent-yellow transition-colors duration-300">
         <div>
           <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider group-hover:text-black/60">Discovery</span>
                <BrainCircuit className="w-5 h-5 text-gray-300 group-hover:text-black/60" />
           </div>
           <h3 className="text-lg font-bold mt-1 text-gray-900">Context Aware</h3>
           <p className="text-sm text-gray-500 mt-2 group-hover:text-black/70">"Find me something like Berserk but less gloomy."</p>
         </div>
      </div>

      {/* Decorative Image Card */}
      <div className="rounded-[2rem] overflow-hidden h-48 shadow-sm relative group">
         <img src={getMangaCover('futuristic-reader-ui')} alt="UI Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
         <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
         <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
            UI Preview
         </div>
      </div>
    </div>
  );
};