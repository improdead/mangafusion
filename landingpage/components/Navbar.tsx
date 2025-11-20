import React from 'react';
import { ShoppingCart, Search, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-white/85 backdrop-blur-xl border border-white/50 shadow-sm rounded-full px-2 pl-4 py-2 flex items-center gap-6 w-full max-w-3xl justify-between transition-all hover:shadow-md">
        
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-6">
          {/* Avatar/Logo */}
          <div className="w-8 h-8 rounded-full bg-gray-900 overflow-hidden border border-gray-200 cursor-pointer">
            <img src="https://picsum.photos/seed/avatar_user/100/100" alt="User" className="w-full h-full object-cover" />
          </div>

          {/* Navigation Items */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors group">
              Library 
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
            </div>
            <span className="cursor-pointer hover:text-black transition-colors">Recommended</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search Icon (Added to preserve functionality subtly) */}
          <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors" aria-label="Search">
             <Search className="w-4 h-4" />
          </button>

          <button className="px-5 py-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium transition-all text-gray-800">
             Cart
          </button>
          <button className="px-5 py-2 rounded-full border border-gray-200 hover:border-black hover:bg-black hover:text-white text-sm font-medium transition-all text-gray-800">
            Sign in
          </button>
        </div>
      </nav>
    </div>
  );
};