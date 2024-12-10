"use client";

import { useState } from 'react';
import Modal from './components/Modal';
import EnterCaseTinForm from './components/EnterCaseTinForm';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [currentView, setCurrentView] = useState('');

  const handleModalSelect = (title) => {
    console.log('Modal selected:', title);
    setShowModal(false);
    setSelectedSection(title);
    setCurrentView(title);
  };

  const renderContent = () => {
    console.log('Current view:', currentView);
    if (currentView === 'ENTER CASE TIN') {
      return <EnterCaseTinForm />;
    }
    if (selectedSection) {
      return (
        <p className="text-gray-400 font-mono">
          No Archive Data Exists For {selectedSection}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="h-[calc(100vh-60px)] m-[30px]">
      <div className="h-full border-double border-4 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-300 font-mono mb-8">
          ICS MAIN MENU
        </h1>
        
        <div className="flex justify-between w-full mb-10">
          <button 
            className="text-lg hover:underline"
            onClick={() => setSelectedSection('CASE ACTIONS')}
          >
            <span className="text-gray-300 font-mono">CASE ACTIONS</span>
          </button>
          <button 
            className="text-lg hover:underline -ml-[50px]"
            onClick={() => setShowModal(true)}
          >
            <span className="text-gray-300 font-mono">ADMIN ACTIONS</span>
          </button>
          <button 
            className="text-lg hover:underline"
            onClick={() => setSelectedSection('REPORTS')}
          >
            <span className="text-gray-300 font-mono">REPORTS</span>
          </button>
        </div>

        <div className="mt-10">
          {renderContent()}
        </div>

        <Modal 
          show={showModal} 
          onClose={() => setShowModal(false)}
          onSelect={handleModalSelect}
        />
      </div>
    </div>
  );
}