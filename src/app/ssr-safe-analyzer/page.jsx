'use client';

import dynamic from 'next/dynamic';

// CRITICAL: Dynamic import with ssr: false - this is the SOLUTION!
const PDFViewerComponent = dynamic(() => import('../../components/PDFViewerComponent'), { 
  ssr: false,
  loading: () => (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-6"></div>
        <div className="h-32 bg-gray-200 rounded mb-6"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
      </div>
      <p className="text-center text-gray-600 mt-4">🚀 Loading SSR-Safe PDF Analyzer...</p>
    </div>
  )
});

export default function SSRSafeAnalyzerPage() {
  return (
    <div>
      <PDFViewerComponent />
    </div>
  );
}
