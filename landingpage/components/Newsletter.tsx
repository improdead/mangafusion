import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getMangaCover } from '../utils';

export const Newsletter: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center overflow-hidden relative">
        
        <div className="flex-1 z-10">
           <span className="text-sm text-gray-400 uppercase tracking-wide">News Letter</span>
           <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 tracking-tight">
             Get our weekly manga <br/> recommendations
           </h2>
           <p className="text-gray-500 mb-8">No Spam. No Scam. Just Manga.</p>

           <div className="flex gap-2 max-w-md">
             <input 
               type="email" 
               placeholder="Write your mail here" 
               className="flex-1 px-6 py-3 rounded-full border border-gray-300 bg-transparent focus:ring-1 focus:ring-black focus:border-black outline-none transition-all"
             />
             <button className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 font-medium">
               Subscribe <ArrowUpRight className="w-4 h-4" />
             </button>
           </div>
        </div>

        <div className="flex-1 relative w-full h-64 md:h-auto min-h-[300px] rounded-2xl overflow-hidden">
           <img src={getMangaCover('vinland', 800, 600)} className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Newsletter" />
           
           {/* Floating bubble */}
           <div className="absolute top-8 right-8 bg-white rounded-full p-3 shadow-xl animate-bounce">
              <div className="text-xs font-bold px-2">I have no enemies.</div>
           </div>
        </div>

      </div>
    </div>
  );
};
