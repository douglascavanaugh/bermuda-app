"use client";

import { useEffect } from 'react';

function Modal({ show, onClose, onSelect }) {
  if (!show) return null;

  const menuItems = [
    { key: 'A', title: 'APPROVALS', view: 'APPROVALS' },
    { key: 'B', title: 'ASSIGNMENTS', view: 'ASSIGNMENTS' },
    { key: 'C', title: 'NOTIFICATIONS', view: 'NOTIFICATIONS' },
    { key: 'D', title: 'ACTIVE INVENTORY', view: 'ACTIVE INVENTORY' },
    { key: 'E', title: 'CLOSED CASES', view: 'CLOSED CASES' },
    { key: 'F', title: 'ENTER CASE TIN', view: 'ENTER CASE TIN' },
    { key: 'G', title: 'ENTER NA CASE TIN', view: 'ENTER NA CASE TIN' },
    { key: 'H', title: 'CASE MAINTENANCE', view: 'CASE MAINTENANCE' },
    { key: 'I', title: 'PARAMETER TABLES', view: 'PARAMETER TABLES' },
    { key: 'J', title: 'RESERVED', view: 'RESERVED' },
    { key: 'K', title: 'ICS SYSTEM MESSAGES', view: 'ICS SYSTEM MESSAGES' },
    { key: 'L', title: 'TIME REPORTING', view: 'TIME REPORTING' },
    { key: 'M', title: 'ENTER ARCHIVE CASE TIN', view: 'ENTER ARCHIVE CASE TIN' },
    { key: 'N', title: 'COLLECTION CONSULTATION', view: 'COLLECTION CONSULTATION' },
    { key: 'O', title: 'COMS', view: 'COMS' },
    { key: 'P', title: 'SIA REJECT NOTIFICATION', view: 'SIA REJECT NOTIFICATION' }
  ];

  const handleSelect = (item) => {
    onSelect(item.view);  // Pass the view name instead of title
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-700 font-mono text-left pl-[50px] mb-4">
          Admin Actions
        </h2>
        
        <div className="space-y-2">
          {menuItems.map(item => (
            <div
              key={item.key}
              onClick={() => handleSelect(item)}
              className="text-gray-700 font-mono hover:text-gray-300 cursor-pointer"
            >
              {item.key}. {item.title}
            </div>
          ))}
        </div>

        <button
          className="w-full mt-6 bg-black text-white font-mono py-2 rounded hover:bg-gray-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default Modal;