"use client";

export default function AdminModal({ show, onClose, onSelect }) {
  if (!show) return null;
  console.log('ADMIN MODAL');
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-700 font-[family-name:var(--font-geist-mono)] text-left pl-[50px] mb-4">
          Admin Actions
        </h2>
        
        <div className="space-y-2">
          {[
            { key: 'A', title: 'BERMUDA', route: '/admin/bermuda' },
            { key: 'B', title: 'HAWAII', route: '/admin/hawaii' },
          ].map(item => (
            <div
              key={item.key}
              onClick={() => onSelect(item.title)}
              className="text-gray-700 font-[family-name:var(--font-geist-mono)] hover:text-gray-300 cursor-pointer"
            >
              {item.key}. {item.title}
            </div>
          ))}
        </div>

        <button
          className="w-full mt-6 bg-black text-white font-[family-name:var(--font-geist-mono)] py-2 rounded hover:bg-gray-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}