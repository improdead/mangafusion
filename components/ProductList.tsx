import React from 'react';
import { Command, BookOpen, Languages, Users, ShieldCheck, History, Download, Wand2 } from 'lucide-react';

const CAPABILITIES = [
  { id: 1, title: "Deep Summaries", icon: BookOpen, desc: "Get spoiler-free synopses." },
  { id: 2, title: "Auto-Translate", icon: Languages, desc: "Japanese to English instantly." },
  { id: 3, title: "Character Graph", icon: Users, desc: "Visualize relationships." },
  { id: 4, title: "Safe Mode", icon: ShieldCheck, desc: "Filter content by age rating." },
  { id: 5, title: "Reading History", icon: History, desc: "Syncs across all devices." },
  { id: 6, title: "Offline Mode", icon: Download, desc: "Download analysis for later." },
  { id: 7, title: "Style Search", icon: Wand2, desc: "Find artists with similar styles." },
  { id: 8, title: "Quick Actions", icon: Command, desc: "Keyboard driven interface." },
];

export const ProductList: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
            <h3 className="text-3xl font-bold text-gray-900">System Capabilities</h3>
            <p className="text-gray-500 mt-2">Everything you need to manage your reading life.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CAPABILITIES.map((cap) => (
          <div key={cap.id} className="group cursor-pointer bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                <cap.icon className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-lg text-gray-900 mb-1">{cap.title}</h4>
            <p className="text-sm text-gray-500 font-medium">{cap.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};