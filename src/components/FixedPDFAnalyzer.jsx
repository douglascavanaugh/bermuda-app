'use client';

import { useState, useEffect } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

export default function FixedPDFAnalyzer() {
  const [pdfFile, setPdfFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [pdfjsReady, setPdfjsReady] = useState(false);

  // SOLUTION #2: Async import for worker file (from your research!)
  useEffect(() => {
    async function configurePdfjs() {
      try {
        console.log('🚀 Configuring PDF.js with async import...');
        
        // Method 1: Try dynamic import of worker
        try {
          const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs");
          GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
          console.log('✅ PDF.js configured with dynamic worker import');
        } catch (workerError) {
          console.log('⚠️ Dynamic worker import failed, trying public folder...');
          
          // Method 2: Fallback to public folder (Solution #3)
          GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
          console.log('✅ PDF.js configured with public folder worker');
        }
        
        setPdfjsReady(true);
        console.log('🤖 PDF.js is ready!');
        
      } catch (err) {
        console.error('❌ Failed to configure PDF.js:', err);
        setError('Failed to initialize PDF.js library');
      }
    }
    
    configurePdfjs();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    console.log('📁 File selected:', file);
    
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      console.log('✅ PDF file set:', file.name);
    } else {
      setError('Please select a valid PDF file');
      console.log('❌ Invalid file type');
    }
  };

  const analyzePDF = async () => {
    if (!pdfFile || !pdfjsReady) {
      setError('Please select a PDF file first or wait for PDF.js to initialize');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('🚀 Starting FIXED PDF analysis...');
      
      // Read PDF file as ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      console.log('📄 PDF loaded:', pdfFile.name, arrayBuffer.byteLength, 'bytes');
      
      // Load PDF document using the FIXED approach
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('📊 PDF document loaded:', pdf.numPages, 'pages');
      
      const allFields = [];
      
      // Analyze each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`🔍 Analyzing page ${pageNum}...`);
        
        const page = await pdf.getPage(pageNum);
        
        // Method 1: Get form field annotations (interactive PDFs)
        try {
          const annotations = await page.getAnnotations();
          console.log(`📋 Page ${pageNum}: Found ${annotations.length} annotations`);
          
          annotations.forEach((annotation, index) => {
            console.log(`🔍 Annotation ${index}:`, {
              subtype: annotation.subtype,
              fieldName: annotation.fieldName,
              fieldType: annotation.fieldType,
              rect: annotation.rect
            });
            
            if (annotation.subtype === 'Widget' || annotation.fieldName) {
              const rect = annotation.rect || [0, 0, 100, 20];
              const fieldName = annotation.fieldName || `field_page${pageNum}_${index}`;
              
              allFields.push({
                name: fieldName,
                type: annotation.fieldType || 'text',
                page: pageNum,
                x: Math.round(rect[0]),
                y: Math.round(rect[1]),
                width: Math.round(rect[2] - rect[0]),
                height: Math.round(rect[3] - rect[1]),
                method: 'FIXED PDF.js Annotations',
                confidence: 1.0,
                subtype: annotation.subtype,
                fontSize: 10
              });
            }
          });
        } catch (annotationError) {
          console.log(`⚠️ Page ${pageNum} annotation error:`, annotationError.message);
        }
        
        // Method 2: Get text content with coordinates (for non-interactive PDFs)
        try {
          const textContent = await page.getTextContent();
          console.log(`📝 Page ${pageNum}: Found ${textContent.items.length} text items`);
          
          // Analyze text for form field patterns
          const textFields = analyzeTextContentForFields(textContent.items, pageNum);
          allFields.push(...textFields);
          
        } catch (textError) {
          console.log(`⚠️ Page ${pageNum} text error:`, textError.message);
        }
      }
      
      console.log(`✅ Total fields detected: ${allFields.length}`);
      
      const result = {
        success: true,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        numPages: pdf.numPages,
        fieldsFound: allFields.length,
        fields: allFields,
        method: 'FIXED PDF.js Analysis',
        note: 'Using FIXED PDF.js with async worker import - NO webpack conflicts!'
      };
      
      setAnalysisResult(result);
      console.log('✅ FIXED analysis complete:', result);
      
      // Auto-save the schema
      await saveDetectedSchema(result, pdfFile.name);
      
    } catch (err) {
      console.error('❌ FIXED PDF analysis error:', err);
      setError('Failed to analyze PDF: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze text content for form field patterns (non-interactive PDFs)
  const analyzeTextContentForFields = (textItems, pageNum) => {
    const fields = [];
    
    // Look for common form field patterns in text
    const fieldPatterns = [
      { pattern: /principal.*name/i, name: 'principal_name', estimatedWidth: 300 },
      { pattern: /principal.*address/i, name: 'principal_address', estimatedWidth: 300 },
      { pattern: /state.*incorporation/i, name: 'state_of_incorporation', estimatedWidth: 100 },
      { pattern: /surety.*name/i, name: 'surety_name', estimatedWidth: 300 },
      { pattern: /surety.*address/i, name: 'surety_address', estimatedWidth: 300 },
      { pattern: /individual/i, name: 'org_individual', estimatedWidth: 20, type: 'checkbox' },
      { pattern: /partnership/i, name: 'org_partnership', estimatedWidth: 20, type: 'checkbox' },
      { pattern: /corporation/i, name: 'org_corporation', estimatedWidth: 20, type: 'checkbox' },
      { pattern: /joint.*venture/i, name: 'org_joint_venture', estimatedWidth: 20, type: 'checkbox' },
      { pattern: /percent.*bid/i, name: 'percent_of_bid_price', estimatedWidth: 100 },
      { pattern: /bid.*date/i, name: 'bid_date', estimatedWidth: 120 },
      { pattern: /invitation.*number/i, name: 'invitation_number', estimatedWidth: 150 }
    ];
    
    textItems.forEach((item, index) => {
      const text = item.str.toLowerCase();
      const x = item.transform[4];
      const y = item.transform[5];
      
      fieldPatterns.forEach(pattern => {
        if (pattern.pattern.test(text)) {
          // Estimate field position based on text position
          const fieldX = x + 20; // Slightly to the right of the label
          const fieldY = y - 5; // Slightly below the label
          
          fields.push({
            name: pattern.name,
            type: pattern.type || 'text',
            page: pageNum,
            x: Math.round(fieldX),
            y: Math.round(fieldY),
            width: pattern.estimatedWidth,
            height: pattern.type === 'checkbox' ? 15 : 20,
            method: 'FIXED Text Pattern Analysis',
            confidence: 0.8,
            sourceText: item.str,
            fontSize: 10
          });
        }
      });
    });
    
    return fields;
  };

  const saveDetectedSchema = async (result, pdfFileName) => {
    try {
      // Generate filename based on PDF name
      const baseName = pdfFileName.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `${baseName}_FIXED_detected_schema.json`;
      
      // Create schema object
      const schema = {
        formType: "FIXED_detected",
        name: `${pdfFileName} - FIXED Detected Fields`,
        description: `Automatically detected form fields from ${pdfFileName} using FIXED PDF.js approach`,
        version: "1.0",
        hasFormFields: result.fieldsFound > 0,
        detectedFieldCount: result.fieldsFound,
        detectionMethods: [result.method],
        fields: result.fields
      };
      
      // Download the schema
      const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`💾 Saved FIXED detected schema: ${fileName}`);
    } catch (err) {
      console.error('❌ Failed to save schema:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔧 FIXED PDF Analyzer</h1>
        <p className="text-gray-600">
          Using your research solutions - async worker import + public folder fallback!
        </p>
      </div>

      {/* PDF.js Status */}
      <div className="mb-6 p-4 rounded-lg border">
        <h3 className="font-medium text-gray-800 mb-2">📊 PDF.js Status</h3>
        {pdfjsReady ? (
          <p className="text-green-600">✅ PDF.js configured successfully with FIXED approach</p>
        ) : (
          <p className="text-yellow-600">⏳ Configuring PDF.js with async worker import...</p>
        )}
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-6">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <label className="cursor-pointer">
          <span className="mt-2 block text-sm font-medium text-gray-900">
            Upload PDF Form
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileUpload}
          />
        </label>
        {pdfFile && (
          <p className="mt-2 text-sm text-green-600">
            ✅ {pdfFile.name}
          </p>
        )}
      </div>

      {/* Analyze Button */}
      <div className="mb-6">
        <button
          onClick={analyzePDF}
          disabled={!pdfFile || !pdfjsReady || isAnalyzing}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            !pdfFile || !pdfjsReady || isAnalyzing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing PDF...
            </span>
          ) : (
            '🔧 Analyze PDF (FIXED Approach)'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Results Display */}
      {analysisResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">
            ✅ FIXED Analysis Complete!
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">📊 Analysis Stats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>File: {analysisResult.fileName}</li>
                <li>Pages: {analysisResult.numPages}</li>
                <li>Fields Found: {analysisResult.fieldsFound}</li>
                <li>Method: {analysisResult.method}</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">🎯 Detection Info</h4>
              <p className="text-sm text-gray-600">
                {analysisResult.note}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded border">
            <h4 className="font-medium text-gray-800 mb-2">📋 Detected Fields</h4>
            <div className="max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {analysisResult.fields.map((field, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <span className="font-medium">{field.name}</span>
                      <span className="text-gray-500 ml-2">
                        Page {field.page} • ({field.x}, {field.y}) • {field.width}x{field.height}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Method: {field.method}</div>
                      <div className="text-xs text-blue-600">Confidence: {Math.round(field.confidence * 100)}%</div>
                      <div className="text-xs font-medium text-emerald-600">{field.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
