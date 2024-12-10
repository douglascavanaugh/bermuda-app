"use client";

export default function AdminModal({ show, onClose, onSelect }) {
  if (!show) return null;

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
            { key: 'A', title: 'APPROVALS', route: '/admin/approvals' },
            { key: 'B', title: 'ASSIGNMENTS', route: '/admin/assignments' },
            { key: 'C', title: 'NOTIFICATIONS', route: '/admin/notifications' },
            { key: 'D', title: 'ACTIVE INVENTORY', route: '/admin/active-inventory' },
            { key: 'E', title: 'CLOSED CASES', route: '/admin/closed-cases' },
            { key: 'F', title: 'ENTER CASE TIN', route: '/admin/enter-case-tin' },
            { key: 'G', title: 'ENTER NA CASE TIN', route: '/admin/enter-na-case-tin' },
            { key: 'H', title: 'CASE MAINTENANCE', route: '/admin/case-maintenance' },
            { key: 'I', title: 'PARAMETER TABLES', route: '/admin/parameter-tables' },
            { key: 'J', title: 'RESERVED', route: '/admin/reserved' },
            { key: 'K', title: 'ICS SYSTEM MESSAGES', route: '/admin/ics-system-messages' },
            { key: 'L', title: 'TIME REPORTING', route: '/admin/time-reporting' },
            { key: 'M', title: 'ENTER ARCHIVE CASE TIN', route: '/admin/enter-archive-case-tin' },
            { key: 'N', title: 'COLLECTION CONSULTATION', route: '/admin/collection-consultation' },
            { key: 'O', title: 'COMS', route: '/admin/coms' },
            { key: 'P', title: 'SIA REJECT NOTIFICATION', route: '/admin/sia-reject-notification' },
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