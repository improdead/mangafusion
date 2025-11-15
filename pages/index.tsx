import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

// Character limits
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

// Validation state type
interface FieldErrors {
  title?: string;
  description?: string;
  genreTags?: string;
  tone?: string;
  setting?: string;
  visualVibe?: string;
  castInput?: string;
}

export default function Home() {
  const r = useRouter();
  const [title, setTitle] = useState('Shadow Sketch');
  const [description, setDescription] = useState('');
  const [genreTags, setGenreTags] = useState('modern shonen, urban fantasy');
  const [tone, setTone] = useState('dynamic, heroic, hopeful');
  const [setting, setSetting] = useState('rain-slick neon city at dusk');
  const [visualVibe, setVisualVibe] = useState('shōnen energy akin to Demon Slayer / JJK / OPM — just the vibe');
  const [castInput, setCastInput] = useState('Aoi\nKenji');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [styleRefs, setStyleRefs] = useState<File[]>([]);
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [planningStatus, setPlanningStatus] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [heroTitle, setHeroTitle] = useState('Create Your AI Manga');
  const [heroSubtitle, setHeroSubtitle] = useState('Transform your ideas into stunning manga pages with AI-powered storytelling and image generation');
  const eventSourceRef = useRef<EventSource | null>(null);
  const planningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Validation function
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.length > TITLE_MAX_LENGTH) return `Title must be ${TITLE_MAX_LENGTH} characters or less`;
        return undefined;
      case 'description':
        if (value.length > DESCRIPTION_MAX_LENGTH) return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`;
        return undefined;
      case 'genreTags':
        if (!value.trim()) return 'At least one genre tag is recommended';
        return undefined;
      case 'tone':
        if (!value.trim()) return 'Tone helps guide the story mood';
        return undefined;
      case 'setting':
        if (!value.trim()) return 'Setting provides important context';
        return undefined;
      case 'visualVibe':
        if (!value.trim()) return 'Visual style reference helps generate better art';
        return undefined;
      case 'castInput':
        const characters = value.split('\n').filter(s => s.trim());
        if (characters.length === 0) return 'At least one character is required';
        if (characters.length > 10) return 'Maximum 10 characters allowed';
        return undefined;
      default:
        return undefined;
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    errors.title = validateField('title', title);
    errors.description = validateField('description', description);
    errors.genreTags = validateField('genreTags', genreTags);
    errors.tone = validateField('tone', tone);
    errors.setting = validateField('setting', setting);
    errors.visualVibe = validateField('visualVibe', visualVibe);
    errors.castInput = validateField('castInput', castInput);

    setFieldErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error !== undefined);
  };

  // Handle field blur
  const handleBlur = (fieldName: string) => {
    setTouched(prev => new Set(prev).add(fieldName));
    const value = { title, description, genreTags, tone, setting, visualVibe, castInput }[fieldName] as string;
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Handle field change with validation
  const handleFieldChange = (fieldName: string, value: string) => {
    // Update the field value
    switch (fieldName) {
      case 'title': setTitle(value); break;
      case 'description': setDescription(value); break;
      case 'genreTags': setGenreTags(value); break;
      case 'tone': setTone(value); break;
      case 'setting': setSetting(value); break;
      case 'visualVibe': setVisualVibe(value); break;
      case 'castInput': setCastInput(value); break;
    }

    // Validate if field has been touched
    if (touched.has(fieldName)) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Cleanup EventSource and timeout on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (planningTimeoutRef.current) {
        clearTimeout(planningTimeoutRef.current);
        planningTimeoutRef.current = null;
      }
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      setTouched(new Set(['title', 'description', 'genreTags', 'tone', 'setting', 'visualVibe', 'castInput']));
      setError('Please fix the validation errors before submitting');
      return;
    }

    setBusy(true);
    setError(null);
    setCurrentStep('Initializing...');

    try {
      const cast = castInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, traits: 'mysterious character' }));
      const body = {
        title,
        description,
        genre_tags: genreTags.split(',').map((s) => s.trim()).filter(Boolean),
        tone,
        setting,
        visual_vibe: visualVibe,
        cast,
      };

      setCurrentStep('Submitting story details...');
      setPlanningStatus('Submitting your story to the AI planner...');

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

      // Close any existing EventSource and timeout before creating new ones
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (planningTimeoutRef.current) {
        clearTimeout(planningTimeoutRef.current);
        planningTimeoutRef.current = null;
      }

      setCurrentStep('Planning story...');

      // Listen for planning status updates
      const eventSource = new EventSource(`${API_BASE}/episodes/${episodeId}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'planning_started' || data.type === 'planning_progress') {
            setCurrentStep('Planning story structure...');
            setPlanningStatus(data.message || 'AI is planning your 10-page story...');
          } else if (data.type === 'planning_complete') {
            setCurrentStep('Planning complete!');
            setPlanningStatus(data.message || 'Story planning complete!');
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            if (planningTimeoutRef.current) {
              clearTimeout(planningTimeoutRef.current);
              planningTimeoutRef.current = null;
            }
            // Continue with the rest of the process
            continueAfterPlanning(episodeId);
          }
        } catch (e) {
          // ignore parsing errors
        }
      };

      eventSource.onerror = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };

      // Fallback in case SSE doesn't work (only runs if planning hasn't completed)
      planningTimeoutRef.current = setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        continueAfterPlanning(episodeId);
        planningTimeoutRef.current = null;
      }, 10000);

    } catch (err: any) {
      setError(err.message || String(err));
      setBusy(false);
      setCurrentStep('');
      setPlanningStatus('');
    }
  }

  async function continueAfterPlanning(episodeId: string) {
    try {
      // upload style refs if provided
      if (styleRefs.length) {
        setCurrentStep('Uploading style references...');
        setPlanningStatus(`Uploading ${styleRefs.length} style reference image(s)...`);
        await Promise.all(styleRefs.map(async (file) => {
          const form = new FormData();
          form.append('file', file);
          const up = await fetch(`${API_BASE}/episodes/${episodeId}/style-refs`, { method: 'POST', body: form });
          const j = await up.json();
          if (!up.ok || j.error) throw new Error(j.error || 'Failed uploading style ref');
        }));
      }

      setCurrentStep('Generating pages...');
      setPlanningStatus('Starting AI image generation for 10 pages...');
      await fetch(`${API_BASE}/episodes/${episodeId}/generate10`, { method: 'POST' });

      setCurrentStep('Complete!');
      setPlanningStatus('Redirecting to your manga...');
      r.push(`/episodes/${episodeId}`);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
      setPlanningStatus('');
      setCurrentStep('');
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
                  <div className="font-medium text-red-800">API not reachable</div>
                  <div className="text-sm text-red-700">This app serves the API internally at <code>/api</code>. If this persists, reload the page or restart <code>npm run dev</code>. For external APIs, set <code>NEXT_PUBLIC_API_BASE</code>.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="glass-card max-w-2xl mx-auto p-8">
          <form onSubmit={onSubmit} className="space-y-8" noValidate>
            {/* Title */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="title" className="section-label">
                  <span className="text-purple-600">📖</span> Story Title
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <span
                  className={`text-sm ${title.length > TITLE_MAX_LENGTH ? 'text-red-600 font-semibold' : 'text-gray-500'}`}
                  aria-live="polite"
                >
                  {title.length}/{TITLE_MAX_LENGTH}
                </span>
              </div>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                className={`input-field w-full ${touched.has('title') && fieldErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your manga title..."
                aria-required="true"
                aria-invalid={touched.has('title') && !!fieldErrors.title}
                aria-describedby={fieldErrors.title ? 'title-error' : 'title-help'}
              />
              {touched.has('title') && fieldErrors.title ? (
                <p id="title-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.title}
                </p>
              ) : (
                <p id="title-help" className="text-sm text-gray-500">The main title of your manga series or episode</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="section-label">
                  <span className="text-purple-600">📝</span> Story Description
                </label>
                <span
                  className={`text-sm ${description.length > DESCRIPTION_MAX_LENGTH ? 'text-red-600 font-semibold' : 'text-gray-500'}`}
                  aria-live="polite"
                >
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="description"
                className={`input-field w-full resize-none ${touched.has('description') && fieldErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                rows={4}
                value={description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                placeholder="Brief synopsis: who, what, stakes, vibe..."
                aria-invalid={touched.has('description') && !!fieldErrors.description}
                aria-describedby={fieldErrors.description ? 'description-error' : 'description-help'}
              />
              {touched.has('description') && fieldErrors.description ? (
                <p id="description-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.description}
                </p>
              ) : (
                <p id="description-help" className="text-sm text-gray-500">
                  Optional: Provide a brief summary of the story, main characters, conflict, and overall vibe
                </p>
              )}
            </div>

            {/* Genre Tags */}
            <div className="space-y-3">
              <label htmlFor="genreTags" className="section-label">
                <span className="text-blue-600">🏷️</span> Genre Tags
              </label>
              <input
                id="genreTags"
                type="text"
                value={genreTags}
                onChange={(e) => handleFieldChange('genreTags', e.target.value)}
                onBlur={() => handleBlur('genreTags')}
                className={`input-field w-full ${touched.has('genreTags') && fieldErrors.genreTags ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="action, adventure, supernatural..."
                aria-invalid={touched.has('genreTags') && !!fieldErrors.genreTags}
                aria-describedby={fieldErrors.genreTags ? 'genreTags-error' : 'genreTags-help'}
              />
              {touched.has('genreTags') && fieldErrors.genreTags ? (
                <p id="genreTags-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.genreTags}
                </p>
              ) : (
                <p id="genreTags-help" className="text-sm text-gray-500">
                  Separate multiple genres with commas (e.g., "action, comedy, romance")
                </p>
              )}
            </div>

            {/* Tone */}
            <div className="space-y-3">
              <label htmlFor="tone" className="section-label">
                <span className="text-pink-600">🎭</span> Tone & Mood
              </label>
              <input
                id="tone"
                type="text"
                value={tone}
                onChange={(e) => handleFieldChange('tone', e.target.value)}
                onBlur={() => handleBlur('tone')}
                className={`input-field w-full ${touched.has('tone') && fieldErrors.tone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="heroic, dark, comedic, intense..."
                aria-invalid={touched.has('tone') && !!fieldErrors.tone}
                aria-describedby={fieldErrors.tone ? 'tone-error' : 'tone-help'}
              />
              {touched.has('tone') && fieldErrors.tone ? (
                <p id="tone-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.tone}
                </p>
              ) : (
                <p id="tone-help" className="text-sm text-gray-500">
                  Describe the emotional atmosphere and mood of your story
                </p>
              )}
            </div>

            {/* Setting */}
            <div className="space-y-3">
              <label htmlFor="setting" className="section-label">
                <span className="text-green-600">🌍</span> Setting & World
              </label>
              <input
                id="setting"
                type="text"
                value={setting}
                onChange={(e) => handleFieldChange('setting', e.target.value)}
                onBlur={() => handleBlur('setting')}
                className={`input-field w-full ${touched.has('setting') && fieldErrors.setting ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="futuristic Tokyo, medieval fantasy kingdom..."
                aria-invalid={touched.has('setting') && !!fieldErrors.setting}
                aria-describedby={fieldErrors.setting ? 'setting-error' : 'setting-help'}
              />
              {touched.has('setting') && fieldErrors.setting ? (
                <p id="setting-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.setting}
                </p>
              ) : (
                <p id="setting-help" className="text-sm text-gray-500">
                  Where and when does your story take place? Be specific about the environment
                </p>
              )}
            </div>

            {/* Visual Vibe */}
            <div className="space-y-3">
              <label htmlFor="visualVibe" className="section-label">
                <span className="text-indigo-600">🎨</span> Visual Style Reference
              </label>
              <input
                id="visualVibe"
                type="text"
                value={visualVibe}
                onChange={(e) => handleFieldChange('visualVibe', e.target.value)}
                onBlur={() => handleBlur('visualVibe')}
                className={`input-field w-full ${touched.has('visualVibe') && fieldErrors.visualVibe ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="like Attack on Titan, Studio Ghibli style..."
                aria-invalid={touched.has('visualVibe') && !!fieldErrors.visualVibe}
                aria-describedby={fieldErrors.visualVibe ? 'visualVibe-error' : 'visualVibe-help'}
              />
              {touched.has('visualVibe') && fieldErrors.visualVibe ? (
                <p id="visualVibe-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.visualVibe}
                </p>
              ) : (
                <p id="visualVibe-help" className="text-sm text-gray-500">
                  Reference existing manga/anime styles (e.g., "Studio Ghibli", "Attack on Titan", "One Piece")
                </p>
              )}
            </div>

            {/* Style Reference Images */}
            <div className="space-y-3">
              <label htmlFor="styleRefs" className="section-label">
                <span className="text-amber-600">🖼️</span> Upload Style Reference Images
                <span className="text-gray-500 text-sm font-normal ml-2">(optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-all duration-200 bg-gray-50/50 hover:bg-purple-50/50">
                <input
                  id="styleRefs"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(e) => setStyleRefs(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-colors cursor-pointer"
                  aria-describedby="styleRefs-help"
                />
              </div>
              {styleRefs.length > 0 ? (
                <div className="flex items-center space-x-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{styleRefs.length} image{styleRefs.length > 1 ? 's' : ''} selected - will be used to guide the art style</span>
                </div>
              ) : (
                <p id="styleRefs-help" className="text-sm text-gray-500">
                  Upload reference images to guide the AI's visual style (PNG, JPEG, or WebP)
                </p>
              )}
            </div>

            {/* Cast */}
            <div className="space-y-3">
              <label htmlFor="castInput" className="section-label">
                <span className="text-fuchsia-600">👥</span> Main Characters
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="castInput"
                value={castInput}
                onChange={(e) => handleFieldChange('castInput', e.target.value)}
                onBlur={() => handleBlur('castInput')}
                rows={4}
                className={`input-field resize-none w-full ${touched.has('castInput') && fieldErrors.castInput ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Akira&#10;Yuki&#10;Sensei Tanaka"
                aria-required="true"
                aria-invalid={touched.has('castInput') && !!fieldErrors.castInput}
                aria-describedby={fieldErrors.castInput ? 'castInput-error' : 'castInput-help'}
              />
              {touched.has('castInput') && fieldErrors.castInput ? (
                <p id="castInput-error" className="text-sm text-red-600 flex items-center" role="alert">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.castInput}
                </p>
              ) : (
                <div id="castInput-help" className="text-sm text-gray-500">
                  <p>Enter one character name per line (1-10 characters max)</p>
                  {castInput.split('\n').filter(s => s.trim()).length > 0 && (
                    <p className="mt-1 text-gray-600">
                      {castInput.split('\n').filter(s => s.trim()).length} character{castInput.split('\n').filter(s => s.trim()).length > 1 ? 's' : ''} added
                    </p>
                  )}
                </div>
              )}
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
                className="btn-primary w-full text-lg py-4 relative shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-busy={busy}
                aria-live="polite"
              >
                {busy ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    {/* Progress Indicator */}
                    <div className="flex items-center space-x-3">
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-semibold">
                        {currentStep || 'Creating Your Manga...'}
                      </span>
                    </div>

                    {/* Detailed Status */}
                    {planningStatus && (
                      <div className="w-full bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                        <div className="text-sm text-white/90 text-center flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>{planningStatus}</span>
                        </div>
                      </div>
                    )}

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center space-x-2 text-xs text-white/70">
                      <span className={currentStep.includes('Initializing') || currentStep.includes('Submitting') ? 'text-white font-semibold' : ''}>Planning</span>
                      <span>→</span>
                      <span className={currentStep.includes('Planning story') ? 'text-white font-semibold' : ''}>Structuring</span>
                      <span>→</span>
                      <span className={currentStep.includes('Uploading') ? 'text-white font-semibold' : ''}>References</span>
                      <span>→</span>
                      <span className={currentStep.includes('Generating') ? 'text-white font-semibold' : ''}>Generating</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <span className="font-semibold">Generate Manga Episode</span>
                  </div>
                )}
              </button>

              {apiUp === false && (
                <p className="text-sm text-red-600 text-center mt-2" role="alert">
                  API is not available. Please check your connection.
                </p>
              )}
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
              badge: 'GPT-5 Mini',
            }, {
              title: 'Visual Generation',
              desc: 'OpenAI GPT-Image-1 creates stunning B&W manga artwork with perfect character consistency across all pages.',
              color: 'from-blue-500 to-cyan-500',
              icon: (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              ),
              badge: 'GPT-Image-1',
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
              <div
                key={i}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="glass-card p-8 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-white/30 cursor-pointer h-full flex flex-col">
                  {/* Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className={`bg-gradient-to-r ${f.color} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg group-hover:shadow-xl transition-shadow`}>
                      {f.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${f.color} text-white flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-2xl`}>
                    {f.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 transition-all duration-300">
                    {f.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed flex-grow group-hover:text-gray-700 transition-colors">
                    {f.desc}
                  </p>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300 pointer-events-none`}></div>

                  {/* Bottom Accent Line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${f.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Features Row */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex items-center space-x-4 hover:shadow-xl hover:scale-102 transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Studio Editor</h4>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Advanced editing tools with overlay support and AI regeneration</p>
              </div>
            </div>

            <div className="glass-card p-6 flex items-center space-x-4 hover:shadow-xl hover:scale-102 transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">Real-time Generation</h4>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Watch your manga come to life with live progress streaming</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        /* Smooth focus styles for accessibility */
        input:focus,
        textarea:focus,
        button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        }

        /* Enhanced loading animation */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>
    </Layout>
  );
}
