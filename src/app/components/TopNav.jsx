"use client";

export default function TopNav({ onAdminClick, onSectionSelect }) {
  return (
    <div className="flex justify-between w-full mb-10">
      <button 
        className="text-lg hover:underline"
        onClick={() => onSectionSelect('CASE ACTIONS')}
      >
        <span className="text-gray-300 font-[family-name:var(--font-geist-mono)]">CASE ACTIONS</span>
      </button>
      <button 
        className="text-lg hover:underline -ml-[50px]"
        onClick={onAdminClick}
      >
        <span className="text-gray-300 font-[family-name:var(--font-geist-mono)]">ADMIN ACTIONS</span>
      </button>
      <button 
        className="text-lg hover:underline"
        onClick={() => onSectionSelect('REPORTS')}
      >
        <span className="text-gray-300 font-[family-name:var(--font-geist-mono)]">REPORTS</span>
      </button>
    </div>
  );
}