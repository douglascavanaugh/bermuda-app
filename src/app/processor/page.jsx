"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, CheckCircle, XCircle, Download, Trash2, Package } from 'lucide-react';
import JSZip from 'jszip';

// GSA constant reference (same as MasterBondSheet)
const GSA_REFERENCE = 'GSA SF (Rev. 6/2022)';

// US States + Canadian Provinces for lookups
const STATES_PROVINCES = [
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
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
  // Canadian Provinces
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' }, { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' }, { code: 'YT', name: 'Yukon' }
];

const getStateName = (code) => {
  if (!code) return '';
  const found = STATES_PROVINCES.find(s => s.code === code.toUpperCase());
  return found ? found.name : code;
};

export default function ProcessorPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/submit-bond?status=${statusFilter}`);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.submissions);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error fetching: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  // Convert snake_case DB data to camelCase for API
  const convertToCamelCase = (submission) => {
    return {
      clientFullName: submission.client_full_name,
      dateBondExecuted: submission.date_bond_executed || 'Open',
      courtCaseNumber: submission.court_case_number,
      pastConvictionsCaseNumbers: submission.past_convictions_case_numbers || '',
      birthCertificateNumber: submission.birth_certificate_number || '',
      stateOfBirth: submission.state_of_birth || '',
      dateOfBirth: submission.date_of_birth || '',
      uccTrustNumber: submission.ucc_trust_number || '',
      socialSecurityNumber: submission.social_security_number || '',
      ssnBackNumber: submission.ssn_back_number || '',
      thirdPartyName: submission.third_party_name || '',
      thirdPartyAddress: submission.third_party_address || '',
      thirdPartyCity: submission.third_party_city || '',
      thirdPartyState: submission.third_party_state || '',
      thirdPartyZip: submission.third_party_zip || '',
      thirdPartyCounty: submission.third_party_county || '',
      prisonNumber: submission.prison_number || '',
      prisonName: submission.prison_name || '',
      prisonAddress: submission.prison_address || '',
      trialCourtName: submission.trial_court_name || '',
      trialCourtType: submission.trial_court_type || 'State',
      courtAddress: submission.court_address || '',
      courtCity: submission.court_city || '',
      courtState: submission.court_state || '',
      courtZip: submission.court_zip || '',
      amountOwed: submission.amount_owed || ''
    };
  };

  // Build package data (same logic as MasterBondSheet)
  const buildPackageData = (formData) => {
    const stateOfBirthFull = getStateName(formData.stateOfBirth);
    
    // Format date of birth
    let dobFormatted = '';
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      dobFormatted = dob.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }
    
    // Format date bond executed
    let bondDateFormatted = formData.dateBondExecuted || 'Open';
    if (bondDateFormatted && bondDateFormatted !== 'Open') {
      const bondDate = new Date(bondDateFormatted);
      bondDateFormatted = bondDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }
    
    // Build principal address
    const principalAddressParts = [];
    if (formData.thirdPartyAddress) principalAddressParts.push(formData.thirdPartyAddress);
    if (formData.thirdPartyCity) principalAddressParts.push(formData.thirdPartyCity);
    if (formData.thirdPartyState) principalAddressParts.push(formData.thirdPartyState);
    if (formData.thirdPartyZip) principalAddressParts.push(formData.thirdPartyZip);
    const principalAddress = `${formData.clientFullName}\n${principalAddressParts.join(', ')}`;
    
    // Build SF28 field 7
    const sf28Field7 = `${formData.courtCaseNumber} - ${GSA_REFERENCE}\nBirth Certificate - [${stateOfBirthFull} - ${formData.birthCertificateNumber}] and Social Security - [${formData.socialSecurityNumber}]; Bond Number; Non-Negotiable set off [${formData.birthCertificateNumber}];\nDeposited with the United States Treasury`;
    
    return {
      clientFullName: formData.clientFullName,
      dateBondExecuted: bondDateFormatted,
      courtCaseNumber: formData.courtCaseNumber,
      pastConvictionsCaseNumbers: formData.pastConvictionsCaseNumbers,
      birthCertificateNumber: formData.birthCertificateNumber,
      stateOfBirth: stateOfBirthFull,
      dateOfBirth: dobFormatted,
      uccTrustNumber: formData.uccTrustNumber,
      socialSecurityNumber: formData.socialSecurityNumber,
      thirdPartyName: formData.thirdPartyName,
      thirdPartyAddress: formData.thirdPartyAddress,
      thirdPartyCity: formData.thirdPartyCity,
      thirdPartyState: formData.thirdPartyState,
      thirdPartyZip: formData.thirdPartyZip,
      thirdPartyCounty: formData.thirdPartyCounty,
      principalAddress: principalAddress,
      prisonNumber: formData.prisonNumber,
      prisonName: formData.prisonName,
      prisonAddress: formData.prisonAddress,
      trialCourtName: formData.trialCourtName,
      trialCourtType: formData.trialCourtType,
      courtAddress: formData.courtAddress,
      courtCity: formData.courtCity,
      courtState: formData.courtState,
      courtZip: formData.courtZip,
      amountOwed: formData.amountOwed,
      sf28Field7: sf28Field7,
      ssnBackNumber: formData.ssnBackNumber
    };
  };

  // Update submission status in database
  const updateSubmissionStatus = async (id, status, errorMessage = null) => {
    try {
      const response = await fetch('/api/update-bond-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, errorMessage })
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to update status:', error);
      return false;
    }
  };

  // Process selected submissions
  const processSelected = async () => {
    const toProcess = submissions.filter(s => selectedIds.includes(s.id));
    if (toProcess.length === 0) {
      setMessage('No submissions selected');
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: toProcess.length });
    setMessage('');

    const results = [];
    const zip = new JSZip();

    for (let i = 0; i < toProcess.length; i++) {
      const submission = toProcess[i];
      setProgress({ current: i + 1, total: toProcess.length });

      try {
        // Convert and build package data
        const formData = convertToCamelCase(submission);
        const packageData = buildPackageData(formData);

        console.log(`📦 Processing ${i + 1}/${toProcess.length}: ${formData.clientFullName}`);

        // Generate PDF
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
          throw new Error(`Failed to generate: ${response.statusText}`);
        }

        const blob = await response.blob();
        const fileName = `Completed_Package_${formData.clientFullName.replace(/\s+/g, '_')}_${formData.courtCaseNumber.replace(/\s+/g, '_')}.pdf`;
        
        zip.file(fileName, blob);
        results.push({ id: submission.id, success: true, name: formData.clientFullName });

        // Update status to completed
        await updateSubmissionStatus(submission.id, 'completed');

        // Small delay between requests
        if (i < toProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Error processing ${submission.client_full_name}:`, error);
        results.push({ id: submission.id, success: false, name: submission.client_full_name, error: error.message });
        await updateSubmissionStatus(submission.id, 'error', error.message);
      }
    }

    // Download ZIP
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Processed_Packages_${successCount}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    setMessage(`✅ Processed ${successCount}/${toProcess.length} submissions`);
    setSelectedIds([]);
    setProcessing(false);
    fetchSubmissions(); // Refresh list
  };

  // Toggle selection
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map(s => s.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8 text-green-400" />
              Bond Processor
            </h1>
            <p className="text-gray-400 mt-1">Process pending submissions from the database</p>
          </div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Form
          </Link>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 text-white rounded px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="error">Errors</option>
            </select>
            
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <span className="text-gray-400">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {selectedIds.length > 0 && (
              <span className="text-green-400">
                {selectedIds.length} selected
              </span>
            )}
            
            <button
              onClick={processSelected}
              disabled={processing || selectedIds.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing {progress.current}/{progress.total}...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Process Selected
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
            {message}
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === submissions.length && submissions.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="p-3 text-left">Client Name</th>
                <th className="p-3 text-left">Court Case #</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Submitted</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No {statusFilter} submissions found
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr 
                    key={sub.id} 
                    className={`border-t border-gray-700 hover:bg-gray-750 ${selectedIds.includes(sub.id) ? 'bg-gray-700' : ''}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sub.id)}
                        onChange={() => toggleSelect(sub.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-3 font-mono">{sub.client_full_name}</td>
                    <td className="p-3 font-mono text-gray-400">{sub.court_case_number}</td>
                    <td className="p-3 font-mono text-green-400">${sub.amount_owed || '—'}</td>
                    <td className="p-3 text-gray-400 text-sm">
                      {new Date(sub.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {sub.status === 'pending' && (
                        <span className="text-yellow-400 flex items-center gap-1">
                          ⏳ Pending
                        </span>
                      )}
                      {sub.status === 'processing' && (
                        <span className="text-blue-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      )}
                      {sub.status === 'completed' && (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Completed
                        </span>
                      )}
                      {sub.status === 'error' && (
                        <span className="text-red-400 flex items-center gap-1" title={sub.error_message}>
                          <XCircle className="w-4 h-4" /> Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
