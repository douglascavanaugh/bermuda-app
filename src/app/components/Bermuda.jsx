"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';

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
  zip: '',
  ssn: '',
  state: '',
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

export default function BermudaForm() {
  const [formDataList, setFormDataList] = useState([]);
  const [currentForm, setCurrentForm] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [successMessage, setSuccessMessage] = useState('');
  const [showStoredForms, setShowStoredForms] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: [] });

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
    if (!/^\d{5}$|^\[\d{5}\]$/.test(currentForm.zip)) {
      newErrors.zip = 'ZIP must be 5 digits or [12345]';
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

  const generatePDF = (formData) => {
    const doc = new jsPDF();
    
    // Add a title
    doc.setFontSize(16);
    doc.text('CASE TIN DATA', 105, 20, { align: 'center' });
    
    // Set font size for content
    doc.setFontSize(12);

    console.log('PDF FORMDATA:', formData);
    
    // Add form data
    const content = [
      `Name: ${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`,
      `Address: ${formData.address}`,
      `City/State/ZIP: ${formData.city}, ${formData.state} ${formData.zip}`,
      `SSN: XXX-XX-${formData.ssn}`,
      `TDA No.: ${formData.tdaNo}`
    ];
    
    // Add each line of content
    content.forEach((line, index) => {
      doc.text(line, 20, 40 + (index * 10));
    });

    // Add text in the middle of the page
    doc.setFontSize(20);  // Make it bigger
    doc.text('BOND', 105, 140, { align: 'center' });  // X: 105 (center), Y: 140 (middle)
    
    // Add timestamp
    const timestamp = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Generated: ${timestamp}`, 20, 280);
    
    // Save the PDF
    doc.save(`case-tin-${formData.lastName}-${formData.firstName}.pdf`);
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

  const handleConfirmSubmit = async () => {
    // Use only the forms in formDataList
    const processBatch = async (forms, batchSize = 5) => {
      for (let i = 0; i < forms.length; i += batchSize) {
        const batch = forms.slice(i, i + batchSize);
        
        for (const formData of batch) {
          generatePDF(formData);
        }
        
        if (i + batchSize < forms.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };

    await processBatch(formDataList);
    
    setSuccessMessage('Forms successfully created!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setCurrentForm(initialFormData);
    setFormDataList([]);
    setShowConfirmDialog(false);
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
    const [nameLine, addressLine, locationLine, ssnLine, tdaLine] = lines;
    
    // Use our existing patterns
    const standardNamePattern = /^([A-Za-z]+)(?:\s+([A-Za-z.]+))?\s+([A-Za-z]+)$/;
    const specialNamePattern = /^([A-Za-z-]+(?:Ray:)?)\s+([A-Za-z]+)$/;
    const cityStateZipPattern = /^(.*?),\s*((?:[A-Za-z]+\s+)*[A-Za-z]+)\s+(?:\[?(\d{5})\]?)$/;
    
    // Parse name
    let firstName, middleName, lastName;
    const standardMatch = nameLine.match(standardNamePattern);
    if (standardMatch) {
      [, firstName, middleName, lastName] = standardMatch;
      middleName = middleName || '';
    } else {
      const specialMatch = nameLine.match(specialNamePattern);
      if (specialMatch) {
        const [, firstPart, last] = specialMatch;
        if (firstPart.includes(':')) {
          firstName = firstPart;
          middleName = '';
        } else {
          firstName = firstPart;
          middleName = '';
        }
        lastName = last;
      } else {
        throw new Error('Invalid name format');
      }
    }

    // Parse location
    const locationMatch = locationLine.match(cityStateZipPattern);
    if (!locationMatch) {
      throw new Error('Invalid city/state/zip format');
    }

    // Log the full match for debugging
    console.log('Location match:', locationMatch);
    
    // Now we'll get the ZIP in position 3 regardless of brackets
    const [_, city, state, zip] = locationMatch;
    
    return {
      firstName,
      middleName,
      lastName,
      address: addressLine.trim(),
      city: city.trim(),
      state: getStateAbbreviation(state.trim()),
      zip: zip,
      ssn: ssnLine.trim(),
      tdaNo: tdaLine.trim()
    };
  };

  const ProcessingIndicator = ({ progress, isProcessing }) => {
    if (!isProcessing) return null;
    
    const percent = Math.round((progress.current / progress.total) * 100);
    
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg w-80">
        <div className="flex justify-between text-white mb-2">
          <span>Processing entries...</span>
          <span>{percent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-gray-300 text-sm mt-2">
          {progress.current} of {progress.total} entries
        </div>
        {progress.errors.length > 0 && (
          <div className="text-red-400 text-sm mt-1">
            {progress.errors.length} errors found
          </div>
        )}
      </div>
    );
  };

  const StoredFormsView = () => (
    <div className="mt-4 mb-6 bg-gray-800 rounded-md p-4  w-full">
      <h3 className="text-white font-mono-bold mb-4">Stored Forms:</h3>
      {formDataList.map((form, index) => (
        <div key={index} className="mb-4 p-3 bg-gray-700 rounded-md relative">
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
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  const ConfirmationDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-white font-mono-bold mb-4">Confirm Submission</h3>
        <p className="text-gray-200 mb-4">
          You are about to create {formDataList.length} form(s). 
          This action cannot be undone.
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
            Confirm
          </button>
        </div>
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
          BERMUDA FORM
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