"use client";

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PDFTemplateScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [message, setMessage] = useState('');

  const scanPDFForFields = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Get form fields if they exist
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const detectedFields = [];
      
      if (fields.length > 0) {
        // PDF has form fields - JACKPOT!
        fields.forEach((field, index) => {
          const fieldName = field.getName();
          const fieldType = field.constructor.name;
          
          // Try to get field position (this is tricky with pdf-lib)
          detectedFields.push({
            name: fieldName,
            type: fieldType,
            x: 100 + (index % 3) * 150, // Estimated positioning
            y: 700 - Math.floor(index / 3) * 30,
            width: 120,
            height: 20,
            fontSize: 10,
            required: true
          });
        });
      } else {
        // No form fields - we'll need OCR or manual mapping
        // For now, create a basic template structure
        const commonFields = [
          'firstName', 'lastName', 'address', 'city', 'state', 'zip',
          'ssn', 'dateOfBirth', 'phone', 'email'
        ];
        
        commonFields.forEach((fieldName, index) => {
          detectedFields.push({
            name: fieldName,
            label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
            type: 'text',
            x: 100 + (index % 2) * 200,
            y: 700 - Math.floor(index / 2) * 40,
            width: 150,
            height: 20,
            fontSize: 10,
            required: true
          });
        });
      }
      
      // Generate schema
      const schema = {
        formType: file.name.replace('.pdf', '').toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        name: file.name.replace('.pdf', ''),
        description: `Auto-generated schema for ${file.name}`,
        version: "1.0",
        hasFormFields: fields.length > 0,
        detectedFieldCount: fields.length,
        fields: detectedFields,
        metadata: {
          created: new Date().toISOString().split('T')[0],
          author: "Bermuda App Auto-Scanner",
          pdfTemplate: file.name,
          fileSize: file.size,
          pageCount: pdfDoc.getPageCount(),
          pageSize: {
            width: 612,
            height: 792
          }
        }
      };
      
      return schema;
      
    } catch (error) {
      console.error('PDF scanning error:', error);
      throw new Error(`Failed to scan ${file.name}: ${error.message}`);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsScanning(true);
    setMessage('Scanning PDFs for form fields...');
    setScanResults([]);

    const results = [];

    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          setMessage(`Scanning ${file.name}...`);
          const schema = await scanPDFForFields(file);
          results.push({
            file: file.name,
            schema: schema,
            status: 'success'
          });
        } catch (error) {
          results.push({
            file: file.name,
            error: error.message,
            status: 'error'
          });
        }
      }
    }

    setScanResults(results);
    setMessage(`Scanned ${results.length} PDF(s). Check results below.`);
    setIsScanning(false);
  };

  const downloadSchema = (result) => {
    const blob = new Blob([JSON.stringify(result.schema, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.schema.formType.toLowerCase()}-schema.json`;
    link.click();
  };

  const downloadAllSchemas = () => {
    const successResults = scanResults.filter(r => r.status === 'success');
    
    successResults.forEach(result => {
      setTimeout(() => downloadSchema(result), 100);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        PDF TEMPLATE AUTO-SCANNER 🔍⚡
      </h2>

      <div className="space-y-6">
        {/* Upload Section */}
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-bold text-white mb-4">
            Upload PDFs from sample-pdfs folder:
          </h3>
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
            disabled={isScanning}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500"
          />
          <p className="text-gray-400 text-sm mt-2">
            Select multiple PDF files to auto-generate JSON schemas
          </p>
        </div>

        {/* Status */}
        {message && (
          <div className="p-3 bg-gray-700 text-white rounded text-center">
            {isScanning && <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>}
            {message}
          </div>
        )}

        {/* Results */}
        {scanResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Scan Results:</h3>
              <button
                onClick={downloadAllSchemas}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download All Schemas
              </button>
            </div>

            {scanResults.map((result, index) => (
              <div key={index} className={`p-4 rounded ${
                result.status === 'success' ? 'bg-green-900' : 'bg-red-900'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{result.file}</h4>
                    {result.status === 'success' ? (
                      <div className="text-green-300 text-sm space-y-1">
                        <p>✅ Form Type: {result.schema.formType}</p>
                        <p>✅ Fields Detected: {result.schema.fields.length}</p>
                        <p>✅ Has Form Fields: {result.schema.hasFormFields ? 'Yes' : 'No'}</p>
                        <p>✅ Pages: {result.schema.metadata.pageCount}</p>
                      </div>
                    ) : (
                      <p className="text-red-300 text-sm">❌ {result.error}</p>
                    )}
                  </div>
                  
                  {result.status === 'success' && (
                    <button
                      onClick={() => downloadSchema(result)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Download Schema
                    </button>
                  )}
                </div>

                {/* Preview Schema */}
                {result.status === 'success' && (
                  <details className="mt-3">
                    <summary className="text-white cursor-pointer hover:text-blue-300">
                      Preview Schema
                    </summary>
                    <pre className="text-xs text-gray-300 bg-gray-800 p-3 rounded mt-2 overflow-auto max-h-40">
                      {JSON.stringify(result.schema, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-bold text-white mb-2">How This Works:</h3>
          <div className="space-y-2 text-gray-300 text-sm">
            <p><strong className="text-green-400">1. Form Field Detection:</strong> Scans for existing PDF form fields</p>
            <p><strong className="text-blue-400">2. Schema Generation:</strong> Creates JSON templates with field positions</p>
            <p><strong className="text-yellow-400">3. Template Creation:</strong> Ready-to-use schemas for overlay system</p>
            <p><strong className="text-purple-400">4. Batch Processing:</strong> Handle multiple PDFs at once</p>
          </div>
        </div>
      </div>
    </div>
  );
}
