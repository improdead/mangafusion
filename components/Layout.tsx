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
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>
      
      <div className="min-h-screen" style={{ backgroundImage: 'url(/background.png)', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
        <div className="min-h-screen bg-white/70">
        {/* Navigation */}
        <nav className="glass-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-3">
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
              
              <div className="flex items-center space-x-4">
                <ApiStatus />
                <Link href="/" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Create
                </Link>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white/80 border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600 text-sm">
              <p>Powered by AI • Built with ❤️ for manga creators</p>
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
  React.useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_BASE || '/api') + '/health')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, []);
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok===true?'bg-green-500': ok===false?'bg-red-500':'bg-gray-300'}`} />
      <span className="text-gray-600">API</span>
    </div>
  );
}
