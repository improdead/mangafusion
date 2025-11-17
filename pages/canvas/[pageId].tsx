/**
 * Canvas Page
 * User-facing page for drawing and refining sketches to manga
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CanvasEditor } from '../../components/canvas/CanvasEditor';

export default function CanvasPage() {
  const router = useRouter();
  const { pageId } = router.query;
  const [canvasData, setCanvasData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [refinementResult, setRefinementResult] = useState<any>(null);

  // Load canvas data on mount
  useEffect(() => {
    if (!pageId || typeof pageId !== 'string') return;

    loadCanvasData(pageId);
  }, [pageId]);

  /**
   * Load canvas data from API
   */
  const loadCanvasData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/canvas/${id}`);

      if (response.ok) {
        const data = await response.json();
        setCanvasData(data);
      } else if (response.status === 404) {
        // Canvas doesn't exist yet - that's okay
        setCanvasData(null);
      } else {
        throw new Error(`Failed to load canvas: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('Failed to load canvas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save canvas data to API
   */
  const handleSave = async (data: any) => {
    try {
      const response = await fetch('/api/canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to save canvas: ${response.statusText}`);
      }

      const result = await response.json();
      setCanvasData(result);
      alert('Canvas saved successfully!');
    } catch (err: any) {
      console.error('Failed to save canvas:', err);
      alert(`Failed to save canvas: ${err.message}`);
    }
  };

  /**
   * Refine sketch to manga using AI
   */
  const handleRefine = async (imageData: string) => {
    if (!pageId || typeof pageId !== 'string') return;

    try {
      setRefining(true);
      setRefinementResult(null);

      // Convert data URL to blob
      const blob = await (await fetch(imageData)).blob();

      // Upload sketch image first
      const formData = new FormData();
      formData.append('image', blob, 'sketch.png');
      formData.append('pageId', pageId);

      // For now, we'll use the image data directly
      // In production, you'd upload to Supabase first
      const response = await fetch('/api/refinement/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          canvasId: canvasData?.id || 'temp',
          sketchImageUrl: imageData,
          style: 'manga',
          strength: 0.7,
          controlnetType: 'scribble',
          promptDescription: 'manga style, black and white, high quality lineart',
          aiProvider: 'segmind',
        }),
      });

      if (!response.ok) {
        throw new Error(`Refinement failed: ${response.statusText}`);
      }

      const result = await response.json();
      setRefinementResult(result);
      alert('Refinement completed! Check the result below.');
    } catch (err: any) {
      console.error('Refinement failed:', err);
      alert(`Refinement failed: ${err.message}`);
    } finally {
      setRefining(false);
    }
  };

  if (!pageId || typeof pageId !== 'string') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Page ID</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadCanvasData(pageId)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Canvas Editor</h1>
        </div>
        <div className="text-sm text-gray-400">
          Page ID: {pageId}
        </div>
      </div>

      {/* Canvas Editor */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <CanvasEditor
            pageId={pageId}
            width={1024}
            height={1024}
            initialData={canvasData?.canvasData}
            onSave={handleSave}
            onRefine={handleRefine}
          />
        </div>

        {/* Refinement panel */}
        {(refining || refinementResult) && (
          <div className="w-96 border-l border-gray-300 bg-white p-4 overflow-auto">
            <h2 className="text-lg font-bold mb-4">AI Refinement</h2>

            {refining && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Refining sketch to manga...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take 10-30 seconds
                </p>
              </div>
            )}

            {refinementResult && !refining && (
              <div>
                <div className="mb-4">
                  <img
                    src={refinementResult.refinedImageUrl}
                    alt="Refined manga"
                    className="w-full border border-gray-300 rounded"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Style:</span>{' '}
                    {refinementResult.style}
                  </div>
                  <div>
                    <span className="font-medium">Provider:</span>{' '}
                    {refinementResult.aiProvider}
                  </div>
                  <div>
                    <span className="font-medium">Processing Time:</span>{' '}
                    {(refinementResult.processingTimeMs / 1000).toFixed(2)}s
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      // TODO: Apply refined image to page
                      alert('Apply to page - TODO');
                    }}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Apply to Page
                  </button>
                  <button
                    onClick={() => setRefinementResult(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
