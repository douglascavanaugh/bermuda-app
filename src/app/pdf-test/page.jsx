import PDFOverlay from '../../components/PDFOverlay';
import PDFTemplateScanner from '../../components/PDFTemplateScanner';

export default function PDFTestPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          PDF OVERLAY SYSTEM - PROOF OF CONCEPT 🚀
        </h1>
        
        <div className="mb-8 text-center">
          <p className="text-gray-300 text-lg">
            Testing PDF-lib integration for form overlay functionality
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Mon Frere, let's kick some PDF grass! 🌱💪
          </p>
        </div>

        <PDFOverlay />
        
        <div className="mt-12">
          <PDFTemplateScanner />
        </div>
        
        <div className="mt-12 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">How This Works:</h2>
          <div className="space-y-3 text-gray-300">
            <p><strong className="text-green-400">1. Schema-Driven:</strong> JSON defines field positions and properties</p>
            <p><strong className="text-blue-400">2. Data Mapping:</strong> Form data maps to schema field names</p>
            <p><strong className="text-yellow-400">3. PDF Overlay:</strong> pdf-lib positions text at exact coordinates</p>
            <p><strong className="text-purple-400">4. Template System:</strong> Reusable schemas for different form types</p>
          </div>
        </div>
      </div>
    </div>
  );
}
