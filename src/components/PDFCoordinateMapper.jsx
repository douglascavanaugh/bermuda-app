"use client";

import { useState, useRef } from 'react';

function PDFCoordinateMapper() {
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scale, setScale] = useState(1.0);
  const [fieldMappings, setFieldMappings] = useState([]);
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);
  const [message, setMessage] = useState('Upload a PDF or image file to start mapping coordinates');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);

  // Actual GSA SF24-23A Bid Bond form fields
  const commonFields = [
    // Basic Information
    'principal_name_address',
    'state_of_incorporation',
    'surety_name_address',
    
    // Organization Type (checkboxes)
    'org_individual', 'org_partnership', 'org_joint_venture', 'org_corporation', 'org_other',
    
    // Penal Sum
    'percent_of_bid_price',
    'amount_millions', 'amount_thousands', 'amount_hundreds', 'amount_cents',
    
    // Bid Information
    'bid_date',
    'invitation_number',
    'for_construction_supplies_services',
    
    // Principal Signatures & Names
    'principal_signature_1', 'principal_signature_2', 'principal_signature_3',
    'principal_name_title_1', 'principal_name_title_2', 'principal_name_title_3',
    
    // Individual Surety
    'individual_surety_signature_1', 'individual_surety_signature_2',
    'individual_surety_name_1', 'individual_surety_name_2',
    
    // Corporate Surety A-G
    'surety_a_name_address', 'surety_a_state_incorporation', 'surety_a_liability_limit',
    'surety_a_name_title_1', 'surety_a_name_title_2',
    
    'surety_b_name_address', 'surety_b_state_incorporation', 'surety_b_liability_limit',
    'surety_b_name_title_1', 'surety_b_name_title_2',
    
    'surety_c_name_address', 'surety_c_state_incorporation', 'surety_c_liability_limit',
    'surety_c_name_title_1', 'surety_c_name_title_2',
    
    'surety_d_name_address', 'surety_d_state_incorporation', 'surety_d_liability_limit',
    'surety_d_name_title_1', 'surety_d_name_title_2',
    
    'surety_e_name_address', 'surety_e_state_incorporation', 'surety_e_liability_limit',
    'surety_e_name_title_1', 'surety_e_name_title_2',
    
    'surety_f_name_address', 'surety_f_state_incorporation', 'surety_f_liability_limit',
    'surety_f_name_title_1', 'surety_f_name_title_2',
    
    'surety_g_name_address', 'surety_g_state_incorporation', 'surety_g_liability_limit',
    'surety_g_name_title_1', 'surety_g_name_title_2',
    
    // Instructions
    'maximum_dollar_limitation'
  ];

  // Handle file upload (multiple files for multi-page forms)
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Filter for valid files
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length === 0) {
      setMessage('Please upload PDF or image files (PNG, JPG, etc.)');
      return;
    }

    setUploadedFiles(validFiles);
    setCurrentPageIndex(0);
    
    // Load first image if it's an image file
    const firstFile = validFiles[0];
    if (firstFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(firstFile);
      setImageUrl(url);
      setMessage(`${validFiles.length} file(s) uploaded. Page 1/${validFiles.length}: ${firstFile.name}`);
    } else {
      setImageUrl(null);
      setMessage(`${validFiles.length} file(s) uploaded. Convert PDFs to images for visual mapping.`);
    }
  };

  // Handle image load
  const handleImageLoad = () => {
    setMessage('Form image loaded! Click field names to start mapping coordinates.');
  };

  // Handle image load error
  const handleImageError = () => {
    setMessage('Could not load form image. Please try a different file format.');
  };

  // Navigate between pages
  const goToPage = (pageIndex) => {
    if (pageIndex < 0 || pageIndex >= uploadedFiles.length) return;
    
    setCurrentPageIndex(pageIndex);
    const file = uploadedFiles[pageIndex];
    
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setMessage(`Page ${pageIndex + 1}/${uploadedFiles.length}: ${file.name}`);
    } else {
      setImageUrl(null);
      setMessage(`Page ${pageIndex + 1}/${uploadedFiles.length}: ${file.name} (PDF - convert to image for visual mapping)`);
    }
  };

  // Clear uploaded files
  const clearFiles = () => {
    setUploadedFiles([]);
    setCurrentPageIndex(0);
    setImageUrl(null);
    setFieldMappings([]);
    setMessage('Upload PDF or image files to start mapping coordinates');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image/area click to capture coordinates
  const handleImageClick = (event) => {
    if (!isAddingField || !selectedFieldName) return;

    const element = imageRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    
    // Get click coordinates relative to the element
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    let actualX, actualY;
    
    if (imageUrl) {
      // For images: account for potential padding/margins
      const img = element;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Calculate the actual image area (excluding padding)
      const imageAspectRatio = naturalWidth / naturalHeight;
      const displayAspectRatio = displayWidth / displayHeight;
      
      let imageDisplayWidth, imageDisplayHeight, offsetX = 0, offsetY = 0;
      
      if (imageAspectRatio > displayAspectRatio) {
        // Image is wider - will have vertical padding
        imageDisplayWidth = displayWidth;
        imageDisplayHeight = displayWidth / imageAspectRatio;
        offsetY = (displayHeight - imageDisplayHeight) / 2;
      } else {
        // Image is taller - will have horizontal padding
        imageDisplayHeight = displayHeight;
        imageDisplayWidth = displayHeight * imageAspectRatio;
        offsetX = (displayWidth - imageDisplayWidth) / 2;
      }
      
      // Adjust click coordinates to account for padding
      const adjustedX = x - offsetX;
      const adjustedY = y - offsetY;
      
      // Convert to PDF coordinates (612x792 points for 8.5x11")
      actualX = Math.round((adjustedX / imageDisplayWidth) * 612);
      actualY = Math.round(792 - (adjustedY / imageDisplayHeight) * 792);
      
      console.log(`🖼️ Image click: (${x}, ${y}) → Adjusted: (${adjustedX}, ${adjustedY}) → PDF: (${actualX}, ${actualY})`);
      console.log(`📐 Padding: X=${offsetX}, Y=${offsetY} | Display: ${imageDisplayWidth}x${imageDisplayHeight}`);
    } else {
      // For placeholder area: direct conversion
      actualX = Math.round((x / rect.width) * 612);
      actualY = Math.round(792 - (y / rect.height) * 792);
      console.log(`📄 Placeholder click: (${x}, ${y}) → PDF: (${actualX}, ${actualY})`);
    }

    // Add field mapping with page information
    const newField = {
      name: selectedFieldName,
      x: actualX,
      y: actualY,
      width: 120,
      height: 20,
      fontSize: 10,
      page: currentPageIndex + 1 // 1-based page numbering
    };

    setFieldMappings(prev => [...prev, newField]);
    setSelectedFieldName('');
    setIsAddingField(false);
    setMessage(`Added field "${selectedFieldName}" at coordinates (${actualX}, ${actualY})`);

    console.log(`Added field: ${selectedFieldName} at (${actualX}, ${actualY})`);
  };

  // Start adding a field
  const startAddingField = (fieldName) => {
    setSelectedFieldName(fieldName);
    setIsAddingField(true);
  };

  // Remove field mapping
  const removeField = (index) => {
    setFieldMappings(prev => prev.filter((_, i) => i !== index));
  };

  // Export field mappings as JSON
  const exportMappings = () => {
    const formName = uploadedFiles.length > 0 ? uploadedFiles[0].name.replace(/\.[^/.]+$/, "").replace(/-\d+$/, "") : "custom-form";
    // Generate lowercase form type and filename for consistency
    const formType = formName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = formName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
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
    link.download = `${fileName}_1_1_manual_schema.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('JSON schema exported successfully with lowercase naming!');
  };

  // No useEffect needed - react-pdf handles loading automatically

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        FORM COORDINATE MAPPER 🎯📍
      </h2>
      <p className="text-center text-gray-300 mb-8">
        Click field names, then click on the form area to map exact coordinates!
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
            <h3 className="text-lg font-bold text-white mb-4">📁 Upload Form</h3>
            
            {uploadedFiles.length === 0 ? (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full p-3 border border-gray-600 rounded-md bg-gray-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-gray-300 text-sm">
                  📄 <strong>Multi-page support!</strong> Upload multiple PNG files (page 1, page 2, etc.) for complete form mapping.
                </p>
                <p className="text-gray-300 text-xs">
                  💡 Tip: Name your files like "SF24-23a-1.png", "SF24-23a-2.png", etc.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-800 rounded border border-green-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 font-medium">📄 {uploadedFiles.length} file(s) uploaded</p>
                      <p className="text-green-200 text-sm">
                        {uploadedFiles.map(f => f.name).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={clearFiles}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Page Navigation */}
                {uploadedFiles.length > 1 && (
                  <div className="p-3 bg-blue-900 rounded border border-blue-600">
                    <p className="text-blue-100 font-medium mb-2">📄 Page Navigation:</p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => goToPage(index)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            index === currentPageIndex
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                          }`}
                        >
                          Page {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {!imageUrl && uploadedFiles[currentPageIndex]?.type === 'application/pdf' && (
                  <div className="p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200">
                    <p className="font-semibold mb-2">📋 PDF Mapping Options</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">🎯 Option 1: Visual Mapping (Recommended)</p>
                      <p className="text-sm mb-2">Convert your PDF to an image for precise visual mapping:</p>
                      <ol className="text-sm list-decimal list-inside space-y-1 mb-2">
                        <li>Go to <a href="https://pdf2png.com/" target="_blank" className="text-blue-300 underline">pdf2png.com</a></li>
                        <li>Upload your PDF and convert to PNG</li>
                        <li>Download and upload the PNG here</li>
                      </ol>
                      <p className="text-xs text-yellow-300">✅ Improved padding detection will account for image margins!</p>
                    </div>
                    
                    <div className="border-t border-yellow-600 pt-3">
                      <p className="text-sm font-semibold mb-2">📐 Option 2: Coordinate-Only Mapping</p>
                      <p className="text-sm mb-2">Map coordinates without visual preview using the placeholder area below.</p>
                      <p className="text-xs text-yellow-300">⚠️ Less precise but works directly with PDF dimensions.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Field Selection */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">🖱️ Field Mapping</h3>
            
            <p className="text-gray-300 text-sm mb-4">
              Click a field name below, then click on the PDF where that field should go.
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commonFields.map(fieldName => (
                <button
                  key={fieldName}
                  onClick={() => startAddingField(fieldName)}
                  disabled={isAddingField}
                  className={`w-full p-2 text-left rounded transition-colors ${
                    selectedFieldName === fieldName 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  } ${isAddingField ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {fieldName}
                </button>
              ))}
            </div>
            
            {isAddingField && (
              <div className="mt-4 p-3 bg-blue-900 rounded text-blue-200">
                <p className="font-semibold">📍 Click on "{selectedFieldName}" field in the PDF →</p>
                <button
                  onClick={() => setIsAddingField(false)}
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
                    <div className="font-semibold">{field.name}</div>
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

        {/* Right Columns - PDF Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-gray-700 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">PDF Viewer:</h3>
              <div className="flex items-center space-x-2">
                <label className="text-white text-sm">Scale:</label>
                <select 
                  value={scale} 
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-sm"
                >
                  <option value={0.75}>75%</option>
                  <option value={1.0}>100%</option>
                  <option value={1.25}>125%</option>
                  <option value={1.5}>150%</option>
                  <option value={2.0}>200%</option>
                </select>
              </div>
            </div>
            
            <div className="border border-gray-600 rounded overflow-auto max-h-[800px] bg-white p-4">
              {imageUrl ? (
                /* Show uploaded image */
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Uploaded form"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    onClick={handleImageClick}
                    className={`w-full max-w-full h-auto ${
                      isAddingField ? 'cursor-crosshair' : 'cursor-default'
                    }`}
                    style={{ maxHeight: '800px', objectFit: 'contain' }}
                  />
                  {isAddingField && (
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded shadow-lg">
                      📍 Click to place "{selectedFieldName}" field
                    </div>
                  )}
                </div>
              ) : (
                /* Show placeholder when no image */
                <div 
                  ref={imageRef}
                  onClick={handleImageClick}
                  className={`w-full h-[600px] border-2 border-dashed border-gray-300 flex items-center justify-center ${
                    isAddingField ? 'cursor-crosshair bg-blue-50' : 'cursor-default bg-gray-50'
                  }`}
                  style={{ aspectRatio: '8.5/11' }}
                >
                  <div className="text-center text-gray-500">
                    {uploadedFiles.length > 0 ? (
                      <>
                        <p className="text-lg font-semibold mb-2">📄 Page {currentPageIndex + 1}/{uploadedFiles.length}</p>
                        <p className="text-sm mb-2">{uploadedFiles[currentPageIndex]?.name}</p>
                        <p className="text-sm mb-4">Click anywhere to map field coordinates</p>
                        {isAddingField && (
                          <p className="text-blue-600 font-semibold">
                            📍 Click to place "{selectedFieldName}" field
                          </p>
                        )}
                        <div className="mt-4 text-xs text-gray-400">
                          <p>Standard 8.5" x 11" page (612 x 792 points)</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold mb-2">📁 Upload a Form</p>
                        <p className="text-sm mb-4">Upload a PDF or image file to start mapping</p>
                        <div className="mt-4 text-xs text-gray-400">
                          <p>Supports PDF, PNG, JPG, and other image formats</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {isAddingField && (
              <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200">
                <p className="font-semibold">🎯 Instructions:</p>
                <p className="text-sm">Click exactly where you want to place the "{selectedFieldName}" field data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFCoordinateMapper;
