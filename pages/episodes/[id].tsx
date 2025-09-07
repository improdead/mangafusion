import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import PageCard from '../../components/PageCard';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

type PageState = {
  page: number;
  pct?: number;
  imageUrl?: string;
  seed?: number;
  version?: number;
  error?: string;
  id?: string; // pageId for actions
};

type Episode = {
  id: string;
  title: string;
  rendererModel: string;
  createdAt: string;
};

export default function EpisodeReader() {
  const r = useRouter();
  const { id } = r.query;
  const [pages, setPages] = useState<Record<number, PageState>>({});
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [fullPageView, setFullPageView] = useState<PageState | null>(null);
  const [readerMode, setReaderMode] = useState(false);
  const [currentReaderPage, setCurrentReaderPage] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [dialogues, setDialogues] = useState<any[]>([]);
  const [ttsVoices, setTtsVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [ttsUsage, setTtsUsage] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const sorted = useMemo(() => {
    const arr: PageState[] = [];
    for (let i = 1; i <= 10; i++) arr.push(pages[i] || { page: i });
    return arr;
  }, [pages]);

  const completedPages = useMemo(() => {
    return sorted.filter(p => p.imageUrl).length;
  }, [sorted]);

  const progressPercentage = useMemo(() => {
    return Math.round((completedPages / 10) * 100);
  }, [completedPages]);

  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    
    // Load TTS voices and usage info
    fetch(`${API_BASE}/tts/voices`)
      .then(res => res.json())
      .then(data => {
        if (data.voices) {
          setTtsVoices(data.voices);
          // Set default voice if available
          if (data.voices.length > 0 && !selectedVoice) {
            setSelectedVoice(data.voices[0].voice_id);
          }
        }
      })
      .catch(console.error);

    fetch(`${API_BASE}/tts/usage`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setTtsUsage(data);
        }
      })
      .catch(console.error);
    
    // Fetch episode details
    fetch(`${API_BASE}/episodes/${id}`)
      .then(res => res.json())
      .then(data => {
        setEpisode(data);
        if (data?.pages) {
          setPages((prev: any) => {
            const next: Record<number, PageState> = { ...prev };
            data.pages.forEach((p: any) => {
              next[p.pageNumber] = { ...(next[p.pageNumber] || { page: p.pageNumber }), id: p.id, imageUrl: p.imageUrl, seed: p.seed, version: p.version, error: p.error };
            });
            return next;
          });
        }
      })
      .catch(console.error);

    const es = new EventSource(`${API_BASE}/episodes/${id}/stream`);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'page_progress') {
          setPages((prev) => ({ ...prev, [msg.page]: { ...(prev[msg.page] || { page: msg.page }), pct: msg.pct } }));
        } else if (msg.type === 'page_done') {
          setPages((prev) => ({
            ...prev,
            [msg.page]: { ...(prev[msg.page] || { page: msg.page }), imageUrl: msg.imageUrl, seed: msg.seed, version: msg.version, pct: 100, error: undefined },
          }));
        } else if (msg.type === 'page_failed') {
          setPages((prev) => ({ ...prev, [msg.page]: { ...(prev[msg.page] || { page: msg.page }), error: msg.error, pct: undefined } }));
        } else if (msg.type === 'generation_complete') {
          setIsGenerating(false);
        }
      } catch (e) {
        // ignore
      }
    };
    es.onerror = () => {
      // you might want to handle reconnection in real app
    };
    return () => es.close();
  }, [id]);

  // Check if generation is complete
  useEffect(() => {
    if (completedPages === 10) {
      setIsGenerating(false);
    }
  }, [completedPages]);

  const generateAudio = async (pageNumber: number) => {
    const pageState = pages[pageNumber];
    if (!pageState?.id) return;

    setIsLoadingAudio(true);
    try {
      const response = await fetch(`${API_BASE}/pages/${pageState.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_id: selectedVoice || undefined,
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        console.error('Audio generation failed:', data.error);
        alert('Audio generation failed: ' + data.error);
        return;
      }

      setAudioUrl(data.audioUrl);
      setDialogues(data.dialogues || []);
      
      // Auto-play the audio
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      alert('Audio generation failed');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const currentReaderPageData = useMemo(() => {
    return pages[currentReaderPage];
  }, [pages, currentReaderPage]);

  const canGoNext = currentReaderPage < 10 && pages[currentReaderPage + 1]?.imageUrl;
  const canGoPrev = currentReaderPage > 1;

  // Keyboard navigation for reader mode
  useEffect(() => {
    if (!readerMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) {
        setCurrentReaderPage(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && canGoNext) {
        setCurrentReaderPage(prev => prev + 1);
      } else if (e.key === 'Escape') {
        setReaderMode(false);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        generateAudio(currentReaderPage);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [readerMode, canGoPrev, canGoNext, currentReaderPage]);

  // Reader Mode View
  if (readerMode) {
    return (
      <Layout title={`${episode?.title || 'Episode'} - Reader Mode - MangaFusion`}>
        <div className="min-h-screen bg-black text-white">
          {/* Reader Header */}
          <div className="bg-gray-900 border-b border-gray-700 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setReaderMode(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold">{episode?.title}</h1>
                <span className="text-gray-400">Page {currentReaderPage} of 10</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Voice Selection */}
                {ttsVoices.length > 0 && (
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-sm"
                  >
                    {ttsVoices.map((voice) => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name} ({voice.labels?.accent || 'Unknown'})
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Audio Controls */}
                <button
                  onClick={() => generateAudio(currentReaderPage)}
                  disabled={isLoadingAudio || !currentReaderPageData?.id}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  {isLoadingAudio ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.324a1 1 0 011.617.824zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                      <span>Read Aloud</span>
                    </>
                  )}
                </button>
                
                {/* Navigation */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentReaderPage(prev => Math.max(1, prev - 1))}
                    disabled={!canGoPrev}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 rounded"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentReaderPage(prev => Math.min(10, prev + 1))}
                    disabled={!canGoNext}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-2 rounded"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reader Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            {currentReaderPageData?.imageUrl ? (
              <div className="max-w-4xl max-h-full">
                <img
                  src={currentReaderPageData.imageUrl}
                  alt={`Page ${currentReaderPage}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📖</div>
                <p>Page {currentReaderPage} is not ready yet</p>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="fixed bottom-4 left-4 right-4">
              <div className="bg-gray-900 rounded-lg p-4 max-w-md mx-auto">
                <audio
                  ref={audioRef}
                  controls
                  className="w-full"
                  src={audioUrl}
                >
                  Your browser does not support the audio element.
                </audio>
                <div className="mt-2 text-sm text-gray-400 flex justify-between items-center">
                  <div>
                    {dialogues.length > 0 && (
                      <p>🎭 {dialogues.length} dialogue(s) for this page</p>
                    )}
                  </div>
                  <div>
                    {ttsUsage && (
                      <p className="text-xs">
                        ⚡ Flash v2.5 | {ttsUsage.characterCount?.toLocaleString()}/{ttsUsage.characterLimit?.toLocaleString()} chars
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Navigation Hint */}
          <div className="fixed bottom-4 right-4 text-xs text-gray-500">
            Use ← → keys to navigate
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${episode?.title || 'Episode'} - MangaFusion`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-purple-600 hover:text-purple-700 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Create
            </Link>
            
            <div className="flex items-center space-x-4">
              {completedPages > 0 && (
                <button
                  onClick={() => setReaderMode(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Reader Mode</span>
                </button>
              )}
              <div className="text-sm text-gray-500">
                {episode?.rendererModel && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    {episode.rendererModel}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {episode?.title || 'Loading...'}
          </h1>
          
          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="progress-bar h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {completedPages} of 10 pages completed
            </span>
            <span className="text-gray-600">
              {progressPercentage}% complete
            </span>
          </div>
          
          {isGenerating && (
            <div className="mt-4 flex items-center text-purple-600">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI is generating your manga pages...
            </div>
          )}
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((p) => (
            <PageCard
              key={p.page}
              page={p.page}
              imageUrl={p.imageUrl}
              seed={p.seed}
              progress={p.pct}
              isGenerating={isGenerating}
              error={p.error}
              onRetry={p.error && p.id ? async () => {
                try {
                  await fetch(`${API_BASE}/pages/${p.id}/retry`, { method: 'POST' });
                } catch {}
              } : undefined}
              onViewFull={() => p.imageUrl && setFullPageView(p)}
            />
          ))}
        </div>

        {/* Full Page Modal */}
        {fullPageView && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setFullPageView(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Page {String(fullPageView.page).padStart(2, '0')}</h3>
                  <div className="flex items-center space-x-4">
                    {fullPageView.page > 1 && (
                      <button
                        onClick={() => {
                          const prevPage = sorted.find(p => p.page === fullPageView.page - 1);
                          if (prevPage?.imageUrl) setFullPageView(prevPage);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ← Previous
                      </button>
                    )}
                    {fullPageView.page < 10 && (
                      <button
                        onClick={() => {
                          const nextPage = sorted.find(p => p.page === fullPageView.page + 1);
                          if (nextPage?.imageUrl) setFullPageView(nextPage);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="max-h-[80vh] overflow-auto">
                  <img
                    src={fullPageView.imageUrl}
                    alt={`Page ${fullPageView.page}`}
                    className="w-full h-auto"
                  />
                </div>
                
                {fullPageView.seed && (
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    Seed: #{fullPageView.seed} | Version: {fullPageView.version || 1}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {!isGenerating && completedPages === 10 && (
          <div className="mt-12 text-center">
            <div className="card max-w-md mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Manga Complete!</h3>
                <p className="text-gray-600 mb-6">Your 10-page manga episode has been generated successfully.</p>
                <div className="flex space-x-3 justify-center">
                  <button className="btn-secondary">
                    Download PDF
                  </button>
                  <Link href={`/studio/${id}`} className="btn-primary">
                    Edit In Studio
                  </Link>
                  <Link href="/" className="btn-secondary">
                    Create Another
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
