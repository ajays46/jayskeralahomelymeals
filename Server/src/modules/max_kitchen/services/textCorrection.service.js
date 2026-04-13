import axios from 'axios';

const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';
const MIN_LENGTH = 5;

/**
 * Apply LanguageTool matches to text: replace each match with its first replacement.
 * Processes matches in reverse order by offset so indices remain valid.
 * @param {string} text - Original text
 * @param {Array<{ offset: number, length: number, replacements: Array<{ value: string }> }>} matches
 * @returns {string} Corrected text
 */
function applyMatches(text, matches) {
  if (!matches || matches.length === 0) return text;
  const sorted = [...matches].filter(m => m.replacements && m.replacements.length > 0);
  if (sorted.length === 0) return text;
  sorted.sort((a, b) => b.offset - a.offset); // reverse by offset
  let result = text;
  for (const m of sorted) {
    const replacement = m.replacements[0].value;
    result = result.slice(0, m.offset) + replacement + result.slice(m.offset + m.length);
  }
  return result;
}

/**
 * Correct spelling/grammar in English text using LanguageTool public API.
 * @param {string} text - Raw input text
 * @returns {Promise<{ success: boolean, corrected: string, language: string, changed: boolean, error?: string }>}
 */
export async function correctText(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed.length < MIN_LENGTH) {
    return {
      success: true,
      corrected: trimmed,
      language: 'en',
      changed: false,
    };
  }

  try {
    const params = new URLSearchParams();
    params.set('text', trimmed);
    params.set('language', 'en-US');

    const { data } = await axios.post(LANGUAGETOOL_API, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
      maxContentLength: 20000,
    });

    const matches = data.matches || [];
    const corrected = applyMatches(trimmed, matches);
    const changed = corrected !== trimmed;
    const lang = data.language?.detected?.code || data.language?.code || 'en';

    return {
      success: true,
      corrected,
      language: lang,
      changed,
    };
  } catch (err) {
    console.warn('LanguageTool correction failed:', err.message);
    return {
      success: false,
      corrected: trimmed,
      language: 'en',
      changed: false,
      error: err.message || 'Correction service unavailable',
    };
  }
}
