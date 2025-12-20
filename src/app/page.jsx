'use client';
import { useState, useEffect } from 'react';
import Bermuda from './components/Bermuda';
import SPC from './components/SPC';
import MasterBondSheet from './components/MasterBondSheet';

export default function Home() {
  const [currentView, setCurrentView] = useState('menu');
  const [isProduction, setIsProduction] = useState(true); // Default to production (safe)

  useEffect(() => {
    // Check if we're on localhost (development)
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // Development mode ONLY on localhost
    setIsProduction(!isLocalhost);
  }, []);

  // PRODUCTION: Only show Master Bond Sheet
  if (isProduction) {
    return <MasterBondSheet />;
  }

  // DEVELOPMENT: Show full menu
  const renderContent = () => {
    switch (currentView) {
      case 'bermuda':
        return <Bermuda onBack={() => setCurrentView('menu')} />;
      case 'hawaii':
        return <Bermuda onBack={() => setCurrentView('menu')} />;
      case 'spc':
        return <SPC onBack={() => setCurrentView('menu')} />;
      case 'master-bond-sheet':
        return <MasterBondSheet onBack={() => setCurrentView('menu')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-700">
              <h1 className="text-3xl font-bold text-center mb-8 text-gray-100">
                ICS Document System
              </h1>
              <div className="space-y-4">
                <button
                  onClick={() => setCurrentView('bermuda')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Bermuda
                </button>
                <button
                  onClick={() => setCurrentView('hawaii')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Hawaii
                </button>
                <button
                  onClick={() => setCurrentView('spc')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  SPC
                </button>
                <button
                  onClick={() => setCurrentView('master-bond-sheet')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Master Bond Sheet
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700">
                <a
                  href="/form-analyzer"
                  className="block text-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ADMIN ACTIONS →
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
}
