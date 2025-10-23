/**
 * Zoho CRM Controller
 * Handles Zoho CRM authentication and SMS integration
 */
import axios from 'axios';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';
import { setZohoCredentials, testZohoCRMConnection } from '../services/zohoCRM.service.js';

/**
 * Generate authorization URL for Zoho CRM OAuth
 * This URL should be visited by the user to authorize the application
 */
export const getZohoAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const redirectUri = process.env.ZOHO_TEST_CALLBACK_URL;
    
    if (!clientId || !redirectUri) {
      return res.status(400).json({
        success: false,
        message: 'Zoho credentials not configured. Please set ZOHO_CLIENT_ID and ZOHO_TEST_CALLBACK_URL in environment variables.'
      });
    }

    // Zoho CRM OAuth authorization URL
    const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.users.ALL&client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline&prompt=consent`;

    logInfo('EXTERNAL_API', 'Generated Zoho auth URL', {
      clientId: clientId.substring(0, 8) + '...',
      redirectUri
    });

    res.json({
      success: true,
      authUrl,
      message: 'Visit this URL to authorize the application with Zoho CRM'
    });

  } catch (error) {
    logError('EXTERNAL_API', 'Failed to generate Zoho auth URL', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message
    });
  }
};

/**
 * Exchange authorization code for access token and refresh token
 * This endpoint is called after user authorizes the application
 */
export const exchangeCodeForTokens = async (req, res) => {
  try {
    const { code } = req.body;
    console.log("code", code);
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = process.env.ZOHO_TEST_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        success: false,
        message: 'Zoho credentials not configured. Please set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_TEST_CALLBACK_URL in environment variables.'
      });
    }

    // Exchange authorization code for tokens
    const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code
    };

    const response = await axios.post(tokenUrl, null, {
      params: tokenData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;

    logInfo('EXTERNAL_API', 'Successfully exchanged code for tokens', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in,
      tokenType: token_type
    });

    res.json({
      success: true,
      message: 'Successfully obtained access token and refresh token',
      data: {
        access_token,
        refresh_token,
        expires_in,
        token_type
      }
    });

  } catch (error) {
    logError('EXTERNAL_API', 'Failed to exchange code for tokens', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      message: 'Failed to exchange authorization code for tokens',
      error: error.response?.data?.error || error.message
    });
  }
};

/**
 * Refresh access token using refresh token
 * This endpoint can be used to get a new access token when the current one expires
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Zoho credentials not configured. Please set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in environment variables.'
      });
    }

    // Refresh access token
    const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
    const tokenData = {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh_token
    };

    const response = await axios.post(tokenUrl, null, {
      params: tokenData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in, token_type } = response.data;

    logInfo('EXTERNAL_API', 'Successfully refreshed access token', {
      hasAccessToken: !!access_token,
      expiresIn: expires_in,
      tokenType: token_type
    });

    res.json({
      success: true,
      message: 'Successfully refreshed access token',
      data: {
        access_token,
        expires_in,
        token_type
      }
    });

  } catch (error) {
    logError('EXTERNAL_API', 'Failed to refresh access token', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      message: 'Failed to refresh access token',
      error: error.response?.data?.error || error.message
    });
  }
};

/**
 * Test Zoho CRM connection with access token
 * This endpoint verifies that the access token is valid and can be used for API calls
 */
export const testZohoConnection = async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Test connection by fetching user info
    const testUrl = 'https://www.zohoapis.in/crm/v2/users';
    
    const response = await axios.get(testUrl, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    logInfo('EXTERNAL_API', 'Successfully tested Zoho CRM connection', {
      userCount: response.data?.users?.length || 0
    });

    res.json({
      success: true,
      message: 'Successfully connected to Zoho CRM',
      data: {
        users: response.data?.users || [],
        connectionStatus: 'active'
      }
    });

  } catch (error) {
    logError('EXTERNAL_API', 'Failed to test Zoho CRM connection', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      message: 'Failed to test Zoho CRM connection',
      error: error.response?.data?.error || error.message
    });
  }
};

/**
 * Handle OAuth callback from Zoho
 * This endpoint receives the authorization code from Zoho after user authorization
 */
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      logError('EXTERNAL_API', 'OAuth callback error', {
        error,
        error_description
      });
      
      return res.status(400).json({
        success: false,
        message: 'OAuth authorization failed',
        error: error_description || error
      });
    }
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const redirectUri = process.env.ZOHO_TEST_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        success: false,
        message: 'Zoho credentials not configured'
      });
    }

    // Exchange authorization code for tokens
    const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code
    };

    const response = await axios.post(tokenUrl, null, {
      params: tokenData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;

    // Store credentials in the service
    setZohoCredentials(access_token, refresh_token, expires_in);

    logInfo('EXTERNAL_API', 'OAuth callback successful', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in,
      tokenType: token_type
    });

    // Return success page or redirect to frontend with tokens
    res.json({
      success: true,
      message: 'Successfully authorized with Zoho CRM',
      data: {
        access_token,
        refresh_token,
        expires_in,
        token_type
      }
    });

  } catch (error) {
    logError('EXTERNAL_API', 'OAuth callback failed', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process OAuth callback',
      error: error.response?.data?.error || error.message
    });
  }
};
