import React, { useState, useEffect } from 'react';

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
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset loading state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    // Delay the fade-in slightly for smoother transition
    setTimeout(() => setImageLoaded(true), 50);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    setImageLoaded(false);
  };

  const handleRetry = () => {
    setImageError(false);
    setIsLoading(true);
    setImageLoaded(false);
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div
      className="manga-panel group transition-all duration-300 hover:shadow-lg"
      role="article"
      aria-label={`Manga page ${page}`}
    >
      {/* Page Header */}
      <div className="p-4 border-b border-gray-100 transition-colors duration-200 group-hover:bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 transition-colors duration-200">
            Page {String(page).padStart(2, '0')}
          </h3>
          {seed && (
            <span
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded transition-all duration-200 group-hover:bg-gray-200"
              aria-label={`Seed number ${seed}`}
            >
              #{seed}
            </span>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="aspect-[2/3] relative overflow-hidden">
        {imageUrl && !imageError ? (
          <div className="relative h-full">
            {/* Enhanced Loading Skeleton */}
            {isLoading && (
              <div
                className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse"
                role="status"
                aria-label="Loading image"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                  {/* Skeleton Lines */}
                  <div className="w-3/4 space-y-3">
                    <div className="h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 bg-gray-200 rounded-full animate-pulse w-5/6" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 bg-gray-200 rounded-full animate-pulse w-4/6" style={{ animationDelay: '300ms' }} />
                  </div>
                  <div className="text-gray-400 text-sm animate-pulse">Loading image...</div>
                </div>
              </div>
            )}

            {/* Image with Smooth Fade-in */}
            <img
              src={imageUrl}
              alt={`Manga page ${page}`}
              className={`w-full h-full object-cover transition-all duration-700 ease-out transform ${
                imageLoaded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }`}
              loading="lazy"
              decoding="async"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* Enhanced View Full Button Overlay */}
            {imageLoaded && onViewFull && (
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                aria-hidden="true"
              >
                <button
                  onClick={onViewFull}
                  className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 bg-white shadow-xl text-gray-800 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label={`View full size of page ${page}`}
                >
                  <svg
                    className="w-4 h-4 mr-2 inline transition-transform duration-200 group-hover:rotate-12"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                  </svg>
                  View Full
                </button>
              </div>
            )}
          </div>
        ) : imageError ? (
          <div
            className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 text-red-500 animate-fade-in p-6"
            role="alert"
            aria-live="polite"
          >
            <div className="animate-bounce-gentle">
              <svg
                className="w-16 h-16 mb-3 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1">Failed to load image</p>
            <p className="text-xs text-red-600 mb-4">The image could not be displayed</p>
            <button
              onClick={handleRetry}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={`Retry loading page ${page}`}
            >
              <svg
                className="w-4 h-4 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Loading
            </button>
          </div>
        ) : error ? (
          <div
            className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 text-red-600 p-6 animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
            <div className="animate-bounce-gentle">
              <svg
                className="w-12 h-12 mb-3 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2H9v-2zm0-8h2v6H9V5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-center mb-1">Generation Failed</p>
            <p className="text-xs text-red-700 text-center max-w-xs mb-4 line-clamp-3">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label={`Retry generating page ${page}`}
              >
                <svg
                  className="w-4 h-4 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Generation
              </button>
            )}
          </div>
        ) : progress !== undefined ? (
          <div
            className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 text-purple-600 animate-fade-in"
            role="status"
            aria-live="polite"
            aria-label={`Generating page ${page}, ${progress} percent complete`}
          >
            {/* Enhanced Progress Indicator */}
            <div className="w-20 h-20 mb-6 relative animate-scale-in">
              {/* Background Circle */}
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-purple-200 transition-colors duration-300"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Animated Progress Circle */}
                <path
                  className="text-purple-500 transition-all duration-500 ease-out"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))'
                  }}
                />
              </svg>
              {/* Progress Percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-700 animate-pulse-subtle">
                  {progress}%
                </span>
              </div>
              {/* Spinning Outer Ring */}
              <div className="absolute inset-0 animate-spin-slow opacity-30">
                <svg className="w-20 h-20" viewBox="0 0 36 36">
                  <circle
                    className="text-purple-400"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    fill="none"
                    cx="18"
                    cy="18"
                    r="16"
                  />
                </svg>
              </div>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2 animate-fade-in">
              <p className="text-base font-semibold text-purple-700 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Generating
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
              </p>
              <p className="text-xs text-purple-600 max-w-xs">AI is creating your manga page</p>
            </div>
          </div>
        ) : (
          <div
            className="h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 animate-fade-in"
            role="status"
            aria-label="Empty page slot"
          />
        )}
      </div>

      {/* Add custom animations styles */}
      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
