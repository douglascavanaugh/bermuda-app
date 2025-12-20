"use client";

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Download, CheckCircle, XCircle, Package, Clipboard } from 'lucide-react';

// Constants for the package
const SURETY_COMPANY = {
  name: 'Depository Trust Company',
  address: '55 Water St.',
  cityStateZip: 'New York, New York [10041-0099]'
};

const GSA_REFERENCE = 'See GSA FORMS; sf 24; sf 25A; sf 28; sf 273; sf 274; sf 275 and 91.';

export default function PackageBatchProcessor() {
  const [entries, setEntries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [pasteData, setPasteData] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const fileInputRef = useRef(null);

  // Expected CSV headers (matches Master Bond Sheet export - 20 field format)
  const EXPECTED_HEADERS = [
    'clientFullName', 'dateBondExecuted', 'courtCaseNumber', 'pastConvictionsCaseNumbers',
    'birthCertificateNumber', 'stateOfBirth', 'dateOfBirth', 'uccTrustNumber',
    'socialSecurityNumber', 'ssnBackNumber', 'thirdPartyName', 'thirdPartyAddress',
    'thirdPartyCity', 'thirdPartyState', 'thirdPartyZip', 'thirdPartyCounty', 
    'prisonNumber', 'prisonName', 'prisonAddress', 'trialCourtName', 'trialCourtType',
    'courtAddress', 'courtCity', 'courtState', 'courtZip', 'amountOwed'
  ];

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const entry = {};
        headers.forEach((header, index) => {
          entry[header] = values[index];
        });
        data.push(entry);
      }
    }

    return data;
  };

  // Parse a single CSV line (handles quoted values with commas)
  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values.map(v => v.replace(/^"|"$/g, ''));
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setResults([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = parseCSV(e.target.result);
        if (data.length === 0) {
          throw new Error('No valid data rows found in CSV');
        }
        setEntries(data);
      } catch (err) {
        setError(`Error parsing CSV: ${err.message}`);
        setEntries([]);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste CSV data
  const handlePasteCSV = () => {
    setError('');
    setResults([]);
    
    try {
      if (!pasteData.trim()) {
        throw new Error('No data pasted');
      }
      
      const data = parseCSV(pasteData);
      if (data.length === 0) {
        throw new Error('No valid data rows found in pasted CSV');
      }
      setEntries(data);
      setShowPasteModal(false);
      setPasteData('');
    } catch (err) {
      setError(`Error parsing pasted CSV: ${err.message}`);
    }
  };

  // Build package data for a single entry (matches MasterBondSheet logic)
  const buildPackageData = (entry) => {
    const suretyBlock = `${SURETY_COMPANY.name}\n${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`;
    const suretyBlockWithName = `${entry.clientFullName}\n${suretyBlock}`;
    
    // Build Third Party full address with ZIP (no county)
    const thirdPartyZip = entry.thirdPartyZip || '';
    const thirdPartyFullAddress = [
      entry.thirdPartyAddress,
      `${entry.thirdPartyCity}, ${entry.thirdPartyState} ${thirdPartyZip}`
    ].filter(Boolean).join('\n');
    
    // Build Court full address with ZIP
    const courtZip = entry.courtZip || '';
    const courtFullAddress = `${entry.courtAddress}\n${entry.courtCity}, ${entry.courtState} ${courtZip}`;
    const courtReference = `${entry.trialCourtName} Attn: Clerk; ${entry.courtCaseNumber}`;

    return {
      dateBondExecuted: entry.dateBondExecuted,
      clientFullName: entry.clientFullName,
      stateOfBirth: entry.stateOfBirth,
      courtCaseNumber: entry.courtCaseNumber,
      socialSecurityNumber: entry.socialSecurityNumber,
      birthCertificateNumber: entry.birthCertificateNumber,
      uccTrustNumber: entry.uccTrustNumber,
      suretyBlockWithName,
      suretyBlockNoName: suretyBlock,
      courtReference,
      trialCourtName: entry.trialCourtName,
      trialCourtType: entry.trialCourtType || 'State',
      courtFullAddress,
      thirdPartyName: entry.thirdPartyName,
      thirdPartyFullAddress,
      thirdPartyCounty: entry.thirdPartyCounty,
      prisonNumber: entry.prisonNumber,
      prisonName: entry.prisonName,
      prisonAddress: entry.prisonAddress,
      sf28Field7: `${entry.courtCaseNumber} - ${GSA_REFERENCE}\nBirth Certificate - [${entry.stateOfBirth} - ${entry.birthCertificateNumber}] and Social Security - [${entry.socialSecurityNumber}]; Bond Number; Non-Negotiable set off [${entry.birthCertificateNumber}];\nDeposited with the United States Treasury`,
      sf28Field8: `${entry.trialCourtName} Attn: Clerk; ${entry.courtCaseNumber} - ${GSA_REFERENCE}`,
      sf28Field9: `Bid Bond issued by ${entry.trialCourtName} Attn: Clerk; ${entry.courtCaseNumber} - ${GSA_REFERENCE}`,
      of91Claims: `${entry.trialCourtName} Attn: Clerk; ${entry.courtCaseNumber} - ${GSA_REFERENCE}`,
      amountOwed: entry.amountOwed,
      gsaReference: GSA_REFERENCE,
      suretyCompanyName: SURETY_COMPANY.name,
      suretyCompanyAddress: `${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`
    };
  };

  // Process all entries
  const handleProcessAll = async () => {
    if (entries.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setResults([]);
    setError('');

    const newResults = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      try {
        const packageData = buildPackageData(entry);

        const response = await fetch('/api/generate-bond-package', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            masterData: entry,
            packageData: packageData,
            forms: ['SF24', 'SF25', 'SF28', 'SF1418', 'SF273', 'SF274', 'SF275', 'OF91']
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        // Download the PDF
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Completed_Package_${entry.clientFullName?.replace(/\s+/g, '_') || `Entry_${i + 1}`}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        newResults.push({
          index: i + 1,
          clientName: entry.clientFullName,
          status: 'success',
          message: 'Package generated successfully'
        });

      } catch (err) {
        newResults.push({
          index: i + 1,
          clientName: entry.clientFullName,
          status: 'error',
          message: err.message
        });
      }

      setProcessedCount(i + 1);
      setResults([...newResults]);

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const headers = EXPECTED_HEADERS.join(',');
    const sampleRow = [
      'John Doe', '2025-01-15', '123456789', '', 'BC-123-456', 'New York', '1980-05-15',
      'UCC123456', '123-45-6789', 'J12345678', 'Jane Doe', '123 Main St', 'New York',
      'NY', 'Kings', '', '', '', 'Superior Court', 'State', '100 Court St', 'New York',
      'NY', '50000.00'
    ].map(v => `"${v}"`).join(',');

    const csv = headers + '\n' + sampleRow;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'master_bond_sheet_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload/Paste Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Upload or Paste CSV Data
        </h3>

        <div className="flex flex-wrap gap-4 mb-4">
          {/* File Upload */}
          <label className="flex-1 min-w-[200px]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-300">Click to upload CSV file</p>
              <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
            </div>
          </label>
          
          {/* Paste CSV Button */}
          <div 
            onClick={() => setShowPasteModal(true)}
            className="flex-1 min-w-[200px] border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
          >
            <Clipboard className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-300">Click to paste CSV data</p>
            <p className="text-gray-500 text-sm mt-1">from email or clipboard</p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Template CSV
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}
      </div>
      
      {/* Paste CSV Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clipboard className="h-6 w-6" />
              Paste CSV Data
            </h3>
            
            <p className="text-gray-400 text-sm mb-4">
              Paste your CSV data below. Include the header row from the email.
            </p>
            
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={`Paste CSV data here...\n\nExample:\nclientFullName,dateBondExecuted,courtCaseNumber,...\n"John Doe","2025-01-15","123456789",...`}
              className="w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded text-gray-100 font-mono text-sm resize-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteData('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteCSV}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 flex items-center gap-2"
              >
                <Clipboard className="h-4 w-4" />
                Parse CSV Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {entries.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Entries to Process ({entries.length})
          </h3>

          <div className="max-h-64 overflow-y-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-300">#</th>
                  <th className="px-3 py-2 text-left text-gray-300">Client Name</th>
                  <th className="px-3 py-2 text-left text-gray-300">Court Case #</th>
                  <th className="px-3 py-2 text-left text-gray-300">Amount</th>
                  <th className="px-3 py-2 text-left text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const result = results.find(r => r.index === index + 1);
                  return (
                    <tr key={index} className="border-t border-gray-700">
                      <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                      <td className="px-3 py-2 text-white">{entry.clientFullName}</td>
                      <td className="px-3 py-2 text-gray-300">{entry.courtCaseNumber}</td>
                      <td className="px-3 py-2 text-green-400">${entry.amountOwed}</td>
                      <td className="px-3 py-2">
                        {result ? (
                          result.status === 'success' ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="h-4 w-4" /> Done
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle className="h-4 w-4" /> Error
                            </span>
                          )
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Process Button */}
          <div className="flex items-center justify-between">
            <div className="text-gray-400">
              {isProcessing && (
                <span>Processing {processedCount} of {entries.length}...</span>
              )}
              {!isProcessing && results.length > 0 && (
                <span>
                  Completed: {successCount} success, {errorCount} errors
                </span>
              )}
            </div>

            <button
              onClick={handleProcessAll}
              disabled={isProcessing || entries.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  Generate All Packages ({entries.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && !isProcessing && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Results</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-900 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-400">{successCount}</div>
              <div className="text-green-200">Successful</div>
            </div>
            <div className="bg-red-900 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-400">{errorCount}</div>
              <div className="text-red-200">Failed</div>
            </div>
          </div>

          {errorCount > 0 && (
            <div className="space-y-2">
              <h4 className="text-red-400 font-semibold">Errors:</h4>
              {results.filter(r => r.status === 'error').map((r, i) => (
                <div key={i} className="bg-red-900/50 p-2 rounded text-red-200 text-sm">
                  <strong>#{r.index} {r.clientName}:</strong> {r.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

