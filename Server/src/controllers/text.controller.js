import { correctText } from '../services/textCorrection.service.js';

/**
 * POST /api/text/correct
 * Body: { text: string }
 * Returns: { success, corrected, language, changed } or { success: false, error, corrected: "" }
 */
export async function correctTextController(req, res) {
  try {
    const { text } = req.body ?? {};
    if (text === undefined || text === null) {
      return res.status(400).json({
        success: false,
        error: "Missing 'text' in body",
        corrected: '',
      });
    }

    const result = await correctText(text);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Correction failed',
        corrected: result.corrected || (typeof text === 'string' ? text.trim() : ''),
      });
    }

    return res.status(200).json({
      success: true,
      corrected: result.corrected,
      language: result.language,
      changed: result.changed,
    });
  } catch (err) {
    console.error('Text correct controller error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
      corrected: typeof req.body?.text === 'string' ? req.body.text.trim() : '',
    });
  }
}
