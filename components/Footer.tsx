import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-gray-200/60">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Logo/Nav */}
        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
           <div className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm">
             <img src="https://picsum.photos/seed/logo/50/50" className="w-6 h-6 rounded-full" alt="Tanoshi" />
           </div>
           <a href="#" className="hover:text-black">Library</a>
           <a href="#" className="hover:text-black">Recommended</a>
        </div>

        {/* Socials */}
        <div className="flex gap-2">
           {['Medium', 'Instagram', 'Linkedin'].map(social => (
             <button key={social} className="px-4 py-1.5 rounded-full border border-gray-300 text-xs font-medium hover:bg-black hover:text-white transition-colors">
               {social}
             </button>
           ))}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mt-8 text-[10px] text-gray-400 uppercase tracking-wider">
        <span>2024@Tanoshi.com</span>
        <div className="flex gap-4 mt-2 md:mt-0">
          <span>Privacy Policy</span>
          <span>Money-back policy</span>
          <span>Terms of us</span>
        </div>
      </div>
    </footer>
  );
};