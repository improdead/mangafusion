import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title = 'MangaFusion', description = 'AI-Powered Manga Creation Studio' }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Handle scroll for scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close mobile menu on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>

      {/* Skip to main content - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:shadow-lg transition-all"
      >
        Skip to main content
      </a>

      <div className="min-h-screen" style={{ backgroundImage: 'url(/background.png)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
        <div className="min-h-screen bg-white/70">
        {/* Navigation */}
        <nav className="glass-nav sticky top-0 z-50 shadow-sm" role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg">
                <div className="w-8 h-8 relative">
                  <Image
                    src="/logo.png"
                    alt="MangaFusion Logo"
                    width={32}
                    height={32}
                    className="rounded-lg object-contain"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  MangaFusion
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <ApiStatus />
                <Link
                  href="/"
                  className="text-gray-700 hover:text-purple-600 transition-all duration-200 font-medium hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                >
                  Create
                </Link>
                <Link
                  href="/gallery"
                  className="text-gray-700 hover:text-purple-600 transition-all duration-200 font-medium hover:scale-105 transform focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                >
                  Gallery
                </Link>
                <button
                  className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label="User profile"
                >
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="w-6 h-6 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0)' }}
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            <div
              className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="py-4 space-y-3 border-t border-gray-200 mt-2">
                <ApiStatus />
                <Link
                  href="/"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create
                </Link>
                <Link
                  href="/gallery"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <button
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
        </main>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 p-3 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 z-40 ${
            showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>

        {/* Footer */}
        <footer className="bg-gradient-to-br from-white/90 to-purple-50/80 border-t border-gray-200 mt-20" role="contentinfo">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Section */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 relative">
                    <Image
                      src="/logo.png"
                      alt="MangaFusion Logo"
                      width={32}
                      height={32}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    MangaFusion
                  </span>
                </div>
                <p className="text-gray-600 text-sm max-w-md">
                  AI-powered manga creation studio. Transform your ideas into stunning manga panels with the power of artificial intelligence.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-gray-600 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                      Create Manga
                    </Link>
                  </li>
                  <li>
                    <Link href="/gallery" className="text-gray-600 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                      Gallery
                    </Link>
                  </li>
                  <li>
                    <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                      Features
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#help" className="text-gray-600 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#docs" className="text-gray-600 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-gray-600 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-center md:text-left text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} MangaFusion. Powered by AI. Built with passion for manga creators.</p>
              </div>
              <div className="flex space-x-6">
                <a href="#privacy" className="text-gray-500 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                  Privacy
                </a>
                <a href="#terms" className="text-gray-500 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                  Terms
                </a>
                <a href="#cookies" className="text-gray-500 hover:text-purple-600 transition-colors text-sm focus:outline-none focus:underline">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </>
  );
}

function ApiStatus() {
  const [ok, setOk] = React.useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_BASE || '/api') + '/health')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);

  const getStatusText = () => {
    if (ok === true) return 'API Online';
    if (ok === false) return 'API Offline';
    return 'Checking API...';
  };

  const getStatusColor = () => {
    if (ok === true) return 'bg-green-500';
    if (ok === false) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center space-x-2 text-sm px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/80 transition-colors cursor-pointer">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
        <span className="text-gray-700 font-medium">API</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-fadeIn">
          {getStatusText()}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
}
