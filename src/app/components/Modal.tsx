// components/Modal.tsx
import { useEffect } from 'react';

interface ModalProps {
  show: boolean;
  onClose: (arg: string) => void;
}

const Modal: React.FC<ModalProps> = ({ show, onClose }) => {
  // const [adminAction, setAdminAction] = useState<boolean>(false);
  // Close the modal if escape is pressed
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      console.log('MODALING')
      if (event.key === 'Escape') onClose('');
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center"
      onClick={() => onClose('')}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl text-center font-bold font-[family-name:var(--font-geist-mono)] text-gray-700 mb-4">Admin Actions</h2>
        <p onClick={() => onClose('APPROVALS')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">A. APPROVALS</p>
        <p onClick={() => onClose('ASSIGNMENTS')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">B. ASSIGNMENTS</p>
        <p onClick={() => onClose('NOTIFICATIONS')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">C. NOTIFICATIONS</p>
        <p onClick={() => onClose('ACTIVE INVENTORY')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">D. ACTIVE INVENTORY</p>
        <p onClick={() => onClose('CLOSED CASES')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">E. CLOSED CASES</p>
        <p onClick={() => onClose('ENTER CASE TIN')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">F. ENTER CASE TIN</p>
        <p onClick={() => onClose('ENTER NA CASE TIN')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">G. ENTER NA CASE TIN</p>
        <p onClick={() => onClose('CASE MAINTENANCE')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">H. CASE MAINTENANCE</p>
        <p onClick={() => onClose('PARAMETER TABLES')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">I. PARAMETER TABLES</p>
        <p onClick={() => onClose('RESERVED')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">J. RESERVED</p>
        <p onClick={() => onClose('ICS SYSTEN MESSAGES')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">K. ICS SYSTEN MESSAGES</p>
        <p onClick={() => onClose('TIME REPORTING')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">L. TIME REPORTING</p>
        <p onClick={() => onClose('ENTER ARCHIVE CASE TIN')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">M. ENTER ARCHIVE CASE TIN</p>
        <p onClick={() => onClose('COLLECTION CONSULTATION')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">N. COLLECTION CONSULTATION</p>
        <p onClick={() => onClose('COMS')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">0. COMS</p>
        <p onClick={() => onClose('SIA REJECT NOTIFICATION')} className="text-lg font-[family-name:var(--font-geist-mono)] text-gray-700">P. SIA REJECT NOTIFICATION</p>
        <div className="flex w-full">
          <button
            className="bg-blue-500 text-white mt-10 px-4 py-2 rounded hover:bg-blue-600 w-full"
            onClick={() => onClose('')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;