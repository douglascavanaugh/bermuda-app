"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Upload, Download, Mail, Clipboard, Package, Camera, Image as ImageIcon } from 'lucide-react';

// US State options for dropdowns
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' }
];

// Initial form state
const initialFormData = {
  // Client Information
  clientFullName: '',
  dateBondExecuted: '',
  courtCaseNumber: '',
  pastConvictionsCaseNumbers: '',
  
  // Birth & Identity
  birthCertificateNumber: '',
  stateOfBirth: '',
  dateOfBirth: '',
  uccTrustNumber: '',
  socialSecurityNumber: '',
  ssnBackNumber: '',
  
  // Third Party Information
  thirdPartyName: '',
  thirdPartyAddress: '',
  thirdPartyCity: '',
  thirdPartyState: '',
  thirdPartyZip: '',
  thirdPartyCounty: '',
  
  // Prison Information
  prisonNumber: '',
  prisonName: '',
  prisonAddress: '',
  
  // Court Information
  trialCourtName: '',
  trialCourtType: 'State',
  courtAddress: '',
  courtCity: '',
  courtState: '',
  courtZip: '',
  
  // Financial
  amountOwed: ''
};

const initialErrors = {};

// Constants for the package
const SURETY_COMPANY = {
  name: 'Depository Trust Company',
  address: '55 Water St.',
  cityStateZip: 'New York, New York [10041-0099]'
};

const GSA_REFERENCE = 'See GSA FORMS; sf 24; sf 25A; sf 28; sf 273; sf 274; sf 275 and 91.';

export default function MasterBondSheet({ isProduction = false }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  
  // OCR Scan State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrImage, setOcrImage] = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrError, setOcrError] = useState('');
  
  // Multi-paste batch state
  const [batchEntries, setBatchEntries] = useState([]);
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // 🎖️ PRODUCTION MODE: Required fields validation
  const REQUIRED_FIELDS = {
    clientFullName: 'Client Full Name is required',
    courtCaseNumber: 'Court Case # is required',
    birthCertificateNumber: 'Birth Certificate # is required',
    stateOfBirth: 'State of Birth is required',
    dateOfBirth: 'Date of Birth is required',
    uccTrustNumber: 'UCC Trust # is required',
    socialSecurityNumber: 'Social Security # is required',
    ssnBackNumber: 'SSN Back Number is required',
    thirdPartyAddress: 'Third Party Address is required',
    thirdPartyCity: 'Third Party City is required',
    thirdPartyState: 'Third Party State is required',
    thirdPartyZip: 'Third Party ZIP is required',
    thirdPartyCounty: 'County is required',
    trialCourtName: 'Trial Court Name is required',
    trialCourtType: 'Court Type (State/Federal) is required',
    courtAddress: 'Court Address is required',
    courtCity: 'Court City is required',
    courtState: 'Court State is required',
    courtZip: 'Court ZIP is required',
    amountOwed: 'Amount Owed is required',
  };

  // 🎖️ Validate all required fields (production mode)
  const validateRequiredFields = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(REQUIRED_FIELDS).forEach(field => {
      const value = formData[field];
      if (!value || value.toString().trim() === '') {
        newErrors[field] = REQUIRED_FIELDS[field];
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Field mapping for numbered paste format (matches Master Bond Sheet order)
  // 🎖️ UPDATED: County is now separate line 13, all fields shifted
  const PASTE_FIELD_MAP = [
    'clientFullName',           // 1
    'dateBondExecuted',         // 2  ⚠️ REQUIRED
    'courtCaseNumber',          // 3
    'pastConvictionsCaseNumbers', // 4
    'birthCertificateNumber',   // 5
    'stateOfBirth',             // 6
    'dateOfBirth',              // 7
    'uccTrustNumber',           // 8
    'socialSecurityNumber',     // 9
    'ssnBackNumber',            // 10
    'thirdPartyName',           // 11
    'thirdPartyAddress',        // 12 (Address, City, ST [ZIP] - NO county)
    'thirdPartyCounty',         // 13 (County on its own line - NEW!)
    'prisonNumber',             // 14
    'prisonName',               // 15
    'prisonAddress',            // 16
    'trialCourtName',           // 17
    'trialCourtType',           // 18 (S=State, F=Federal)
    'courtAddress',             // 19 (full address of court)
    'amountOwed'                // 20
  ];

  // Parse numbered paste data
  const parsePastedData = (text) => {
    const lines = text.split('\n');
    const parsedData = { ...initialFormData };
    let currentFieldIndex = 0;
    
    for (let i = 0; i < lines.length && currentFieldIndex < PASTE_FIELD_MAP.length; i++) {
      let line = lines[i].trim();
      
      // Check if line starts with a number (e.g., "1.", "2.", etc.)
      const numberedMatch = line.match(/^(\d+)\.\s*(.*)/);
      if (numberedMatch) {
        const fieldNum = parseInt(numberedMatch[1]) - 1;
        const value = numberedMatch[2].trim();
        
        if (fieldNum >= 0 && fieldNum < PASTE_FIELD_MAP.length) {
          currentFieldIndex = fieldNum;
          const fieldName = PASTE_FIELD_MAP[fieldNum];
          
          // Handle special field parsing
          if (fieldName === 'thirdPartyAddress' && value) {
            // 🎖️ NEW FORMAT: "PO Box 319, Temple Hills, MD [20757]" (NO county - county is line 13)
            // Also handles: "341 Furnace Dock Rd. Unit 11, Cortlandt Manor, NY [10567]"
            // Also handles: ZIP with or without brackets, with or without extension
            // 🎖️ FIXED: Capture brackets if present
            const addressMatch = value.match(/^([^,]+),\s*([^,]+),\s*([A-Za-z]{2})\s*(\[?[\d-]+\]?)/i);
            if (addressMatch) {
              parsedData.thirdPartyAddress = addressMatch[1].trim();
              parsedData.thirdPartyCity = addressMatch[2].trim();
              parsedData.thirdPartyState = addressMatch[3].toUpperCase().trim();
              // 🎖️ Keep brackets if they were provided
              parsedData.thirdPartyZip = addressMatch[4]?.trim() || '';
              console.log('📍 Parsed address:', { 
                address: parsedData.thirdPartyAddress, 
                city: parsedData.thirdPartyCity, 
                state: parsedData.thirdPartyState,
                zip: parsedData.thirdPartyZip
              });
            } else {
              console.warn('⚠️ Could not parse address format:', value);
              parsedData.thirdPartyAddress = value;
            }
          } else if (fieldName === 'thirdPartyCounty' && value) {
            // 🎖️ County is now its own line - clean up the value
            parsedData.thirdPartyCounty = value.replace(/['']s\s*County/i, '').replace(/County/i, '').trim();
            console.log('📍 Parsed county:', parsedData.thirdPartyCounty);
          } else if (fieldName === 'courtAddress' && value) {
            // Parse: "PO BOX 1423, Charlotte, NC [28201-1423]"
            // 🎖️ Updated to capture ZIP with brackets
            const courtMatch = value.match(/^([^,]+),\s*([^,]+),\s*([A-Za-z]{2})\s*(\[?[\d-]+\]?)?/i);
            if (courtMatch) {
              parsedData.courtAddress = courtMatch[1].trim();
              parsedData.courtCity = courtMatch[2].trim();
              parsedData.courtState = courtMatch[3].toUpperCase().trim();
              parsedData.courtZip = courtMatch[4]?.trim() || '';
            } else {
              parsedData.courtAddress = value;
            }
          } else if (fieldName === 'dateOfBirth' && value) {
            // Convert MM/DD/YYYY to YYYY-MM-DD for date input
            const dateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (dateMatch) {
              const [, month, day, year] = dateMatch;
              parsedData.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
              parsedData.dateOfBirth = value;
            }
          } else if (fieldName === 'trialCourtType' && value) {
            // Parse S/F/State/Federal/1/2 for court type
            const lowerVal = value.toLowerCase().trim();
            if (lowerVal === 's' || lowerVal === 'state' || lowerVal === '1') {
              parsedData.trialCourtType = 'State';
            } else if (lowerVal === 'f' || lowerVal === 'federal' || lowerVal === '2') {
              parsedData.trialCourtType = 'Federal';
            } else {
              parsedData.trialCourtType = 'State'; // Default to State
            }
          } else if (fieldName === 'amountOwed' && value) {
            // Clean amount (remove $ and commas for storage, but keep for display)
            parsedData.amountOwed = value.replace(/[$,]/g, '');
          } else if (fieldName) {
            parsedData[fieldName] = value;
          }
        }
      }
    }
    
    return parsedData;
  };

  // Handle paste data submission - supports single OR multiple entries separated by ---
  const handlePasteSubmit = () => {
    if (!pasteData.trim()) {
      setSuccessMessage('❌ Error: No data to paste');
      return;
    }
    
    // 🎖️ AUTO-FILL: If Date Bond Executed is empty, set to "Open"
    const autoFillDefaults = (entry) => {
      if (!entry.dateBondExecuted || entry.dateBondExecuted.trim() === '') {
        entry.dateBondExecuted = 'Open';
      }
      return entry;
    };
    
    // Check for multiple entries (separated by ---)
    const entries = pasteData.split(/\n---+\n/).filter(e => e.trim());
    
    if (entries.length > 1) {
      // Multiple entries - parse all and show batch preview
      const parsedEntries = entries.map((entry, index) => {
        const parsed = parsePastedData(entry);
        // 🎖️ Auto-fill defaults (e.g., "Open" for empty dates)
        autoFillDefaults(parsed);
        return {
          id: index + 1,
          data: parsed,
          clientName: parsed.clientFullName || `Entry ${index + 1}`,
          status: 'pending'
        };
      });
      
      setBatchEntries(parsedEntries);
      setShowPasteModal(false);
      setShowBatchPreview(true);
      setPasteData('');
      setSuccessMessage(`✅ Found ${parsedEntries.length} entries! Review and generate all packages.`);
    } else {
      // Single entry - fill the form as usual
      const parsed = parsePastedData(pasteData);
      // 🎖️ Auto-fill defaults (e.g., "Open" for empty dates)
      autoFillDefaults(parsed);
      
      setFormData(parsed);
      setShowPasteModal(false);
      setPasteData('');
      setSuccessMessage('✅ Data pasted successfully! Review and edit as needed.');
    }
  };

  // Generate all batch packages
  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    setBatchProgress({ current: 0, total: batchEntries.length });
    
    const results = [];
    
    for (let i = 0; i < batchEntries.length; i++) {
      const entry = batchEntries[i];
      setBatchProgress({ current: i + 1, total: batchEntries.length });
      
      // Update entry status
      setBatchEntries(prev => prev.map((e, idx) => 
        idx === i ? { ...e, status: 'generating' } : e
      ));
      
      try {
        const packageData = buildPackageData(entry.data);
        
        const response = await fetch('/api/generate-bond-package', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            masterData: entry.data,
            packageData: packageData,
            forms: ['SF24', 'SF25', 'SF28', 'SF1418', 'SF273', 'SF274', 'SF275', 'OF91']
          })
        });
        
        if (!response.ok) throw new Error(`Failed for ${entry.clientName}`);
        
        const blob = await response.blob();
        results.push({ name: entry.clientName, blob, success: true });
        
        // Update entry status to complete
        setBatchEntries(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: 'complete' } : e
        ));
        
        // 🎖️ MILITARY GRADE: Add delay between packages to prevent race conditions
        if (i < batchEntries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        
      } catch (error) {
        console.error(`Error generating package for ${entry.clientName}:`, error);
        results.push({ name: entry.clientName, error: error.message, success: false });
        
        setBatchEntries(prev => prev.map((e, idx) => 
          idx === i ? { ...e, status: 'error' } : e
        ));
      }
    }
    
    // Download all successful PDFs
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 1) {
      // Single file - download directly
      const { name, blob } = successfulResults[0];
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Completed_Package_${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else if (successfulResults.length > 1) {
      // Multiple files - download each with a slight delay
      for (let i = 0; i < successfulResults.length; i++) {
        const { name, blob } = successfulResults[i];
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Completed_Package_${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        
        // Stagger downloads slightly
        setTimeout(() => {
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, i * 500);
      }
    }
    
    const failedCount = results.filter(r => !r.success).length;
    setSuccessMessage(
      failedCount === 0 
        ? `✅ All ${successfulResults.length} packages generated successfully!`
        : `⚠️ Generated ${successfulResults.length} packages. ${failedCount} failed.`
    );
    
    setIsGenerating(false);
    setBatchProgress({ current: 0, total: 0 });
  };

  // Close batch preview and reset
  const handleCloseBatchPreview = () => {
    setShowBatchPreview(false);
    setBatchEntries([]);
  };

  // Export form data as CSV
  const handleExportCSV = () => {
    const headers = Object.keys(formData);
    const values = Object.values(formData).map(v => `"${String(v).replace(/"/g, '""')}"`);
    
    const csv = headers.join(',') + '\n' + values.join(',');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `master_bond_sheet_${formData.clientFullName?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccessMessage('✅ CSV exported successfully!');
  };

  // Send form data via email
  const handleSendEmail = () => {
    // 🎖️ PRODUCTION MODE: Validate required fields before sending
    if (isProduction) {
      const isValid = validateRequiredFields();
      if (!isValid) {
        setSuccessMessage('❌ Please fill in all required fields before sending.');
        return;
      }
    }

    const headers = Object.keys(formData);
    const values = Object.values(formData).map(v => `"${String(v).replace(/"/g, '""')}"`);
    const csv = headers.join(',') + '\n' + values.join(',');
    
    // Create mailto link with CSV in body
    const subject = encodeURIComponent(`Master Bond Sheet - ${formData.clientFullName || 'New Entry'}`);
    const body = encodeURIComponent(
      `Master Bond Sheet Data\n` +
      `========================\n\n` +
      `Client: ${formData.clientFullName}\n` +
      `Date Bond Executed: ${formData.dateBondExecuted}\n` +
      `Court Case #: ${formData.courtCaseNumber}\n` +
      `Birth Certificate #: ${formData.birthCertificateNumber}\n` +
      `State of Birth: ${formData.stateOfBirth}\n` +
      `DOB: ${formData.dateOfBirth}\n` +
      `UCC Trust #: ${formData.uccTrustNumber}\n` +
      `SSN: ${formData.socialSecurityNumber}\n` +
      `SSN Back #: ${formData.ssnBackNumber}\n` +
      `Third Party: ${formData.thirdPartyName}\n` +
      `Third Party Address: ${formData.thirdPartyAddress}, ${formData.thirdPartyCity}, ${formData.thirdPartyState} (${formData.thirdPartyCounty})\n` +
      `Prison #: ${formData.prisonNumber}\n` +
      `Prison: ${formData.prisonName}\n` +
      `Prison Address: ${formData.prisonAddress}\n` +
      `Trial Court: ${formData.trialCourtName} (${formData.trialCourtType})\n` +
      `Court Address: ${formData.courtAddress}, ${formData.courtCity}, ${formData.courtState}\n` +
      `Amount Owed: $${formData.amountOwed}\n\n` +
      `========================\n` +
      `CSV DATA (for batch processing):\n` +
      `========================\n\n` +
      csv
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setSuccessMessage('✅ Email client opened!');
  };

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Format SSN as user types (XXX-XX-XXXX)
  const handleSSNChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 9) value = value.slice(0, 9);
    
    if (value.length > 5) {
      value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    
    setFormData(prev => ({ ...prev, socialSecurityNumber: value }));
  };

  // Format currency as user types
  const handleCurrencyChange = (e) => {
    let value = e.target.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1]?.length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setFormData(prev => ({ ...prev, amountOwed: value }));
  };

  // OCR Image Upload Handler
  const handleOcrImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setOcrError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setOcrPreview(e.target.result);
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = e.target.result.split(',')[1];
      setOcrImage({ data: base64Data, mediaType: file.type });
      setOcrError('');
    };
    reader.readAsDataURL(file);
  };

  // OCR Scan Handler
  const handleOcrScan = async () => {
    if (!ocrImage) {
      setOcrError('Please upload an image first');
      return;
    }

    setIsScanning(true);
    setOcrError('');

    try {
      const response = await fetch('/api/ocr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: ocrImage.data,
          mediaType: ocrImage.mediaType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'OCR scan failed');
      }

      if (result.formData) {
        // Fill form with extracted data
        setFormData(prev => ({
          ...prev,
          ...result.formData
        }));
        setSuccessMessage('✅ Form data extracted successfully from image!');
        setShowOcrModal(false);
        setOcrImage(null);
        setOcrPreview(null);
      }

    } catch (error) {
      console.error('OCR Error:', error);
      setOcrError(error.message || 'Failed to scan image');
    } finally {
      setIsScanning(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setFormData(initialFormData);
    setErrors({});
    setSuccessMessage('');
  };

  // Handle submit - show confirmation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.clientFullName.trim()) newErrors.clientFullName = 'Required';
    if (!formData.dateBondExecuted) newErrors.dateBondExecuted = 'Required';
    if (!formData.courtCaseNumber.trim()) newErrors.courtCaseNumber = 'Required';
    if (!formData.stateOfBirth) newErrors.stateOfBirth = 'Required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setShowConfirmDialog(true);
  };

  // Generate the complete package
  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsGenerating(true);
    setSuccessMessage('');

    try {
      // Build the template data with all mappings
      const packageData = buildPackageData(formData);
      
      console.log('📦 Generating Completed Package with data:', packageData);

      // Call the API to generate all forms
      const response = await fetch('/api/generate-bond-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterData: formData,
          packageData: packageData,
          forms: ['SF24', 'SF25', 'SF28', 'SF1418', 'SF273', 'SF274', 'SF275', 'OF91']
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate package: ${response.statusText}`);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Completed_Package_${formData.clientFullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('Completed Package generated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (error) {
      console.error('Package generation error:', error);
      setSuccessMessage(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Build all the template data from master form
  const buildPackageData = (data) => {
    const suretyBlockWithName = `${data.clientFullName}\n${SURETY_COMPANY.name}\n${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`;
    const suretyBlockNoName = `${SURETY_COMPANY.name}\n${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`;
    const courtReference = `${data.trialCourtName} Attn: Clerk; ${data.courtCaseNumber}`;
    const sf28Field7 = `${data.courtCaseNumber} - ${GSA_REFERENCE}\nBirth Certificate - [${data.stateOfBirth} - ${data.birthCertificateNumber}] and Social Security - [${data.socialSecurityNumber}]; Bond Number; Non-Negotiable set off [${data.birthCertificateNumber}];\nDeposited with the United States Treasury`;
    const sf28Field8 = `${courtReference} - ${GSA_REFERENCE}`;
    const sf28Field9 = `Bid Bond issued by ${courtReference} - ${GSA_REFERENCE}`;
    const of91Claims = `${courtReference} - ${GSA_REFERENCE}`;
    // 🎖️ FIXED: Principal address uses ZIP, not County
    // 🎖️ ZIP already includes brackets if provided, so don't double-add
    const zipWithBrackets = data.thirdPartyZip.startsWith('[') ? data.thirdPartyZip : `[${data.thirdPartyZip}]`;
    const thirdPartyFullAddress = `${data.thirdPartyAddress}\n${data.thirdPartyCity}, ${data.thirdPartyState} ${zipWithBrackets}`;

    return {
      dateBondExecuted: data.dateBondExecuted,
      clientFullName: data.clientFullName,
      stateOfBirth: data.stateOfBirth,
      courtCaseNumber: data.courtCaseNumber,
      socialSecurityNumber: data.socialSecurityNumber,
      birthCertificateNumber: data.birthCertificateNumber,
      uccTrustNumber: data.uccTrustNumber,
      suretyBlockWithName,
      suretyBlockNoName,
      courtReference,
      trialCourtName: data.trialCourtName,
      trialCourtType: data.trialCourtType,
      courtFullAddress: `${data.courtAddress}, ${data.courtCity}, ${data.courtState} ${data.courtZip || ''}`.trim(),
      thirdPartyName: data.thirdPartyName,
      thirdPartyFullAddress,
      thirdPartyState: data.thirdPartyState,
      thirdPartyCounty: data.thirdPartyCounty,
      prisonNumber: data.prisonNumber,
      prisonName: data.prisonName,
      prisonAddress: data.prisonAddress,
      sf28Field7,
      sf28Field8,
      sf28Field9,
      of91Claims,
      amountOwed: data.amountOwed,
      gsaReference: GSA_REFERENCE,
      suretyCompanyName: SURETY_COMPANY.name,
      suretyCompanyAddress: `${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`
    };
  };

  // Input field styling (matching Hawaii/SPC)
  const getInputClassName = (fieldName, fullWidth = false) => `
    p-2 border rounded font-mono 
    bg-gray-800 text-gray-100 
    placeholder-gray-500
    ${fullWidth ? 'w-full' : ''}
    ${errors[fieldName] 
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
      : 'border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
    hover:bg-gray-700
  `;

  // Confirmation Dialog
  const ConfirmationDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-white font-mono-bold mb-4">Confirm Package Generation</h3>
        <p className="text-gray-200 mb-4">
          You are about to generate a Completed Package with all 8 GSA forms for:
        </p>
        <p className="text-white font-bold mb-4">{formData.clientFullName}</p>
        <p className="text-gray-300 text-sm mb-4">
          Forms: SF24, SF25, SF28, SF1418, SF273, SF274, SF275, OF91
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded font-mono hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSubmit}
            className="px-4 py-2 bg-black text-white rounded font-mono hover:bg-green-600"
          >
            Generate Package
          </button>
        </div>
      </div>
    </div>
  );

  // Batch Preview Dialog
  const BatchPreviewDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <h3 className="text-white font-mono-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Batch Package Generation
        </h3>
        
        <p className="text-gray-200 mb-4">
          Found <span className="text-green-400 font-bold">{batchEntries.length}</span> entries to process:
        </p>
        
        {/* Progress bar during generation */}
        {isGenerating && batchProgress.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>Generating packages...</span>
              <span>{batchProgress.current} / {batchProgress.total}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Scrollable entry list */}
        <div className="flex-1 overflow-y-auto mb-4 border border-gray-600 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                <th className="text-left text-gray-300 text-sm p-2">#</th>
                <th className="text-left text-gray-300 text-sm p-2">Client Name</th>
                <th className="text-left text-gray-300 text-sm p-2">Court Case #</th>
                <th className="text-left text-gray-300 text-sm p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {batchEntries.map((entry, idx) => (
                <tr key={idx} className="border-t border-gray-600 hover:bg-gray-650">
                  <td className="text-gray-400 text-sm p-2">{idx + 1}</td>
                  <td className="text-white text-sm p-2 font-mono">{entry.data.clientFullName || '—'}</td>
                  <td className="text-gray-300 text-sm p-2 font-mono">{entry.data.courtCaseNumber || '—'}</td>
                  <td className="text-sm p-2">
                    {entry.status === 'pending' && <span className="text-gray-400">Pending</span>}
                    {entry.status === 'generating' && <span className="text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Generating...</span>}
                    {entry.status === 'complete' && <span className="text-green-400">✓ Complete</span>}
                    {entry.status === 'error' && <span className="text-red-400">✗ Failed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-xs">
            Each entry generates 8 GSA forms (SF24, SF25, SF28, SF1418, SF273, SF274, SF275, OF91)
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCloseBatchPreview}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-500 text-white rounded font-mono hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBatchGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-600 text-white rounded font-mono hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Generate All ({batchEntries.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto overflow-visible">
      <div className="bg-gray-700 rounded-md shadow-lg p-6 h-full">
        <h2 className="text-xl font-mono-bold text-center text-white mb-6">
          MASTER BOND SHEET
        </h2>
        <p className="text-gray-400 text-center text-sm mb-6">
          Complete Package Generator • SF24 • SF25 • SF28 • SF1418 • SF273 • SF274 • SF275 • OF91
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className={`mb-4 p-2 rounded text-center ${
            successMessage.includes('Error') ? 'bg-red-800 text-red-200' : 'bg-gray-800 text-white'
          }`}>
            <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Client Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white text-center">1. CLIENT INFORMATION</h3>
            
            <div className="relative">
              <label className="block text-gray-300 text-sm mb-1">Client&apos;s Full Name *</label>
              <input
                type="text"
                name="clientFullName"
                value={formData.clientFullName}
                onChange={handleChange}
                placeholder="Enter full legal name"
                className={getInputClassName('clientFullName', true)}
              />
              {errors.clientFullName && (
                <div className="text-xs text-red-500 mt-1">{errors.clientFullName}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Date Bond Executed *</label>
                <input
                  type="date"
                  name="dateBondExecuted"
                  value={formData.dateBondExecuted}
                  onChange={handleChange}
                  className={`${getInputClassName('dateBondExecuted')} w-full`}
                />
                {errors.dateBondExecuted && (
                  <div className="text-xs text-red-500 mt-1">{errors.dateBondExecuted}</div>
                )}
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Court Case # *</label>
                <input
                  type="text"
                  name="courtCaseNumber"
                  value={formData.courtCaseNumber}
                  onChange={handleChange}
                  placeholder="e.g., 20 C01-2311-FS"
                  className={getInputClassName('courtCaseNumber', true)}
                />
                {errors.courtCaseNumber && (
                  <div className="text-xs text-red-500 mt-1">{errors.courtCaseNumber}</div>
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-gray-300 text-sm mb-1">Past Convictions Case Number(s)</label>
              <input
                type="text"
                name="pastConvictionsCaseNumbers"
                value={formData.pastConvictionsCaseNumbers}
                onChange={handleChange}
                placeholder="Separate multiple with commas"
                className={getInputClassName('pastConvictionsCaseNumbers', true)}
              />
            </div>
          </div>

          {/* Section 2: Birth & Identity */}
          <div className="space-y-6 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-bold text-white text-center">2. BIRTH & IDENTITY INFORMATION</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Birth Certificate #</label>
                <input
                  type="text"
                  name="birthCertificateNumber"
                  value={formData.birthCertificateNumber}
                  onChange={handleChange}
                  placeholder="e.g., 0426103"
                  className={getInputClassName('birthCertificateNumber', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">State of Birth *</label>
                <select
                  name="stateOfBirth"
                  value={formData.stateOfBirth}
                  onChange={handleChange}
                  className={getInputClassName('stateOfBirth', true)}
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.name}>{state.name}</option>
                  ))}
                </select>
                {errors.stateOfBirth && (
                  <div className="text-xs text-red-500 mt-1">{errors.stateOfBirth}</div>
                )}
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`${getInputClassName('dateOfBirth')} w-full`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">UCC Trust #</label>
                <input
                  type="text"
                  name="uccTrustNumber"
                  value={formData.uccTrustNumber}
                  onChange={handleChange}
                  placeholder="Enter UCC Trust Number"
                  className={getInputClassName('uccTrustNumber', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Social Security #</label>
                <input
                  type="text"
                  name="socialSecurityNumber"
                  value={formData.socialSecurityNumber}
                  onChange={handleSSNChange}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  className={getInputClassName('socialSecurityNumber', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1"># on Back of SS Card</label>
                <input
                  type="text"
                  name="ssnBackNumber"
                  value={formData.ssnBackNumber}
                  onChange={handleChange}
                  placeholder="Number on back"
                  className={getInputClassName('ssnBackNumber', true)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Third Party Information */}
          <div className="space-y-6 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-bold text-white text-center">3. THIRD PARTY INFORMATION</h3>
            
            <div className="relative">
              <label className="block text-gray-300 text-sm mb-1">Third Party&apos;s Name</label>
              <input
                type="text"
                name="thirdPartyName"
                value={formData.thirdPartyName}
                onChange={handleChange}
                placeholder="Enter third party name"
                className={getInputClassName('thirdPartyName', true)}
              />
            </div>

            <div className="relative">
              <label className="block text-gray-300 text-sm mb-1">Third Party&apos;s Address</label>
              <input
                type="text"
                name="thirdPartyAddress"
                value={formData.thirdPartyAddress}
                onChange={handleChange}
                placeholder="Street address"
                className={getInputClassName('thirdPartyAddress', true)}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">City</label>
                <input
                  type="text"
                  name="thirdPartyCity"
                  value={formData.thirdPartyCity}
                  onChange={handleChange}
                  placeholder="City"
                  className={getInputClassName('thirdPartyCity', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">State</label>
                <select
                  name="thirdPartyState"
                  value={formData.thirdPartyState}
                  onChange={handleChange}
                  className={getInputClassName('thirdPartyState', true)}
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="thirdPartyZip"
                  value={formData.thirdPartyZip}
                  onChange={handleChange}
                  placeholder="e.g., 10567"
                  className={getInputClassName('thirdPartyZip', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">County</label>
                <input
                  type="text"
                  name="thirdPartyCounty"
                  value={formData.thirdPartyCounty}
                  onChange={handleChange}
                  placeholder="e.g., Westchester"
                  className={getInputClassName('thirdPartyCounty', true)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Prison Information */}
          <div className="space-y-6 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-bold text-white text-center">4. PRISON INFORMATION</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Prison #</label>
                <input
                  type="text"
                  name="prisonNumber"
                  value={formData.prisonNumber}
                  onChange={handleChange}
                  placeholder="Inmate number"
                  className={getInputClassName('prisonNumber', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Prison Name</label>
                <input
                  type="text"
                  name="prisonName"
                  value={formData.prisonName}
                  onChange={handleChange}
                  placeholder="Facility name"
                  className={getInputClassName('prisonName', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Prison Address</label>
                <input
                  type="text"
                  name="prisonAddress"
                  value={formData.prisonAddress}
                  onChange={handleChange}
                  placeholder="Full address"
                  className={getInputClassName('prisonAddress', true)}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Court Information */}
          <div className="space-y-6 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-bold text-white text-center">5. TRIAL COURT INFORMATION</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Name of Trial Court</label>
                <input
                  type="text"
                  name="trialCourtName"
                  value={formData.trialCourtName}
                  onChange={handleChange}
                  placeholder="e.g., Elkhart County Circuit Court"
                  className={getInputClassName('trialCourtName', true)}
                />
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">Court Type</label>
                <div className="flex space-x-4 mt-2">
                  <label className="inline-flex items-center text-white">
                    <input
                      type="radio"
                      name="trialCourtType"
                      value="State"
                      checked={formData.trialCourtType === 'State'}
                      onChange={handleChange}
                      className="form-radio text-blue-500"
                    />
                    <span className="ml-2">State</span>
                  </label>
                  <label className="inline-flex items-center text-white">
                    <input
                      type="radio"
                      name="trialCourtType"
                      value="Federal"
                      checked={formData.trialCourtType === 'Federal'}
                      onChange={handleChange}
                      className="form-radio text-blue-500"
                    />
                    <span className="ml-2">Federal</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-gray-300 text-sm mb-1">Court Address</label>
              <input
                type="text"
                name="courtAddress"
                value={formData.courtAddress}
                onChange={handleChange}
                placeholder="Street address"
                className={getInputClassName('courtAddress', true)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">City {isProduction && <span className="text-red-400">*</span>}</label>
                <input
                  type="text"
                  name="courtCity"
                  value={formData.courtCity}
                  onChange={handleChange}
                  placeholder="City"
                  className={getInputClassName('courtCity', true)}
                />
                {errors.courtCity && <p className="text-red-400 text-xs mt-1">{errors.courtCity}</p>}
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">State {isProduction && <span className="text-red-400">*</span>}</label>
                <select
                  name="courtState"
                  value={formData.courtState}
                  onChange={handleChange}
                  className={getInputClassName('courtState', true)}
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
                {errors.courtState && <p className="text-red-400 text-xs mt-1">{errors.courtState}</p>}
              </div>
              <div className="relative">
                <label className="block text-gray-300 text-sm mb-1">ZIP Code {isProduction && <span className="text-red-400">*</span>}</label>
                <input
                  type="text"
                  name="courtZip"
                  value={formData.courtZip}
                  onChange={handleChange}
                  placeholder="e.g., [28201-1423]"
                  className={getInputClassName('courtZip', true)}
                />
                {errors.courtZip && <p className="text-red-400 text-xs mt-1">{errors.courtZip}</p>}
              </div>
            </div>
          </div>

          {/* Section 6: Financial Information */}
          <div className="space-y-6 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-bold text-white text-center">6. FINANCIAL INFORMATION</h3>
            
            <div className="relative w-1/2">
              <label className="block text-gray-300 text-sm mb-1">Amount Owed/Due</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-mono">$</span>
                <input
                  type="text"
                  name="amountOwed"
                  value={formData.amountOwed}
                  onChange={handleCurrencyChange}
                  placeholder="0.00"
                  className={`${getInputClassName('amountOwed', true)} pl-8`}
                />
              </div>
            </div>
          </div>

          {/* Surety Info Display (Read-only) */}
          <div className="space-y-4 border-t border-gray-600 pt-8">
            <h3 className="text-lg font-bold text-white text-center">SURETY COMPANY (Auto-filled on all forms)</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-gray-300 text-sm">
              <p className="text-blue-400 mb-1">{formData.clientFullName || '[Client Name]'}</p>
              <p>{SURETY_COMPANY.name}</p>
              <p>{SURETY_COMPANY.address}</p>
              <p>{SURETY_COMPANY.cityStateZip}</p>
            </div>
            <p className="text-gray-500 text-xs">
              * Client name appears on SF24 & SF1418 only. Other forms omit the client name.
            </p>
          </div>

          {/* Action Buttons Row - 🎖️ PRODUCTION: Only Clear and Send */}
          <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-gray-600">
            {/* 🎖️ DEV ONLY: Paste Data */}
            {!isProduction && (
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-3 py-2 bg-purple-600 text-white rounded font-mono hover:bg-purple-500 flex items-center gap-2 text-sm"
                title="Paste numbered data from Master Bond Sheet"
              >
                <Clipboard className="h-4 w-4" />
                Paste Data
              </button>
            )}
            {/* 🎖️ DEV ONLY: OCR Scan */}
            {!isProduction && (
              <button
                type="button"
                onClick={() => setShowOcrModal(true)}
                className="px-3 py-2 bg-cyan-600 text-white rounded font-mono hover:bg-cyan-500 flex items-center gap-2 text-sm"
                title="Scan handwritten Master Bond Sheet with AI"
              >
                <Camera className="h-4 w-4" />
                OCR Scan
              </button>
            )}
            {/* 🎖️ DEV ONLY: Export CSV */}
            {!isProduction && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 bg-blue-600 text-white rounded font-mono hover:bg-blue-500 flex items-center gap-2 text-sm"
                title="Export form data as CSV"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            )}
            {/* 🎖️ PRODUCTION + DEV: Send Form */}
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3 py-2 bg-green-600 text-white rounded font-mono hover:bg-green-500 flex items-center gap-2 text-sm"
              title="Send form data via email"
            >
              <Mail className="h-4 w-4" />
              Send Form
            </button>
            {/* 🎖️ DEV ONLY: Batch Process */}
            {!isProduction && (
              <Link
                href="/package-batch-processor"
                className="px-3 py-2 bg-orange-600 text-white rounded font-mono hover:bg-orange-500 flex items-center gap-2 text-sm"
                title="Batch process multiple Master Bond Sheets"
              >
                <Package className="h-4 w-4" />
                Batch Process
              </Link>
            )}
          </div>

          {/* Form Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            {/* 🎖️ PRODUCTION + DEV: Clear Form */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-500 text-white rounded font-mono hover:bg-gray-600 disabled:opacity-50"
            >
              Clear Form
            </button>
            {/* 🎖️ DEV ONLY: Generate Package */}
            {!isProduction && (
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-2 bg-black text-white rounded font-mono hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Completed Package'
                )}
              </button>
            )}
          </div>

        </form>

        {showConfirmDialog && <ConfirmationDialog />}
        
        {showBatchPreview && <BatchPreviewDialog />}
        
        {/* Paste Data Modal */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-white font-mono-bold mb-4 text-lg">📋 Paste Master Bond Sheet Data</h3>
              <p className="text-gray-300 text-sm mb-4">
                Paste your numbered data below. Format should be:
              </p>
              <pre className="bg-gray-800 text-gray-300 p-3 rounded text-xs mb-4 overflow-x-auto">
{`1. Client Full Name
2. Date Bond Executed (MM/DD/YYYY or leave blank → "Open")
3. Court Case #
4. Past Convictions Case #
5. Birth Certificate #
6. State of Birth
7. Date of Birth (MM/DD/YYYY)
8. UCC Trust #
9. Social Security #
10. SSN Back Number
11. Third Party Name
12. Third Party Address, City, ST [ZIP]
13. County (e.g., "Prince George's County" or just "Prince George")
14. Prison #
15. Prison Name
16. Prison Address
17. Trial Court Name
18. Court Type (S=State, F=Federal)
19. Court Address, City, ST [ZIP]
20. Amount Owed`}
              </pre>
              <p className="text-green-400 text-xs mb-2 bg-gray-800 p-2 rounded">
                💡 <strong>Multi-entry support:</strong> Paste multiple entries separated by <code className="bg-gray-900 px-1">---</code> on its own line
              </p>
              <textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder={`Paste your numbered data here (20 fields)...\n\n1. John Doe\n2. 01/15/2025 (or blank → "Open")\n3. 123456789\n...\n12. 341 Furnace Dock Rd, Cortlandt Manor, NY [10567]\n13. Westchester County\n...\n18. S (State) or F (Federal)\n19. 100 Court St, City, ST [ZIP]\n20. 50000.00\n\n---\n\n1. Jane Smith\n2.\n...\n(add more entries separated by ---)`}
                className="w-full h-64 p-3 bg-gray-800 border border-gray-600 rounded text-white font-mono text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowPasteModal(false);
                    setPasteData('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded font-mono hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="px-4 py-2 bg-purple-600 text-white rounded font-mono hover:bg-purple-500 flex items-center gap-2"
                >
                  <Clipboard className="h-4 w-4" />
                  Parse & Fill Form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OCR Scan Modal */}
        {showOcrModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-white font-mono-bold mb-4 text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                📷 OCR Scan - Handwritten Form
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Upload a photo of a handwritten Master Bond Sheet form. Claude AI will extract the data and fill the form automatically.
              </p>

              {/* Image Upload Area */}
              <div className="mb-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOcrImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-400 transition-colors">
                    {ocrPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={ocrPreview} 
                          alt="Preview" 
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <p className="text-gray-400 text-sm">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-gray-300">Click to upload image</p>
                        <p className="text-gray-500 text-sm">or drag and drop</p>
                        <p className="text-gray-500 text-xs">Supports: JPEG, PNG, GIF, WebP</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Error Message */}
              {ocrError && (
                <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
                  ❌ {ocrError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowOcrModal(false);
                    setOcrImage(null);
                    setOcrPreview(null);
                    setOcrError('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded font-mono hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOcrScan}
                  disabled={!ocrImage || isScanning}
                  className="px-4 py-2 bg-cyan-600 text-white rounded font-mono hover:bg-cyan-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Scan with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
