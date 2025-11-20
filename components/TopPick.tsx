import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { Badge } from './ui/Badge';
import { getMangaCover } from '../utils';

export const TopPick: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-white/50 relative overflow-hidden">
        
        <div className="flex flex-col md:flex-row gap-12 relative z-10">
          {/* Text Content */}
          <div className="flex-1">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold mb-4">
                <Sparkles className="w-3 h-3" />
                AI CORE ENGINE 2.5
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 leading-tight">
                Recommendations that <br/>
                feel like <span className="relative inline-block z-10 text-black">magic.
                 <div className="absolute inset-x-0 bottom-1 h-3 bg-accent-yellow/60 -z-10 skew-x-12"></div>
                </span>
              </h2>
              <p className="text-gray-500 text-base max-w-md leading-relaxed">
                Tanoshi doesn't just match genres. It analyzes pacing, art style, emotional tone, and character tropes to find your perfect next read.
              </p>
            </div>

            <div className="flex gap-4 mt-8">
                 <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-gray-900">98%</span>
                    <span className="text-xs text-gray-500 font-medium uppercase">Match Rate</span>
                 </div>
                 <div className="w-px h-10 bg-gray-200"></div>
                 <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-gray-900">2.5s</span>
                    <span className="text-xs text-gray-500 font-medium uppercase">Analysis Time</span>
                 </div>
            </div>
          </div>

          {/* Main Feature Visual */}
          <div className="flex-1 flex justify-center md:justify-end relative items-center">
            {/* Background abstract shapes */}
            <div className="absolute w-64 h-64 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full blur-3xl opacity-30 -top-10 right-10"></div>

            <div className="relative w-full max-w-md bg-gray-50 rounded-2xl border border-gray-100 p-6 shadow-lg">
                {/* Header of the fake card */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="ml-auto text-xs text-gray-400 font-mono">analysis.json</div>
                </div>
                
                {/* Content */}
                <div className="space-y-3">
                    <div className="flex gap-3 items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <img src={getMangaCover('user-fav-1', 100, 100)} className="w-10 h-10 rounded-lg object-cover" alt="Input" />
                        <div className="flex-1">
                            <div className="h-2 w-20 bg-gray-100 rounded mb-1"></div>
                            <div className="h-2 w-12 bg-gray-100 rounded"></div>
                        </div>
                        <Zap className="w-4 h-4 text-accent-yellow" />
                    </div>
                    
                    <div className="flex justify-center">
                        <div className="h-8 w-0.5 bg-gray-200"></div>
                    </div>

                    <div className="bg-black text-white p-4 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="text-xs text-gray-400 mb-1">Best Match Found</div>
                            <div className="font-bold text-lg">Chainsaw Man</div>
                            <div className="flex gap-1 mt-2">
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Chaos</span>
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Dark</span>
                            </div>
                        </div>
                        {/* Decoration inside card */}
                        <img src={getMangaCover('chainsaw', 200, 100)} className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-50 mix-blend-overlay" alt="Result" />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};