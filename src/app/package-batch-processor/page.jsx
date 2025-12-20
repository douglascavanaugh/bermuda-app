"use client";

import PackageBatchProcessor from '../../components/PackageBatchProcessor';
import Link from 'next/link';
import { Home, Package } from 'lucide-react';

export default function PackageBatchProcessorPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            <Package className="h-12 w-12 text-green-400" />
            PACKAGE BATCH PROCESSOR
          </h1>
          <p className="text-gray-300 text-xl mb-2">
            Process multiple Master Bond Sheet entries into Completed Packages
          </p>
          <p className="text-gray-400 text-lg">
            Upload CSV → Review Entries → Generate All 8 Forms per Entry → Download PDFs
          </p>
        </div>

        {/* Main Processor Component */}
        <PackageBatchProcessor />
        
        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Process Flow */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">🔄 The Process:</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <span>Export CSVs from Master Bond Sheet form</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <span>Combine all CSVs into one file</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <span>Upload combined CSV here</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                <span>Preview and verify entries</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                <span>Click "Generate All Packages"</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
                <span>Each entry generates 8 GSA forms merged into one PDF</span>
              </div>
            </div>
          </div>

          {/* Forms Included */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">📋 Forms in Each Package:</h2>
            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF24</span>
                <span className="text-gray-400">Bid Bond</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF25</span>
                <span className="text-gray-400">Performance Bond</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF28</span>
                <span className="text-gray-400">Affidavit of Individual Surety</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF1418</span>
                <span className="text-gray-400">Performance Bond for Construction</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF273</span>
                <span className="text-gray-400">Reinsurance Agreement</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF274</span>
                <span className="text-gray-400">Reinsurance Agreement - Performance</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">SF275</span>
                <span className="text-gray-400">Reinsurance Agreement - Payment</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">OF91</span>
                <span className="text-gray-400">Authorization Agreement</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <span className="text-green-400 font-bold">8 forms merged into 1 PDF per entry!</span>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Format Section */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">📄 Expected CSV Format:</h2>
          <p className="text-gray-400 mb-4">
            The CSV should match the export format from the Master Bond Sheet form. 
            Download the template for the exact column headers.
          </p>
          <div className="bg-gray-900 p-4 rounded overflow-x-auto">
            <code className="text-green-400 text-sm">
              clientFullName,dateBondExecuted,courtCaseNumber,pastConvictionsCaseNumbers,birthCertificateNumber,stateOfBirth,...
            </code>
          </div>
          <p className="text-gray-500 mt-4 text-sm">
            💡 Tip: Use the "Export CSV" button on the Master Bond Sheet form to get properly formatted data
          </p>
        </div>
      </div>
    </div>
  );
}

