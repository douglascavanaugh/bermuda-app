"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';
import { Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const initialFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  ssn: '',
  tdaNo: ''
};

const initialErrors = {
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  ssn: '',
  tdaNo: ''
};

const stateMapping = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY'
};

const parseNameLine = (nameLine) => {
  // Updated name patterns to handle more cases
  const patterns = [
    // Standard name with optional middle name
    /^([A-Za-z]+)\s+(?:([A-Za-z.-]+)\s+)?([A-Za-z]+)$/,
    
    // Name with hyphen and/or apostrophe
    /^([A-Za-z]+)\s+(?:([A-Za-z.-]+)\s+)?([A-Za-z'-]+(?:-[A-Za-z]+)?)$/,
    
    // Name with suffix (Jr., Sr., etc.)
    /^([A-Za-z]+)\s+(?:([A-Za-z.-]+)\s+)?([A-Za-z'-]+)\s+(?:Jr\.|Sr\.|III|IV)$/,
    
    // Name with middle initial and possible suffix
    /^([A-Za-z]+)\s+([A-Za-z]\.?)\s+([A-Za-z'-]+(?:\s+(?:Jr\.|Sr\.|III|IV))?)$/,
    
    // Complex middle names with hyphens
    /^([A-Za-z]+)\s+([A-Za-z'-]+(?:-[A-Za-z]+)?)\s+([A-Za-z'-]+)$/
  ];

  for (const pattern of patterns) {
    const match = nameLine.match(pattern);
    if (match) {
      const [_, firstName, middleName, lastName] = match;
      return {
        firstName: firstName,
        middleName: middleName || '',
        lastName: lastName
      };
    }
  }

  // If no patterns match, try splitting on spaces
  const parts = nameLine.split(/\s+/);
  if (parts.length >= 2) {
    return {
      firstName: parts[0],
      middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
      lastName: parts[parts.length - 1]
    };
  }

  throw new Error('Invalid name format');
};

export default function BermudaForm() {
  const [formDataList, setFormDataList] = useState([]);
  const [currentForm, setCurrentForm] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [successMessage, setSuccessMessage] = useState('');
  const [showStoredForms, setShowStoredForms] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: [] });
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [processStage, setProcessStage] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [shouldCancel, setShouldCancel] = useState(false);
  const [saveDirectory, setSaveDirectory] = useState(null);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...initialErrors };

    // Required field validations
    // First Name
    if (!currentForm.firstName.trim()) {
      newErrors.firstName = 'Required';
      isValid = false;
    }

    // Last Name
    if (!currentForm.lastName.trim()) {
      newErrors.lastName = 'Required';
      isValid = false;
    }

    // Address
    if (!currentForm.address.trim()) {
      newErrors.address = 'Required';
      isValid = false;
    }

    // City
    if (!currentForm.city.trim()) {
      newErrors.city = 'Required';
      isValid = false;
    }

    // State validation (2 letters)
    if (!/^[A-Z]{2}$/.test(currentForm.state.toUpperCase())) {
      newErrors.state = '2 letter state';
      isValid = false;
    }

    // ZIP validation (5 digits)
    // if (!/^\d{5}$/.test(currentForm.zip)) {
    //   newErrors.zip = 'ZIP must be 5 digits';
    //   isValid = false;
    // }
    // if (!/^\d{5}$|^\[\d{5}\]$/.test(currentForm.zip)) {
    //   newErrors.zip = 'ZIP must be 5 digits or [12345]';
    //   isValid = false;
    // }
    // Updated ZIP validation to allow alphanumeric codes
    if (!/^\d{5}$|^\[\d{5}\]$|^[A-Z0-9]{5,6}$|^\[[A-Z0-9]{5,6}\]$/.test(currentForm.zip)) {
      newErrors.zip = 'ZIP must be 5 digits, [12345], or alphanumeric code';
      isValid = false;
    }

    // SSN validation (4 digits)
    if (!/^\d{4}$/.test(currentForm.ssn)) {
      newErrors.ssn = 'SSN must be 4 digits';
      isValid = false;
    }

    // TDA No.
    if (!currentForm.tdaNo.trim()) {
      newErrors.tdaNo = 'Required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add these new functions
  const captureElement = async (elementId, fullPage = true) => {
    try {
      const element = fullPage ? document.documentElement : document.getElementById(elementId);
      if (!element) return null;
      
      // Calculate proper dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const aspectRatio = viewportWidth / viewportHeight;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1a1a1a',
        width: viewportWidth,
        height: viewportHeight,
        windowWidth: viewportWidth,
        windowHeight: viewportHeight,
        x: window.scrollX,
        y: window.scrollY,
        preserveAspectRatio: true // Add this
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Capture error:', error);
      return null;
    }
  };

  // Add this function to handle directory selection
  // const selectSaveDirectory = async () => {
  //   try {
  //     const dirHandle = await window.showDirectoryPicker();
  //     setSaveDirectory(dirHandle);
  //     return true;
  //   } catch (error) {
  //     console.error('Error selecting directory:', error);
  //     return false;
  //   }
  // };

  const generatePDF = async (formData) => {
    try {
      // Stage 1: Capture form entry (full page)
      setProcessStage('Capturing form data...');
      const formImage = await captureElement('root', true);
      
      // Stage 2: Capture confirmation
      setProcessStage('Capturing confirmation...');
      setShowConfirmDialog(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const confirmationImage = await captureElement('root', true);
      setShowConfirmDialog(false);
  
      // Stage 3: Generate PDF
      setProcessStage('Generating PDF...');
      const doc = new jsPDF();
      
      // Calculate proper dimensions for PDF
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calculate dimensions maintaining browser window aspect ratio
      const browserAspectRatio = window.innerWidth / window.innerHeight;
      const maxImageWidth = pageWidth - 20; // 10px margin on each side
      const maxImageHeight = pageHeight - 20; // 10px margin on each side
      
      // Calculate image dimensions that preserve aspect ratio
      let imageWidth = maxImageWidth;
      let imageHeight = imageWidth / browserAspectRatio;
      
      // If height is too tall, scale based on height instead
      if (imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight;
        imageWidth = imageHeight * browserAspectRatio;
      }
      
      // Calculate centering offsets
      const xOffset = (pageWidth - imageWidth) / 2;
      const yOffset = (pageHeight - imageHeight) / 2;
  
      // First page: Form screenshot
      if (formImage) {
        doc.addImage(formImage, 'PNG', xOffset, yOffset, imageWidth, imageHeight);
      }
  
      // Second page: Confirmation screenshot
      if (confirmationImage) {
        doc.addPage();
        doc.addImage(confirmationImage, 'PNG', xOffset, yOffset, imageWidth, imageHeight);
      }
  
      // Third page: Form data
      doc.addPage();
      doc.setFontSize(16);
      doc.text('CASE TIN DATA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      const content = [
        `Name: ${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`,
        `Address: ${formData.address}`,
        `City/State/ZIP: ${formData.city}, ${formData.state} ${formData.zip}`,
        `SSN: XXX-XX-${formData.ssn}`,
        `TDA No.: ${formData.tdaNo}`
      ];
      
      content.forEach((line, index) => {
        doc.text(line, 20, 40 + (index * 10));
      });
  
      doc.setFontSize(20);
      doc.text('BOND', 105, 140, { align: 'center' });
      
      const timestamp = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.text(`Generated: ${timestamp}`, 20, 280);
      
      // Save the PDF
      const filename = `case-tin-${formData.lastName}-${formData.firstName}.pdf`;
      
      if (saveDirectory) {
        try {
          const pdfBlob = doc.output('blob');
          const fileHandle = await saveDirectory.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (error) {
          console.error('Error saving to directory:', error);
          const pdfBlob = doc.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }
  
      // After successful PDF generation and save, remove the processed form
      setFormDataList(prevList => 
        prevList.filter(form => 
          !(form.firstName === formData.firstName && 
            form.lastName === formData.lastName && 
            form.ssn === formData.ssn)
        )
      );
  
      setProcessStage('Complete');
      return true;
  
    } catch (error) {
      console.error('Error generating PDF:', error);
      setProcessStage('Error: ' + error.message);
      return false;
    }
  };

  const handleAddMore = () => {
    if (!validateForm()) return;

    setFormDataList([...formDataList, currentForm]);
    setCurrentForm(initialFormData);
    setSuccessMessage('Form added successfully! Add another or create all forms.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If we have items in formDataList from pasting, skip all validation
    if (formDataList.length > 0) {
      setShowConfirmDialog(true);
      return;
    }
    
    // Otherwise, validate and handle manual entry
    if (validateForm()) {
      // Add current form to the list if it's not empty
      if (Object.values(currentForm).some(value => value !== '')) {
        setFormDataList([...formDataList, currentForm]);
      }
      
      // Show confirmation dialog first
      setShowConfirmDialog(true);
    }
  };

  // Modify handleConfirmSubmit to process one at a time
  const handleConfirmSubmit = async () => {
    setIsProcessingBatch(true);
    setCurrentProcessingIndex(0);
    setShowConfirmDialog(false);
    setShouldCancel(false);
    setIsPaused(false);
    
    try {
      for (let i = 0; i < formDataList.length; i++) {
        if (shouldCancel) {
          setSuccessMessage('Processing cancelled');
          return; // Immediate return when cancelled
        }
  
        // Check for pause
        while (isPaused && !shouldCancel) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
  
        setCurrentProcessingIndex(i);
        const formData = formDataList[i];
        
        setProgress({
          current: i + 1,
          total: formDataList.length,
          errors: []
        });
  
        const formElement = document.getElementById(`form-entry-${formData.lastName}-${formData.firstName}`);
        formElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
        await new Promise(resolve => setTimeout(resolve, 500));
        await generatePDF(formData);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
  
      setSuccessMessage(shouldCancel ? 'Processing cancelled' : 'All forms successfully created!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setCurrentForm(initialFormData);
      
      // Only clear the form list if not cancelled
      if (!shouldCancel) {
        setFormDataList([]);
      }
      
    } catch (error) {
      console.error('Error processing forms:', error);
      setSuccessMessage(`Error processing forms: ${error.message}`);
    } finally {
      setIsProcessingBatch(false);
      setCurrentProcessingIndex(-1);
      setShouldCancel(false);
      setIsPaused(false);
    }
  };

  const handleRemoveForm = (index) => {
    const newList = formDataList.filter((_, i) => i !== index);
    setFormDataList(newList);
    setSuccessMessage('Form removed successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Add this helper function
  const getStateAbbreviation = (stateName) => {
    const normalizedState = stateName.toLowerCase().trim();
    return stateMapping[normalizedState] || stateName;
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    console.log('Raw pasted text:', pastedText);  // First log
    
    const cleanedText = pastedText
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    console.log('Cleaned text:', cleanedText);  // Second log
    
    // Split into 5-line entries (accounting for blank line separators)
    const entries = cleanedText.split(/\n{2,}/)
      .filter(entry => entry.trim())
      .map(entry => entry.split('\n').filter(line => line.trim()));
    console.log('Parsed entries:', entries);  // Third log
    
    // Validate entry count
    const entryCount = entries.length;
    console.log(`Found ${entryCount} entries to process`);
    
    if (entryCount === 0) {
      setSuccessMessage('No valid entries found to process');
      return;
    }

    // Start processing
    setIsProcessing(true);
    setProgress({ current: 0, total: entryCount, errors: [] });
    
    try {
      // Process in batches of 50
      const BATCH_SIZE = 50;
      let processedEntries = [];
      let errors = [];
      
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        
        // Process each entry in the current batch
        for (const [index, lines] of batch.entries()) {
          const currentIndex = i + index;
          console.log('Processing lines:', lines);  // Fourth log
          
          try {
            if (lines.length !== 5) {
              throw new Error(`Invalid entry format at position ${currentIndex + 1}`);
            }
            
            // Parse the entry
            const parsedData = await parseEntry(lines);
            console.log('Parsed data:', parsedData);  // Fifth log
            processedEntries.push(parsedData);
            
          } catch (error) {
            console.error('Parse error:', error);  // Sixth log
            errors.push({
              index: currentIndex,
              lines,
              error: error.message
            });
          }
          
          // Update progress
          setProgress(prev => ({
            ...prev,
            current: currentIndex + 1,
            errors
          }));
        }
        
        // Small delay between batches to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Add ALL successful entries to formDataList at once
      setFormDataList(prev => [...prev, ...processedEntries]);
      
      // Final status update
      const successCount = processedEntries.length;
      setSuccessMessage(
        `Processing complete: ${successCount} successful, ${errors.length} failed. ` +
        (errors.length > 0 ? 'Check console for error details.' : '')
      );
      
      if (errors.length > 0) {
        console.log('Processing errors:', errors);
      }
      
    } catch (error) {
      setSuccessMessage(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // Helper function to parse a single entry
  const parseEntry = async (lines) => {
    // Handle entries with missing address
    if (lines.length === 4) {
      const [nameLine, addressLine, ssnLine, tdaLine] = lines;
      if (addressLine === '[Address not provided]') {
        const nameComponents = parseNameLine(nameLine);
        return {
          ...nameComponents,
          address: addressLine,
          city: '',
          state: '',
          zip: '',
          ssn: ssnLine.trim(),
          tdaNo: tdaLine.trim()
        };
      }
    }
  
    const [nameLine, addressLine, locationLine, ssnLine, tdaLine] = lines;
    
    const nameComponents = parseNameLine(nameLine);
    
    // Updated pattern to handle alphanumeric postal codes
    const cityStateZipPattern = /^(.*?),\s*((?:[A-Za-z]+\s+)*[A-Za-z]+)(?:,?\s+(\[?\d{5}\]?))?$/;
    
    const locationMatch = locationLine.match(cityStateZipPattern);
    if (!locationMatch) {
      throw new Error('Invalid city/state/zip format');
    }
    
    const [_, city, state, zip] = locationMatch;
    
    return {
      ...nameComponents,
      address: addressLine.trim(),
      city: city.trim(),
      state: getStateAbbreviation(state.trim()),
      zip: zip || '',
      ssn: ssnLine.trim(),
      tdaNo: tdaLine.trim()
    };
  };

  // Update ProcessingIndicator to show current person being processed
  const ProcessingIndicator = ({ progress, isProcessing }) => {
    if (!isProcessing && !isProcessingBatch) return null;
    
    const percent = Math.round((progress.current / progress.total) * 100);
    const currentForm = formDataList[currentProcessingIndex];
    
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg w-80">
        <div className="flex justify-between text-white mb-2">
          <span>Processing forms...</span>
          <span>{percent}%</span>
        </div>
        {currentForm && (
          <>
            <div className="text-gray-300 text-sm mb-2">
              Currently processing: {currentForm.firstName} {currentForm.lastName}
            </div>
            <div className="text-blue-300 text-sm mb-2">
              {processStage}
            </div>
          </>
        )}
        <div className="w-full h-2 bg-gray-700 rounded-full mb-3">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-gray-300 text-sm mb-3">
          {progress.current} of {progress.total} forms
        </div>
        
        {/* Add control buttons */}
        <div className="flex justify-between gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex-1 px-3 py-1 rounded font-mono text-sm ${
              isPaused 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel processing?')) {
                setShouldCancel(true);
                setIsPaused(false);
              }
            }}
            className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-sm"
          >
            Cancel
          </button>
        </div>
        
        {isPaused && (
          <div className="text-yellow-400 text-sm mt-2 text-center">
            Processing paused - Click Resume to continue
          </div>
        )}
      </div>
    );
  };

  // Modify StoredFormsView to highlight current processing item
  const StoredFormsView = () => (
    <div className="mt-4 mb-6 bg-gray-800 rounded-md p-4 w-full">
      <h3 className="text-white font-mono-bold mb-4">Stored Forms:</h3>
      <div className="max-h-[300px] overflow-y-auto pr-2">
        {formDataList.map((form, index) => (
          <div 
            key={index} 
            id={`form-entry-${form.lastName}-${form.firstName}`}
            className={`mb-4 p-3 rounded-md relative
              ${currentProcessingIndex === index ? 'bg-gray-700' : 'bg-gray-700'}
              transition-colors duration-200`}
          >
            <div className="text-white font-mono">
              <p>{form.firstName} {form?.middleName} {form.lastName}</p>
              <p className="text-sm text-gray-300">{form.address}</p>
              <p className="text-sm text-gray-300">
                {form.city}, {form.state} {form.zip}
              </p>
              <p className="text-sm text-gray-300">{form.ssn}</p>
              <p className="text-sm text-gray-300">{form.tdaNo}</p>
            </div>
            <button
              onClick={() => handleRemoveForm(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              disabled={isProcessingBatch}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Update ConfirmationDialog to show different messages for initial vs per-form confirmation
  const ConfirmationDialog = () => (
    <div 
      id="confirmation-dialog"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-white font-mono-bold mb-4 flex items-center gap-2">
          <Loader2 className="h-5 w-5 text-white" />
          Processing...
        </h3>
        <p className="text-gray-200 mb-4">
          {isProcessingBatch
            ? 'Processing users data form confirmed! Generating PDF...'
            : `You are about to create ${formDataList.length} form(s). This action cannot be undone.`
          }
        </p>
        {!isProcessingBatch && (
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
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Helper function for input error styling
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

  return (
    <div className="max-w-2xl mx-auto overflow-visible">
      <div className="bg-gray-700 rounded-md shadow-lg p-6 h-full">
        <h2 className="text-xl font-mono-bold text-center text-white mb-6">
          CASE TIN DATA FORM
        </h2>
        
        {/* Dedicated paste zone instructions */}
        <div
          className="mb-6 p-4 border-2 border-dashed border-gray-500 rounded-lg 
                    text-center cursor-pointer bg-gray-800 hover:bg-gray-750"
          onPaste={handlePaste}
          tabIndex="0"
          onClick={() => {
            console.log('Paste zone clicked');
            navigator.clipboard.readText()
              .then(text => {
                const e = { 
                  preventDefault: () => {}, 
                  clipboardData: { getData: () => text } 
                };
                handlePaste(e);
              })
              .catch(err => {
                setSuccessMessage('Please use Ctrl+V or Cmd+V to paste');
                setTimeout(() => setSuccessMessage(''), 3000);
              });
          }}
        >
          <p className="text-gray-300 font-bold mb-2">Click here and paste (Ctrl+V or Cmd+V)</p>
          <p className="text-sm text-gray-400 mb-3">
            Paste multiple entries at once - each entry should be 5 lines with a blank line between entries
          </p>
          <div className="text-xs text-gray-500 text-left mx-auto w-fit">
            <p className="mb-2">Format for each entry:</p>
            <div className="pl-4">
              <p>First Middle Last</p>
              <p>Address</p>
              <p>City, State [ZIP]</p>
              <p>SSN (last 4)</p>
              <p>TDA No.</p>
              <p className="mt-2">[blank line between entries]</p>
            </div>
          </div>
        </div>
        
        {successMessage && (
          <div className="mb-4 p-2 bg-gray-800 text-white rounded text-center">
            <pre className="whitespace-pre-wrap text-sm">
              {successMessage}
            </pre>
          </div>
        )}

        {formDataList.length > 0 && (
          <div className="mb-4 text-white text-center">
            <p>Forms ready to create: {formDataList.length}</p>
            <button
              onClick={() => setShowStoredForms(!showStoredForms)}
              className="text-blue-300 hover:text-blue-400 text-sm mt-1"
            >
              {showStoredForms ? 'Hide stored forms' : 'View stored forms'}
            </button>
          </div>
        )}

        {showStoredForms && formDataList.length > 0 && <StoredFormsView />}
        
        <form onSubmit={handleSubmit} onPaste={handlePaste}>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* First Name */}
            <div className="relative">
              <input
                type="text"
                placeholder="First Name"
                required={formDataList.length === 0}
                className={`${getInputClassName('firstName')} w-[200px]`}
                value={currentForm.firstName}
                onChange={e => setCurrentForm({...currentForm, firstName: e.target.value})}
              />
              {errors.firstName && (
                <div className="absolute text-xs text-red-500 mt-1">{errors.firstName}</div>
              )}
            </div>
            
            {/* Middle Name */}
            <div className="relative">
              <input
                type="text"
                placeholder="Middle (optional)"
                className={`${getInputClassName('middleName')} text-gray-100 w-[180px]`}
                value={currentForm.middleName}
                onChange={e => setCurrentForm({...currentForm, middleName: e.target.value})}
              />
            </div>
            
            {/* Last Name */}
            <div className="relative -ml-[20px]">
              <input
                type="text"
                placeholder="Last Name"
                required={formDataList.length === 0}
                className={getInputClassName('lastName')}
                value={currentForm.lastName}
                onChange={e => setCurrentForm({...currentForm, lastName: e.target.value})}
              />
              {errors.lastName && (
                <div className="absolute text-xs text-red-500 mt-1">{errors.lastName}</div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mb-8 relative">
            <input
              type="text"
              placeholder="Address"
              required={formDataList.length === 0}
              className={getInputClassName('address', true)}
              value={currentForm.address}
              onChange={e => setCurrentForm({...currentForm, address: e.target.value})}
            />
            {errors.address && (
              <div className="absolute text-xs text-red-500 mt-1">{errors.address}</div>
            )}
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* City */}
            <div className="relative">
              <input
                type="text"
                placeholder="City"
                required={formDataList.length === 0}
                className={`${getInputClassName('city')} w-[280px]`}
                value={currentForm.city}
                onChange={e => setCurrentForm({...currentForm, city: e.target.value})}
              />
              {errors.city && (
              <div className="absolute text-xs text-red-500 mt-1">{errors.city}</div>
              )}
            </div>
            {/* State */}
            <div className="relative ml-[80px]">
              <input
                type="text"
                placeholder="State"
                required={formDataList.length === 0}
                maxLength={2}
                className={`${getInputClassName('state')} w-[90px]`}
                value={currentForm.state}
                onChange={e => setCurrentForm({...currentForm, state: e.target.value.toUpperCase()})}
              />
              {errors.state && (
                <div className="absolute text-xs text-red-500 mt-1">{errors.state}</div>
              )}
            </div>
            {/* ZIP */}
            <div className="relative -ml-[30px]">
              <input
                type="text"
                placeholder="ZIP"
                required={formDataList.length === 0}
                maxLength={7}  // Allow for brackets
                className={`${getInputClassName('zip')} w-[228px]`}
                value={currentForm.zip}
                onChange={e => {
                  const value = e.target.value;
                  // Allow digits and square brackets
                  if (/^[\d\[\]]*$/.test(value)) {
                    setCurrentForm({...currentForm, zip: value});
                  }
                }}
              />
              {errors.zip && (
                <div className="absolute text-xs text-red-500 mt-1">{errors.zip}</div>
              )}
            </div>
          </div>
          
          {/* Last 4 SSN */}
          <div className="mb-8 relative">
            <input
              type="text"
              placeholder="Last 4 SSN"
              required={formDataList.length === 0}
              maxLength={4}
              className={getInputClassName('ssn', true)}  // Added true for full width
              value={currentForm.ssn}
              onChange={e => setCurrentForm({...currentForm, ssn: e.target.value.replace(/\D/g, '')})}
            />
            {errors.ssn && (
              <div className="absolute text-xs text-red-500 mt-1">{errors.ssn}</div>
            )}
          </div>

          {/* TDA No. */}
          <div className="mb-8 relative">
            <input
              type="text"
              placeholder="TDA No."
              required={formDataList.length === 0}
              className={getInputClassName('tdaNo', true)}
              value={currentForm.tdaNo}
              onChange={e => setCurrentForm({...currentForm, tdaNo: e.target.value})}
            />
            {errors.tdaNo && (
              <div className="absolute text-xs text-red-500 mt-1">{errors.tdaNo}</div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            {/* <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded font-mono hover:bg-gray-600"
            >
              Cancel
            </button> */}
            <button
              type="button"
              onClick={handleAddMore}
              className="px-4 py-2 bg-white text-black hover:text-white rounded font-mono hover:bg-gray-800"
            >
              Add More
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded font-mono hover:bg-green-600"
            >
              Create
            </button>
          </div>
        </form>
        {showConfirmDialog && <ConfirmationDialog />}

        {/* Add the ProcessingIndicator here */}
        <ProcessingIndicator 
          progress={progress} 
          isProcessing={isProcessing} 
        />
      </div>
    </div>
  );
}