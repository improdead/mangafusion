import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../components/Layout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

type Character = {
  id: string;
  name: string;
  assetFilename: string;
  imageUrl?: string;
};

type Page = {
  id: string;
  pageNumber: number;
  imageUrl?: string;
};

type Overlay = {
  id: string;
  type: 'text' | 'bubble' | 'image';
  x: number; y: number; w: number; h: number;
  text?: string;
  fontSize?: number;
  color?: string;
  stroke?: string;
  imageUrl?: string; // for type=image
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  radius?: number; // for bubble corner radius
  visible?: boolean; // for layer visibility
};

type HistoryEntry = {
  overlays: Record<string, Overlay[]>;
  timestamp: number;
};

export default function Studio() {
  const r = useRouter();
  const { id } = r.query;
  const [pages, setPages] = useState<Page[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [overlays, setOverlays] = useState<Record<string, Overlay[]>>({}); // pageId -> overlays
  const [selected, setSelected] = useState<{ pageId: string; overlayId: string } | null>(null);
  const [styleRefs, setStyleRefs] = useState<string[]>([]);
  const [useAllStyleRefs, setUseAllStyleRefs] = useState(true);

  const currentPage = useMemo(() => pages[currentIdx], [pages, currentIdx]);
  const currentOverlays = useMemo(() => currentPage ? (overlays[currentPage.id] || []) : [], [overlays, currentPage]);
  const [editPrompt, setEditPrompt] = useState('');
  const [dialogueText, setDialogueText] = useState('');
  const [editing, setEditing] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    // load episode
    fetch(`${API_BASE}/episodes/${id}`)
      .then(res => res.json())
      .then((ep) => {
        const ps = ep.pages?.filter((p: any) => !!p.imageUrl).map((p: any) => ({ id: p.id, pageNumber: p.pageNumber, imageUrl: p.imageUrl })) || [];
        setPages(ps);
        if (ps.length > 0) { loadOverlays(ps[0].id); loadDialogue(ps[0].id); }
      });
    fetch(`${API_BASE}/episodes/${id}/characters`).then(r=>r.json()).then((d)=> setCharacters(d.characters || []));
    fetch(`${API_BASE}/episodes/${id}/style-refs`).then(r=>r.json()).then((d)=> setStyleRefs(d.refs || []));
  }, [id]);

  const loadOverlays = useCallback((pageId: string) => {
    fetch(`${API_BASE}/pages/${pageId}/overlays`).then(r=>r.json()).then((d)=>{
      setOverlays((prev) => ({ ...prev, [pageId]: d.overlays || [] }));
    });
  }, []);

  const saveOverlays = useCallback(async (pageId: string, list: Overlay[]) => {
    await fetch(`${API_BASE}/pages/${pageId}/overlays`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ overlays: list })
    });
  }, []);

  const loadDialogue = useCallback((pageId: string) => {
    fetch(`${API_BASE}/pages/${pageId}/dialogue`).then(r=>r.json()).then((d)=>{
      const arr = (d?.dialogues || []) as any[];
      const text = arr.map((x, idx) => {
        const who = x.character ? `${x.character}: ` : '';
        return `${who}${x.text}`;
      }).join('\n');
      setDialogueText(text);
    }).catch(()=> setDialogueText(''));
  }, []);

  // When changing current page, load its dialogue text
  useEffect(() => {
    if (currentPage?.id) loadDialogue(currentPage.id);
  }, [currentPage?.id, loadDialogue]);

  // History management
  const addToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ overlays: JSON.parse(JSON.stringify(overlays)), timestamp: Date.now() });
      // Keep only last 50 history entries
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [overlays, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1];
      setOverlays(JSON.parse(JSON.stringify(prevEntry.overlays)));
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      setOverlays(JSON.parse(JSON.stringify(nextEntry.overlays)));
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key to remove selected overlay
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          e.preventDefault();
          removeSelected();
        }
      }
      // Cmd+Z / Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd+Shift+Z / Ctrl+Shift+Z for redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelected(null);
      }
      // Arrow keys to move selected overlay
      if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          addToHistory();
          onDrag(selected.overlayId, dx, dy);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, undo, redo, removeSelected, addToHistory, onDrag]);

  const addOverlay = (type: Overlay['type'], init?: Partial<Overlay>) => {
    if (!currentPage) return;
    addToHistory();
    const o: Overlay = {
      id: Math.random().toString(36).slice(2),
      type,
      x: 40, y: 40, w: 200, h: 80,
      text: type !== 'image' ? '' : undefined,
      fontSize: 18,
      color: '#000000',
      stroke: '#ffffff',
      visible: true,
      ...init,
    };
    const list = [...currentOverlays, o];
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
    setSelected({ pageId: currentPage.id, overlayId: o.id });
  };

  const applyAIEdit = async () => {
    if (!currentPage) return;
    setEditing(true);
    try {
      const res = await fetch(`${API_BASE}/pages/${currentPage.id}/regenerate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: editPrompt, dialogueTextOverride: dialogueText, styleRefUrls: useAllStyleRefs ? styleRefs : [] })
      });
      const updated = await res.json();
      if (!res.ok || updated.error) throw new Error(updated.error || 'Edit failed');
      // replace page in list
      setPages((prev) => prev.map(p => p.id === currentPage.id ? { ...p, imageUrl: updated.imageUrl } : p));
      setEditPrompt('');
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || String(e));
    } finally {
      setEditing(false);
    }
  };

  const insertDialogue = async () => {
    if (!currentPage) return;
    try {
      const res = await fetch(`${API_BASE}/pages/${currentPage.id}/dialogue`);
      const data = await res.json();
      const dialogues = data?.dialogues || [];
      if (!Array.isArray(dialogues) || dialogues.length === 0) return alert('No dialogue suggestions for this page');
      addToHistory();
      const rects = getPanelRects(dialogues.length);
      const newOverlays = dialogues.map((d: any, idx: number) => {
        const r = rects[Math.min(idx, rects.length-1)];
        const pad = 12;
        const w = Math.max(180, r.w - 2*pad);
        const h = Math.max(80, Math.min(160, r.h - 2*pad));
        const x = r.x + (r.w - w)/2;
        const y = r.y + (r.h - h)/2;
        return {
          id: Math.random().toString(36).slice(2),
          type: 'bubble' as const,
          x, y, w, h,
          text: (d.character ? `${d.character}: ` : '') + d.text,
          fontSize: 18,
          color: '#000000',
          stroke: '#000000',
          fontFamily: 'Kalam, Inter, sans-serif',
          align: 'center' as const,
          radius: 16,
          visible: true,
        };
      });
      const list = [...currentOverlays, ...newOverlays];
      setOverlays(prev => ({ ...prev, [currentPage.id]: list }));
      await saveOverlays(currentPage.id, list);
    } catch (e) {
      console.error(e);
    }
  };

  const removeSelected = useCallback(() => {
    if (!currentPage || !selected) return;
    addToHistory();
    const list = currentOverlays.filter(o => o.id !== selected.overlayId);
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
    setSelected(null);
  }, [currentPage, selected, currentOverlays, addToHistory, saveOverlays]);

  const toggleOverlayVisibility = (overlayId: string) => {
    if (!currentPage) return;
    const list = currentOverlays.map(o => o.id === overlayId ? { ...o, visible: !o.visible } : o);
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
  };

  const duplicateOverlay = (overlayId: string) => {
    if (!currentPage) return;
    addToHistory();
    const overlay = currentOverlays.find(o => o.id === overlayId);
    if (!overlay) return;
    const newOverlay = { ...overlay, id: Math.random().toString(36).slice(2), x: overlay.x + 20, y: overlay.y + 20 };
    const list = [...currentOverlays, newOverlay];
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
    setSelected({ pageId: currentPage.id, overlayId: newOverlay.id });
  };

  const onDrag = useCallback((id: string, dx: number, dy: number) => {
    if (!currentPage) return;
    const list = currentOverlays.map(o => {
      if (o.id === id) {
        const newX = o.x + dx;
        const newY = o.y + dy;
        setDragInfo({ x: Math.round(newX), y: Math.round(newY), w: o.w, h: o.h });
        return { ...o, x: newX, y: newY };
      }
      return o;
    });
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
  }, [currentOverlays, currentPage]);

  const onResize = (id: string, dw: number, dh: number) => {
    if (!currentPage) return;
    const list = currentOverlays.map(o => {
      if (o.id === id) {
        const newW = Math.max(40, o.w + dw);
        const newH = Math.max(30, o.h + dh);
        setDragInfo({ x: o.x, y: o.y, w: Math.round(newW), h: Math.round(newH) });
        return { ...o, w: newW, h: newH };
      }
      return o;
    });
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
  };

  const onPointerResize = (overlayId: string, corner: 'br'|'tr'|'bl'|'tl') => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        addToHistory();
        setIsDragging(true);
        const overlay = currentOverlays.find(o => o.id === overlayId);
        if (overlay) setDragInfo({ x: overlay.x, y: overlay.y, w: overlay.w, h: overlay.h });
      },
      onPointerMove: (e: React.PointerEvent) => {
        const dx = (e as any).movementX || 0;
        const dy = (e as any).movementY || 0;
        if (!currentPage) return;
        const list = currentOverlays.map(o => {
          if (o.id !== overlayId) return o;
          let x = o.x, y = o.y, w = o.w, h = o.h;
          if (corner === 'br') { w += dx; h += dy; }
          if (corner === 'tr') { w += dx; h -= dy; y += dy; }
          if (corner === 'bl') { w -= dx; h += dy; x += dx; }
          if (corner === 'tl') { w -= dx; h -= dy; x += dx; y += dy; }
          const newW = Math.max(40, w);
          const newH = Math.max(30, h);
          setDragInfo({ x: Math.round(x), y: Math.round(y), w: Math.round(newW), h: Math.round(newH) });
          return { ...o, x, y, w: newW, h: newH };
        });
        setOverlays(prev => ({ ...prev, [currentPage.id]: list }));
      },
      onPointerUp: (e: React.PointerEvent) => {
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        setIsDragging(false);
        setDragInfo(null);
      },
    };
  };

  function getPanelRects(count: number) {
    const W = 682, H = 1024; const m = 20; const rects: {x:number;y:number;w:number;h:number}[] = [];
    if (count <= 1) rects.push({ x: m, y: m, w: W-2*m, h: H-2*m });
    else if (count === 2) { const h=(H-3*m)/2; rects.push({x:m,y:m,w:W-2*m,h}); rects.push({x:m,y:m+h+m,w:W-2*m,h}); }
    else if (count === 3) { const hTop=(H-3*m)*0.55; const hBottom=(H-3*m)-hTop; const wHalf=(W-3*m)/2; rects.push({x:m,y:m,w:W-2*m,h:hTop}); rects.push({x:m,y:m+hTop+m,w:wHalf,h:hBottom}); rects.push({x:m+wHalf+m,y:m+hTop+m,w:wHalf,h:hBottom}); }
    else if (count === 4) { const wHalf=(W-3*m)/2; const hHalf=(H-3*m)/2; for(let r=0;r<2;r++) for(let c=0;c<2;c++) rects.push({x:m+c*(wHalf+m),y:m+r*(hHalf+m),w:wHalf,h:hHalf}); }
    else if (count === 5) { const wHalf=(W-3*m)/2; const rowH=(H-4*m)/3; rects.push({x:m,y:m,w:wHalf,h:rowH}); rects.push({x:m+wHalf+m,y:m,w:wHalf,h:rowH}); rects.push({x:m,y:m+rowH+m,w:W-2*m,h:rowH}); rects.push({x:m,y:m+2*(rowH+m),w:wHalf,h:rowH}); rects.push({x:m+wHalf+m,y:m+2*(rowH+m),w:wHalf,h:rowH}); }
    else { const wThird=(W-4*m)/3, hThird=(H-4*m)/3; let n=Math.min(count,6); for(let i=0;i<n;i++){const r=Math.floor(i/3),c=i%3; rects.push({x:m+c*(wThird+m),y:m+r*(hThird+m),w:wThird,h:hThird});}}
    return rects;
  }

  useEffect(() => {
    // save debounce
    const t = setTimeout(() => { if (currentPage) saveOverlays(currentPage.id, currentOverlays); }, 500);
    return () => clearTimeout(t);
  }, [currentOverlays, currentPage, saveOverlays]);

  const onPointerDrag = (overlayId: string) => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        addToHistory();
        setIsDragging(true);
        const overlay = currentOverlays.find(o => o.id === overlayId);
        if (overlay) setDragInfo({ x: overlay.x, y: overlay.y, w: overlay.w, h: overlay.h });
      },
      onPointerMove: (e: React.PointerEvent) => {
        const target = e.currentTarget as HTMLElement;
        const dx = (e as any).movementX || 0;
        const dy = (e as any).movementY || 0;
        // If we have capture, treat as drag
        try {
          // movementX/Y are deltas since last event
          onDrag(overlayId, dx, dy);
        } catch {}
      },
      onPointerUp: (e: React.PointerEvent) => {
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
        setIsDragging(false);
        setDragInfo(null);
      }
    };
  };



  return (
    <Layout title="Studio Editor - MangaFusion">
      <div className="flex h-[calc(100vh-120px)]">
        {/* Pages list */}
        <aside className="w-56 border-r bg-white p-3 overflow-y-auto" role="navigation" aria-label="Pages list">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Pages</h3>
            <span className="text-xs text-gray-500" aria-label={`${pages.length} pages`}>{pages.length}</span>
          </div>
          <div className="space-y-2" role="list">
            {pages.map((p, idx) => (
              <button
                key={p.id}
                onClick={()=>{ setCurrentIdx(idx); loadOverlays(p.id); }}
                className={`block w-full text-left text-sm rounded-lg border p-2 transition-colors ${idx===currentIdx?'border-purple-500 bg-purple-50':'border-gray-200 hover:border-gray-300'}`}
                aria-label={`Page ${p.pageNumber}`}
                aria-current={idx === currentIdx ? 'page' : undefined}
                role="listitem"
              >
                Page {p.pageNumber}
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex items-center justify-center editor-grid relative" role="main" aria-label="Canvas editor">
          {currentPage && (
            <>
              {/* Floating Toolbar */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 glass-card px-4 py-3 flex items-center gap-3 shadow-2xl" role="toolbar" aria-label="Overlay controls">
                <button
                  onClick={() => addOverlay('text')}
                  className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  title="Add Text Overlay (T)"
                  aria-label="Add text overlay"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Text
                </button>
                <button
                  onClick={() => addOverlay('bubble')}
                  className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  title="Add Speech Bubble (B)"
                  aria-label="Add speech bubble"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Bubble
                </button>
                <button
                  onClick={insertDialogue}
                  className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  title="Insert All Dialogue"
                  aria-label="Insert all dialogue bubbles"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Auto Dialogue
                </button>
                <div className="w-px h-6 bg-gray-300"></div>
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Undo (Cmd+Z)"
                  aria-label="Undo last action"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Redo (Cmd+Shift+Z)"
                  aria-label="Redo last action"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
                <div className="w-px h-6 bg-gray-300"></div>
                <button
                  onClick={removeSelected}
                  disabled={!selected}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Delete Selected (Delete)"
                  aria-label="Delete selected overlay"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowLayersPanel(!showLayersPanel)}
                  className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
                  title="Toggle Layers Panel (L)"
                  aria-label="Toggle layers panel"
                  aria-pressed={showLayersPanel}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              {/* Drag Info Indicator */}
              {isDragging && dragInfo && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-purple-900 text-white px-4 py-2 rounded-lg text-xs font-mono shadow-lg" role="status" aria-live="polite">
                  X: {dragInfo.x} Y: {dragInfo.y} W: {dragInfo.w} H: {dragInfo.h}
                </div>
              )}

              {/* Layers Panel */}
              {showLayersPanel && (
                <div className="absolute top-4 right-4 w-64 z-20 glass-card p-4 shadow-2xl max-h-[80vh] overflow-y-auto" role="complementary" aria-label="Layers panel">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Layers</h3>
                    <span className="text-xs text-gray-500">{currentOverlays.length}</span>
                  </div>
                  <div className="space-y-1">
                    {currentOverlays.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No overlays yet</p>
                    ) : (
                      [...currentOverlays].reverse().map((o, idx) => {
                        const isSel = selected?.overlayId === o.id;
                        const actualIndex = currentOverlays.length - 1 - idx;
                        return (
                          <div
                            key={o.id}
                            className={`flex items-center gap-2 px-2 py-2 rounded-lg border transition-all cursor-pointer ${isSel ? 'bg-purple-50 border-purple-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            onClick={() => setSelected({ pageId: currentPage.id, overlayId: o.id })}
                            role="listitem"
                            aria-label={`Layer ${actualIndex + 1}: ${o.type}`}
                            aria-selected={isSel}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleOverlayVisibility(o.id); }}
                              className="flex-shrink-0 text-gray-500 hover:text-gray-700"
                              title={o.visible !== false ? 'Hide layer' : 'Show layer'}
                              aria-label={o.visible !== false ? 'Hide layer' : 'Show layer'}
                            >
                              {o.visible !== false ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate capitalize">{o.type}</div>
                              <div className="text-xs text-gray-500 truncate">{o.text || o.imageUrl ? `${o.w}×${o.h}` : `${Math.round(o.x)}, ${Math.round(o.y)}`}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); duplicateOverlay(o.id); }}
                              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                              title="Duplicate layer"
                              aria-label="Duplicate layer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              <div ref={canvasRef} className="relative bg-white shadow-xl" style={{ width: 682, height: 1024 }}>
                <img src={currentPage.imageUrl} className="absolute inset-0 w-full h-full object-contain" alt={`Page ${currentPage.pageNumber}`} />
                {currentOverlays.map((o) => {
                  const isSel = selected?.overlayId===o.id;
                  if (o.visible === false) return null;
                  return (
                    <div
                      key={o.id}
                      className={`absolute group ${isSel ? 'ring-4 ring-purple-500 ring-offset-2' : 'hover:ring-2 hover:ring-purple-300'}`}
                      style={{ left: o.x, top: o.y, width: o.w, height: o.h }}
                      onClick={(e) => { e.stopPropagation(); setSelected({ pageId: currentPage.id, overlayId: o.id }); }}
                      {...onPointerDrag(o.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${o.type} overlay at ${Math.round(o.x)}, ${Math.round(o.y)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected({ pageId: currentPage.id, overlayId: o.id });
                        }
                      }}
                    >
                      {o.type === 'image' && o.imageUrl ? (
                        <img src={o.imageUrl} className="w-full h-full object-contain pointer-events-none" alt="Overlay image" />
                      ) : (
                        <div
                          className={`w-full h-full ${o.type==='bubble' ? 'border-4' : ''}`}
                          style={{
                            color: o.color,
                            borderColor: o.stroke,
                            backgroundColor: o.type==='bubble'? 'white':'transparent',
                            borderRadius: o.radius ?? 0,
                            fontFamily: o.fontFamily
                          }}
                        >
                          <div className="p-2" style={{ fontSize: o.fontSize, textAlign: o.align || 'center' }}>{o.text}</div>
                        </div>
                      )}
                      {/* Enhanced resize handles with better visibility */}
                      <div
                        className={`absolute bottom-0 right-0 w-4 h-4 bg-purple-500 border-2 border-white rounded-sm shadow-lg cursor-nwse-resize ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        {...onPointerResize(o.id,'br')}
                        title="Resize bottom-right"
                        aria-label="Resize bottom-right corner"
                      />
                      <div
                        className={`absolute top-0 right-0 w-4 h-4 bg-purple-500 border-2 border-white rounded-sm shadow-lg cursor-nesw-resize ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        {...onPointerResize(o.id,'tr')}
                        title="Resize top-right"
                        aria-label="Resize top-right corner"
                      />
                      <div
                        className={`absolute bottom-0 left-0 w-4 h-4 bg-purple-500 border-2 border-white rounded-sm shadow-lg cursor-nesw-resize ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        {...onPointerResize(o.id,'bl')}
                        title="Resize bottom-left"
                        aria-label="Resize bottom-left corner"
                      />
                      <div
                        className={`absolute top-0 left-0 w-4 h-4 bg-purple-500 border-2 border-white rounded-sm shadow-lg cursor-nwse-resize ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        {...onPointerResize(o.id,'tl')}
                        title="Resize top-left"
                        aria-label="Resize top-left corner"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* Tools */}
        <aside className="w-80 border-l bg-white p-4 space-y-4 overflow-y-auto" role="complementary" aria-label="Tools panel">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tools</h3>
            {selected && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {currentOverlays.find(o => o.id === selected.overlayId)?.type || 'Selected'}
              </span>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          <details className="bg-gray-50 rounded-lg p-3">
            <summary className="text-xs font-semibold cursor-pointer text-gray-700 hover:text-gray-900">Keyboard Shortcuts</summary>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Delete overlay</span>
                <kbd className="bg-white px-2 py-0.5 rounded border text-xs">Del</kbd>
              </div>
              <div className="flex justify-between">
                <span>Undo</span>
                <kbd className="bg-white px-2 py-0.5 rounded border text-xs">Cmd+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span>Redo</span>
                <kbd className="bg-white px-2 py-0.5 rounded border text-xs">Cmd+Shift+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span>Deselect</span>
                <kbd className="bg-white px-2 py-0.5 rounded border text-xs">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span>Move overlay</span>
                <kbd className="bg-white px-2 py-0.5 rounded border text-xs">Arrow keys</kbd>
              </div>
              <div className="flex justify-between">
                <span>Move 10px</span>
                <kbd className="bg-white px-2 py-0.5 rounded border text-xs">Shift+Arrow</kbd>
              </div>
            </div>
          </details>

          <div>
            <h4 className="font-medium mb-2">Dialogue For This Page</h4>
            <textarea
              className="input-field"
              rows={6}
              value={dialogueText}
              onChange={(e)=> setDialogueText(e.target.value)}
              placeholder="One line per bubble, e.g.&#10;Aoi: What was that sound?&#10;Kenji: Stay sharp."
              aria-label="Dialogue text for current page"
            />
            <div className="flex justify-end mt-2">
              <button
                className="btn-secondary text-sm"
                onClick={() => currentPage && loadDialogue(currentPage.id)}
                title="Reset dialogue to original planner text"
                aria-label="Reset dialogue from planner"
              >
                Reset from Planner
              </button>
            </div>
          </div>

          <div className="mt-2">
            <h4 className="font-medium mb-2">Visual Edit Prompt</h4>
            <textarea
              className="input-field"
              rows={4}
              value={editPrompt}
              onChange={(e)=> setEditPrompt(e.target.value)}
              placeholder="Describe visual changes (lighting, pose, camera, effects, etc.)"
              aria-label="Visual edit prompt"
            />
            <label className="flex items-center space-x-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAllStyleRefs}
                onChange={(e)=> setUseAllStyleRefs(e.target.checked)}
                className="rounded focus:ring-2 focus:ring-purple-500"
                aria-label="Use all style references"
              />
              <span className="text-sm text-gray-600">Use all style refs</span>
            </label>
            <button
              className="btn-primary mt-2 w-full"
              onClick={applyAIEdit}
              disabled={editing || !currentPage}
              aria-label={editing ? 'Updating page' : 'Update page with AI'}
            >
              {editing ? 'Updating...' : 'Update Page'}
            </button>
            <p className="text-xs text-gray-500 mt-1">Regenerates this page using the dialogue above and your visual prompt.</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Style References</h4>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e)=>{
                const file = e.target.files?.[0];
                if (!file || !id) return;
                const form = new FormData();
                form.append('file', file);
                const res = await fetch(`${API_BASE}/episodes/${id}/style-refs`, { method: 'POST', body: form });
                const json = await res.json();
                if (json?.url) setStyleRefs((prev)=> [json.url, ...prev]);
              }}
              className="text-sm"
              aria-label="Upload style reference image"
            />
            <div className="grid grid-cols-2 gap-2 mt-2" role="list" aria-label="Style references">
              {styleRefs.map((url, idx) => (
                <div key={url} className="border rounded-lg p-1" role="listitem">
                  <img src={url} className="w-full h-24 object-cover rounded" alt={`Style reference ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
