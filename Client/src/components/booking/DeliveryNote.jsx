import React from 'react';
import { MdNote, MdInfo } from 'react-icons/md';

const DeliveryNote = ({ deliveryNote, onDeliveryNoteChange, isMobile }) => {
  return (
    <div className="space-y-2">
      <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <MdNote className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-blue-900 text-xs sm:text-sm mb-1">Delivery Note (Optional)</h3>
            <p className="text-xs text-blue-700">
              Add any special instructions or notes for delivery
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
        <textarea
          value={deliveryNote || ''}
          onChange={(e) => onDeliveryNoteChange(e.target.value)}
          placeholder="Enter delivery instructions, special requests, or any notes for the delivery team..."
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MdInfo className="w-3 h-3" />
            <span>Optional field - helps delivery team with special instructions</span>
          </div>
          <span className="text-xs text-slate-400">
            {(deliveryNote || '').length}/500
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryNote;
