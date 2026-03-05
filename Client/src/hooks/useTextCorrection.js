import { useState, useCallback, useEffect, useRef } from 'react';
import axiosInstance from '../api/axios';

const DEBOUNCE_MS = 400;
const MIN_LENGTH = 5;

/**
 * Hook for text auto-correction (spelling/grammar) via POST /text/correct.
 * Debounces input, fetches suggestion when text length >= MIN_LENGTH.
 * Shows "Suggested: ..." with Apply button; text updates only when user clicks Apply (no "Checking...").
 * @param {string} text - Current input value
 * @param {Object} options
 * @param {(corrected: string) => void} options.onApply - Called when user clicks Apply (e.g. setState(corrected))
 * @param {number} [options.debounceMs] - Debounce delay (default 400)
 * @param {number} [options.minLength] - Min characters before calling API (default 5)
 * @returns {{ suggestion: string | null, correcting: boolean, applySuggestion: () => void }}
 */
export function useTextCorrection(text, { onApply, debounceMs = DEBOUNCE_MS, minLength = MIN_LENGTH } = {}) {
  const [suggestion, setSuggestion] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const debounceRef = useRef(null);

  const fetchCorrection = useCallback(async (value) => {
    const trimmed = (value || '').trim();
    if (trimmed.length < minLength) {
      setSuggestion(null);
      return;
    }
    setCorrecting(true);
    try {
      const { data } = await axiosInstance.post('/text/correct', { text: trimmed });
      if (data?.success && data?.changed && data?.corrected) {
        setSuggestion(data.corrected);
      } else {
        setSuggestion(null);
      }
    } catch (e) {
      console.warn('Text correction failed:', e);
      setSuggestion(null);
    } finally {
      setCorrecting(false);
    }
  }, [minLength]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = (text || '').trim();
    if (!trimmed) {
      setSuggestion(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchCorrection(text);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, debounceMs, fetchCorrection]);

  const applySuggestion = useCallback(() => {
    if (suggestion != null && typeof onApply === 'function') {
      onApply(suggestion);
      setSuggestion(null);
    }
  }, [suggestion, onApply]);

  return { suggestion, correcting, applySuggestion };
}
