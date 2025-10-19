"use client";

import { useState, useRef, useEffect } from 'react';

function PDFCoordinateMapper() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [fieldMappings, setFieldMappings] = useState([]);
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);
  const [message, setMessage] = useState('Upload a PDF file to start mapping coordinates');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detectedFields, setDetectedFields] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedCSV, setGeneratedCSV] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // ALL SF25-23A form fields (from the CSV we generated)
  const commonFields = [
    // Page 1 fields
    'page1_dateexecuted[0]',
    'page1_principaladdress[0]',
    'page1_millions[0]',
    'page1_stateof[0]',
    'page1_surety[0]',
    'page1_individual[0]',
    'page1_partnership[0]',
    'page1_jointventure[0]',
    'page1_corporation[0]',
    'page1_other[0]',
    'page1_cents[0]',
    'page1_hunderds[0]',
    'page1_thousands[0]',
    'page1_millions[1]',
    'page1_contractno[0]',
    'page1_contratedate[0]',
    
    // Page 2 fields
    'page2_nametitle1[0]',
    'page2_nametitle2[0]',
    'page2_nametitle3[0]',
    'page2_nametitle20[0]',
    'page2_nametitle[0]',
    'page2_nameaddressa[0]',
    'page2_nametitlea[0]',
    'page2_nametitlea2[0]',
    'page2_liabilitylimita[0]',
    'page2_statea[0]',
    'page2_nameaddressa[1]',
    'page2_nametitlea[1]',
    'page2_nametitlea2[1]',
    'page2_liabilitylimita[1]',
    'page2_statea[1]',
    'page2_nameaddressa[2]',
    'page2_nametitlea[2]',
    'page2_nametitlea2[2]',
    'page2_liabilitylimita[2]',
    'page2_statea[2]',
    'page2_nametitlea2[3]',
    'page2_liabilitylimita[3]',
    'page2_statea[3]',
    'page2_nameaddressa[3]',
    'page2_nametitlea[3]',
    'page2_nametitlea2[4]',
    'page2_nametitlea[4]',
    'page2_liabilitylimita[4]',
    'page2_statea[4]',
    'page2_nameaddressa[4]',
    
    // Page 3 fields
    'page3_liabilitylimita[5]',
    'page3_statea[5]',
    'page3_nametitlea2[5]',
    'page3_nameaddressa[5]',
    'page3_nametitlea[5]',
    'page3_liabilitylimita[6]',
    'page3_statea[6]',
    'page3_nametitlea2[6]',
    'page3_nameaddressa[6]',
    'page3_nametitlea[6]',
    'page3_total[0]',
    'page3_rateperthousand[0]'
  ];

  // Auto-detect fields from uploaded PDF
  const analyzeUploadedPDF = async (file) => {
    setIsAnalyzing(true);
    setMessage('🔍 Auto-detecting form fields...');
    
    try {
      // Save PDF to server first
      const formData = new FormData();
      formData.append('pdf', file);
      
      const uploadResponse = await fetch('/api/upload-form', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }
      
      const { fileName } = await uploadResponse.json();
      setUploadedFileName(fileName); // Store filename for page navigation
      
      // Analyze the uploaded PDF
      const analyzeResponse = await fetch('/api/analyze-form-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze PDF fields');
      }
      
      const { detectedFields: fields } = await analyzeResponse.json();
      
      // Set detected fields for coordinate mapping
      const fieldNames = fields.map(field => field.originalName || field.name);
      setDetectedFields(fieldNames);
      setMessage(`✅ Detected ${fields.length} form fields! Click field names to map coordinates.`);
      
      console.log('🎯 DETECTED FIELDS COUNT:', fields.length);
      console.log('🎯 DETECTED FIELD NAMES:', fieldNames);
      
      // Check for duplicates
      const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        console.warn('⚠️ DUPLICATE FIELDS FOUND:', [...new Set(duplicates)]);
      }
      
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      setMessage('❌ Failed to analyze PDF. Using fallback field list.');
      // Fallback to hardcoded fields if auto-detection fails
      setDetectedFields(commonFields);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle PDF upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    setCurrentPage(1);
    setTotalPages(4); // Default, will be updated
    
    // Render PDF to canvas
    renderPDFToCanvas(file, 1);
    
    // Auto-detect fields from the uploaded PDF
    await analyzeUploadedPDF(file);
  };

  // Render PDF to canvas using Python API
  const renderPDFToCanvas = async (file, pageNumber) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      
      // Clear canvas and show loading
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 612, 792);
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading PDF page...', 306, 396);

      // Use stored filename if available, otherwise upload file
      let fileName = uploadedFileName;
      if (!fileName && file) {
        // First time upload - store the filename
        const uploadFormData = new FormData();
        uploadFormData.append('pdf', file);
        
        const uploadResponse = await fetch('/api/upload-form', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload PDF');
        }
        
        const result = await uploadResponse.json();
        fileName = result.fileName;
        setUploadedFileName(fileName);
      }

      // Call Python API to get coordinate mapper image using filename
      const formData = new FormData();
      formData.append('filename', fileName);
      formData.append('page_number', pageNumber.toString());

      // Call Python API directly
      const pythonApiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://bermuda-app.onrender.com/api/create-coordinate-mapper'
        : 'http://localhost:5001/api/create-coordinate-mapper';
        
      const response = await fetch(pythonApiUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to render PDF');
      }

      const blob = await response.blob();
      const img = new Image();
      
      img.onload = () => {
        // Clear canvas and draw PDF image
        ctx.clearRect(0, 0, 612, 792);
        ctx.drawImage(img, 0, 0, 612, 792);
        
        // Add grid overlay for better coordinate mapping
        drawGrid(ctx);
      };
      
      img.onerror = () => {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('Failed to load PDF page', 306, 396);
      };
      
      img.src = URL.createObjectURL(blob);
      
    } catch (error) {
      console.error('Error rendering PDF:', error);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 612, 792);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error loading PDF', 306, 396);
      }
      setMessage('❌ Error loading PDF. Make sure the Python API is running.');
    }
  };

  // Draw grid overlay for better coordinate mapping
  const drawGrid = (ctx) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    
    // Vertical lines every 50 points
    for (let x = 50; x < 612; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 792);
      ctx.stroke();
    }
    
    // Horizontal lines every 50 points
    for (let y = 50; y < 792; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(612, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };

  // Handle canvas click to capture coordinates
  const handleCanvasClick = (event) => {
    if (!isAddingField || !selectedFieldName) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Get click coordinates relative to the canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to PDF coordinates (612x792 points for 8.5x11")
    const pdfX = Math.round((x / rect.width) * 612);
    const pdfY = Math.round(792 - (y / rect.height) * 792); // Flip Y coordinate
    
    // Use current page being viewed
    const pageNumber = currentPage;

    // Add field mapping
    const newField = {
      name: selectedFieldName,
      x: pdfX,
      y: pdfY,
      width: 120,
      height: 20,
      fontSize: 10,
      page: pageNumber
    };

    setFieldMappings(prev => {
      const updated = [...prev, newField];
      // Auto-generate CSV when fields are added
      setTimeout(() => {
        const headers = updated.map(field => field.name);
        const sampleRow = updated.map(field => field.name);
        const csvContent = [
          headers.join(','),
          sampleRow.map(value => `"${value}"`).join(',')
        ].join('\n');
        setGeneratedCSV(csvContent);
      }, 100);
      return updated;
    });
    
    setSelectedFieldName('');
    setIsAddingField(false);
    setMessage(`✅ Added field "${selectedFieldName}" at PDF coordinates (${pdfX}, ${pdfY}) on page ${pageNumber}`);

    console.log(`Added field: ${selectedFieldName} at PDF (${pdfX}, ${pdfY}) page ${pageNumber}`);
  };

  // Start adding a field
  const startAddingField = (fieldName) => {
    setSelectedFieldName(fieldName);
    setIsAddingField(true);
    setMessage(`🎯 Click on the canvas where "${fieldName}" should be placed`);
  };

  // Remove field mapping
  const removeField = (index) => {
    setFieldMappings(prev => prev.filter((_, i) => i !== index));
    setMessage('Field removed');
  };

  // Generate CSV template with field names as values
  const generateCSVTemplate = () => {
    if (fieldMappings.length === 0) {
      setGeneratedCSV('');
      return;
    }

    // Create CSV headers from mapped field names
    const headers = fieldMappings.map(field => field.name);
    
    // Create sample row with field names as values (for debugging)
    const sampleRow = fieldMappings.map(field => field.name);
    
    // Generate CSV content
    const csvContent = [
      headers.join(','),
      sampleRow.map(value => `"${value}"`).join(',')
    ].join('\n');
    
    setGeneratedCSV(csvContent);
    setMessage(`✅ Generated CSV template with ${fieldMappings.length} fields!`);
  };

  // Copy CSV to clipboard
  const copyCSVToClipboard = async () => {
    if (!generatedCSV) {
      setMessage('❌ No CSV generated yet');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedCSV);
      setMessage('✅ CSV copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy CSV:', error);
      setMessage('❌ Failed to copy CSV to clipboard');
    }
  };

  // Export field mappings as JSON
  const exportMappings = () => {
    if (fieldMappings.length === 0) {
      setMessage('❌ No fields mapped yet');
      return;
    }

    const formName = uploadedFile ? uploadedFile.name.replace('.pdf', '') : 'custom-form';
    const formType = formName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const schema = {
      formType: formType,
      name: `${formName} Manual Mapping`,
      description: `Manually mapped field coordinates for ${formName}`,
      version: "1.0",
      hasFormFields: true,
      detectedFieldCount: fieldMappings.length,
      fields: fieldMappings
    };

    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formType}_manual_schema.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('✅ JSON schema exported successfully!');
  };

  // Navigate between pages
  const goToPage = (pageNumber) => {
    if (!uploadedFile || pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    renderPDFToCanvas(uploadedFile, pageNumber);
    setMessage(`📄 Showing page ${pageNumber} of ${totalPages}. Click field names, then click on the PDF to map coordinates.`);
  };

  // Clear all data
  const clearAll = () => {
    setUploadedFile(null);
    setFieldMappings([]);
    setSelectedFieldName('');
    setIsAddingField(false);
    setCurrentPage(1);
    setTotalPages(1);
    setMessage('Upload a PDF file to start mapping coordinates');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        🎯 BULLETPROOF PDF COORDINATE MAPPER
      </h2>
      <p className="text-center text-gray-300 mb-8">
        NO IMAGE CONVERSION BULLSHIT! Upload PDF → Click fields → Export schema!
      </p>

      {/* Status Message */}
      <div className="mb-6 p-4 bg-gray-700 rounded text-center">
        <p className="text-white font-medium">{message}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">📁 Upload PDF</h3>
            
            {!uploadedFile ? (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-gray-300 text-sm">
                  📄 Upload your PDF form directly - no conversion needed!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-800 rounded border border-green-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 font-medium">📄 {uploadedFile.name}</p>
                      <p className="text-green-200 text-sm">Ready for coordinate mapping</p>
                    </div>
                    <button
                      onClick={clearAll}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                {/* Page Navigation */}
                {uploadedFile && totalPages > 1 && (
                  <div className="p-3 bg-blue-900 rounded border border-blue-600">
                    <p className="text-blue-100 font-medium mb-2">📄 Page Navigation:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                          }`}
                        >
                          Page {pageNum}
                        </button>
                      ))}
                    </div>
                    <p className="text-blue-200 text-xs mt-2">
                      Currently viewing: Page {currentPage} of {totalPages}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field Selection */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">🖱️ Field Mapping</h3>
            
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-blue-300">🔍 Auto-detecting form fields...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-300 text-sm mb-4">
                  {detectedFields.length > 0 
                    ? `✅ Detected ${detectedFields.length} form fields. Click a field name, then click on the canvas where that field should go.`
                    : "Click a field name, then click on the canvas where that field should go."
                  }
                </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(detectedFields.length > 0 ? detectedFields : commonFields).map(fieldName => (
                <button
                  key={fieldName}
                  onClick={() => startAddingField(fieldName)}
                  disabled={isAddingField || !uploadedFile}
                  className={`w-full p-2 text-left rounded transition-colors text-sm ${
                    selectedFieldName === fieldName 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  } ${(isAddingField || !uploadedFile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {fieldName}
                </button>
              ))}
            </div>
              </>
            )}
            
            {isAddingField && (
              <div className="mt-4 p-3 bg-blue-900 rounded text-blue-200">
                <p className="font-semibold">📍 Click on canvas to place "{selectedFieldName}"</p>
                <button
                  onClick={() => {
                    setIsAddingField(false);
                    setSelectedFieldName('');
                    setMessage('Field placement cancelled');
                  }}
                  className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Mapped Fields */}
          <div className="bg-gray-700 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Mapped Fields ({fieldMappings.length}):</h3>
              {fieldMappings.length > 0 && (
                <button
                  onClick={exportMappings}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Export JSON 📥
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fieldMappings.map((field, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-600 rounded">
                  <div className="text-gray-200">
                    <div className="font-semibold text-xs">{field.name}</div>
                    <div className="text-xs text-gray-400">
                      Page {field.page} • ({field.x}, {field.y})
                    </div>
                  </div>
                  <button
                    onClick={() => removeField(index)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {fieldMappings.length === 0 && (
                <p className="text-gray-400 text-center py-4">No fields mapped yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns - Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">📄 PDF Canvas (Click to Map Fields)</h3>
            
            <div className="border border-gray-600 rounded overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={612}
                height={792}
                onClick={handleCanvasClick}
                className={`w-full h-auto ${
                  isAddingField ? 'cursor-crosshair' : 'cursor-default'
                } ${!uploadedFile ? 'opacity-50' : ''}`}
                style={{ 
                  maxHeight: '800px',
                  aspectRatio: '612/792',
                  backgroundColor: uploadedFile ? 'white' : '#f3f4f6'
                }}
              />
              
              {!uploadedFile && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-semibold mb-2">📁 Upload a PDF first</p>
                    <p className="text-sm">Canvas will be active after PDF upload</p>
                  </div>
                </div>
              )}
              
              {isAddingField && uploadedFile && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded shadow-lg pointer-events-none">
                  📍 Click to place "{selectedFieldName}"
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center text-gray-300 text-sm">
              <p>📐 Canvas represents standard 8.5" × 11" page (612 × 792 points)</p>
              {uploadedFile && (
                <p className="text-green-300">✅ Click anywhere on the white canvas to map field coordinates</p>
              )}
            </div>
          </div>
        </div>

        {/* CSV Template Display */}
        {generatedCSV && (
          <div className="mt-6 bg-gray-700 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">📋 Generated CSV Template</h3>
              <div className="space-x-2">
                <button
                  onClick={copyCSVToClipboard}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  📋 Copy CSV
                </button>
                <button
                  onClick={generateCSVTemplate}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  🔄 Refresh CSV
                </button>
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {generatedCSV}
              </pre>
            </div>
            
            <p className="text-gray-300 text-sm mt-2">
              ✅ Field names are used as values for debugging. Replace with actual data for batch processing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFCoordinateMapper;