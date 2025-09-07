import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

export default function Home() {
  const r = useRouter();
  const [title, setTitle] = useState('Shadow Sketch');
  const [genreTags, setGenreTags] = useState('modern shonen, urban fantasy');
  const [tone, setTone] = useState('dynamic, heroic, hopeful');
  const [setting, setSetting] = useState('rain-slick neon city at dusk');
  const [visualVibe, setVisualVibe] = useState('shōnen energy akin to Demon Slayer / JJK / OPM — just the vibe');
  const [castInput, setCastInput] = useState('Aoi\nKenji');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [styleRefs, setStyleRefs] = useState<File[]>([]);
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [planningStatus, setPlanningStatus] = useState<string>('');
  const [heroTitle, setHeroTitle] = useState('Create Your AI Manga');
  const [heroSubtitle, setHeroSubtitle] = useState('Transform your ideas into stunning manga pages with AI-powered storytelling and image generation');

  useEffect(() => {
    fetch(`${API_BASE}/health`).then((r) => (r.ok ? r.json() : Promise.reject())).then(() => setApiUp(true)).catch(() => setApiUp(false));
  }, []);

  useEffect(() => {
    // Load content from words.md
    fetch('/words.md')
      .then(response => response.text())
      .then(content => {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          // Extract title from first line (remove # and trim)
          const title = lines[0].replace(/^#+\s*/, '').trim();
          setHeroTitle(title);

          // Extract subtitle from second line if it exists
          if (lines.length > 1) {
            setHeroSubtitle(lines[1].trim());
          }
        }
      })
      .catch(error => {
        console.log('Could not load words.md, using default text');
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const cast = castInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, traits: 'mysterious character' }));
      const body = {
        title,
        genre_tags: genreTags.split(',').map((s) => s.trim()).filter(Boolean),
        tone,
        setting,
        visual_vibe: visualVibe,
        cast,
      };
      const planRes = await fetch(`${API_BASE}/planner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const planJson = await planRes.json();
      if (!planRes.ok || planJson.error) {
        throw new Error(planJson.error || 'Planner failed');
      }
      const episodeId = planJson.episodeId as string;

      // Listen for planning status updates
      const eventSource = new EventSource(`${API_BASE}/episodes/${episodeId}/stream`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'planning_started' || data.type === 'planning_progress') {
            setPlanningStatus(data.message || 'Planning in progress...');
          } else if (data.type === 'planning_complete') {
            setPlanningStatus(data.message || 'Planning complete!');
            eventSource.close();
            // Continue with the rest of the process
            continueAfterPlanning(episodeId);
          }
        } catch (e) {
          // ignore parsing errors
        }
      };

      // Fallback in case SSE doesn't work
      setTimeout(() => {
        eventSource.close();
        continueAfterPlanning(episodeId);
      }, 10000);

    } catch (err: any) {
      setError(err.message || String(err));
      setBusy(false);
    }
  }

  async function continueAfterPlanning(episodeId: string) {
    try {
      // upload style refs if provided
      if (styleRefs.length) {
        setPlanningStatus('Uploading style references...');
        await Promise.all(styleRefs.map(async (file) => {
          const form = new FormData();
          form.append('file', file);
          const up = await fetch(`${API_BASE}/episodes/${episodeId}/style-refs`, { method: 'POST', body: form });
          const j = await up.json();
          if (!up.ok || j.error) throw new Error(j.error || 'Failed uploading style ref');
        }));
      }

      setPlanningStatus('Starting page generation...');
      await fetch(`${API_BASE}/episodes/${episodeId}/generate10`, { method: 'POST' });
      r.push(`/episodes/${episodeId}`);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
      setPlanningStatus('');
    }
  }

  return (
    <Layout title="Create Your AI Manga - MangaFusion">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="hero-title mb-4">{heroTitle}</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
        </div>

        {/* Backend status */}
        {apiUp === false && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="glass-card bg-red-50/70 border-red-200/70 p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 102 0 1 1 0 00-2 0zm1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <div>
                  <div className="font-medium text-red-800">Backend not reachable</div>
                  <div className="text-sm text-red-700">Start the API with `npm run dev` in <code>backend/</code> or set NEXT_PUBLIC_API_BASE to your API.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="glass-card max-w-2xl mx-auto p-8">
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Title */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-purple-600">📖</span> Story Title</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="Enter your manga title..."
                required
              />
            </div>

            {/* Genre Tags */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-blue-600">🏷️</span> Genre Tags</div>
              <input
                type="text"
                value={genreTags}
                onChange={(e) => setGenreTags(e.target.value)}
                className="input-field w-full"
                placeholder="action, adventure, supernatural..."
              />
              <p className="text-sm text-gray-500 mt-2">Separate multiple genres with commas</p>
            </div>

            {/* Tone */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-pink-600">🎭</span> Tone & Mood</div>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input-field w-full"
                placeholder="heroic, dark, comedic, intense..."
              />
            </div>

            {/* Setting */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-green-600">🌍</span> Setting & World</div>
              <input
                type="text"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                className="input-field w-full"
                placeholder="futuristic Tokyo, medieval fantasy kingdom..."
              />
            </div>

            {/* Visual Vibe */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-indigo-600">🎨</span> Visual Style Reference</div>
              <input
                type="text"
                value={visualVibe}
                onChange={(e) => setVisualVibe(e.target.value)}
                className="input-field w-full"
                placeholder="like Attack on Titan, Studio Ghibli style..."
              />
              <p className="text-sm text-gray-500 mt-2">Reference existing manga/anime styles</p>
            </div>

            {/* Style Reference Images */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-amber-600">🖼️</span> Upload Style Reference Images (optional)</div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(e) => setStyleRefs(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
              {styleRefs.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">{styleRefs.length} image(s) will be used to guide the art style</p>
              )}
            </div>

            {/* Cast */}
            <div className="space-y-3">
              <div className="section-label"><span className="text-fuchsia-600">👥</span> Main Characters</div>
              <textarea
                value={castInput}
                onChange={(e) => setCastInput(e.target.value)}
                rows={4}
                className="input-field resize-none w-full"
                placeholder="Akira&#10;Yuki&#10;Sensei Tanaka"
              />
              <p className="text-sm text-gray-500 mt-2">One character name per line</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Time Notice */}
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">⏱️ Generation takes time, please be patient</h4>
                  <p className="text-sm text-blue-700">
                    Creating your 10-page manga with AI story planning, character design, and image generation typically takes 
                    <span className="font-medium"> 3-5 minutes</span>. You'll see live progress updates during the process.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={busy || apiUp === false}
                className="btn-primary w-full text-lg py-4 relative shadow-lg hover:shadow-xl transition-shadow"
              >
                {busy ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center mb-2">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Your Manga...
                    </div>
                    {planningStatus && (
                      <div className="text-sm text-white/80 text-center">
                        {planningStatus}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    Generate Manga Episode
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered by Advanced AI</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of manga creation with cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
              title: 'AI Story Planning',
              desc: 'Intelligent 10-page outlines with detailed panel layouts, character development, and compelling dialogues.',
              color: 'from-purple-500 to-indigo-500',
              icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              ),
              badge: 'Gemini 2.5',
            }, {
              title: 'Visual Generation',
              desc: 'Nano Banana creates stunning B&W manga artwork with perfect character consistency across all pages.',
              color: 'from-blue-500 to-cyan-500',
              icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              ),
              badge: 'Flash Image',
            }, {
              title: 'AI Audiobook',
              desc: 'ElevenLabs Flash v2.5 brings your manga to life with natural voice narration and immersive reading experience.',
              color: 'from-emerald-500 to-teal-500',
              icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="m19.07 4.93-1.41 1.41A8.97 8.97 0 0 1 21 12a8.97 8.97 0 0 1-3.34 5.66l1.41 1.41A10.97 10.97 0 0 0 23 12a10.97 10.97 0 0 0-4.93-7.07z"/>
                  <path d="m15.54 8.46-1.41 1.41A2.97 2.97 0 0 1 15 12a2.97 2.97 0 0 1-.87 1.13l1.41 1.41A4.97 4.97 0 0 0 17 12a4.97 4.97 0 0 0-1.46-3.54z"/>
                </svg>
              ),
              badge: 'Flash v2.5',
            }].map((f, i) => (
              <div key={i} className="group relative">
                <div className="glass-card p-8 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-white/30">
                  {/* Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`bg-gradient-to-r ${f.color} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg`}>
                      {f.badge}
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${f.color} text-white flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {f.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                  
                  {/* Hover Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Features Row */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Studio Editor</h4>
                <p className="text-sm text-gray-600">Advanced editing tools with overlay support and AI regeneration</p>
              </div>
            </div>
            
            <div className="glass-card p-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Real-time Generation</h4>
                <p className="text-sm text-gray-600">Watch your manga come to life with live progress streaming</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
