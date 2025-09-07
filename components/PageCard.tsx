import React, { useState } from 'react';

interface PageCardProps {
  page: number;
  imageUrl?: string;
  seed?: number;
  progress?: number;
  isGenerating?: boolean;
  onViewFull?: () => void;
  error?: string;
  onRetry?: () => void;
}

export default function PageCard({ page, imageUrl, seed, progress, isGenerating, onViewFull, error, onRetry }: PageCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className="manga-panel group">
      {/* Page Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Page {String(page).padStart(2, '0')}
          </h3>
          {seed && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              #{seed}
            </span>
          )}
        </div>
      </div>
      
      {/* Page Content */}
      <div className="aspect-[2/3] relative">
        {imageUrl && !imageError ? (
          <div className="relative h-full">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
              </div>
            )}
            <img 
              src={imageUrl} 
              alt={`Page ${page}`} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!isLoading && onViewFull && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                <button 
                  onClick={onViewFull}
                  className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-opacity-100"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                  </svg>
                  View Full
                </button>
              </div>
            )}
          </div>
        ) : imageError ? (
          <div className="h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
            <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">Failed to load</p>
            <button 
              onClick={() => {setImageError(false); setIsLoading(true);}}
              className="text-xs text-red-600 hover:text-red-700 mt-1"
            >
              Retry
            </button>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-4">
            <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2H9v-2zm0-8h2v6H9V5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-center">Generation failed</p>
            <p className="text-xs text-red-700 line-clamp-2 text-center">{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="mt-2 btn-secondary text-red-700">Retry</button>
            )}
          </div>
        ) : progress !== undefined ? (
          <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 text-purple-600">
            <div className="w-16 h-16 mb-4 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-purple-200"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-500"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-700">{progress}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-purple-700">Generating...</p>
            <p className="text-xs text-purple-500 mt-1">AI is creating your manga page</p>
          </div>
        ) : (
          <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100" />
        )}
      </div>
    </div>
  );
}
