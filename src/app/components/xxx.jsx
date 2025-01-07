"use client";

import { useState } from 'react';
import TopNav from './TopNav';
import AdminModal from './AdminModal';
import EnterCaseTinForm from './EnterCaseTinForm';

const Layout = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [currentView, setCurrentView] = useState('');

  return (
    <div className="h-[calc(100vh-60px)] m-[30px]">
      <div className="h-full border-double border-4 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-300 font-[family-name:var(--font-geist-mono)] mb-8">
          ICS MAIN MENU
        </h1>
        
        <TopNav 
          onAdminClick={() => setShowModal(true)}
          onSectionSelect={setSelectedSection}
        />

        <div className="mt-10 flex justify-center">
          {currentView === 'ENTER CASE TIN' && <EnterCaseTinForm />}
          {currentView === '' && selectedSection && (
            <p className="text-gray-400 font-[family-name:var(--font-geist-mono)]">
              No Archive Data Exists For {selectedSection}
            </p>
          )}
          {currentView !== '' && currentView !== 'ENTER CASE TIN' && (
            <p className="text-gray-400 font-[family-name:var(--font-geist-mono)]">
              {currentView} Page Coming Soon
            </p>
          )}
        </div>

        <AdminModal 
          show={showModal} 
          onClose={() => setShowModal(false)}
          onSelect={(view) => {
            setCurrentView(view);
            setShowModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default Layout;