import UniversalBatchProcessor from '../../components/UniversalBatchProcessor';

export default function BatchProcessorPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-center text-white mb-4">
          UNIVERSAL BATCH PROCESSOR
        </h1>
        
        <div className="text-center mb-8">
          <p className="text-gray-300 text-xl mb-2">
            Process THOUSANDS of entries into PDFs with ANY template!
          </p>
          <p className="text-gray-400 text-lg">
            Email → Parse → Template → Batch Process → Bulk Email Ready!
          </p>
        </div>

        <UniversalBatchProcessor />
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Process Flow */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">🔄 The Process:</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <span>Email arrives with CSV/Text data</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <span>Auto-detect template type</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <span>Batch process all entries</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                <span>Generate individual PDFs</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                <span>Store in processed-pdfs folder</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
                <span>Ready for bulk email delivery</span>
              </div>
            </div>
          </div>

          {/* Supported Templates */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">📋 Supported Templates:</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold">GSA SF24-23A</span>
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">991 Fields</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Hawaii Investigation</span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">40 Fields</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Bermuda Basic</span>
                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">5 Fields</span>
              </div>
              <div className="text-sm text-gray-400 mt-4">
                ✨ Auto-detection based on data structure and headers
              </div>
            </div>
          </div>
        </div>

        {/* Sample Data Examples */}
        <div className="mt-12 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">📝 Sample Data Formats:</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">Text Format (Multiple Entries):</h3>
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
{`John Doe
123 Main St
Honolulu, Hawaii 96813
01/15/1980
123-45-6789

Jane Smith
456 Oak Ave
Los Angeles, California 90210
02/20/1985
987-65-4321`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">CSV Format:</h3>
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
{`First Name,Last Name,Address,City,State,ZIP
John,Doe,123 Main St,Honolulu,HI,96813
Jane,Smith,456 Oak Ave,Los Angeles,CA,90210`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
