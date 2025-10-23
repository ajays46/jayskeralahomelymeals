/**
 * Zoho CRM Routes
 * Handles Zoho CRM authentication and SMS integration endpoints
 */
import express from 'express';
import {
  getZohoAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  testZohoConnection,
  handleOAuthCallback
} from '../controllers/zoho.controller.js';
import { 
  createContactInZohoCRM, 
  updateContactInZohoCRM, 
  getContactFromZohoCRM,
  testZohoCRMConnection,
  getZohoCredentialsStatus,
  setZohoCredentials
} from '../services/zohoCRM.service.js';

const router = express.Router();

/**
 * @route GET /api/zoho/auth-url
 * @desc Get Zoho CRM authorization URL
 * @access Public
 */
router.get('/auth-url', getZohoAuthUrl);

/**
 * @route POST /api/zoho/exchange-tokens
 * @desc Exchange authorization code for access and refresh tokens
 * @access Public
 */
router.post('/exchange-tokens', exchangeCodeForTokens);

/**
 * @route POST /api/zoho/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh-token', refreshAccessToken);

/**
 * @route POST /api/zoho/test-connection
 * @desc Test Zoho CRM connection with access token
 * @access Public
 */
router.post('/test-connection', testZohoConnection);

/**
 * @route GET /api/zoho/callback
 * @desc Handle OAuth callback from Zoho CRM
 * @access Public
 */
router.get('/callback', handleOAuthCallback);

/**
 * @route POST /api/zoho/create-contact
 * @desc Create contact in Zoho CRM
 * @access Public
 */
router.post('/create-contact', async (req, res) => {
  try {
    const result = await createContactInZohoCRM(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/zoho/update-contact/:contactId
 * @desc Update contact in Zoho CRM
 * @access Public
 */
router.put('/update-contact/:contactId', async (req, res) => {
  try {
    const result = await updateContactInZohoCRM(req.params.contactId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/zoho/search-contact
 * @desc Search contact in Zoho CRM by phone number
 * @access Public
 */
router.get('/search-contact', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    const result = await getContactFromZohoCRM(phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/zoho/test-crm-connection
 * @desc Test Zoho CRM connection
 * @access Public
 */
router.get('/test-crm-connection', async (req, res) => {
  try {
    const result = await testZohoCRMConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/zoho/credentials-status
 * @desc Get Zoho credentials status
 * @access Public
 */
router.get('/credentials-status', async (req, res) => {
  try {
    const status = getZohoCredentialsStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/zoho/set-credentials
 * @desc Set Zoho credentials manually
 * @access Public
 */
router.post('/set-credentials', async (req, res) => {
  try {
    const { access_token, refresh_token, expires_in } = req.body;
    
    if (!access_token || !refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Access token and refresh token are required'
      });
    }
    
    setZohoCredentials(access_token, refresh_token, expires_in);
    
    res.json({
      success: true,
      message: 'Zoho credentials set successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
