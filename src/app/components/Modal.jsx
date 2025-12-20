"use client";

import { useEffect } from 'react';
import Link from 'next/link';

function Modal({ show, onClose, onSelect }) {
  if (!show) return null;

  const menuItems = [
    { key: 'A', title: 'BERMUDA', view: 'BERMUDA' },
    { key: 'B', title: 'HAWAII', view: 'HAWAII' },
    { key: 'C', title: 'SPC', view: 'SPC' },
    { key: 'D', title: 'MASTER BOND SHEET', view: 'MASTER_BOND_SHEET' },
    { key: 'E', title: 'PACKAGE BATCH PROCESSOR', link: '/package-batch-processor' },
    { key: 'F', title: 'SINGLE FORM BATCH', link: '/batch-processor' },
    { key: 'G', title: 'COORDINATE MAPPER', link: '/coordinate-mapper' },
    { key: 'H', title: 'TBD', view: 'TBD' },
    { key: 'I', title: 'TBD', view: 'TBD' },
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
            item.link ? (
              <Link
                key={item.key}
                href={item.link}
                className="block text-gray-700 font-mono hover:text-blue-600 cursor-pointer"
              >
                {item.key}. {item.title}
              </Link>
            ) : (
              <div
                key={item.key}
                onClick={() => handleSelect(item)}
                className="text-gray-700 font-mono hover:text-gray-300 cursor-pointer"
              >
                {item.key}. {item.title}
              </div>
            )
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