"use client";

import { useState, useRef, useEffect } from 'react';

function PDFCoordinateMapper() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const schemaInputRef = useRef(null); // 🆕 For importing existing schemas
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
  const [visualFields, setVisualFields] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingFieldId, setResizingFieldId] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [importedSchemaName, setImportedSchemaName] = useState(''); // 🆕 Track imported schema
  
  // 🚀 CLEAN & SIMPLE: Back to proven React state management
  
  // 🚫 ZOOM REMOVED: Caused positioning issues, keeping it simple and bulletproof!

  // 🔥 NO MORE HARDCODED GARBAGE! We use dynamic field detection now! ✨

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
      
      // 🔥 MAGIC: Create visual field data with SMART AUTO-SIZING!
      // Only create HTML fields for detected fields (no extras!)
      const visualFieldData = fields.map((field, index) => {
        const rawName = field.originalName || field.name;
        
        // 🧹 SUPER CLEAN FIELD NAMES (MATCH MANUAL SCHEMA!)
        let cleanName = rawName
          .replace(/form\d+\[\d+\]\.?/g, '')           // Remove form1[0].
          .replace(/#subform\[\d+\]\.?/g, '')          // Remove #subform[0].
          .replace(/\[\d+\]$/g, '')                    // Remove trailing [0]
          .replace(/^\.+|\.+$/g, '')                   // Remove leading/trailing dots
          .replace(/\./g, '_')                         // Replace dots with underscores
          .toLowerCase();                              // 🔥 FORCE LOWERCASE!
        
        // 🎯 MATCH MANUAL SCHEMA NAMES (NO MORE MAPPING NEEDED!)
        const schemaNameMapping = {
          'state_of_incorporation': 'state',
          'bid_date': 'biddate',
          'percent_of_bid_price': 'percentbid', 
          'invitation_number': 'invitationno'
        };
        
        if (schemaNameMapping[cleanName]) {
          cleanName = schemaNameMapping[cleanName];
        }
        
        // If still messy, use a generic name
        if (cleanName.length < 2 || cleanName.includes('form') || cleanName.includes('subform')) {
          cleanName = `field_${index + 1}`;
        }
        
        // 🎯 SMART AUTO-SIZING based on field type and name
        let width = 120, height = 20, fieldType = 'text';
        
        const lowerName = rawName.toLowerCase();
        
        // Checkbox detection
        if (['individual', 'partnership', 'corporation', 'jointventure', 'other'].some(k => lowerName.includes(k))) {
          width = 15; height = 15; fieldType = 'checkbox';
        }
        // Long text fields
        else if (['address', 'name', 'construction', 'description'].some(k => lowerName.includes(k))) {
          width = 200; height = 20; fieldType = 'text';
        }
        // Date fields
        else if (['date', 'bid'].some(k => lowerName.includes(k))) {
          width = 100; height = 18; fieldType = 'date';
        }
        // Percentage/number fields
        else if (['percent', 'amount', 'number'].some(k => lowerName.includes(k))) {
          width = 80; height = 18; fieldType = 'number';
        }
        
        // 🧟‍♂️ ZOMBIE DEFENSE: Sanitize API field dimensions
        let apiWidth = parseFloat(field.width);
        let apiHeight = parseFloat(field.height);
        
        // If API dimensions are crazy large (zombie attack), use our smart defaults
        if (apiWidth > 500 || apiHeight > 100 || isNaN(apiWidth) || isNaN(apiHeight)) {
          apiWidth = width;
          apiHeight = height;
        }
        
        return {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
          name: rawName,
          cleanName: cleanName.replace(/\\/g, ''),  // 🔥 REMOVE BACKSLASHES!
          x: field.x || 100 + (index % 3) * 150,
          y: field.y || 700 - Math.floor(index / 3) * 30,
          width: apiWidth,  // Use sanitized width (zombie-proof!)
          height: apiHeight,  // Use sanitized height (zombie-proof!)
          page: field.page || 1,
          type: field.type || fieldType
        };
      });
      
      setVisualFields(visualFieldData);
      setMessage(`✅ Detected ${fields.length} form fields! Drag the red boxes to adjust positions.`);
      
      console.log('🎯 DETECTED FIELDS COUNT:', fields.length);
      console.log('🎯 VISUAL FIELD DATA:', visualFieldData);
      
      // 🧟‍♂️ ZOMBIE DEBUG: Check for page distribution
      const pageStats = {};
      visualFieldData.forEach(field => {
        pageStats[field.page] = (pageStats[field.page] || 0) + 1;
      });
      console.log('📄 FIELDS PER PAGE:', pageStats);
      
      // 🔥 AUTO-GENERATE CSV FROM DETECTED FIELDS (CLEAN NAMES!)
      setTimeout(() => {
        const headers = visualFieldData.map(field => field.cleanName);
        const sampleRow = visualFieldData.map(field => field.cleanName);
        const csvContent = [
          headers.join(','),
          sampleRow.map(value => `"${value}"`).join(',')
        ].join('\n');
        setGeneratedCSV(csvContent);
      }, 200);
      
      // Check for duplicates
      const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        console.warn('⚠️ DUPLICATE FIELDS FOUND:', [...new Set(duplicates)]);
      }
      
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      setMessage('❌ Failed to analyze PDF. Please try uploading again.');
      // No more hardcoded fallbacks - we're fully dynamic now!
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

  // 🔥 ADD NEW FIELD
  const addNewField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: `new_field_${visualFields.length + 1}`,
      cleanName: `new_field_${visualFields.length + 1}`,
      x: 100 + (visualFields.length % 5) * 120,
      y: 600 - Math.floor(visualFields.length / 5) * 30,
      width: 120,
      height: 20,
      page: currentPage,
      type: 'text'
    };
    
    setVisualFields(prev => [...prev, newField]);
    setMessage('✅ New field added! Drag to position it.');
    
    // Auto-update CSV
    setTimeout(() => generateCSVTemplate(), 100);
  };

  // 🔥 DELETE FIELD
  const deleteField = (fieldId) => {
    console.log(`🗑️ DELETING FIELD: ${fieldId}`);
    
    setVisualFields(prev => {
      const beforeCount = prev.length;
      const filtered = prev.filter(field => field.id !== fieldId);
      const afterCount = filtered.length;
      
      console.log(`📊 DELETE RESULT: ${beforeCount} -> ${afterCount} fields (removed ${beforeCount - afterCount})`);
      
      if (beforeCount === afterCount) {
        console.warn(`⚠️ NO FIELD DELETED! Field ID '${fieldId}' not found`);
      }
      
      return filtered;
    });
    
    setMessage('🗑️ Field deleted!');
    
    // Auto-update CSV
    setTimeout(() => generateCSVTemplate(), 100);
  };

  // 🔥 RENAME FIELD
  const renameField = (fieldId) => {
    const field = visualFields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newName = prompt(`Rename field "${field.cleanName}":`, field.cleanName);
    if (newName && newName.trim() && newName !== field.cleanName) {
      setVisualFields(prev => prev.map(f => 
        f.id === fieldId 
          ? { ...f, cleanName: newName.trim(), name: newName.trim() }
          : f
      ));
      setMessage(`✅ Field renamed to "${newName.trim()}"!`);
      
      // Auto-update CSV
      setTimeout(() => generateCSVTemplate(), 100);
    }
  };

  // Generate CSV template with field names as values (from visual fields)
  const generateCSVTemplate = () => {
    if (visualFields.length === 0) {
      setGeneratedCSV('');
      return;
    }

    // 🔥 CREATE UNIQUE HEADERS (SAME LOGIC AS FORM ANALYZER!)
    const rawHeaders = visualFields.map(field => field.cleanName.replace(/\\/g, '')); // 🔥 REMOVE BACKSLASHES!
    const uniqueHeaders = [];
    const headerCounts = {};
    
    rawHeaders.forEach(header => {
      if (headerCounts[header]) {
        headerCounts[header]++;
        uniqueHeaders.push(`${header}_${headerCounts[header]}`);
      } else {
        headerCounts[header] = 1;
        uniqueHeaders.push(header);
      }
    });
    
    // Create sample row with unique field names as values (for debugging)
    const sampleRow = uniqueHeaders.map(header => header);
    
    // Generate CSV content
    const csvContent = [
      uniqueHeaders.join(','),
      sampleRow.map(value => `"${value}"`).join(',')
    ].join('\n');
    
    setGeneratedCSV(csvContent);
    setMessage(`✅ Generated CSV template with ${uniqueHeaders.length} unique fields from visual mapping!`);
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

  // 🔥 ORIGINAL SMOOTH DRAG HANDLERS (RESTORED!)
  const handleFieldMouseDown = (e, fieldId) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDraggedFieldId(fieldId);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate offset from mouse to field center
    const field = visualFields.find(f => f.id === fieldId);
    if (!field) return;
    
    // Direct mouse to PDF coordinates
    const rawMouseX = e.clientX - canvasRect.left;
    const rawMouseY = e.clientY - canvasRect.top;
    
    // Convert to PDF coordinates
    const baseScaleX = canvasRect.width / 612;
    const baseScaleY = canvasRect.height / 792;
    const mousePdfX = rawMouseX / baseScaleX;
    const mousePdfY = (canvasRect.height - rawMouseY) / baseScaleY;
    
    // Calculate offset from mouse to field's PDF position
    const offsetX = mousePdfX - field.x;
    const offsetY = mousePdfY - field.y;
    
    const handleMouseMove = (moveEvent) => {
      // Direct coordinate calculation
      const rawMouseX = moveEvent.clientX - canvasRect.left;
      const rawMouseY = moveEvent.clientY - canvasRect.top;
      
      const mousePdfX = rawMouseX / baseScaleX;
      const mousePdfY = (canvasRect.height - rawMouseY) / baseScaleY;
      
      // Calculate new field position by subtracting the offset
      const pdfX = mousePdfX - offsetX;
      const pdfY = mousePdfY - offsetY;
      
      // Direct React state update
      setVisualFields(prev => prev.map(field => 
        field.id === fieldId 
          ? { 
              ...field, 
              x: pdfX,
              y: pdfY
            }
          : field
      ));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedFieldId(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Auto-update CSV after drag
      setTimeout(() => generateCSVTemplate(), 100);
      setMessage('✅ Field moved successfully!');
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 🔍 ZOOM CONTROL FUNCTIONS (FOR WORLD DOMINATION!)
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
    setMessage(`🔍 Zoomed in to ${Math.round((zoomLevel + 0.25) * 100)}%`);
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
    setMessage(`🔍 Zoomed out to ${Math.round((zoomLevel - 0.25) * 100)}%`);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setMessage('🎯 Zoom reset to 100%');
  };

  const fitToScreen = () => {
    setZoomLevel(0.8);
    setPanOffset({ x: 0, y: 0 });
    setMessage('📏 Fit to screen');
  };

  // Mouse wheel zoom (with passive event handling)
  const handleWheelZoom = (e) => {
    // Don't preventDefault in passive listener - just handle the zoom
    const delta = e.deltaY > 0 ? -0.05 : 0.05; // Smaller increments for smoother zoom
    setZoomLevel(prev => Math.max(0.25, Math.min(3, prev + delta)));
  };

  // 🖱️ PANNING HANDLERS (FOR PRECISE NAVIGATION!)
  const handlePanStart = (e) => {
    // 🚫 PAN DISABLED: No zoom functionality
    return;
    
    const handlePanMove = (moveEvent) => {
      setPanOffset({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };
    
    const handlePanEnd = () => {
      setIsPanning(false);
      document.removeEventListener('mousemove', handlePanMove);
      document.removeEventListener('mouseup', handlePanEnd);
    };
    
    document.addEventListener('mousemove', handlePanMove);
    document.addEventListener('mouseup', handlePanEnd);
  };

  // 📁 DRAG & DROP HANDLERS (FOR FILE UPLOADS)
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload({ target: { files: [pdfFile] } });
      setMessage('📁 PDF dropped successfully!');
    } else {
      setMessage('❌ Please drop a PDF file');
    }
  };

  // 🔥 RESIZE HANDLERS
  const handleResizeStart = (e, fieldId, handle) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizingFieldId(fieldId);
    setResizeHandle(handle);
    
    const handleMouseMove = (moveEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = 612 / rect.width;
      const scaleY = 792 / rect.height;
      
      // 🚀 SIMPLIFIED: Direct mouse position (no zoom/pan)
      const canvasMouseX = moveEvent.clientX - rect.left;
      const canvasMouseY = moveEvent.clientY - rect.top;
      const mouseX = canvasMouseX * scaleX;
      const mouseY = (rect.height - canvasMouseY) * scaleY; // Flip Y
      
      setVisualFields(prev => prev.map(field => {
        if (field.id !== fieldId) return field;
        
        let newField = { ...field };
        
        // Larger minimum sizes for better control
        const minWidth = 40;
        const minHeight = 20;
        
        // 🔥 FIXED RESIZE DIRECTIONS - NOW INTUITIVE!
        switch (handle) {
          case 'se': // 🔥 SOUTHEAST: Drag down-right to expand (CORRECT!)
            newField.width = Math.max(minWidth, mouseX - field.x);
            newField.height = Math.max(minHeight, field.y - mouseY + field.height);
            break;
          case 'sw': // 🔥 SOUTHWEST: Drag down-left to expand (CORRECT!)
            const newWidthSW = Math.max(minWidth, field.x + field.width - mouseX);
            newField.x = field.x + field.width - newWidthSW;
            newField.width = newWidthSW;
            newField.height = Math.max(minHeight, field.y - mouseY + field.height);
            break;
          case 'ne': // 🔥 NORTHEAST: Drag up-right to expand (FIXED!)
            newField.width = Math.max(minWidth, mouseX - field.x);
            const newHeightNE = Math.max(minHeight, mouseY - field.y);
            newField.y = field.y;
            newField.height = newHeightNE;
            break;
          case 'nw': // 🔥 NORTHWEST: Drag up-left to expand (FIXED!)
            const newWidthNW = Math.max(minWidth, field.x + field.width - mouseX);
            const newHeightNW = Math.max(minHeight, mouseY - field.y);
            newField.x = field.x + field.width - newWidthNW;
            newField.y = field.y;
            newField.width = newWidthNW;
            newField.height = newHeightNW;
            break;
        }
        
        // Keep within bounds
        newField.x = Math.max(0, Math.min(612 - newField.width, newField.x));
        newField.y = Math.max(0, Math.min(792 - newField.height, newField.y));
        
        return newField;
      }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingFieldId(null);
      setResizeHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      console.log(`🎯 RESIZED FIELD ${fieldId}`);
      setMessage(`✅ Field resized successfully!`);
      
      // 🔥 AUTO-UPDATE CSV WHEN FIELD IS RESIZED
      setTimeout(() => generateCSVTemplate(), 100);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Export field mappings as JSON (using visual field data)
  const exportMappings = () => {
    if (visualFields.length === 0) {
      setMessage('❌ No fields detected yet. Upload a PDF first.');
      return;
    }

    const formName = uploadedFile ? uploadedFile.name.replace('.pdf', '') : 'custom-form';
    const formType = formName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // 🔥 GENERATE SCHEMA FROM VISUAL FIELD DATA (DRAG/RESIZE POSITIONS)
    const schema = {
      formType: formType.toUpperCase(),
      name: `${formName} Visual Mapping`,
      description: `Visual field mapping schema for ${formName} (drag/resize positions)`,
      version: "1.0",
      hasFormFields: true,
      detectedFieldCount: visualFields.length,
      fields: visualFields.map(field => ({
        name: field.name,
        cleanName: field.cleanName,
        type: field.type === 'checkbox' ? "PDFCheckBox" : "PDFTextField",
        x: Math.round(field.x * 100) / 100, // Round to 2 decimal places
        y: Math.round(field.y * 100) / 100,
        width: Math.round(field.width * 100) / 100,
        height: Math.round(field.height * 100) / 100,
        fontSize: field.type === 'checkbox' ? 12 : 10,
        page: field.page,
        required: false
      }))
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

  // 🆕 IMPORT EXISTING SCHEMA - Load previously mapped fields for editing!
  const importSchema = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const schema = JSON.parse(e.target.result);
        
        if (!schema.fields || !Array.isArray(schema.fields)) {
          setMessage('❌ Invalid schema: No fields array found');
          return;
        }

        // Convert schema fields back to visualFields format
        const importedFields = schema.fields.map((field, index) => ({
          id: `imported_${index}_${Date.now()}`,
          name: field.name || `field_${index}`,
          cleanName: field.cleanName || field.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `field_${index}`,
          type: field.type === 'PDFCheckBox' ? 'checkbox' : 'text',
          x: field.x || 100,
          y: field.y || 100,
          width: field.width || 150,
          height: field.height || 20,
          page: field.page || 1
        }));

        // Merge with existing fields or replace
        setVisualFields(importedFields);
        
        // Also populate detectedFields list for the sidebar
        const fieldNames = importedFields.map(f => f.name);
        setDetectedFields(fieldNames);
        
        setImportedSchemaName(file.name);
        setMessage(`✅ Imported ${importedFields.length} fields from "${file.name}"! You can now drag/resize them.`);
        
        // Auto-generate CSV
        setTimeout(() => generateCSVTemplate(), 100);
        
      } catch (error) {
        console.error('Schema import error:', error);
        setMessage(`❌ Failed to parse schema: ${error.message}`);
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again
    if (schemaInputRef.current) {
      schemaInputRef.current.value = '';
    }
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
        PDF COORDINATE MAPPER
      </h2>
      <p className="text-center text-gray-300 mb-8">
        Upload PDF → Click fields → Export schema!
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
                
                {/* 🔥 FIELD MANAGEMENT CONTROLS */}
                {uploadedFile && (
                  <div className="p-3 bg-green-900 rounded border border-green-600">
                    <p className="text-green-100 font-medium mb-2">🛠️ Field Management:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={addNewField}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors"
                        title="Add New Field"
                      >
                        ➕ Add Field
                      </button>
                      <span className="px-2 py-1 bg-green-800 text-green-200 rounded text-sm">
                        {visualFields.filter(f => f.page === currentPage).length} fields on page {currentPage}
                      </span>
                    </div>
                    
                    {/* 🆕 IMPORT EXISTING SCHEMA */}
                    <div className="mt-3 pt-3 border-t border-green-700">
                      <p className="text-green-200 text-xs mb-2">📥 Have an existing schema? Import it to edit:</p>
                      <input
                        ref={schemaInputRef}
                        type="file"
                        accept=".json"
                        onChange={importSchema}
                        className="hidden"
                        id="schema-import"
                      />
                      <label
                        htmlFor="schema-import"
                        className="inline-block px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm cursor-pointer transition-colors"
                      >
                        📂 Import Schema JSON
                      </label>
                      {importedSchemaName && (
                        <p className="text-yellow-200 text-xs mt-1">
                          ✅ Loaded: {importedSchemaName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 🚫 ZOOM REMOVED: Keeping it simple and bulletproof for perfect field positioning! */}

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
              {detectedFields.map(fieldName => (
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
              <h3 className="text-lg font-bold text-white">Visual Field Mapping ({visualFields.length} fields):</h3>
              {visualFields.length > 0 && (
                <button
                  onClick={exportMappings}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Export Visual Schema
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
            
            <div 
              className="border border-gray-600 rounded bg-white relative"
              style={{ 
                overflow: 'auto',
                cursor: 'default',
                maxHeight: '800px'
              }}
            >
              <div
                style={{
                  transform: 'scale(1) translate(0px, 0px)',
                  transformOrigin: '0 0'
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={612}
                  height={792}
                  onClick={handleCanvasClick}
                  onDragOver={handleCanvasDragOver}
                  onDrop={handleCanvasDrop}
                  className={`w-full h-auto ${
                    isAddingField ? 'cursor-crosshair' : 'cursor-default'
                  } ${!uploadedFile ? 'opacity-50' : ''}`}
                  style={{ 
                    aspectRatio: '612/792',
                    backgroundColor: uploadedFile ? 'white' : '#f3f4f6',
                    display: 'block'
                  }}
                />
              
                {/* 🔥 ORIGINAL SMOOTH DRAG SYSTEM (RESTORED!) */}
                {visualFields
                  .filter(field => field.page === currentPage)
                  .slice(0, 50) // 🧟‍♂️ ZOMBIE PROTECTION: Limit to 50 fields per page
                  .map((field) => {
                  const canvas = canvasRef.current;
                  if (!canvas) return null;
                  
                  const rect = canvas.getBoundingClientRect();
                  const baseScaleX = rect.width / 612;
                  const baseScaleY = rect.height / 792;
                  
                  // Calculate screen positions
                  const scaleX = baseScaleX;
                  const scaleY = baseScaleY;
                  const leftPos = field.x * scaleX;
                  const topPos = (792 - field.y - field.height) * scaleY;
                
                return (
                  <div
                    key={field.id}
                    data-field-id={field.id}
                    onMouseDown={(e) => !isResizing && handleFieldMouseDown(e, field.id)}
                    className={`absolute border-2 border-red-500 bg-red-100 bg-opacity-30 cursor-move select-none hover:bg-red-200 hover:bg-opacity-50 transition-all ${
                      draggedFieldId === field.id ? 'opacity-50 scale-105' : ''
                    } ${isResizing ? 'pointer-events-none' : ''}`}
                    style={{
                      left: leftPos + 'px',
                      top: topPos + 'px',
                      width: (field.width * scaleX) + 'px',
                      height: (field.height * scaleY) + 'px',
                      fontSize: Math.max(8, field.width * scaleX / 12) + 'px',
                      color: '#dc2626',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      lineHeight: '1.1',
                      padding: '1px',
                      borderRadius: '3px',
                      zIndex: 10
                    }}
                    title={`${field.name}\nCoordinates: (${field.x.toFixed(1)}, ${field.y.toFixed(1)})\nSize: ${field.width}x${field.height}\nDrag to move!`}
                  >
                    <span className="truncate">
                      {field.cleanName.length > 12 ? field.cleanName.substring(0, 10) + '...' : field.cleanName}
                    </span>
                    
                    {/* 🔥 RESIZE HANDLES */}
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-white cursor-se-resize hover:bg-red-700"
                      onMouseDown={(e) => handleResizeStart(e, field.id, 'se')}
                      title="Drag to resize"
                      style={{ borderRadius: '50%' }}
                    />
                    <div
                      className="absolute -top-1 -left-1 w-3 h-3 bg-red-600 border border-white cursor-nw-resize hover:bg-red-700"
                      onMouseDown={(e) => handleResizeStart(e, field.id, 'nw')}
                      title="Drag to resize"
                      style={{ borderRadius: '50%' }}
                    />
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border border-white cursor-ne-resize hover:bg-red-700"
                      onMouseDown={(e) => handleResizeStart(e, field.id, 'ne')}
                      title="Drag up-right to resize"
                      style={{ borderRadius: '50%' }}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 border border-white cursor-se-resize hover:bg-red-700"
                      onMouseDown={(e) => handleResizeStart(e, field.id, 'se')}
                      title="Drag down-right to resize"
                      style={{ borderRadius: '50%' }}
                    />
                    <div
                      className="absolute -bottom-1 -left-1 w-3 h-3 bg-red-600 border border-white cursor-sw-resize hover:bg-red-700"
                      onMouseDown={(e) => handleResizeStart(e, field.id, 'sw')}
                      title="Drag down-left to resize"
                      style={{ borderRadius: '50%' }}
                    />
                    
                    {/* 🗑️ DELETE BUTTON */}
                    <div
                      className="absolute -top-2 -left-2 w-4 h-4 bg-red-800 border border-white cursor-pointer hover:bg-red-900 flex items-center justify-center text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteField(field.id);
                      }}
                      title="Delete field"
                      style={{ borderRadius: '50%' }}
                    >
                      ×
                    </div>
                    
                    {/* ✏️ RENAME BUTTON */}
                    <div
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border border-white cursor-pointer hover:bg-blue-700 flex items-center justify-center text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        renameField(field.id);
                      }}
                      title="Rename field"
                      style={{ borderRadius: '50%' }}
                    >
                      ✏
                    </div>
                  </div>
                );
              })}
              </div>
              
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
                <div className="space-y-1">
                  <p className="text-green-300">✅ Click anywhere on the white canvas to map field coordinates</p>
                  {/* 🚫 ZOOM INFO REMOVED */}
                  <p className="text-blue-300">🖱️ Drag fields to reposition • Click to add coordinates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CSV Template Display */}
        {generatedCSV && (
          <div className="mt-6 bg-gray-700 p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">📋 Generated CSV Template</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyCSVToClipboard}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  📋 Copy CSV
                </button>
                <button
                  onClick={generateCSVTemplate}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  🔄 Refresh CSV
                </button>
                <span className="px-3 py-2 bg-gray-700 text-gray-300 rounded text-sm">
                  {visualFields.length} fields total
                </span>
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