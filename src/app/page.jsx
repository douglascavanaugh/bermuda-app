"use client";

import { useState } from 'react';
import Modal from './components/Modal';
import BermudaForm from './components/Bermuda';
import HawaiiForm from './components/Hawaii';
import SPCForm from './components/SPC';

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
    // { currentView === 'BERMUDA' && <BermudaForm /> }
    // { currentView === 'HAWAII' && (
    //   <p className="text-gray-400 font-[family-name:var(--font-geist-mono)]">
    //     {currentView} Page Coming Soon
    //   </p>
    // ) }
    // { currentView === '' && selectedSection && (
    //   <p className="text-gray-400 font-[family-name:var(--font-geist-mono)]">
    //     No Archive Data Exists For {selectedSection}
    //   </p>
    // )}
    if (currentView === 'BERMUDA') {
      return <BermudaForm />;
    }
    if (currentView === 'HAWAII') {
      return <HawaiiForm />;
    }
    if (currentView === 'SPC') {
      return <SPCForm />;
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
      <div className="h-full border-double border-4 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-center text-gray-300 font-mono mb-8">
          ICS MAIN MENU
        </h1>
        
        <div className="flex justify-center w-full mb-10">
          {/* <button 
            className="text-lg hover:underline"
            onClick={() => setSelectedSection('CASE ACTIONS')}
          >
            <span className="text-gray-300 font-mono"></span>
          </button> */}
          <button 
            className="text-lg hover:underline"
            onClick={() => setShowModal(true)}
          >
            <span className="text-gray-300 font-mono">ADMIN ACTIONS</span>
          </button>
          {/* <button 
            className="text-lg hover:underline"
            onClick={() => setSelectedSection('REPORTS')}
          >
            <span className="text-gray-300 font-mono"></span>
          </button> */}
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