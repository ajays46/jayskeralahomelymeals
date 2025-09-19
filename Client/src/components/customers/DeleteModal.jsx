import React, { memo } from 'react';

const DeleteModal = memo(({ 
  showDeleteModal, 
  userToDelete, 
  deletingUsers, 
  onCancel, 
  onConfirm 
}) => {
  if (!showDeleteModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Delete Customer</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold">
            {userToDelete?.contacts?.[0]?.firstName}
          </span>? 
          This action cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deletingUsers.has(userToDelete?.id)}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deletingUsers.has(userToDelete?.id) ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteModal.displayName = 'DeleteModal';

export default DeleteModal;
