import React from 'react';

/**
 * UI block for text correction: shows "Suggested: ..." + Apply when a suggestion is available.
 * No "Checking..." message. User must click Apply to replace the text.
 */
const TextCorrectionSuggestion = ({ correcting, suggestion, onApply, className = '' }) => {
  if (correcting) return null;
  if (suggestion == null) return null;
  return (
    <div
      className={`mt-2 p-2 sm:p-2.5 rounded-lg border flex flex-wrap items-center gap-2 bg-[#f0f7ff] border-[#b8daff] ${className}`}
      role="region"
      aria-label="Spelling suggestion"
    >
      <span className="text-xs sm:text-sm text-gray-800 flex-1 min-w-0">
        <span className="font-medium text-gray-700">Suggested: </span>
        <span className="break-words">{suggestion}</span>
      </span>
      <button
        type="button"
        onClick={onApply}
        className="flex-shrink-0 px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-[#007bff] text-white rounded hover:bg-[#0069d9] transition-colors"
      >
        Apply
      </button>
    </div>
  );
};

export default TextCorrectionSuggestion;
