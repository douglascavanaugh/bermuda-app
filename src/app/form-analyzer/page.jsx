'use client';

import { useState } from 'react';

export default function FormAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedFields, setDetectedFields] = useState([]);
  const [generatedCSV, setGeneratedCSV] = useState('');
  const [formType, setFormType] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Helper function to show confirmation messages
  const showConfirmation = (message) => {
    setConfirmationMessage(message);
    setTimeout(() => setConfirmationMessage(''), 3000); // Auto-hide after 3 seconds
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setDetectedFields([]);
      setGeneratedCSV('');
    } else {
      alert('Please upload a PDF file');
    }
  };

  const analyzeForm = async () => {
    if (!uploadedFile) return;

    setAnalyzing(true);
    try {
      // First, upload the PDF to our public folder
      const formData = new FormData();
      formData.append('pdf', uploadedFile);
      
      const uploadResponse = await fetch('/api/upload-form', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const uploadResult = await uploadResponse.json();
      const fileName = uploadResult.fileName;

      // Now analyze the uploaded PDF
      const analyzeResponse = await fetch('/api/analyze-form-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName })
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze PDF');
      }

      const result = await analyzeResponse.json();
      setDetectedFields(result.fields);
      setGeneratedCSV(result.csv);
      setFormType(result.formType);

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing PDF: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyCSV = () => {
    navigator.clipboard.writeText(generatedCSV);
    showConfirmation('✅ CSV copied to clipboard! 📋');
  };

  const downloadCSV = () => {
    const blob = new Blob([generatedCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showConfirmation('✅ CSV downloaded successfully! 💾');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎯 LEGENDARY FORM ANALYZER
          </h1>
          <p className="text-xl text-gray-600">
            Upload any GSA PDF → Auto-detect fields → Generate perfect CSV
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📤 Step 1: Upload GSA Form
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="text-6xl mb-4">📄</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">
                Click to upload GSA PDF
              </div>
              <div className="text-gray-500">
                Supports: SF24, SF25, SF28, and more!
              </div>
            </label>
          </div>

          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 font-semibold">✅ File uploaded:</span>
                <span className="ml-2 text-gray-700">{uploadedFile.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Section */}
        {uploadedFile && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🔍 Step 2: Analyze Form Fields
            </h2>
            
            <button
              onClick={analyzeForm}
              disabled={analyzing}
              className={`px-8 py-4 rounded-lg font-bold text-white text-lg transition-all ${
                analyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {analyzing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Analyzing PDF...
                </div>
              ) : (
                'ANALYZE FORM FIELDS'
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {detectedFields.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ✅ Step 3: Detected Fields ({detectedFields.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {detectedFields.map((field, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-semibold text-blue-600">{field.cleanName}</div>
                  <div className="text-sm text-gray-500">{field.originalName}</div>
                  <div className="text-xs text-gray-400">
                    ({field.x.toFixed(1)}, {field.y.toFixed(1)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated CSV Section */}
        {generatedCSV && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎯 Step 4: Generated CSV Template
            </h2>
            
            <div className="mb-4 flex gap-4">
              <button
                onClick={copyCSV}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                📋 Copy CSV
              </button>
              <button
                onClick={downloadCSV}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
              >
                💾 Download CSV
              </button>
            </div>

            {/* Confirmation Message */}
            {confirmationMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {confirmationMessage}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                {generatedCSV}
              </pre>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">🚀 Next Steps:</h3>
              <ol className="list-decimal list-inside text-blue-700 space-y-1">
                <li>Copy the generated CSV above</li>
                <li>Go to <a href="/batch-processor" className="underline font-semibold">/batch-processor</a></li>
                <li>Paste your CSV data</li>
                <li>Process thousands of perfect PDFs! 🎯</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
