"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ssn: string;
  tdaNo: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  ssn: '',
  tdaNo: ''
};

export default function EnterCaseTin() {
  const router = useRouter();
  const [formDataList, setFormDataList] = useState<FormData[]>([]);
  const [currentForm, setCurrentForm] = useState<FormData>(initialFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allForms = [...formDataList, currentForm];
    // Generate PDFs for all forms
    allForms.forEach(formData => {
      generatePDF(formData);
    });
  };

  const handleAddMore = () => {
    setFormDataList([...formDataList, currentForm]);
    setCurrentForm(initialFormData);
  };

  const generatePDF = (formData: FormData) => {
    // Here you would implement PDF generation
    // For now, we'll just console.log the data
    console.log('Generating PDF for:', formData);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">ENTER CASE TIN</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="First Name"
              required
              className="p-2 border rounded"
              value={currentForm.firstName}
              onChange={e => setCurrentForm({...currentForm, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              className="p-2 border rounded"
              value={currentForm.lastName}
              onChange={e => setCurrentForm({...currentForm, lastName: e.target.value})}
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Address"
              required
              className="w-full p-2 border rounded"
              value={currentForm.address}
              onChange={e => setCurrentForm({...currentForm, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="City"
              required
              className="p-2 border rounded"
              value={currentForm.city}
              onChange={e => setCurrentForm({...currentForm, city: e.target.value})}
            />
            <input
              type="text"
              placeholder="State"
              required
              className="p-2 border rounded"
              value={currentForm.state}
              onChange={e => setCurrentForm({...currentForm, state: e.target.value})}
            />
            <input
              type="text"
              placeholder="ZIP"
              required
              className="p-2 border rounded"
              value={currentForm.zip}
              onChange={e => setCurrentForm({...currentForm, zip: e.target.value})}
            />
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Last 4 SSN"
              required
              maxLength={4}
              className="w-full p-2 border rounded"
              value={currentForm.ssn}
              onChange={e => setCurrentForm({...currentForm, ssn: e.target.value})}
            />
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="TDA No."
              required
              className="w-full p-2 border rounded"
              value={currentForm.tdaNo}
              onChange={e => setCurrentForm({...currentForm, tdaNo: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddMore}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add More
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}