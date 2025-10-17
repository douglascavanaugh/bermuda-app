"use client";

import { useState, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';

function UniversalBatchProcessor() {
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [inputData, setInputData] = useState('');
  const [dataFormat, setDataFormat] = useState('text'); // 'text' or 'csv'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  // Mock template loading (in real app, this would load from form-schemas folder)
  useEffect(() => {
    const mockTemplates = [
      {
        id: 'sf24_23a',
        name: 'GSA SF24-23A Form',
        formType: 'SF24_23A',
        description: 'Standard GSA form with 6 manual fields',
        fieldCount: 6
      },
      {
        id: 'hawaii',
        name: 'Hawaii Investigation Form',
        formType: 'HAWAII',
        description: 'Comprehensive investigation form',
        fieldCount: 40
      },
      {
        id: 'bermuda',
        name: 'Bermuda Basic Form',
        formType: 'BERMUDA',
        description: 'Simple 5-field form',
        fieldCount: 5
      }
    ];
    setAvailableTemplates(mockTemplates);
  }, []);

  // Auto-detect template from data
  const detectTemplate = (data) => {
    const firstLine = data.split('\n')[0].toLowerCase();
    console.log('🔍 Template detection - First line:', firstLine);
    
    // Look for template indicators
    if (firstLine.includes('sf24') || firstLine.includes('gsa')) {
      console.log('✅ Detected SF24/GSA template');
      return availableTemplates.find(t => t.id === 'sf24_23a');
    }
    if (firstLine.includes('hawaii')) {
      console.log('✅ Detected Hawaii template');
      return availableTemplates.find(t => t.id === 'hawaii');
    }
    if (firstLine.includes('bermuda')) {
      console.log('✅ Detected Bermuda template');
      return availableTemplates.find(t => t.id === 'bermuda');
    }
    
    // Default detection based on data structure
    const lines = data.split('\n').filter(line => line.trim());
    console.log('📊 Line count for structure detection:', lines.length);
    
    if (lines.length >= 35) {
      console.log('✅ Detected Hawaii template (by line count)');
      return availableTemplates.find(t => t.id === 'hawaii');
    } else if (lines.length <= 10) {
      console.log('✅ Detected Bermuda template (by line count)');
      return availableTemplates.find(t => t.id === 'bermuda');
    }
    
    console.log('✅ Defaulting to SF24 template');
    return availableTemplates.find(t => t.id === 'sf24_23a'); // Default to GSA
  };

  // Parse CSV line properly handling quoted fields
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, '')); // Add last field
    return result;
  };

  // Auto-detect data format (CSV vs Text)
  const detectDataFormat = (data) => {
    const lines = data.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return 'text';
    
    // Skip FORM_TYPE indicator if present
    let checkLine = lines[0].includes('FORM_TYPE:') ? lines[1] : lines[0];
    
    // CSV detection: has commas and looks like headers
    const hasCommas = checkLine.includes(',');
    const commaCount = (checkLine.match(/,/g) || []).length;
    
    // If has 3+ commas and looks like headers, it's CSV
    if (hasCommas && commaCount >= 3) {
      const possibleHeaders = checkLine.toLowerCase();
      const csvKeywords = ['name', 'first', 'last', 'address', 'email', 'phone', 'ssn', 'date'];
      const hasHeaderKeywords = csvKeywords.some(keyword => possibleHeaders.includes(keyword));
      
      if (hasHeaderKeywords) {
        return 'csv';
      }
    }
    
    return 'text';
  };

  // Parse input data with auto-detected format
  const parseInputData = (data, format = null) => {
    // Auto-detect format if not provided
    const detectedFormat = format || detectDataFormat(data);
    console.log('🔍 Parsing input data:', { detectedFormat, dataLength: data.length });
    
    if (detectedFormat === 'csv') {
      const lines = data.split(/\r?\n/).filter(line => line.trim());
      console.log('📝 CSV Lines found:', lines.length);
      
      // Skip form type indicator if present
      let startIndex = 0;
      if (lines[0] && lines[0].includes('FORM_TYPE:')) {
        startIndex = 1;
        console.log('✅ Found FORM_TYPE indicator, skipping first line');
      }
      
      if (lines.length < startIndex + 2) return [];
      
      // Parse CSV headers properly handling quoted fields
      const headers = parseCSVLine(lines[startIndex]);
      
      // Create field mapping for different form types (PERFECT WORKING SCHEMA MATCH)
      const fieldMapping = {
        // SF24-23A Bid Bond form fields (EXACT WORKING SCHEMA FIELD NAMES - NO MAPPING NEEDED!)
        'principal_name_address': 'principal_name_address',
        'state_of_incorporation': 'state_of_incorporation', 
        'surety_name_address': 'surety_name_address',
        'org_corporation': 'org_corporation',
        'percent_of_bid_price': 'percent_of_bid_price',
        'amount_millions': 'penal_sum_millions',
        'amount_thousands': 'penal_sum_thousands', 
        'amount_hundreds': 'penal_sum_hundreds',
        'amount_cents': 'penal_sum_cents',
        'bid_date': 'bid_date',
        'invitation_number': 'invitation_number',
        'for_construction_supplies_services': 'for_construction_of',
        'principal_name_title_1': 'principal_name_title_1',
        'surety_a_name_address': 'corporate_surety_name',
        'surety_a_state_incorporation': 'corporate_surety_state',
        'surety_a_liability_limit': 'liability_limit',
        'surety_a_name_title_1': 'corporate_surety_name_title',
        'maximum_dollar_limitation': 'liability_limit',
        
        // Legacy mappings for backward compatibility
        'principal': 'principal_name',
        'surety company': 'surety_name',
        'suretycompany': 'surety_name',
        'state': 'state_of_incorporation',
        'bid date': 'bid_date',
        'biddate': 'bid_date',
        'invitation no': 'invitation_number',
        'invitationno': 'invitation_number',
        'percent bid': 'percent_of_bid_price',
        'percentbid': 'percent_of_bid_price',
        'date bond expires': 'datebondex',
        'datebondexpires': 'datebondex',
        'datebondex': 'datebondex',
        'project description': 'for_construction_of',
        'projectdescription': 'for_construction_of',
        
        // Legacy personnel form fields (fallback)
        'first name': 'firstname',
        'firstname': 'firstname',
        'last name': 'lastname', 
        'lastname': 'lastname',
        'date of birth': 'dateofbirth',
        'dateofbirth': 'dateofbirth',
        'ssn': 'ssn',
        'address': 'address',
        'city': 'city',
        'zip': 'zip',
        'phone': 'phone',
        'email': 'email',
        'position': 'position',
        'department': 'department',
        'supervisor': 'supervisor',
        'start date': 'startdate',
        'startdate': 'startdate',
        'security clearance': 'securityclearance',
        'securityclearance': 'securityclearance'
      };
      
      console.log('📋 Headers found:', headers);
      
      const entries = lines.slice(startIndex + 1).filter(line => line.trim()).map((line, index) => {
        const values = parseCSVLine(line);
        const entry = { id: index + 1 };
        
        headers.forEach((header, i) => {
          const normalizedHeader = header.toLowerCase().trim();
          const fieldName = fieldMapping[normalizedHeader] || normalizedHeader.replace(/\s+/g, '');
          entry[fieldName] = values[i] || '';
        });
        
        return entry;
      });
      
      console.log('✅ Parsed entries:', entries.length, 'First entry:', entries[0]);
      return entries;
    } else {
      // Text format - split by double newlines for multiple entries
      let cleanData = data;
      
      // Remove form type indicator if present
      if (cleanData.includes('FORM_TYPE:')) {
        cleanData = cleanData.replace(/FORM_TYPE:.*?\n\n/, '');
      }
      
      const entries = cleanData.split(/\n\n/).filter(entry => entry.trim());
      
      console.log('📝 Text entries found:', entries.length);
      
      return entries.map((entry, index) => {
        const lines = entry.split(/\r?\n/).filter(line => line.trim());
        
        // GSA Form text format parsing (13 lines per entry)
        // Line 0: Full Name, Line 1: DOB, Line 2: SSN, Line 3: Address, 
        // Line 4: City/State/ZIP, Line 5: Phone, Line 6: Email, Line 7: Position,
        // Line 8: Department, Line 9: Supervisor, Line 10: Start Date, Line 11: Security Clearance
        
        const parsedEntry = {
          id: index + 1,
          rawLines: lines,
        };
        
        if (lines.length >= 8) {
          // Parse SF24-23A Bid Bond format (8 lines per entry)
          // Line 0: Principal, Line 1: Surety Company, Line 2: State, Line 3: Bid Date
          // Line 4: Invitation No, Line 5: Percent Bid, Line 6: Date Bond Expires, Line 7: Project Description
          
          parsedEntry.principal = lines[0] || '';
          parsedEntry.surety = lines[1] || '';
          parsedEntry.state = lines[2] || '';
          parsedEntry.biddate = lines[3] || '';
          parsedEntry.invitationno = lines[4] || '';
          parsedEntry.percentbid = lines[5] || '';
          parsedEntry.datebondex = lines[6] || '';
          parsedEntry.projectdescription = lines[7] || '';
          
          // Also set fallback fields for compatibility
          parsedEntry.name = parsedEntry.principal;
          parsedEntry.company = parsedEntry.principal;
          parsedEntry.date = parsedEntry.biddate;
        } else if (lines.length >= 12) {
          // Legacy personnel format (12+ lines)
          const fullName = lines[0] || '';
          const nameParts = fullName.split(' ');
          
          parsedEntry.firstname = nameParts[0] || '';
          parsedEntry.lastname = nameParts.slice(1).join(' ') || '';
          parsedEntry.name = fullName;
          parsedEntry.dateofbirth = lines[1] || '';
          parsedEntry.ssn = lines[2] || '';
          parsedEntry.address = lines[3] || '';
          
          // Parse city, state, zip from line 4
          const cityStateZip = lines[4] || '';
          const cityStateZipMatch = cityStateZip.match(/^(.*?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
          if (cityStateZipMatch) {
            parsedEntry.city = cityStateZipMatch[1];
            parsedEntry.state = cityStateZipMatch[2];
            parsedEntry.zip = cityStateZipMatch[3];
          } else {
            parsedEntry.city = cityStateZip;
            parsedEntry.state = '';
            parsedEntry.zip = '';
          }
          
          parsedEntry.phone = lines[5] || '';
          parsedEntry.email = lines[6] || '';
          parsedEntry.position = lines[7] || '';
          parsedEntry.department = lines[8] || '';
          parsedEntry.supervisor = lines[9] || '';
          parsedEntry.startdate = lines[10] || '';
          parsedEntry.securityclearance = lines[11] || '';
        } else {
          // Fallback for shorter entries
          parsedEntry.name = lines[0] || '';
          parsedEntry.firstname = lines[0]?.split(' ')[0] || '';
          parsedEntry.lastname = lines[0]?.split(' ').slice(1).join(' ') || '';
          parsedEntry.address = lines[1] || '';
          parsedEntry.city = lines[2] || '';
        }
        
        return parsedEntry;
      });
      
      console.log('✅ Parsed text entries:', entries.length, 'First entry:', entries[0]);
      return entries;
    }
  };

  // Load JSON schema for template
  const loadTemplateSchema = async (templateId) => {
    // Check if smart calibrated schema is available
    const smartCalibratedSchema = localStorage.getItem('smartCalibratedSchema');
    const calibrationApplied = localStorage.getItem('calibrationApplied');
    
    if (smartCalibratedSchema && calibrationApplied === 'true') {
      console.log('🤖 Using smart calibrated schema from localStorage');
      const schema = JSON.parse(smartCalibratedSchema);
      
      // Clear the flag so it doesn't persist forever
      localStorage.removeItem('calibrationApplied');
      
      return schema;
    }
    
    // Try schemas in priority order (WORKING schemas get highest priority!)
    const schemaFiles = [
      `${templateId}_schema.json`,                    // WORKING detected (HIGHEST PRIORITY!)
      `${templateId}_smart_calibrated_schema.json`,   // Smart calibrated
      `${templateId}_1_1_manual_schema.json`,         // Latest manual with padding detection
      `${templateId}_1_manual_schema.json`,           // Previous manual version
      `${templateId}_manual_schema.json`,             // Generic manual
      `${templateId}_auto_schema.json`                // Auto-generated fallback
    ];
    
    console.log('🔍 Looking for schemas for template:', templateId);
    console.log('📂 Will try these files:', schemaFiles);
    
    for (const schemaFile of schemaFiles) {
      try {
        const url = `/docs/pdf-templates/${schemaFile}`;
        console.log('🔗 Trying to fetch:', url);
        const response = await fetch(url);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (response.ok) {
          const schema = await response.json();
          console.log('✅ Loaded template schema:', schema.name, `(${schema.detectedFieldCount} fields)`, `from ${schemaFile}`);
          console.log('📊 Schema fields:', schema.fields.map(f => f.name));
          return schema;
        }
      } catch (error) {
        console.warn(`❌ Could not load ${schemaFile}:`, error);
      }
    }
    
    console.error('❌ No schema found for template:', templateId);
    console.log('📂 Available schemas should be in /docs/pdf-templates/');
    return null;
  };

  // Generate PDF for single entry using Python API (PERFECT SOLUTION!)
  const generatePDFForEntry = async (entry, template, templateSchema = null) => {
    try {
      console.log('🐍 Generating PDF via Python API:', entry);
      console.log('📋 Template:', template.id);
      
      // Call the Python API for perfect PDF generation
      const response = await fetch('https://bermuda-app.onrender.com/api/process-gsa-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_data: entry,
          template_type: template.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python API error: ${response.status} ${errorText}`);
      }

      const pdfBlob = await response.blob();
      console.log('✅ PDF generated successfully via Python API:', pdfBlob.size, 'bytes');
      
      return {
        success: true,
        pdfBlob: pdfBlob,
        filename: `${template.id}_entry_${Date.now()}.pdf`,
        size: pdfBlob.size
      };
    } catch (error) {
      console.error('❌ Python API error:', error);
      return {
        success: false,
        error: error.message,
        filename: `${template.id}_entry_error.pdf`
      };
    }
  };


  // Process batch of entries
  const processBatch = async () => {
    if (!selectedTemplate) {
      setMessage('Please select a template first');
      return;
    }

    if (!inputData.trim()) {
      setMessage('Please provide input data');
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setMessage('Processing batch...');

    try {
      // Parse input data
      const entries = parseInputData(inputData); // Format auto-detected
      setProcessingProgress({ current: 0, total: entries.length });

      const batchResults = [];

      // Process each entry
      for (let i = 0; i < entries.length; i++) {
        setProcessingProgress({ current: i + 1, total: entries.length });
        setMessage(`Processing entry ${i + 1} of ${entries.length}...`);

        const result = await generatePDFForEntry(entries[i], selectedTemplate, null);
        batchResults.push(result);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults(batchResults);
      const successCount = batchResults.filter(r => r.success).length;
      setMessage(`Batch processing complete! ${successCount}/${entries.length} PDFs generated successfully.`);

    } catch (error) {
      setMessage(`Batch processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save PDFs to processed-pdfs folder
  const savePDFsToFolder = async () => {
    const successResults = results.filter(r => r.success);
    
    if (successResults.length === 0) {
      setMessage('No successful PDFs to save');
      return;
    }
    
    setMessage(`Saving ${successResults.length} PDFs to processed-pdfs/${selectedTemplate.formType.toLowerCase()} folder...`);
    
    try {
      // Prepare PDFs for server
      const pdfsToSave = await Promise.all(successResults.map(async (result) => ({
        filename: result.filename,
        bytes: Array.from(new Uint8Array(await result.pdfBlob.arrayBuffer())) // Convert blob to bytes array
      })));
      
      const batchId = Date.now(); // Simple batch ID
      
      const response = await fetch('/api/save-batch-pdfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfs: pdfsToSave,
          formType: selectedTemplate.formType,
          batchId: batchId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ ${result.saved} PDFs saved to processed-pdfs/${selectedTemplate.formType.toLowerCase()}/ folder! 📁 Batch ID: ${batchId} 📊 Total Size: ${result.totalSize} 🚀 Ready for bulk email delivery!`);
      } else {
        throw new Error('Failed to save PDFs to server');
      }
    } catch (error) {
      setMessage(`Failed to save PDFs: ${error.message}`);
    }
  };

  // Download all PDFs as individual files
  const downloadAllPDFs = () => {
    const successResults = results.filter(r => r.success);
    
    if (successResults.length === 0) {
      setMessage('No PDFs to download');
      return;
    }

    successResults.forEach((result, index) => {
      setTimeout(() => {
        // Use the pdfBlob directly from Python API response
        const blob = result.pdfBlob;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 200); // Stagger downloads
    });
  };

  // Handle data input change and auto-detect template + format
  const handleDataChange = (value) => {
    setInputData(value);
    
    if (value.trim()) {
      // Auto-detect format
      const detectedFormat = detectDataFormat(value);
      setDataFormat(detectedFormat);
      
      // Auto-detect template if not already selected
      if (!selectedTemplate) {
        const detected = detectTemplate(value);
        if (detected) {
          setSelectedTemplate(detected);
          setMessage(`🤖 Auto-detected: ${detected.name} (${detectedFormat.toUpperCase()} format)`);
        }
      } else {
        setMessage(`📊 Format detected: ${detectedFormat.toUpperCase()}`);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        UNIVERSAL BATCH PROCESSOR 🚀⚡
      </h2>
      <p className="text-center text-gray-300 mb-8">
        Process ANY form type with THOUSANDS of entries!
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Auto-Detected Template Display */}
          {selectedTemplate ? (
            <div className="bg-green-800 p-4 rounded border border-green-600">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-green-100">🤖 Auto-Detected Template:</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-3 py-1 bg-green-700 hover:bg-green-600 text-green-100 rounded text-sm transition-colors"
                >
                  Change
                </button>
              </div>
              <div className="text-green-200">
                <div className="font-semibold text-lg">{selectedTemplate.name}</div>
                <div className="text-sm">{selectedTemplate.description} ({selectedTemplate.fieldCount} fields)</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg font-bold text-white mb-4">1. Select Template:</h3>
              <div className="space-y-2">
                {availableTemplates.map(template => (
                  <label key={template.id} className="flex items-center space-x-3 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate?.id === template.id}
                      onChange={() => setSelectedTemplate(template)}
                      className="form-radio text-blue-500"
                    />
                    <div>
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-sm text-gray-400">{template.description} ({template.fieldCount} fields)</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-3 p-2 bg-blue-900 rounded text-blue-200 text-sm">
                💡 <strong>Tip:</strong> Add "FORM_TYPE: SF24_23A" to your data for automatic template detection!
              </div>
            </div>
          )}

          {/* Auto-Detected Format Display */}
          {inputData.trim() && (
            <div className="bg-blue-800 p-4 rounded border border-blue-600">
              <div className="flex items-center space-x-2">
                <span className="text-blue-100 font-medium">📊 Auto-Detected Format:</span>
                <span className="text-blue-200 font-semibold text-lg">{dataFormat.toUpperCase()}</span>
                <span className="text-blue-300 text-sm">
                  {dataFormat === 'csv' ? '(Comma-separated values)' : '(Line-by-line text)'}
                </span>
              </div>
            </div>
          )}

          {/* Data Input */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">{selectedTemplate ? '1.' : '2.'} Input Data:</h3>
            <textarea
              value={inputData}
              onChange={(e) => handleDataChange(e.target.value)}
              placeholder={dataFormat === 'csv' 
                ? "Paste CSV data with headers..." 
                : "Paste text data (line by line)..."}
              className="w-full h-64 p-3 border border-gray-600 rounded-md bg-gray-800 text-white resize-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Process Button */}
          <button
            onClick={processBatch}
            disabled={!selectedTemplate || !inputData.trim() || isProcessing}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Process Batch 🚀'}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-bold text-white mb-4">Status:</h3>
            <p className="text-gray-300">{message}</p>
            
            {isProcessing && processingProgress.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{processingProgress.current}/{processingProgress.total}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gray-700 p-4 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Results:</h3>
                <div className="space-x-2">
                  <button
                    onClick={savePDFsToFolder}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    Save to processed-pdfs/ 📁
                  </button>
                  <button
                    onClick={downloadAllPDFs}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                  >
                    Download All PDFs
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className={`p-2 rounded text-sm ${result.success ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                    {result.success ? '✅' : '❌'} {result.filename}
                    {result.error && <div className="text-xs mt-1 opacity-75">Error: {result.error}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversalBatchProcessor;
