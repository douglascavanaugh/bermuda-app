"use client";

import { useState, useRef } from 'react';

function AutomatedPDFFieldDetector() {
  const [pdfFile, setPdfFile] = useState(null);
  const [detectedFields, setDetectedFields] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState('Upload a PDF to automatically detect form fields');
  const fileInputRef = useRef(null);

  // Handle PDF file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    console.log('📁 File selected:', file);
    console.log('📋 File type:', file?.type);
    
    if (!file) {
      setMessage('No file selected');
      console.log('❌ No file selected');
      return;
    }
    
    if (file.type !== 'application/pdf') {
      setMessage(`Please upload a PDF file. Selected: ${file.type}`);
      console.log('❌ Wrong file type:', file.type);
      return;
    }

    console.log('✅ Setting PDF file:', file.name);
    setPdfFile(file);
    setMessage(`PDF uploaded: ${file.name}. Click "Analyze PDF" to detect form fields.`);
  };

  // Analyze PDF for form fields using server-side API
  const analyzePDF = async () => {
    if (!pdfFile) {
      setMessage('Please upload a PDF file first');
      return;
    }

    setIsAnalyzing(true);
    setMessage('🔍 Analyzing PDF for form fields...');
    
    try {
      // Use server-side API to avoid webpack issues
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      
      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success && result.fields.length > 0) {
        setDetectedFields(result.fields);
        setMessage(`✅ Found ${result.fieldsFound} form fields in ${result.numPages} pages using ${result.method}!`);
      } else if (result.fields && result.fields.length > 0) {
        // Fallback OCR results
        setDetectedFields(result.fields);
        setMessage(`🤖 PDF.js failed, using ${result.fields[0].method}. Found ${result.fields.length} potential fields.`);
      } else {
        setMessage('❌ No form fields detected in this PDF. It may be a static/scanned document.');
      }
    } catch (error) {
      console.error('PDF analysis error:', error);
      setMessage(`❌ Error analyzing PDF: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Server-side analysis handles all the PDF.js complexity

  // Export detected fields as JSON schema
  const exportSchema = () => {
    if (detectedFields.length === 0) {
      setMessage('No fields detected to export');
      return;
    }

    const schema = {
      formType: 'auto_detected',
      name: `${pdfFile.name} - Auto Detected Fields`,
      description: `Automatically detected form fields from ${pdfFile.name}`,
      version: '1.0',
      hasFormFields: true,
      detectedFieldCount: detectedFields.length,
      detectionMethods: [...new Set(detectedFields.map(f => f.method))],
      fields: detectedFields.map(field => ({
        name: field.name,
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        fontSize: 10,
        page: field.page,
        type: field.type,
        confidence: field.confidence
      }))
    };

    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pdfFile.name.replace('.pdf', '')}_auto_detected_schema.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setMessage('✅ Auto-detected schema exported successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        🤖 AUTOMATED PDF FIELD DETECTOR 🔍
      </h2>
      <p className="text-center text-gray-300 mb-8">
        Automatically detect form fields using PDF.js + OCR + Computer Vision
      </p>

      {/* Status Message */}
      <div className="mb-6 p-4 bg-gray-700 rounded text-center">
        <p className="text-white font-medium">{message}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Analysis */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">📁 Upload PDF</h3>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            
            {pdfFile && (
              <div className="mt-4 p-3 bg-green-800 rounded border border-green-600">
                <p className="text-green-100 font-medium">📄 {pdfFile.name}</p>
                <p className="text-green-200 text-sm">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          {/* Analysis Controls */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">🔍 Analysis</h3>
            
            <button
              onClick={() => {
                console.log('🔘 Button clicked, pdfFile:', pdfFile);
                console.log('🔘 isAnalyzing:', isAnalyzing);
                analyzePDF();
              }}
              disabled={!pdfFile || isAnalyzing}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                !pdfFile || isAnalyzing
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🤖 Analyze PDF'}
            </button>
            
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-400">
              Debug: pdfFile={pdfFile ? '✅' : '❌'} | isAnalyzing={isAnalyzing ? '✅' : '❌'}
            </div>
            
            <div className="mt-4 text-sm text-gray-300">
              <p className="font-semibold mb-2">🎯 Detection Methods:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>📄 PDF.js - Interactive form fields</li>
                <li>🤖 OCR - Text recognition & layout analysis</li>
                <li>👁️ Computer Vision - Pattern recognition</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Detected Fields */}
          <div className="bg-gray-700 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                🎯 Detected Fields ({detectedFields.length})
              </h3>
              {detectedFields.length > 0 && (
                <button
                  onClick={exportSchema}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Export Schema 📥
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {detectedFields.map((field, index) => (
                <div key={index} className="p-3 bg-gray-600 rounded">
                  <div className="flex justify-between items-start">
                    <div className="text-gray-200">
                      <div className="font-semibold">{field.name}</div>
                      <div className="text-xs text-gray-400">
                        Page {field.page} • ({field.x}, {field.y}) • {field.width}x{field.height}
                      </div>
                      <div className="text-xs text-gray-400">
                        Method: {field.method} • Confidence: {(field.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      field.method === 'PDF.js' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {field.type}
                    </span>
                  </div>
                </div>
              ))}
              
              {detectedFields.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  No fields detected yet. Upload a PDF and click "Analyze PDF".
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomatedPDFFieldDetector;
