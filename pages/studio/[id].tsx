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

  const addOverlay = (type: Overlay['type'], init?: Partial<Overlay>) => {
    if (!currentPage) return;
    const o: Overlay = {
      id: Math.random().toString(36).slice(2),
      type,
      x: 40, y: 40, w: 200, h: 80,
      text: type !== 'image' ? '' : undefined,
      fontSize: 18,
      color: '#000000',
      stroke: '#ffffff',
      ...init,
    };
    const list = [...currentOverlays, o];
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
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
        };
      });
      const list = [...currentOverlays, ...newOverlays];
      setOverlays(prev => ({ ...prev, [currentPage.id]: list }));
      await saveOverlays(currentPage.id, list);
    } catch (e) {
      console.error(e);
    }
  };

  const removeSelected = () => {
    if (!currentPage || !selected) return;
    const list = currentOverlays.filter(o => o.id !== selected.overlayId);
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
    saveOverlays(currentPage.id, list);
    setSelected(null);
  };

  const onDrag = (id: string, dx: number, dy: number) => {
    if (!currentPage) return;
    const list = currentOverlays.map(o => o.id === id ? { ...o, x: o.x + dx, y: o.y + dy } : o);
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
  };

  const onResize = (id: string, dw: number, dh: number) => {
    if (!currentPage) return;
    const list = currentOverlays.map(o => o.id === id ? { ...o, w: Math.max(40, o.w + dw), h: Math.max(30, o.h + dh) } : o);
    setOverlays((prev)=> ({ ...prev, [currentPage.id]: list }));
  };

  const onPointerResize = (overlayId: string, corner: 'br'|'tr'|'bl'|'tl') => {
    return {
      onPointerDown: (e: React.PointerEvent) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); },
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
          return { ...o, x, y, w: Math.max(40, w), h: Math.max(30, h) };
        });
        setOverlays(prev => ({ ...prev, [currentPage.id]: list }));
      },
      onPointerUp: (e: React.PointerEvent) => { try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {} },
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
      },
      onPointerMove: (e: React.PointerEvent) => {
        const target = e.currentTarget as HTMLElement;
        // If we have capture, treat as drag
        try {
          // movementX/Y are deltas since last event
          onDrag(overlayId, (e as any).movementX || 0, (e as any).movementY || 0);
        } catch {}
      },
      onPointerUp: (e: React.PointerEvent) => {
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      }
    };
  };



  return (
    <Layout title="Studio Editor - MangaFusion">
      <div className="flex h-[calc(100vh-120px)]">
        {/* Pages list */}
        <aside className="w-56 border-r bg-white p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Pages</h3>
            <span className="text-xs text-gray-500">{pages.length}</span>
          </div>
          <div className="space-y-2">
            {pages.map((p, idx) => (
              <button key={p.id} onClick={()=>{ setCurrentIdx(idx); loadOverlays(p.id); }} className={`block w-full text-left text-sm rounded-lg border p-2 ${idx===currentIdx?'border-purple-500 bg-purple-50':'border-gray-200 hover:border-gray-300'}`}>
                Page {p.pageNumber}
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex items-center justify-center editor-grid">
          {currentPage && (
            <div className="relative bg-white shadow-xl" style={{ width: 682, height: 1024 }}>
              <img src={currentPage.imageUrl} className="absolute inset-0 w-full h-full object-contain" alt="page" />
              {currentOverlays.map((o) => {
                const isSel = selected?.overlayId===o.id;
                return (
                  <div key={o.id} className={`absolute group ${isSel? 'ring-2 ring-purple-500':''}`} style={{ left: o.x, top: o.y, width: o.w, height: o.h }} onClick={()=> setSelected({ pageId: currentPage.id, overlayId: o.id })} {...onPointerDrag(o.id)}>
                    {o.type === 'image' && o.imageUrl ? (
                      <img src={o.imageUrl} className="w-full h-full object-contain pointer-events-none" />
                    ) : (
                      <div className={`w-full h-full ${o.type==='bubble' ? 'border-4' : ''}`} style={{ color: o.color, borderColor: o.stroke, backgroundColor: o.type==='bubble'? 'white':'transparent', borderRadius: o.radius ?? 0, fontFamily: o.fontFamily }}>
                        <div className="p-2" style={{ fontSize: o.fontSize, textAlign: o.align || 'center' }}>{o.text}</div>
                      </div>
                    )}
                    {/* resize handle */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 rounded-sm opacity-0 group-hover:opacity-100 cursor-nwse-resize" {...onPointerResize(o.id,'br')} />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-sm opacity-0 group-hover:opacity-100 cursor-nesw-resize" {...onPointerResize(o.id,'tr')} />
                    <div className="absolute bottom-0 left-0 w-3 h-3 bg-purple-500 rounded-sm opacity-0 group-hover:opacity-100 cursor-nesw-resize" {...onPointerResize(o.id,'bl')} />
                    <div className="absolute top-0 left-0 w-3 h-3 bg-purple-500 rounded-sm opacity-0 group-hover:opacity-100 cursor-nwse-resize" {...onPointerResize(o.id,'tl')} />
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Tools */}
        <aside className="w-80 border-l bg-white p-4 space-y-4 overflow-y-auto">
          <h3 className="font-semibold">Tools</h3>
          <div>
            <h4 className="font-medium mb-2">Dialogue For This Page</h4>
            <textarea
              className="input-field"
              rows={6}
              value={dialogueText}
              onChange={(e)=> setDialogueText(e.target.value)}
              placeholder="One line per bubble, e.g.\nAoi: What was that sound?\nKenji: Stay sharp."
            />
            <div className="flex justify-end mt-2">
              <button className="btn-secondary text-sm" onClick={() => currentPage && loadDialogue(currentPage.id)}>Reset from Planner</button>
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
            />
            <label className="flex items-center space-x-2 mt-2">
              <input type="checkbox" checked={useAllStyleRefs} onChange={(e)=> setUseAllStyleRefs(e.target.checked)} />
              <span className="text-sm text-gray-600">Use all style refs</span>
            </label>
            <button className="btn-primary mt-2 w-full" onClick={applyAIEdit} disabled={editing || !currentPage}>
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
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              {styleRefs.map((url) => (
                <div key={url} className="border rounded-lg p-1">
                  <img src={url} className="w-full h-24 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
