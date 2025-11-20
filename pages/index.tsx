import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { TopPick } from '../components/landing/TopPick';
import { BentoGrid } from '../components/landing/BentoGrid';
import { ProductList } from '../components/landing/ProductList';
import { HighlightSection } from '../components/landing/HighlightSection';
import { Newsletter } from '../components/landing/Newsletter';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen text-brand-dark selection:bg-accent-yellow selection:text-black">
      <Navbar />
      
      <main>
        {/* Hero: The Hook */}
        <Hero />
        
        {/* TopPick: The AI Engine Explanation */}
        <TopPick />
        
        {/* BentoGrid: The Core Features */}
        <BentoGrid />
        
        {/* ProductList: Detailed Capabilities Grid */}
        <ProductList />
        
        {/* Highlight 1: Deep dive into Semantic Search */}
        <HighlightSection 
          title="Semantic Search" 
          subtitle="Beyond Keywords" 
          tags={['Natural Language', 'Vibe Check', 'Plot Matching']} 
          imageId="semantic-search-viz"
          direction="left"
        />

        {/* Highlight 2: Deep dive into Reader Experience */}
        <HighlightSection 
          title="Infinite Canvas" 
          subtitle="Reader Experience" 
          tags={['Vertical Scroll', 'Smart Zoom', 'Double Page']} 
          imageId="infinite-reader-ui"
          direction="right"
        />

        <Newsletter />
      </main>

      <Footer />
    </div>
  );
}
