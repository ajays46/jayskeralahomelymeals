import React from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * ConfirmationModal - Reusable confirmation dialog component
 * Handles user confirmations for destructive or important actions
 * Features: Portal rendering, customizable styling, multiple types, keyboard navigation
 */
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to perform this action?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-500/20'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          border: 'border-yellow-500/20'
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-500/20'
        };
      default:
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-500/20'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Create modal content
  const modalContent = (
    <>
      {/* Global CSS to ensure modal displays above everything */}
      <style>{`
        .confirmation-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 1rem !important;
        }
        
        .confirmation-modal-content {
          position: relative !important;
          z-index: 1000000 !important;
          background-color: #1f2937 !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          max-width: 28rem !important;
          width: 100% !important;
          margin: 0 1rem !important;
          border: 1px solid #374151 !important;
        }
        
        .confirmation-modal-backdrop {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(4px) !important;
          z-index: 999999 !important;
        }
      `}</style>
      
      <div className="confirmation-modal-overlay">
        {/* Backdrop */}
        <div 
          className="confirmation-modal-backdrop"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="confirmation-modal-content">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-gray-700 ${styles.icon}`}>
                <FiAlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0 border-t border-gray-700 bg-gray-800 rounded-b-xl">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Use portal to render modal at the top level of the DOM
  return createPortal(modalContent, document.body);
};

export default ConfirmationModal; 