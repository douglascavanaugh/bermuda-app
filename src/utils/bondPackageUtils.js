/**
 * 🔒 SINGLE SOURCE OF TRUTH - Bond Package Utilities
 * 
 * This file is the ONLY place where package data building and defaults live.
 * Both MasterBondSheet.jsx and PackageBatchProcessor.jsx MUST import from here.
 * 
 * DO NOT DUPLICATE THIS LOGIC ELSEWHERE!
 * 
 * Last synced: ${new Date().toISOString()}
 */

// 🏢 Surety Company Details (NEVER changes)
export const SURETY_COMPANY = {
  name: 'Depository Trust Company',
  address: '55 Water St.',
  cityStateZip: 'New York, New York [10041-0099]'
};

// 📜 GSA Reference Text (NEVER changes)
export const GSA_REFERENCE = 'See GSA FORMS; sf 24; sf 25A; sf 28; sf 273; sf 274; sf 275 and 91.';

// 📋 All 8 forms in the package
export const ALL_FORMS = ['SF24', 'SF25', 'SF28', 'SF1418', 'SF273', 'SF274', 'SF275', 'OF91'];

/**
 * 🎖️ Apply default values to form data
 * Called BEFORE buildPackageData in BOTH manual and batch processing
 * 
 * @param {Object} data - Raw form data
 * @returns {Object} - Form data with defaults applied
 */
export const applyDefaults = (data) => {
  const processed = { ...data };
  
  // 📅 Date Bond Executed defaults to "Open" if empty
  if (!processed.dateBondExecuted || processed.dateBondExecuted.trim() === '') {
    processed.dateBondExecuted = 'Open';
  }
  
  // 🇨🇦 ssnBackNumber is optional (Canada doesn't have it)
  if (!processed.ssnBackNumber) {
    processed.ssnBackNumber = '';
  }
  
  // 🏛️ Court type defaults to "State" if not specified
  if (!processed.trialCourtType) {
    processed.trialCourtType = 'State';
  }
  
  return processed;
};

/**
 * 🏗️ Build package data from form data
 * THE canonical function for building all template data
 * 
 * @param {Object} data - Form data (should have defaults applied first!)
 * @returns {Object} - Package data ready for API
 */
export const buildPackageData = (data) => {
  // Surety blocks
  const suretyBlockWithName = `${data.clientFullName}\n${SURETY_COMPANY.name}\n${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`;
  const suretyBlockNoName = `${SURETY_COMPANY.name}\n${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`;
  
  // Court reference
  const courtReference = `${data.trialCourtName} Attn: Clerk; ${data.courtCaseNumber}`;
  
  // SF28 Field texts
  const sf28Field7 = `${data.courtCaseNumber} - ${GSA_REFERENCE}\nBirth Certificate - [${data.stateOfBirth} - ${data.birthCertificateNumber}] and Social Security - [${data.socialSecurityNumber}]; Bond Number; Non-Negotiable set off [${data.birthCertificateNumber}];\nDeposited with the United States Treasury`;
  const sf28Field8 = `${courtReference} - ${GSA_REFERENCE}`;
  const sf28Field9 = `Bid Bond issued by ${courtReference} - ${GSA_REFERENCE}`;
  const of91Claims = `${courtReference} - ${GSA_REFERENCE}`;
  
  // 🎖️ Principal address uses ZIP, not County
  // ZIP already includes brackets if provided, so don't double-add
  const thirdPartyZip = data.thirdPartyZip || '';
  const zipWithBrackets = thirdPartyZip.startsWith('[') ? thirdPartyZip : (thirdPartyZip ? `[${thirdPartyZip}]` : '');
  const thirdPartyFullAddress = `${data.thirdPartyAddress}\n${data.thirdPartyCity}, ${data.thirdPartyState} ${zipWithBrackets}`;
  
  // Court full address
  const courtFullAddress = `${data.courtAddress}, ${data.courtCity}, ${data.courtState} ${data.courtZip || ''}`.trim();

  return {
    // Dates
    dateBondExecuted: data.dateBondExecuted,
    
    // Client info
    clientFullName: data.clientFullName,
    stateOfBirth: data.stateOfBirth,
    courtCaseNumber: data.courtCaseNumber,
    socialSecurityNumber: data.socialSecurityNumber,
    birthCertificateNumber: data.birthCertificateNumber,
    uccTrustNumber: data.uccTrustNumber,
    
    // Surety blocks
    suretyBlockWithName,
    suretyBlockNoName,
    
    // Court info
    courtReference,
    trialCourtName: data.trialCourtName,
    trialCourtType: data.trialCourtType,
    courtFullAddress,
    
    // Third party info
    thirdPartyName: data.thirdPartyName,
    thirdPartyFullAddress,
    thirdPartyState: data.thirdPartyState,
    thirdPartyCounty: data.thirdPartyCounty,
    
    // Prison info
    prisonNumber: data.prisonNumber,
    prisonName: data.prisonName,
    prisonAddress: data.prisonAddress,
    
    // SF28 specific fields
    sf28Field7,
    sf28Field8,
    sf28Field9,
    
    // OF91 specific
    of91Claims,
    
    // Financial
    amountOwed: data.amountOwed,
    
    // Constants
    gsaReference: GSA_REFERENCE,
    suretyCompanyName: SURETY_COMPANY.name,
    suretyCompanyAddress: `${SURETY_COMPANY.address}\n${SURETY_COMPANY.cityStateZip}`
  };
};

/**
 * 🚀 Generate package - combines applyDefaults + buildPackageData
 * Use this for the cleanest implementation
 * 
 * @param {Object} rawData - Raw form data
 * @returns {{ processedData: Object, packageData: Object }}
 */
export const preparePackageGeneration = (rawData) => {
  const processedData = applyDefaults(rawData);
  const packageData = buildPackageData(processedData);
  return { processedData, packageData };
};

