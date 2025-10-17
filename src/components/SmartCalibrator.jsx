'use client';

import { useState } from 'react';

export default function SmartCalibrator() {
  const [pdfFile, setPdfFile] = useState(null);
  const [schemaFile, setSchemaFile] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePDFUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleSchemaUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.json')) {
      setSchemaFile(file);
      setError(null);
    } else {
      setError('Please select a valid JSON schema file');
    }
  };

  const performSmartCalibration = async () => {
    if (!pdfFile || !schemaFile) {
      setError('Please upload both PDF and schema files');
      return;
    }

    setIsCalibrating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('schema', schemaFile);

      console.log('🤖 Starting smart calibration...');
      
      const response = await fetch('/api/calibrate-pdf', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setCalibrationResult(result);
        console.log('✅ Smart calibration complete:', result);
        
        // Auto-save the calibrated schema
        await saveCalibatedSchema(result.schema, pdfFile.name);
        
      } else {
        setError(result.error || 'Calibration failed');
      }
    } catch (err) {
      console.error('❌ Calibration error:', err);
      setError('Failed to perform smart calibration');
    } finally {
      setIsCalibrating(false);
    }
  };

  const saveCalibatedSchema = async (schema, pdfFileName) => {
    try {
      // Generate filename based on PDF name
      const baseName = pdfFileName.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `${baseName}_smart_calibrated_schema.json`;
      
      // Download the calibrated schema
      const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`💾 Saved calibrated schema: ${fileName}`);
    } catch (err) {
      console.error('❌ Failed to save schema:', err);
    }
  };

  const applyCalibrationToBatchProcessor = () => {
    if (!calibrationResult) return;
    
    // Store calibrated schema in localStorage for batch processor
    localStorage.setItem('smartCalibratedSchema', JSON.stringify(calibrationResult.schema));
    localStorage.setItem('calibrationApplied', 'true');
    
    alert('✅ Smart calibration applied! Go to Batch Processor to use the calibrated coordinates.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 Smart PDF Calibrator</h1>
        <p className="text-gray-600">
          Automatically calibrate PDF coordinates for perfect field alignment without manual intervention
        </p>
      </div>

      {/* File Upload Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* PDF Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
              onChange={handlePDFUpload}
            />
          </label>
          {pdfFile && (
            <p className="mt-2 text-sm text-green-600">
              ✅ {pdfFile.name}
            </p>
          )}
        </div>

        {/* Schema Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M9 12h6m6 0h6m-6 6h6m-12 6h12M9 12v18a2 2 0 002 2h26a2 2 0 002-2V12M9 12a2 2 0 012-2h26a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <label className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Upload Schema JSON
            </span>
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleSchemaUpload}
            />
          </label>
          {schemaFile && (
            <p className="mt-2 text-sm text-green-600">
              ✅ {schemaFile.name}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={performSmartCalibration}
          disabled={!pdfFile || !schemaFile || isCalibrating}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
            !pdfFile || !schemaFile || isCalibrating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isCalibrating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calibrating...
            </span>
          ) : (
            '🤖 Perform Smart Calibration'
          )}
        </button>

        {calibrationResult && (
          <button
            onClick={applyCalibrationToBatchProcessor}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            📊 Apply to Batch Processor
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Results Display */}
      {calibrationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            ✅ Smart Calibration Complete!
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">📊 Calibration Stats</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Original Fields: {calibrationResult.originalFields}</li>
                <li>Calibrated Fields: {calibrationResult.calibratedFields}</li>
                <li>Method: {calibrationResult.calibrationMethod}</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">🎯 Improvements</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {calibrationResult.improvements?.map((improvement, index) => (
                  <div key={index} className="text-xs">
                    {improvement}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded border">
            <h4 className="font-medium text-gray-800 mb-2">📋 Calibrated Fields Preview</h4>
            <div className="max-h-40 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {calibrationResult.schema.fields.slice(0, 12).map((field, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">{field.name}</div>
                    <div className="text-gray-500">
                      Page {field.page} • ({field.x}, {field.y})
                    </div>
                  </div>
                ))}
              </div>
              {calibrationResult.schema.fields.length > 12 && (
                <p className="text-center text-gray-500 mt-2">
                  ... and {calibrationResult.schema.fields.length - 12} more fields
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
