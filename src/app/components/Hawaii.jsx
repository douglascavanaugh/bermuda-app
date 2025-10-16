"use client";

import { useState } from 'react';
import jsPDF from 'jspdf';

// import { stateMapping } from '../utils/state';

const initialFormData = {
  // New Subject Information fields
  firstName: '',
  middleName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  dateOfBirth: '',
  socialInsuranceNumber: '',
  dateLastAtAddress: '',
  primaryPhoneNumber: '',
  lastEmployerName: '',
  employerAddress: '',
  employerState: '',
  employerZip: '',
  lastEmployerPhone: '',
  positionAtLastEmployer: '',
  tradeOrProfession: '',
  driverLicenseNo: '',
  licensePlateNumbers: '',
  vehicleDescription: '',

  // Spouse Information
  spouseMaritalStatus: '',
  spouseFirstName: '',
  spouseMiddleName: '',
  spouseLastName: '',
  spouseDateOfBirth: '',
  spouseSocialInsuranceNumber: '',
  spouseAddressType: '',
  spouseAddress: '',
  spouseState: '',
  spouseZip: '',
  spouseDateLastAtAddress: '',
  spousePrimaryPhone: '',
  spouseLastEmployer: '',
  spouseEmployerAddress: '',
  spouseEmployerState: '',
  spouseEmployerZip: '',
  spouseLastEmployerPhone: '',
  spousePosition: '',
  spouseTrade: '',
  spouseDriverLicense: '',
  spouseLicensePlate: '',

  // General Information
  friendsRelativesInfo: '',
  businessCreditRefs: '',
  
  // Checkboxes
  creditSearches: false,
  driverLicenseSearches: false,
  applications: false,
  articlesOfIncorporation: false,
  accidentReports: false,
  ppsa: false,
  nsfCheques: false,
  vehicleRegistration: false,
  
  hasJudgement: false,
  judgementDetails: '',
  hasConsent: false,
  consentDetails: '',
  traceExplanation: ''
};

// Initialize error state at the top of the component
const initialErrors = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  socialInsuranceNumber: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  dateLastAtAddress: '',
  primaryPhoneNumber: '',
  lastEmployerName: '',
  employerAddress: '',
  employerState: '',
  employerZip: '',
  lastEmployerPhone: '',
  positionAtLastEmployer: '',
  tradeOrProfession: '',
  driverLicenseNo: '',
  licensePlateNumbers: '',
  vehicleDescription: '',
  // Spouse fields
  spouseFirstName: '',
  spouseLastName: '',
  spouseDateOfBirth: '',
  spouseSocialInsuranceNumber: '',
  spouseAddress: '',
  spouseCity: '',
  spouseState: '',
  spouseZip: '',
  spouseDateLastAtAddress: '',
  spousePrimaryPhone: '',
  spouseLastEmployerName: '',
  spouseEmployerAddress: '',
  spouseEmployerState: '',
  spouseEmployerZip: '',
  spouseLastEmployerPhone: '',
  spousePosition: '',
  spouseTrade: '',
  spouseDriverLicense: '',
  spouseLicensePlate: '',
  // General Information
  friendsRelativesInfo: '',
  businessCreditRefs: '',
  judgementDetails: '',
  consentDetails: '',
  traceExplanation: '',
  submit: ''
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

const headerMap = {
  // Subject Information
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Date of Birth': 'dateOfBirth',
  'SSN': 'socialInsuranceNumber',
  'Address': 'address',
  'City': 'city',
  'State': 'state',
  'ZIP': 'zip',
  'Date Last at Address': 'dateLastAtAddress',
  'Primary Phone': 'primaryPhoneNumber',
  'Driver License': 'driverLicenseNo',
  'License Plate': 'licensePlateNumbers',
  'Vehicle Description': 'vehicleDescription',

  // Subject's Employment
  'Last Employer': 'lastEmployerName',
  'Employer Address': 'employerAddress',
  'Employer City': 'employerCity',
  'Employer State': 'employerState',
  'Employer ZIP': 'employerZip',
  'Employer Phone': 'lastEmployerPhone',
  'Position': 'positionAtLastEmployer',
  'Trade': 'tradeOrProfession',

  // Spouse Information
  'Spouse Marital Status': 'spouseMaritalStatus',
  'Spouse First Name': 'spouseFirstName',
  'Spouse Last Name': 'spouseLastName',
  'Spouse DOB': 'spouseDateOfBirth',
  'Spouse SSN': 'spouseSocialInsuranceNumber',
  'Spouse Address Type': 'spouseAddressType',
  'Spouse Address': 'spouseAddress',
  'Spouse City': 'spouseCity',
  'Spouse State': 'spouseState',
  'Spouse ZIP': 'spouseZip',
  'Spouse Date Last at Address': 'spouseDateLastAtAddress',
  'Spouse Phone': 'spousePrimaryPhone',
  'Spouse Driver License': 'spouseDriverLicense',
  'Spouse License Plate': 'spouseLicensePlate',

  // Spouse's Employment
  'Spouse Last Employer': 'spouseLastEmployerName',
  'Spouse Employer Address': 'spouseEmployerAddress',
  'Spouse Employer City': 'spouseEmployerCity',
  'Spouse Employer State': 'spouseEmployerState',
  'Spouse Employer ZIP': 'spouseEmployerZip',
  'Spouse Employer Phone': 'spouseLastEmployerPhone',
  'Spouse Position': 'spousePosition',
  'Spouse Trade': 'spouseTrade',

  // General Information
  'Friends Relatives Info': 'friendsRelativesInfo',
  'Business Credit Refs': 'businessCreditRefs',
  'Has Judgement': 'hasJudgement',
  'Judgement Details': 'judgementDetails',
  'Has Consent': 'hasConsent',
  'Consent Details': 'consentDetails',
  'Trace Explanation': 'traceExplanation'
};

const formatValidators = {
  // Date validator (handles multiple formats and converts to MM/DD/YYYY)
  dateValidator: {
    pattern: /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    format: (value) => {
      if (!value) return '';
      
      // Handle M/D/YY format
      if (value.includes('/')) {
        const [month, day, year] = value.split('/');
        
        // Convert 2-digit year to 4-digit year
        let fullYear = year;
        if (year.length === 2) {
          // If year is 2 digits, assume 20YY for years 00-29, 19YY for 30-99
          const yearNum = parseInt(year);
          fullYear = yearNum < 30 ? '20' + year : '19' + year;
        }
        
        // Pad month and day with leading zeros if needed
        const formattedMonth = month.padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        
        return `${formattedMonth}/${formattedDay}/${fullYear}`;
      }
      
      // Handle YYYY-MM-DD format
      if (value.includes('-')) {
        const [year, month, day] = value.split('-');
        return `${month}/${day}/${year}`;
      }
      
      return value;
    },
    error: 'Date must be in MM/DD/YYYY format'
  },

  // Other validators remain the same
  phoneValidator: {
    pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
    format: (value) => {
      if (!value) return '';
      const digits = value.replace(/\D/g, '');
      return digits.length === 10 ? 
        `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}` : value;
    },
    error: 'Phone must be in (000) 000-0000 format'
  },

  ssnValidator: {
    pattern: /^\d{3}-\d{2}-\d{4}$/,
    format: (value) => {
      if (!value) return '';
      const digits = value.replace(/\D/g, '');
      return digits.length === 9 ? 
        `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}` : value;
    },
    error: 'SSN must be in 000-00-0000 format'
  },

  stateValidator: {
    pattern: /^[A-Z]{2}$/,
    format: (value) => value?.toUpperCase() || '',
    error: 'State must be 2 letter code'
  },

  zipValidator: {
    pattern: /^\d{5}$|^\[\d{5}\]$/,
    format: (value) => {
      if (!value) return '';
      const digits = value.replace(/\D/g, '');
      return digits.length === 5 ? digits : value;
    },
    error: 'ZIP must be 5 digits or [12345]'
  }
};

// Field type mapping
const fieldTypes = {
  dateOfBirth: 'date',
  spouseDateOfBirth: 'date',
  dateLastAtAddress: 'date',
  spouseDateLastAtAddress: 'date',
  primaryPhoneNumber: 'phone',
  lastEmployerPhone: 'phone',
  spousePrimaryPhone: 'phone',
  spouseLastEmployerPhone: 'phone',
  socialInsuranceNumber: 'ssn',
  spouseSocialInsuranceNumber: 'ssn',
  state: 'state',
  employerState: 'state',
  spouseState: 'state',
  spouseEmployerState: 'state',
  zip: 'zip',
  employerZip: 'zip',
  spouseZip: 'zip',
  spouseEmployerZip: 'zip'
};

export default function HawaiiForm() {
  const [formDataList, setFormDataList] = useState([]);
  const [currentForm, setCurrentForm] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStoredForms, setShowStoredForms] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: [] });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...initialErrors };

    // Helper function for required fields
    const validateRequired = (field, value, errorMessage = 'Required') => {
      if (!value?.trim()) {
        newErrors[field] = errorMessage;
        isValid = false;
      }
    };

    // Helper function for pattern validation
    const validatePattern = (field, value, pattern, errorMessage) => {
      if (value && !pattern.test(value)) {
        newErrors[field] = errorMessage;
        isValid = false;
      }
    };

    // Required field validations
    // First Name
    if (!currentForm.firstName.trim()) {
      newErrors.firstName = 'Subject\'s First Name is Required';
      isValid = false;
    }

    // Last Name
    if (!currentForm.lastName.trim()) {
      newErrors.lastName = 'Subject\'s Last Name is Required';
      isValid = false;
    }

    // Date validations
    if (!currentForm.dateOfBirth) {
      newErrors.dateOfBirth = 'Subject\'s Date of Birth is Required';
      isValid = false;
    }

    // Social Insurance Number validation (000-00-0000)
    if (!/^\d{3}-\d{2}-\d{4}$/.test(currentForm.socialInsuranceNumber)) {
      newErrors.socialInsuranceNumber = 'Subject\'s Social Insurance Number is Required and in this Format: 000-00-0000';
      isValid = false;
    }

    // Address
    if (!currentForm.address.trim()) {
      newErrors.address = 'Subject\'s Address is Required';
      isValid = false;
    }

    // City
    if (!currentForm.city.trim()) {
      newErrors.city = 'Subject\'s City is Required';
      isValid = false;
    }

    // State validation (2 letters)
    if (!/^[A-Z]{2}$/.test(currentForm.state.toUpperCase())) {
      newErrors.state = '2 Letter State';
      isValid = false;
    }

    // ZIP validation (5 digits)
    if (!/^\d{5}$|^\[\d{5}\]$/.test(currentForm.zip)) {
      newErrors.zip = 'ZIP must be 5 digits or [12345]';
      isValid = false;
    }

    if (!currentForm.dateLastAtAddress) {
      newErrors.dateLastAtAddress = 'Subject\'s Date at Last Address is Required';
      isValid = false;
    }

    // Phone number validations (000) 000-0000
    if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(currentForm.primaryPhoneNumber)) {
      newErrors.primaryPhoneNumber = 'Subject\'s Primary Phone Number is Required and in this Format: (000) 000-0000';
      isValid = false;
    }

    // Last Employer validations
    validateRequired('lastEmployerName', currentForm.lastEmployerName, 'Subject\'s Last Employer Name is required');
    validateRequired('employerAddress', currentForm.employerAddress, 'Subject\'s Last Employer Address is required');
    validateRequired('employerCity', currentForm.employerCity, 'Subject\'s Last Employer City is required');
    
    // Subject's Last Employer State and ZIP - make these required
    validateRequired('employerState', currentForm.employerState, '2 Letter State');
    if (currentForm.employerState) {
      validatePattern(
        'employerState',
        currentForm.employerState,
        /^[A-Z]{2}$/,
        '2 Letter State'
      );
    }

    validateRequired('employerZip', currentForm.employerZip, 'ZIP must be 5 digits or [12345]');
    if (currentForm.employerZip) {
      validatePattern(
        'employerZip',
        currentForm.employerZip,
        /^\d{5}$|^\[\d{5}\]$/,
        'Must be 5 digits or [12345]'
      );
    }

    if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(currentForm.lastEmployerPhone)) {
      newErrors.lastEmployerPhone = 'Subject\'s Last Employer Phone Number is Required and in this Format: (000) 000-0000';
      isValid = false;
    }

    // Required fields with alphanumeric validation
    if (!/^[A-Za-z0-9\s]+$/.test(currentForm.positionAtLastEmployer)) {
      newErrors.positionAtLastEmployer = 'Subject\'s Position at Last Employer is Required and must be Letters and numbers only';
      isValid = false;
    }

    if (!/^[A-Za-z0-9\s]+$/.test(currentForm.tradeOrProfession)) {
      newErrors.tradeOrProfession = 'Subject\'s Trade or Profession is Required and must be Letters and numbers only';
      isValid = false;
    }

    if (!/^[A-Za-z0-9\s]+$/.test(currentForm.driverLicenseNo)) {
      newErrors.driverLicenseNo = 'Subject\'s Driver License Number is Required and must be Letters and numbers only';
      isValid = false;
    }

    // License plate and vehicle description (uppercase)
    if (!/^[A-Z0-9\s]+$/.test(currentForm.licensePlateNumbers)) {
      newErrors.licensePlateNumbers = 'Subject\'s License Plate Number is Required and must be Uppercase letters and numbers only';
      isValid = false;
    }

    if (!/^[A-Z0-9\s]+$/.test(currentForm.vehicleDescription)) {
      newErrors.vehicleDescription = 'Subject\'s Vehicle Description is Required and must be Uppercase letters and numbers only';
      isValid = false;
    }

    // Spouse validations (no longer conditional on marital status)

    // Spouse's Marital Status (Radio)
    if (!currentForm.spouseMaritalStatus) {
      newErrors.spouseMaritalStatus = 'Please select marital status';
      isValid = false;
    }
    
    // Basic spouse information
    validateRequired('spouseFirstName', currentForm.spouseFirstName, 'Spouse\'s First Name is required');
    validateRequired('spouseLastName', currentForm.spouseLastName, 'Spouse\'s Last Name is required');
    validateRequired('spouseDateOfBirth', currentForm.spouseDateOfBirth, 'Spouse\'s Date of Birth is required');
    
    // Spouse's Social Insurance Number
    validateRequired('spouseSocialInsuranceNumber', currentForm.spouseSocialInsuranceNumber, 'Spouse\'s Social Insurance Number is required and in this Format: 000-00-0000');
    if (currentForm.spouseSocialInsuranceNumber) {
      validatePattern(
        'spouseSocialInsuranceNumber',
        currentForm.spouseSocialInsuranceNumber,
        /^\d{3}-\d{2}-\d{4}$/,
        'Format: 000-00-0000'
      );
    }

    // Spouse's Address Type (Radio)
    if (!currentForm.spouseAddressType) {
      newErrors.spouseAddressType = 'Please select if address is same or different';
      isValid = false;
    }

    // Spouse's address validations
    validateRequired('spouseAddress', currentForm.spouseAddress, 'Spouse\'s Address is required');
    validateRequired('spouseCity', currentForm.spouseCity, 'Spouse\'s City is required');
    
    // Spouse's State and ZIP
    validateRequired('spouseState', currentForm.spouseState, '2 Letter State');
    if (currentForm.spouseState) {
      validatePattern(
        'spouseState',
        currentForm.spouseState,
        /^[A-Z]{2}$/,
        '2 Letter State'
      );
    }

    validateRequired('spouseZip', currentForm.spouseZip, 'ZIP must be 5 digits or [12345]');
    if (currentForm.spouseZip) {
      validatePattern(
        'spouseZip',
        currentForm.spouseZip,
        /^\d{5}$|^\[\d{5}\]$/,
        'Must be 5 digits or [12345]'
      );
    }

    // Spouse's Date Last at Address
    validateRequired('spouseDateLastAtAddress', currentForm.spouseDateLastAtAddress, 'Spouse\'s Date at Last Address is required');

    // Spouse's Primary Phone
    validateRequired('spousePrimaryPhone', currentForm.spousePrimaryPhone, 'Spouse\'s Primary Phone Number is Required and in this Format: (000) 000-0000');
    if (currentForm.spousePrimaryPhone) {
      validatePattern(
        'spousePrimaryPhone',
        currentForm.spousePrimaryPhone,
        /^\(\d{3}\) \d{3}-\d{4}$/,
        'Format: (000) 000-0000'
      );
    }

    // Spouse's employment information
    validateRequired('spouseLastEmployerName', currentForm.spouseLastEmployerName, 'Spouse\'s Last Employer Name is required');
    validateRequired('spouseEmployerAddress', currentForm.spouseEmployerAddress, 'Spouse\'s Last Employer Address is required');
    validateRequired('spouseEmployerCity', currentForm.spouseEmployerCity, 'Spouse\'s Last Employer City is required');
    
    // Spouse's Last Employer State and ZIP
    validateRequired('spouseEmployerState', currentForm.spouseEmployerState, '2 Letter State');
    if (currentForm.spouseEmployerState) {
      validatePattern(
        'spouseEmployerState',
        currentForm.spouseEmployerState,
        /^[A-Z]{2}$/,
        '2 Letter State'
      );
    }

    validateRequired('spouseEmployerZip', currentForm.spouseEmployerZip, 'ZIP must be 5 digits or [12345]');
    if (currentForm.spouseEmployerZip) {
      validatePattern(
        'spouseEmployerZip',
        currentForm.spouseEmployerZip,
        /^\d{5}$|^\[\d{5}\]$/,
        'Must be 5 digits or [12345]'
      );
    }

    validateRequired('spouseLastEmployerPhone', currentForm.spouseLastEmployerPhone, 'Spouse\'s Last Employer Phone Number is Required and in this Format: (000) 000-0000');
    if (currentForm.spouseLastEmployerPhone) {
      validatePattern(
        'spouseLastEmployerPhone',
        currentForm.spouseLastEmployerPhone,
        /^\(\d{3}\) \d{3}-\d{4}$/,
        'Format: (000) 000-0000'
      );
    }

    // Spouse's Position and Vehicle Information
    validateRequired('spousePosition', currentForm.spousePosition, 'Spouse\'s Position at Last Employer is Required and must be Letters and numbers only');
    validateRequired('spouseTrade', currentForm.spouseTrade, 'Spouse\'s Trade or Profession is Required and must be Letters and numbers only');
    validateRequired('spouseDriverLicense', currentForm.spouseDriverLicense, 'Spouse\'s Driver License Number is Required and must be Letters and numbers only');
    validateRequired('spouseLicensePlate', currentForm.spouseLicensePlate, 'Spouse\'s License Plate Number is Required and must be Uppercase letters and numbers only');

    validatePattern(
      'spouseLicensePlate',
      currentForm.spouseLicensePlate,
      /^[A-Z0-9\s]+$/,
      'Uppercase letters and numbers only'
    );

    // Required Yes/No for judgement
    if (!currentForm.hasJudgement) {
      newErrors.hasJudgement = 'Please select Yes or No';
      isValid = false;
    }

    // Required explanation
    if (!currentForm.traceExplanation.trim()) {
      newErrors.traceExplanation = 'Required';
      isValid = false;
    }

    // Conditional validations
    if (currentForm.hasJudgement && !currentForm.judgementDetails.trim()) {
      newErrors.judgementDetails = 'Required when judgement is checked';
      isValid = false;
    }

    if (currentForm.hasConsent && !currentForm.consentDetails.trim()) {
      newErrors.consentDetails = 'Required when consent is checked';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const generatePDF = (formData) => {
    const doc = new jsPDF();
    console.log('PDF FORMDATA:', formData);
    
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = 280;
    
    // Helper function to add text and manage page breaks
    const addText = (text, x = 20, fontSize = 10, isBold = false, maxWidth = 170) => {
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      // Handle text wrapping for long text
      if (text && text.length > 0) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPosition);
        yPosition += lineHeight * lines.length;
      } else {
        yPosition += lineHeight;
      }
    };
    
    // Header
    addText('HAWAII FORM - CONFIDENTIAL', 20, 16, true);
    addText('Global Solutions Limited LLC', 20, 12, true);
    addText('12221 Towne Lake Drive Ste A #164', 20, 10);
    addText('Ft. Myers Florida [33913]', 20, 10);
    addText('Tel: 239-234-1107', 20, 10);
    yPosition += 5;
    
    // Subject Information
    addText("SUBJECT'S INFORMATION", 20, 14, true);
    addText(`Name: ${formData.firstName} ${formData.middleName} ${formData.lastName}`, 20);
    addText(`Date of Birth: ${formData.dateOfBirth}`, 20);
    addText(`Social Security Number: ${formData.socialInsuranceNumber}`, 20);
    addText(`Address: ${formData.address}`, 20);
    addText(`City, State ZIP: ${formData.city}, ${formData.state} ${formData.zip}`, 20);
    addText(`Date Last at Address: ${formData.dateLastAtAddress}`, 20);
    addText(`Primary Phone: ${formData.primaryPhoneNumber}`, 20);
    addText(`Driver License: ${formData.driverLicenseNo}`, 20);
    addText(`License Plate: ${formData.licensePlateNumbers}`, 20);
    addText(`Vehicle Description: ${formData.vehicleDescription}`, 20);
    yPosition += 5;
    
    // Employment Information
    addText("EMPLOYMENT INFORMATION", 20, 14, true);
    addText(`Last Employer: ${formData.lastEmployerName}`, 20);
    addText(`Employer Address: ${formData.employerAddress}`, 20);
    addText(`Employer City, State ZIP: ${formData.employerCity}, ${formData.employerState} ${formData.employerZip}`, 20);
    addText(`Employer Phone: ${formData.lastEmployerPhone}`, 20);
    addText(`Position: ${formData.positionAtLastEmployer}`, 20);
    addText(`Trade/Profession: ${formData.tradeOrProfession}`, 20);
    yPosition += 5;
    
    // Spouse Information
    addText("SPOUSE INFORMATION", 20, 14, true);
    addText(`Marital Status: ${formData.spouseMaritalStatus}`, 20);
    addText(`Spouse Name: ${formData.spouseFirstName} ${formData.spouseMiddleName} ${formData.spouseLastName}`, 20);
    addText(`Spouse DOB: ${formData.spouseDateOfBirth}`, 20);
    addText(`Spouse SSN: ${formData.spouseSocialInsuranceNumber}`, 20);
    addText(`Spouse Address Type: ${formData.spouseAddressType}`, 20);
    addText(`Spouse Address: ${formData.spouseAddress}`, 20);
    addText(`Spouse City, State ZIP: ${formData.spouseCity}, ${formData.spouseState} ${formData.spouseZip}`, 20);
    addText(`Spouse Date Last at Address: ${formData.spouseDateLastAtAddress}`, 20);
    addText(`Spouse Phone: ${formData.spousePrimaryPhone}`, 20);
    addText(`Spouse Driver License: ${formData.spouseDriverLicense}`, 20);
    addText(`Spouse License Plate: ${formData.spouseLicensePlate}`, 20);
    yPosition += 5;
    
    // Spouse Employment
    addText("SPOUSE EMPLOYMENT", 20, 14, true);
    addText(`Spouse Last Employer: ${formData.spouseLastEmployerName}`, 20);
    addText(`Spouse Employer Address: ${formData.spouseEmployerAddress}`, 20);
    addText(`Spouse Employer City, State ZIP: ${formData.spouseEmployerCity}, ${formData.spouseEmployerState} ${formData.spouseEmployerZip}`, 20);
    addText(`Spouse Employer Phone: ${formData.spouseLastEmployerPhone}`, 20);
    addText(`Spouse Position: ${formData.spousePosition}`, 20);
    addText(`Spouse Trade: ${formData.spouseTrade}`, 20);
    yPosition += 5;
    
    // General Information
    addText("GENERAL INFORMATION", 20, 14, true);
    
    // Friends/Relatives Info (can be very long)
    if (formData.friendsRelativesInfo) {
      addText("Friends/Relatives Info:", 20, 10, true);
      addText(formData.friendsRelativesInfo, 25, 9, false, 165);
      yPosition += 2; // Add some spacing
    }
    
    // Business/Credit References (can be long)
    if (formData.businessCreditRefs) {
      addText("Business/Credit References:", 20, 10, true);
      addText(formData.businessCreditRefs, 25, 9, false, 165);
      yPosition += 2;
    }
    
    addText(`Has Judgement: ${formData.hasJudgement ? 'Yes' : 'No'}`, 20);
    if (formData.hasJudgement && formData.judgementDetails) {
      addText("Judgement Details:", 20, 10, true);
      addText(formData.judgementDetails, 25, 9, false, 165);
      yPosition += 2;
    }
    
    addText(`Has Consent: ${formData.hasConsent ? 'Yes' : 'No'}`, 20);
    if (formData.hasConsent && formData.consentDetails) {
      addText("Consent Details:", 20, 10, true);
      addText(formData.consentDetails, 25, 9, false, 165);
      yPosition += 2;
    }
    
    // Trace Explanation (usually long)
    if (formData.traceExplanation) {
      addText("Trace Explanation:", 20, 10, true);
      addText(formData.traceExplanation, 25, 9, false, 165);
    }
    
    // Save the PDF
    doc.save(`hawaii-form-${formData.lastName}-${formData.firstName}.pdf`);
  };

  const handleAddMore = (e) => {
    e.preventDefault();
    
    // Reset any previous error messages
    setErrors({});
    
    // Validate the form
    if (!validateForm()) {
      // If validation fails, scroll to the first error
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // If validation passes, add to formDataList and reset form
    setFormDataList([...formDataList, currentForm]);
    setCurrentForm(initialFormData);
    setSuccessMessage('Entry added successfully! You can add another or submit the form.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If we have stored forms, show confirmation dialog
    if (formDataList.length > 0) {
      setShowConfirmDialog(true);
      return;
    }
    
    // Validate current form if no stored forms
    if (!validateForm()) {
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Generate PDF for current form only
    generatePDF(currentForm);
    setSuccessMessage('PDF generated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setCurrentForm(initialFormData);
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

  // Helper function to parse Hawaii simple line format (40-line format)
  const parseHawaiiEntry = async (lines) => {
    if (lines.length < 35) {
      throw new Error('Simple line format requires at least 35 lines of data');
    }

    // Parse name from first line
    const nameLine = lines[0];
    const namePattern = /^([A-Za-z]+)(?:\s+([A-Za-z.]+))?\s+([A-Za-z]+)$/;
    const nameMatch = nameLine.match(namePattern);
    if (!nameMatch) {
      throw new Error('Invalid name format');
    }
    const [, firstName, middleName = '', lastName] = nameMatch;

    // Parse location from third line
    const locationLine = lines[2];
    const cityStateZipPattern = /^(.*?),\s*((?:[A-Za-z]+\s+)*[A-Za-z]+)\s+(\d{5}|\[\d{5}\])$/;
    const locationMatch = locationLine.match(cityStateZipPattern);
    if (!locationMatch) {
      throw new Error('Invalid city/state/zip format');
    }
    const [, city, state, zip] = locationMatch;

    // Helper function to parse city/state/zip from a line
    const parseCityStateZip = (line) => {
      if (!line) return { city: '', state: '', zip: '' };
      const match = line.match(/^(.*?),\s*((?:[A-Za-z]+\s+)*[A-Za-z]+)\s+(\d{5}|\[\d{5}\])$/);
      if (match) {
        return {
          city: match[1].trim(),
          state: getStateAbbreviation(match[2].trim()),
          zip: match[3].replace(/[\[\]]/g, '')
        };
      }
      return { city: line.trim(), state: '', zip: '' };
    };

    // Parse spouse name from line 17
    const spouseName = lines[17]?.trim() || '';
    const spouseNameParts = spouseName.split(' ');
    const spouseFirstName = spouseNameParts[0] || '';
    const spouseLastName = spouseNameParts.length > 1 ? spouseNameParts[spouseNameParts.length - 1] : '';
    const spouseMiddleName = spouseNameParts.length > 2 ? spouseNameParts.slice(1, -1).join(' ') : '';

    // Parse employer city/state/zip
    const employerLocation = parseCityStateZip(lines[9]);
    const spouseEmployerLocation = parseCityStateZip(lines[27]);
    const spouseLocation = parseCityStateZip(lines[22]);

    return {
      // Subject Information
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      address: lines[1]?.trim() || '',
      city: city.trim(),
      state: getStateAbbreviation(state.trim()),
      zip: zip.replace(/[\[\]]/g, ''),
      dateOfBirth: lines[3]?.trim() || '',
      socialInsuranceNumber: lines[4]?.trim() || '',
      dateLastAtAddress: lines[5]?.trim() || '',
      primaryPhoneNumber: lines[6]?.trim() || '',
      
      // Employment Information
      lastEmployerName: lines[7]?.trim() || '',
      employerAddress: lines[8]?.trim() || '',
      employerCity: employerLocation.city,
      employerState: employerLocation.state,
      employerZip: employerLocation.zip,
      lastEmployerPhone: lines[10]?.trim() || '',
      positionAtLastEmployer: lines[11]?.trim() || '',
      tradeOrProfession: lines[12]?.trim() || '',
      
      // Vehicle Information
      driverLicenseNo: lines[13]?.trim() || '',
      licensePlateNumbers: lines[14]?.trim() || '',
      vehicleDescription: lines[15]?.trim() || '',
      
      // Spouse Information
      spouseMaritalStatus: lines[16]?.trim() || '',
      spouseFirstName: spouseFirstName,
      spouseMiddleName: spouseMiddleName,
      spouseLastName: spouseLastName,
      spouseDateOfBirth: lines[18]?.trim() || '',
      spouseSocialInsuranceNumber: lines[19]?.trim() || '',
      spouseAddressType: lines[20]?.trim() || '',
      spouseAddress: lines[21]?.trim() || '',
      spouseCity: spouseLocation.city,
      spouseState: spouseLocation.state,
      spouseZip: spouseLocation.zip,
      spouseDateLastAtAddress: lines[23]?.trim() || '',
      spousePrimaryPhone: lines[24]?.trim() || '',
      
      // Spouse Employment
      spouseLastEmployerName: lines[25]?.trim() || '',
      spouseEmployerAddress: lines[26]?.trim() || '',
      spouseEmployerCity: spouseEmployerLocation.city,
      spouseEmployerState: spouseEmployerLocation.state,
      spouseEmployerZip: spouseEmployerLocation.zip,
      spouseLastEmployerPhone: lines[28]?.trim() || '',
      spousePosition: lines[29]?.trim() || '',
      spouseTrade: lines[30]?.trim() || '',
      spouseDriverLicense: lines[31]?.trim() || '',
      spouseLicensePlate: lines[32]?.trim() || '',
      
      // General Information
      friendsRelativesInfo: lines[33]?.trim() || '',
      businessCreditRefs: lines[34]?.trim() || '',
      hasJudgement: lines[35]?.toLowerCase().includes('yes') || false,
      judgementDetails: lines[36]?.trim() || '',
      hasConsent: lines[37]?.toLowerCase().includes('yes') || false,
      consentDetails: lines[38]?.trim() || '',
      traceExplanation: lines[39]?.trim() || ''
    };
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    try {
      // Split into rows
      const rows = pastedText.split(/\r?\n/).filter(row => row.trim());
      
      // Detect format: Simple line format (35+ lines, no commas in first line) vs CSV format
      if (rows.length >= 35 && !rows[0].includes(',')) {
        // Simple line format - parse as individual entry
        console.log('Detected simple line format with', rows.length, 'lines');
        const parsedEntry = await parseHawaiiEntry(rows);
        setFormDataList(prev => [...prev, parsedEntry]);
        setSuccessMessage('Successfully pasted 1 entry from simple line format');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }
      
      // CSV format processing
      if (rows.length < 2) {
        throw new Error('Pasted data must include headers and at least one data row');
      }

      // Parse headers
      const headers = rows[0].split(',').map(header => header.trim());
      
      // Filter out empty headers and check for at least some valid headers
      const validHeaders = headers.filter(header => header && headerMap[header]);
      if (validHeaders.length === 0) {
        throw new Error('No valid headers found. Please check your CSV format.');
      }
      
      console.log(`Found ${validHeaders.length} valid headers out of ${headers.length} total headers`);

      // Process data rows
      const entries = rows.slice(1).map((row, rowIndex) => {
        const values = row.split(',').map(value => value.trim());
        const entry = { ...initialFormData }; // Changed from initialFormState to initialFormData
        const rowErrors = [];

        // Process only valid headers
        headers.forEach((header, index) => {
          const fieldName = headerMap[header];
          if (!fieldName) return; // Skip unknown headers
          
          let value = values[index] || '';

          // Apply format validation if field has a type
          if (fieldTypes[fieldName]) {
            const validator = formatValidators[`${fieldTypes[fieldName]}Validator`];
            
            // Format the value
            value = validator.format(value);

            // Validate if value is not empty
            if (value && !validator.pattern.test(value)) {
              rowErrors.push(`Row ${rowIndex + 1}: ${header} - ${validator.error}`);
            }
          }

          entry[fieldName] = value;
        });

        if (rowErrors.length > 0) {
          throw new Error(rowErrors.join('\n'));
        }

        return entry;
      });

      // Add entries to form data list
      if (entries.length > 0) {
        setFormDataList(prev => [...prev, ...entries]);
        setSuccessMessage(`Successfully pasted ${entries.length} entries`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }

    } catch (error) {
      console.error('Error parsing pasted data:', error);
      setErrors({ 
        paste: typeof error === 'string' ? error : error.message 
      });
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
  const getInputClassName = (fieldName, fullWidth = false) => 
    `
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
          HAWAII FORM
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
          <p className="text-sm text-gray-400">
            Paste multiple entries at once
          </p>
        </div>

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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-2 bg-gray-800 text-white rounded text-center">
            <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white mb-4">CONFIDENTIAL</h1>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col justify-start items-start">
              <h2 className="text-lg font-bold text-white">Global Solutions Limited LLC</h2>
              <p className="text-gray-300">12221 Towne Lake Drive Ste A #164</p>
              <p className="text-gray-300">Ft. Myers Florida [33913]</p>
            </div>
            <p className="text-gray-300">Tel: 239-234-1107</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Subject's Information Section */}
          <div className="space-y-6"> {/* Added consistent vertical spacing */}
            <h2 className="text-lg font-bold text-white text-center">SUBJECT'S INFORMATION</h2>
            
            {/* Name Fields */}
            <div className="grid grid-cols-3 gap-4 mb-8">
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

              <div className="relative">
                <input
                  type="text"
                  placeholder="Middle (optional)"
                  className={`${getInputClassName('middleName')} text-gray-100 w-[180px]`}
                  value={currentForm.middleName}
                  onChange={e => setCurrentForm({...currentForm, middleName: e.target.value})}
                />
              </div>

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

            {/* Personal Information */}
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="date"
                  placeholder="Date of Birth"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('dateOfBirth')} w-[200px]`}
                  value={currentForm.dateOfBirth}
                  onChange={e => setCurrentForm({...currentForm, dateOfBirth: e.target.value})}
                />
                {errors.dateOfBirth && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.dateOfBirth}</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Social Insurance Number (000-00-0000)"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('socialInsuranceNumber')} w-[394px]`}
                  value={currentForm.socialInsuranceNumber}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[\d-]*$/.test(value)) {
                      setCurrentForm({...currentForm, socialInsuranceNumber: value});
                    }
                  }}
                />
                {errors.socialInsuranceNumber && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.socialInsuranceNumber}</div>
                )}
              </div>
            </div>
            
            {/* Address Information */}
            <div className="space-y-4">
              <div className="relative mb-6">
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

              <div className="grid grid-cols-3 gap-4 mb-8">
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

                <div className="relative -ml-[30px]">
                  <input
                    type="text"
                    placeholder="Postal/ZIP Code"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('zip')} w-[228px]`}
                    value={currentForm.zip}
                    onChange={e => {
                      const value = e.target.value;
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
            </div>

            {/* Contact and Employment Information */}
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="date"
                  placeholder="Date at Last Address"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('dateLastAtAddress')} w-[200px]`}
                  value={currentForm.dateLastAtAddress}
                  onChange={e => setCurrentForm({...currentForm, dateLastAtAddress: e.target.value})}
                />
                {errors.dateLastAtAddress && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.dateLastAtAddress}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Primary Phone Number (000) 000-0000"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('primaryPhoneNumber')} w-[386px]`}
                  value={currentForm.primaryPhoneNumber}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[\d\(\)\s-]*$/.test(value)) {
                      setCurrentForm({...currentForm, primaryPhoneNumber: value});
                    }
                  }}
                />
                {errors.primaryPhoneNumber && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.primaryPhoneNumber}</div>
                )}
              </div>
            </div>

            {/* Employer Information */}
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Last Employer Name"
                  required={formDataList.length === 0}
                  className={getInputClassName('lastEmployerName', true)}
                  value={currentForm.lastEmployerName}
                  onChange={e => setCurrentForm({...currentForm, lastEmployerName: e.target.value})}
                />
                {errors.lastEmployerName && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.lastEmployerName}</div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Last Employer Address"
                  required={formDataList.length === 0}
                  className={getInputClassName('employerAddress', true)}
                  value={currentForm.employerAddress}
                  onChange={e => setCurrentForm({...currentForm, employerAddress: e.target.value})}
                />
                {errors.employerAddress && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.employerAddress}</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="relative w-[280px]">
                  <div className="relative">
                    <input
                      type="text"
                      disabled={true}
                      placeholder="Employer City"
                      required={formDataList.length === 0}
                      className={`${getInputClassName('employerCity')} w-[280px]`}
                      value={currentForm.employerCity}
                    />
                    {errors.employerCity && (
                      <div className="absolute text-xs text-red-500 mt-1">{errors.employerCity}</div>
                    )}
                  </div>
                </div>

                <div className="relative ml-[80px]">
                  <input
                    type="text"
                    placeholder="State"
                    required={formDataList.length === 0}
                    maxLength={2}
                    className={`${getInputClassName('employerState')} w-[90px]`}
                    value={currentForm.employerState}
                    onChange={e => setCurrentForm({...currentForm, employerState: e.target.value.toUpperCase()})}
                  />
                  {errors.employerState && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.employerState}</div>
                  )}
                </div>

                <div className="relative -ml-[30px]">
                  <input
                    type="text"
                    placeholder="Employer Postal/ZIP"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('employerZip')} w-[228px]`}
                    value={currentForm.employerZip}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^[\d\[\]]*$/.test(value)) {
                        setCurrentForm({...currentForm, employerZip: value});
                      }
                    }}
                  />
                  {errors.employerZip && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.employerZip}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Last Employer Phone (000) 000-0000"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('lastEmployerPhone')} w-[384px]`}
                    value={currentForm.lastEmployerPhone}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^[\d\(\)\s-]*$/.test(value)) {
                        setCurrentForm({...currentForm, lastEmployerPhone: value});
                      }
                    }}
                  />
                  {errors.lastEmployerPhone && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.lastEmployerPhone}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Position and Trade Information */}
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Position at Last Employer"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('positionAtLastEmployer')} w-[280px]`}
                  value={currentForm.positionAtLastEmployer}
                  onChange={e => setCurrentForm({...currentForm, positionAtLastEmployer: e.target.value})}
                />
                {errors.positionAtLastEmployer && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.positionAtLastEmployer}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Trade or Profession"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('tradeOrProfession')} w-[280px]`}
                  value={currentForm.tradeOrProfession}
                  onChange={e => setCurrentForm({...currentForm, tradeOrProfession: e.target.value})}
                />
                {errors.tradeOrProfession && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.tradeOrProfession}</div>
                )}
              </div>
            </div>

            {/* Driver and Vehicle Information */}
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Driver License No."
                  required={formDataList.length === 0}
                  className={`${getInputClassName('driverLicenseNo')} w-[280px]`}
                  value={currentForm.driverLicenseNo}
                  onChange={e => setCurrentForm({...currentForm, driverLicenseNo: e.target.value})}
                />
                {errors.driverLicenseNo && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.driverLicenseNo}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="License Plate Numbers"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('licensePlateNumbers')} w-[280px]`}
                  value={currentForm.licensePlateNumbers}
                  onChange={e => setCurrentForm({...currentForm, licensePlateNumbers: e.target.value.toUpperCase()})}
                />
                {errors.licensePlateNumbers && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.licensePlateNumbers}</div>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Description of Any Vehicles"
                required={formDataList.length === 0}
                className={getInputClassName('vehicleDescription', true)}
                value={currentForm.vehicleDescription}
                onChange={e => setCurrentForm({...currentForm, vehicleDescription: e.target.value})}
              />
              {errors.vehicleDescription && (
                <div className="absolute text-xs text-red-500 mt-1">{errors.vehicleDescription}</div>
              )}
            </div>
          </div>

          {/* Spouse's Information Section */}
          <div className="space-y-6 mt-8 border-t border-gray-600 pt-8">
            <h2 className="text-lg font-bold text-white text-center">SUBJECT'S SPOUSE'S INFORMATION</h2>

            {/* Marital Status Radio Buttons */}
            <div className="space-y-2">
              <label className="block text-white">Spouse's Marital Status:</label>
              <div className="relative"> {/* Added relative positioning container */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Married', 'Common Law', 'Divorced', 'Separated'].map((status) => (
                    <label key={status} className="inline-flex items-center text-white">
                      <input
                        type="radio"
                        name="spouseMaritalStatus"
                        value={status}
                        checked={currentForm.spouseMaritalStatus === status}
                        onChange={e => setCurrentForm({...currentForm, spouseMaritalStatus: e.target.value})}
                        className="form-radio text-blue-200"
                      />
                      <span className="ml-2">{status}</span>
                    </label>
                  ))}
                </div>
                {errors.spouseMaritalStatus && (
                  <div className="text-xs text-red-500 mt-1">{errors.spouseMaritalStatus}</div>
                )}
              </div>
            </div>

            {/* Spouse's Name Fields */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Spouse's First Name"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('spouseFirstName')} w-[200px]`}
                  value={currentForm.spouseFirstName}
                  onChange={e => setCurrentForm({...currentForm, spouseFirstName: e.target.value})}
                />
                {errors.spouseFirstName && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseFirstName}</div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Spouse's Middle"
                  className={`${getInputClassName('spouseMiddleName')} text-gray-100 w-[180px]`}
                  value={currentForm.spouseMiddleName}
                  onChange={e => setCurrentForm({...currentForm, spouseMiddleName: e.target.value})}
                />
              </div>

              <div className="relative -ml-[20px]">
                <input
                  type="text"
                  placeholder="Spouse's Last Name"
                  required={formDataList.length === 0}
                  className={getInputClassName('spouseLastName')}
                  value={currentForm.spouseLastName}
                  onChange={e => setCurrentForm({...currentForm, spouseLastName: e.target.value})}
                />
                {errors.spouseLastName && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseLastName}</div>
                )}
              </div>
            </div>

            {/* Spouse's Personal Information */}
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="date"
                  placeholder="Spouse's Date of Birth"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('spouseDateOfBirth')} w-[200px]`}
                  value={currentForm.spouseDateOfBirth}
                  onChange={e => setCurrentForm({...currentForm, spouseDateOfBirth: e.target.value})}
                />
                {errors.spouseDateOfBirth && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseDateOfBirth}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Spouse's Social Number 000-00-0000"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('spouseSocialInsuranceNumber')} w-[394px]`}
                  value={currentForm.spouseSocialInsuranceNumber}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[\d-]*$/.test(value)) {
                      setCurrentForm({...currentForm, spouseSocialInsuranceNumber: value});
                    }
                  }}
                />
                {errors.spouseSocialInsuranceNumber && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseSocialInsuranceNumber}</div>
                )}
              </div>
            </div>

            {/* Spouse's Address Radio Buttons */}
            <div className="space-y-2">
              <label className="block text-white mb-2">Spouse's Address:</label>
              <div className="relative"> {/* Added relative positioning container */}
                <div className="flex space-x-4">
                  <label className="inline-flex items-center text-white">
                    <input
                      type="radio"
                      name="spouseAddressType"
                      value="same"
                      checked={currentForm.spouseAddressType === 'same'}
                      onChange={e => setCurrentForm({...currentForm, spouseAddressType: e.target.value})}
                      className="form-radio text-blue-500"
                    />
                    <span className="ml-2">Same as Subject's</span>
                  </label>
                  <label className="inline-flex items-center text-white">
                    <input
                      type="radio"
                      name="spouseAddressType"
                      value="different"
                      checked={currentForm.spouseAddressType === 'different'}
                      onChange={e => setCurrentForm({...currentForm, spouseAddressType: e.target.value})}
                      className="form-radio text-blue-500"
                    />
                    <span className="ml-2">Different than Subject's</span>
                  </label>
                </div>
                {errors.spouseAddressType && (
                  <div className="text-xs text-red-500 mt-1">{errors.spouseAddressType}</div>
                )}
              </div>
            </div>

            {/* Conditional Spouse's Address Fields */}
            {/* {currentForm.spouseAddressType === 'different' && ( */}
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Spouse's Address"
                  required={formDataList.length === 0}
                  className={getInputClassName('spouseAddress', true)}
                  value={currentForm.spouseAddress}
                  onChange={e => setCurrentForm({...currentForm, spouseAddress: e.target.value})}
                />
                {errors.spouseAddress && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseAddress}</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="City"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseCity')} w-[280px]`}
                    value={currentForm.spouseCity}
                    onChange={e => setCurrentForm({...currentForm, spouseCity: e.target.value})}
                  />
                  {errors.spouseCity && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseCity}</div>
                  )}
                </div>

                <div className="relative ml-[80px]">
                  <input
                    type="text"
                    placeholder="State"
                    required={formDataList.length === 0}
                    maxLength={2}
                    className={`${getInputClassName('spouseState')} w-[90px]`}
                    value={currentForm.spouseState}
                    onChange={e => setCurrentForm({...currentForm, spouseState: e.target.value.toUpperCase()})}
                  />
                  {errors.spouseState && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseState}</div>
                  )}
                </div>

                <div className="relative -ml-[30px]">
                  <input
                    type="text"
                    placeholder="Postal/ZIP Code"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseZip')} w-[228px]`}
                    value={currentForm.spouseZip}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^[\d\[\]]*$/.test(value)) {
                        setCurrentForm({...currentForm, spouseZip: value});
                      }
                    }}
                  />
                  {errors.spouseZip && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseZip}</div>
                  )}
                </div>
              </div>
            </div>
            {/* )} */}

            {/* Spouse's Contact Information */}
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="date"
                  placeholder="Date Last at Address"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('spouseDateLastAtAddress')} w-[200px]`}
                  value={currentForm.spouseDateLastAtAddress}
                  onChange={e => setCurrentForm({...currentForm, spouseDateLastAtAddress: e.target.value})}
                />
                {errors.spouseDateLastAtAddress && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseDateLastAtAddress}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Primary Phone Number ((000) 000-0000)"
                  required={formDataList.length === 0}
                  className={`${getInputClassName('spousePrimaryPhone')} w-[384px]`}
                  value={currentForm.spousePrimaryPhone}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^[\d\(\)\s-]*$/.test(value)) {
                      setCurrentForm({...currentForm, spousePrimaryPhone: value});
                    }
                  }}
                />
                {errors.spousePrimaryPhone && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spousePrimaryPhone}</div>
                )}
              </div>
            </div>

            {/* Spouse's Employment Information */}
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Spouse's Last Employer/Name"
                  required={formDataList.length === 0}
                  className={getInputClassName('spouseLastEmployerName', true)}
                  value={currentForm.spouseLastEmployerName}
                  onChange={e => setCurrentForm({...currentForm, spouseLastEmployerName: e.target.value})}
                />
                {errors.spouseLastEmployerName && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseLastEmployerName}</div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Spouse's Employer Address"
                  required={formDataList.length === 0}
                  className={getInputClassName('spouseEmployerAddress', true)}
                  value={currentForm.spouseEmployerAddress}
                  onChange={e => setCurrentForm({...currentForm, spouseEmployerAddress: e.target.value})}
                />
                {errors.spouseEmployerAddress && (
                  <div className="absolute text-xs text-red-500 mt-1">{errors.spouseEmployerAddress}</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="relative w-[280px]">
                  <div className="relative">
                    <input
                      type="text"
                      disabled={true}
                      placeholder="Spouse Employer City"
                      required={formDataList.length === 0}
                      className={`${getInputClassName('spouseEmployerCity')} w-[280px]`}
                      value={currentForm.spouseEmployerCity}
                    />
                    {errors.spouseEmployerCity && (
                      <div className="absolute text-xs text-red-500 mt-1">{errors.spouseEmployerCity}</div>
                    )}
                  </div>
                </div>
                <div className="relative ml-[80px]">
                  <input
                    type="text"
                    placeholder="State"
                    required={formDataList.length === 0}
                    maxLength={2}
                    className={`${getInputClassName('spouseEmployerStateemployerState')} w-[90px]`}
                    value={currentForm.spouseEmployerState}
                    onChange={e => setCurrentForm({...currentForm, spouseEmployerState: e.target.value.toUpperCase()})}
                  />
                  {errors.spouseEmployerState && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseEmployerState}</div>
                  )}
                </div>

                <div className="relative -ml-[30px]">
                  <input
                    type="text"
                    placeholder="Employer Postal/ZIP"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseEmployerZip')} w-[228px]`}
                    value={currentForm.spouseEmployerZip}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^[\d\[\]]*$/.test(value)) {
                        setCurrentForm({...currentForm, spouseEmployerZip: value});
                      }
                    }}
                  />
                  {errors.spouseEmployerZip && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseEmployerZip}</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Last Employer Phone (000) 000-0000"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseLastEmployerPhone')} w-[384px]`}
                    value={currentForm.spouseLastEmployerPhone}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^[\d\(\)\s-]*$/.test(value)) {
                        setCurrentForm({...currentForm, spouseLastEmployerPhone: value});
                      }
                    }}
                  />
                  {errors.spouseLastEmployerPhone && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseLastEmployerPhone}</div>
                  )}
                </div>
              </div>

              {/* Position and Trade Information */}
              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Position at Last Employer"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spousePosition')} w-[290px]`}
                    value={currentForm.spousePosition}
                    onChange={e => setCurrentForm({...currentForm, spousePosition: e.target.value})}
                  />
                  {errors.spousePosition && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spousePosition}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Spouse's Trade or Profession"
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseTrade')} w-[290px]`}
                    value={currentForm.spouseTrade}
                    onChange={e => setCurrentForm({...currentForm, spouseTrade: e.target.value})}
                  />
                  {errors.spouseTrade && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseTrade}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Spouse's Driver's License No."
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseDriverLicense')} w-[290px]`}
                    value={currentForm.spouseDriverLicense}
                    onChange={e => setCurrentForm({...currentForm, spouseDriverLicense: e.target.value})}
                  />
                  {errors.spouseDriverLicense && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseDriverLicense}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Spouse's License Plate No."
                    required={formDataList.length === 0}
                    className={`${getInputClassName('spouseLicensePlate')} w-[290px]`}
                    value={currentForm.spouseLicensePlate}
                    onChange={e => setCurrentForm({...currentForm, spouseLicensePlate: e.target.value})}
                  />
                  {errors.spouseLicensePlate && (
                    <div className="absolute text-xs text-red-500 mt-1">{errors.spouseLicensePlate}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* General Information Section */}
          <div className="space-y-6 mt-8 border-t border-gray-600 pt-8">
            <h2 className="text-lg font-bold text-white text-center">GENERAL INFORMATION</h2>

            {/* Friends/Relatives Information */}
            <div className="space-y-2">
              <label className="block text-white">
                Names and Addresses of Friends or Relatives who might be able to provide information (Please provide telephone numbers):
              </label>
              <div className="relative">
                <textarea
                  className={getInputClassName('friendsRelativesInfo', true)}
                  rows={4}
                  value={currentForm.friendsRelativesInfo}
                  onChange={e => setCurrentForm({...currentForm, friendsRelativesInfo: e.target.value})}
                />
                {errors.friendsRelativesInfo && (
                  <div className="text-xs text-red-500 mt-1">{errors.friendsRelativesInfo}</div>
                )}
              </div>
            </div>

            {/* Business/Credit References */}
            <div className="space-y-2">
              <label className="block text-white">Business or Credit References:</label>
              <div className="relative">
                <textarea
                  className={getInputClassName('businessCreditRefs', true)}
                  rows={4}
                  value={currentForm.businessCreditRefs}
                  onChange={e => setCurrentForm({...currentForm, businessCreditRefs: e.target.value})}
                />
                {errors.businessCreditRefs && (
                  <div className="text-xs text-red-500 mt-1">{errors.businessCreditRefs}</div>
                )}
              </div>
            </div>

            {/* Documentation Checkboxes */}
            <div className="space-y-4">
              <label className="block text-white">
                If you have any of the following documentation, please put a check by the document name and email a copy to our office (proceeds4u@gmail.com). Please do not mail any original documentation as we will not be returning them to you.
              </label>
              <div className="grid grid-cols-1 gap-4 pl-8">
                {[
                  { id: 'creditSearches', label: 'Credit Searches Equifax/TransUnion/TRW' },
                  { id: 'driverLicenseSearches', label: 'Driver\'s License or Vehicle Searches' },
                  { id: 'applications', label: 'Applications (credit, employment, lease, loan, rental, stock, tenancy, etc.)' },
                  { id: 'articlesOfIncorporation', label: 'Articles of Incorporation (Last page showing the subject as a director)' },
                  { id: 'accidentReports', label: 'Motor Vehicle Accident Report, Police Report or Offence Notices' },
                  { id: 'ppsa', label: 'P.P.S.A.' },
                  { id: 'nsfCheques', label: 'N.S.F. Cheques' },
                  { id: 'vehicleRegistration', label: 'Vehicle Registration Info' }
                ].map(item => (
                  <label key={item.id} className="flex items-start space-x-2 text-white">
                    <input
                      type="checkbox"
                      className="form-checkbox text-blue-500 mt-1"
                      checked={currentForm[item.id] || false}
                      onChange={e => setCurrentForm({...currentForm, [item.id]: e.target.checked})}
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Judgement Information */}
            <div className="space-y-4">
              <label className="block text-white">Do you have any Judgement's against the Subject:</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center text-white">
                  <input
                    type="radio"
                    name="hasJudgement"
                    value="yes"
                    checked={currentForm.hasJudgement === true}
                    onChange={e => setCurrentForm({...currentForm, hasJudgement: true})}
                    className="form-radio text-blue-500"
                    required={formDataList.length === 0}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center text-white">
                  <input
                    type="radio"
                    name="hasJudgement"
                    value="no"
                    checked={currentForm.hasJudgement === false}
                    onChange={e => setCurrentForm({...currentForm, hasJudgement: false})}
                    className="form-radio text-blue-500"
                    required={formDataList.length === 0}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>

              {/* {currentForm.hasJudgement && ( */}
              <div className="relative">
                <label className="block text-white mb-2">
                  If yes, please state amount and when the judgement was obtained:
                </label>
                <textarea
                  className={getInputClassName('judgementDetails', true)}
                  rows={4}
                  required={currentForm.hasJudgement}
                  value={currentForm.judgementDetails}
                  onChange={e => setCurrentForm({...currentForm, judgementDetails: e.target.value})}
                />
                {errors.judgementDetails && (
                  <div className="text-xs text-red-500 mt-1">{errors.judgementDetails}</div>
                )}
              </div>
              {/* )} */}
            </div>
            
            {/* Consent Information */}
            <div className="space-y-4">
              <label className="block text-white">
                Has the Subject ever signed a consent, giving authorization for you or your client to conduct a financial investigation? (ie. As is usually found in loan, lease or credit applications):
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center text-white">
                  <input
                    type="radio"
                    name="hasConsent"
                    value="yes"
                    checked={currentForm.hasConsent === true}
                    onChange={e => setCurrentForm({...currentForm, hasConsent: true})}
                    className="form-radio text-blue-500"
                    required={formDataList.length === 0}
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center text-white">
                  <input
                    type="radio"
                    name="hasConsent"
                    value="no"
                    checked={currentForm.hasConsent === false}
                    onChange={e => setCurrentForm({...currentForm, hasConsent: false})}
                    className="form-radio text-blue-500"
                    required={formDataList.length === 0}
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>

              {/* {currentForm.hasConsent && ( */}
              <div className="relative">
                <label className="block text-white mb-2">
                  Please explain:
                </label>
                <textarea
                  className={getInputClassName('consentDetails', true)}
                  rows={4}
                  required={currentForm.hasConsent}
                  value={currentForm.consentDetails}
                  onChange={e => setCurrentForm({...currentForm, consentDetails: e.target.value})}
                />
                {errors.consentDetails && (
                  <div className="text-xs text-red-500 mt-1">{errors.consentDetails}</div>
                )}
              </div>
              {/* )} */}
            </div>

            {/* Trace Explanation */}
            <div className="space-y-4">
              <label className="block text-white">
                Give a brief explanation why this Trace is required, and state any other information:
              </label>
              <div className="relative">
                <textarea
                  className={getInputClassName('traceExplanation', true)}
                  rows={4}
                  required={formDataList.length === 0}
                  value={currentForm.traceExplanation}
                  onChange={e => setCurrentForm({...currentForm, traceExplanation: e.target.value})}
                />
                {errors.traceExplanation && (
                  <div className="text-xs text-red-500 mt-1">{errors.traceExplanation}</div>
                )}
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-6 mt-8 border-t border-gray-600 pt-8">
            <h2 className="text-lg font-bold text-white text-center">FREQUENTLY ASKED QUESTIONS</h2>
            
            <div className="space-y-4 text-white">
              <p className="text-sm">
                Turnaround times vary based on volume and difficulty. We work towards an average of two weeks or less. 
                We will ultimately send you a close out memo of our efforts if the trace fails.
              </p>

              <p className="text-sm">
                Please do not call our office seeking to know the status. You are welcome to email us proceeds4u@gmail.com.
              </p>

              <p className="text-sm">
                We do not send status reports along the way. Either we have the subject located or we don't. 
                We will ultimately report one way or another.
              </p>

              <p className="text-sm">
                This form is to be used for Skip Tracing exclusively. Global Solutions Limited LLC does not offer 
                the service of "employment only" or "bank account only" investigations. We do offer full asset 
                investigations, email us at proceeds4u@gmail.com for more information.
              </p>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            {/* <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button> */}
            <button
              type="button"
              onClick={handleAddMore}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add More
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Submit
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