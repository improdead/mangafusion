import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({});
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const readerContentRef = useRef<HTMLDivElement>(null);

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

    // Close any existing EventSource before creating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${API_BASE}/episodes/${id}/stream`);
    eventSourceRef.current = es;

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
        // ignore parsing errors
      }
    };

    es.onerror = () => {
      // Close on error to prevent reconnection attempts
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [id]);

  // Check if generation is complete
  useEffect(() => {
    if (completedPages === 10) {
      setIsGenerating(false);
    }
  }, [completedPages]);

  const generateAudio = useCallback(async (pageNumber: number) => {
    const pageState = pages[pageNumber];
    if (!pageState?.id) return;

    setIsLoadingAudio(true);
    setAudioError(null);
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
        setAudioError(data.error);
        return;
      }

      setAudioUrl(data.audioUrl);
      setDialogues(data.dialogues || []);
      setAudioError(null);

      // Auto-play the audio
      if (audioRef.current) {
        audioRef.current.load();
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playError) {
          console.error('Audio playback failed:', playError);
          setAudioError('Playback failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      setAudioError('Failed to generate audio. Please try again.');
    } finally {
      setIsLoadingAudio(false);
    }
  }, [pages, selectedVoice]);

  const currentReaderPageData = useMemo(() => {
    return pages[currentReaderPage];
  }, [pages, currentReaderPage]);

  const canGoNext = currentReaderPage < 10 && pages[currentReaderPage + 1]?.imageUrl;
  const canGoPrev = currentReaderPage > 1;

  // Handle audio player events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Keyboard navigation for reader mode
  useEffect(() => {
    if (!readerMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default for all handled keys
      const handledKeys = ['ArrowLeft', 'ArrowRight', 'Escape', ' ', 'Enter', '?', 'h'];
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' && canGoPrev) {
        setCurrentReaderPage(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && canGoNext) {
        setCurrentReaderPage(prev => prev + 1);
      } else if (e.key === 'Escape') {
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false);
        } else {
          setReaderMode(false);
        }
      } else if (e.key === ' ') {
        if (audioRef.current && audioUrl) {
          if (isPlaying) {
            audioRef.current.pause();
          } else {
            audioRef.current.play();
          }
        } else {
          generateAudio(currentReaderPage);
        }
      } else if (e.key === 'Enter') {
        generateAudio(currentReaderPage);
      } else if (e.key === '?' || e.key === 'h') {
        setShowKeyboardHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [readerMode, canGoPrev, canGoNext, currentReaderPage, generateAudio, audioUrl, isPlaying, showKeyboardHelp]);

  // Focus management for reader mode
  useEffect(() => {
    if (readerMode && readerContentRef.current) {
      readerContentRef.current.focus();
    }
  }, [readerMode, currentReaderPage]);

  // Initialize loading state when image URL changes
  useEffect(() => {
    if (currentReaderPageData?.imageUrl) {
      setImageLoadingStates(prev => ({ ...prev, [currentReaderPage]: true }));
    }
  }, [currentReaderPage, currentReaderPageData?.imageUrl]);

  // Reader Mode View
  if (readerMode) {
    return (
      <Layout title={`${episode?.title || 'Episode'} - Reader Mode - MangaFusion`}>
        <div className="min-h-screen bg-black text-white">
          {/* Reader Header */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-900/95 border-b border-gray-800 p-4 backdrop-blur-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setReaderMode(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800"
                    aria-label="Exit reader mode"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-lg font-bold">{episode?.title}</h1>
                    <span className="text-sm text-gray-400">Page {currentReaderPage} of 10</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Help Button */}
                  <button
                    onClick={() => setShowKeyboardHelp(true)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800"
                    aria-label="Show keyboard shortcuts"
                    title="Keyboard shortcuts (? or H)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Voice Selection */}
                  {ttsVoices.length > 0 && (
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-sm hover:bg-gray-700 transition-colors duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      aria-label="Select voice"
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
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg shadow-purple-500/20"
                    aria-label="Generate audio narration"
                  >
                    {isLoadingAudio ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="text-sm">Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.324a1 1 0 011.617.824zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Read Aloud</span>
                      </>
                    )}
                  </button>

                  {/* Navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentReaderPage(prev => Math.max(1, prev - 1))}
                      disabled={!canGoPrev}
                      className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                      aria-label="Previous page"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentReaderPage(prev => Math.min(10, prev + 1))}
                      disabled={!canGoNext}
                      className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                      aria-label="Next page"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reader Content */}
          <div
            ref={readerContentRef}
            className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-80px)] focus:outline-none"
            tabIndex={-1}
            role="main"
            aria-label="Manga reader content"
          >
            {currentReaderPageData?.imageUrl ? (
              <div className="max-w-4xl max-h-full relative group">
                {imageLoadingStates[currentReaderPage] && (
                  <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center rounded-lg">
                    <div className="text-gray-500">
                      <svg className="animate-spin h-12 w-12" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>
                )}
                <img
                  src={currentReaderPageData.imageUrl}
                  alt={`Page ${currentReaderPage} of ${episode?.title || 'Episode'}`}
                  className={`w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-500 ${
                    imageLoadingStates[currentReaderPage] ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setImageLoadingStates(prev => ({ ...prev, [currentReaderPage]: false }))}
                  onError={() => setImageLoadingStates(prev => ({ ...prev, [currentReaderPage]: false }))}
                />
                {/* Page navigation overlays */}
                {canGoPrev && (
                  <button
                    onClick={() => setCurrentReaderPage(prev => prev - 1)}
                    className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    aria-label="Previous page (click or left arrow)"
                  >
                    <div className="h-full flex items-center justify-start pl-4">
                      <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
                {canGoNext && (
                  <button
                    onClick={() => setCurrentReaderPage(prev => prev + 1)}
                    className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    aria-label="Next page (click or right arrow)"
                  >
                    <div className="h-full flex items-center justify-end pr-4">
                      <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ) : currentReaderPageData?.pct !== undefined ? (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-800"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-500"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${currentReaderPageData.pct}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{currentReaderPageData.pct}%</span>
                  </div>
                </div>
                <p className="text-xl text-gray-300 mb-2">Generating Page {currentReaderPage}</p>
                <p className="text-sm text-gray-500">AI is creating your manga page...</p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <svg className="w-24 h-24 mx-auto mb-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <p className="text-xl mb-2">Page {currentReaderPage} Not Ready</p>
                <p className="text-sm text-gray-600">This page hasn't been generated yet</p>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6 animate-fadeIn">
              <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto border border-gray-700 shadow-2xl">
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${isPlaying ? 'bg-purple-500' : 'bg-gray-700'} flex items-center justify-center transition-all duration-300`}>
                    {isPlaying ? (
                      <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.324a1 1 0 011.617.824zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.324a1 1 0 011.617.824z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <audio
                      ref={audioRef}
                      controls
                      className="w-full"
                      src={audioUrl}
                      aria-label="Page narration audio player"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center text-sm">
                  <div className="text-gray-400">
                    {dialogues.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{dialogues.length} dialogue{dialogues.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {ttsUsage && (
                      <span>
                        {ttsUsage.characterCount?.toLocaleString()}/{ttsUsage.characterLimit?.toLocaleString()} chars used
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Error */}
          {audioError && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{audioError}</span>
              <button
                onClick={() => setAudioError(null)}
                className="ml-2 text-white/80 hover:text-white"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Keyboard Help Modal */}
          {showKeyboardHelp && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
              onClick={() => setShowKeyboardHelp(false)}
            >
              <div
                className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="keyboard-help-title"
                aria-modal="true"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 id="keyboard-help-title" className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setShowKeyboardHelp(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close dialog"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { keys: ['←', '→'], description: 'Navigate between pages' },
                    { keys: ['Space'], description: 'Play/Pause audio or generate if not available' },
                    { keys: ['Enter'], description: 'Generate audio narration' },
                    { keys: ['Esc'], description: 'Exit reader mode' },
                    { keys: ['?', 'H'], description: 'Show this help dialog' },
                  ].map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && <span className="text-gray-600">or</span>}
                            <kbd className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono text-gray-300">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                      <span className="text-gray-400 text-sm">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowKeyboardHelp(false)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Navigation Hint */}
          <div className="fixed bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg text-xs text-gray-400 border border-gray-800 flex items-center space-x-2 animate-fadeIn">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">?</kbd> for shortcuts</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${episode?.title || 'Episode'} - MangaFusion`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 flex items-center transition-all duration-200 hover:translate-x-[-4px] group"
              aria-label="Back to create page"
            >
              <svg className="w-5 h-5 mr-2 transition-transform group-hover:translate-x-[-2px]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Back to Create</span>
            </Link>

            <div className="flex items-center space-x-4">
              {completedPages > 0 && (
                <button
                  onClick={() => {
                    setReaderMode(true);
                    setCurrentReaderPage(1);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/20"
                  aria-label="Enter reader mode"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <span>Reader Mode</span>
                </button>
              )}
              {episode?.rendererModel && (
                <div className="text-sm text-gray-500">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-medium" aria-label={`Rendered with ${episode.rendererModel}`}>
                    {episode.rendererModel}
                  </span>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {episode?.title || (
              <span className="inline-block bg-gray-200 animate-pulse rounded-lg h-10 w-64"></span>
            )}
          </h1>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
            <div
              className="progress-bar h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Episode generation progress: ${progressPercentage}%`}
            >
              {progressPercentage > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-600 font-medium">
              {completedPages} of 10 pages completed
            </span>
            <span className="text-gray-600 font-medium">
              {progressPercentage}% complete
            </span>
          </div>

          {isGenerating && (
            <div className="mt-4 flex items-center text-purple-600 bg-purple-50 px-4 py-3 rounded-lg animate-fadeIn" role="status" aria-live="polite">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">AI is generating your manga pages...</span>
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
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setFullPageView(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-page-title"
          >
            <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setFullPageView(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
                aria-label="Close full page view"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="bg-white rounded-2xl p-6 shadow-2xl transform transition-all duration-300 hover:scale-[1.01]">
                <div className="flex items-center justify-between mb-4">
                  <h3 id="full-page-title" className="text-2xl font-bold text-gray-900">
                    Page {String(fullPageView.page).padStart(2, '0')}
                  </h3>
                  <div className="flex items-center space-x-3">
                    {fullPageView.page > 1 && sorted.find(p => p.page === fullPageView.page - 1)?.imageUrl && (
                      <button
                        onClick={() => {
                          const prevPage = sorted.find(p => p.page === fullPageView.page - 1);
                          if (prevPage?.imageUrl) setFullPageView(prevPage);
                        }}
                        className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2"
                        aria-label="Previous page"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Previous</span>
                      </button>
                    )}
                    {fullPageView.page < 10 && sorted.find(p => p.page === fullPageView.page + 1)?.imageUrl && (
                      <button
                        onClick={() => {
                          const nextPage = sorted.find(p => p.page === fullPageView.page + 1);
                          if (nextPage?.imageUrl) setFullPageView(nextPage);
                        }}
                        className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2"
                        aria-label="Next page"
                      >
                        <span>Next</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[75vh] overflow-auto rounded-lg">
                  <img
                    src={fullPageView.imageUrl}
                    alt={`Page ${fullPageView.page} of ${episode?.title || 'Episode'}`}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                {fullPageView.seed && (
                  <div className="mt-4 text-sm text-gray-500 text-center bg-gray-50 rounded-lg py-2 px-4">
                    <span className="font-medium">Seed:</span> #{fullPageView.seed} | <span className="font-medium">Version:</span> {fullPageView.version || 1}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {!isGenerating && completedPages === 10 && (
          <div className="mt-12 text-center animate-fadeIn">
            <div className="card max-w-2xl mx-auto bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg shadow-green-500/30">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Manga Complete!</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Your 10-page manga episode has been generated successfully.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    className="btn-secondary flex items-center space-x-2"
                    disabled
                    aria-label="Download PDF (coming soon)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                  <Link
                    href={`/studio/${id}`}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span>Edit In Studio</span>
                  </Link>
                  <Link
                    href="/"
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Create Another</span>
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
