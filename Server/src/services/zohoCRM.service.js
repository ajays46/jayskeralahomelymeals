/**
 * Zoho CRM Service
 * Handles Zoho CRM API operations for contact management
 * Features: Contact creation, contact updates, lead management, SMS integration
 */
import axios from 'axios';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

// Store Zoho credentials (in production, store these securely in database)
let zohoCredentials = {
  access_token: null,
  refresh_token: null,
  expires_at: null
};

// Load credentials from environment variables on startup
const loadCredentialsFromEnv = () => {
  if (process.env.ZOHO_ACCESS_TOKEN && process.env.ZOHO_REFRESH_TOKEN) {
    zohoCredentials.access_token = process.env.ZOHO_ACCESS_TOKEN;
    zohoCredentials.refresh_token = process.env.ZOHO_REFRESH_TOKEN;
    zohoCredentials.expires_at = process.env.ZOHO_EXPIRES_AT ? new Date(process.env.ZOHO_EXPIRES_AT) : null;
    
    console.log('✅ [ZOHO CRM] Credentials loaded from environment variables');
    logInfo('EXTERNAL_API', 'Zoho credentials loaded from environment', {
      hasAccessToken: !!zohoCredentials.access_token,
      hasRefreshToken: !!zohoCredentials.refresh_token,
      expiresAt: zohoCredentials.expires_at
    });
  }
};

// Load credentials on module initialization
loadCredentialsFromEnv();

/**
 * Set Zoho CRM credentials
 * @param {string} accessToken - Zoho access token
 * @param {string} refreshToken - Zoho refresh token
 * @param {number} expiresIn - Token expiration time in seconds
 */
export const setZohoCredentials = (accessToken, refreshToken, expiresIn = 3600) => {
  zohoCredentials = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + (expiresIn * 1000))
  };
  
  logInfo('EXTERNAL_API', 'Zoho credentials updated', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expiresAt: zohoCredentials.expires_at
  });
};

/**
 * Check if access token is valid and not expired
 */
const isTokenValid = () => {
  console.log('🔍 [ZOHO CRM] Checking token validity details:', {
    hasAccessToken: !!zohoCredentials.access_token,
    hasExpiresAt: !!zohoCredentials.expires_at,
    currentTime: new Date().toISOString(),
    expiresAt: zohoCredentials.expires_at?.toISOString(),
    isNotExpired: zohoCredentials.expires_at ? new Date() < zohoCredentials.expires_at : false
  });
  
  if (!zohoCredentials.access_token) {
    console.log('❌ [ZOHO CRM] No access token available');
    return false;
  }
  if (!zohoCredentials.expires_at) {
    console.log('❌ [ZOHO CRM] No expiry date available');
    return false;
  }
  
  const isValid = new Date() < zohoCredentials.expires_at;
  console.log('🔍 [ZOHO CRM] Token validity result:', isValid);
  return isValid;
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async () => {
  try {
    console.log('🔄 [ZOHO CRM] Refreshing access token...');
    
    if (!zohoCredentials.refresh_token) {
      throw new Error('No refresh token available');
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Zoho credentials not configured');
    }

    const tokenUrl = 'https://accounts.zoho.in/oauth/v2/token';
    const tokenData = {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: zohoCredentials.refresh_token
    };

    const response = await axios.post(tokenUrl, null, {
      params: tokenData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in } = response.data;
    
    // Update credentials with new access token
    zohoCredentials.access_token = access_token;
    zohoCredentials.expires_at = new Date(Date.now() + (expires_in * 1000));

    console.log('✅ [ZOHO CRM] Access token refreshed successfully', {
      expiresIn: `${expires_in} seconds`,
      expiresAt: zohoCredentials.expires_at
    });

    logInfo('EXTERNAL_API', 'Access token refreshed successfully', {
      expiresIn: expires_in
    });

    return access_token;
  } catch (error) {
    logError('EXTERNAL_API', 'Failed to refresh access token', {
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

/**
 * Get valid access token (refresh if needed)
 */
const getValidAccessToken = async () => {
  console.log('🔍 [ZOHO CRM] Checking token validity...', {
    hasToken: !!zohoCredentials.access_token,
    hasExpiry: !!zohoCredentials.expires_at,
    isExpired: zohoCredentials.expires_at ? new Date() >= zohoCredentials.expires_at : true
  });
  
  if (isTokenValid()) {
    console.log('✅ [ZOHO CRM] Using existing valid access token');
    return zohoCredentials.access_token;
  }

  console.log('⚠️ [ZOHO CRM] Access token expired, refreshing...');
  logInfo('EXTERNAL_API', 'Access token expired, refreshing...');
  return await refreshAccessToken();
};

/**
 * Create contact in Zoho CRM
 * @param {Object} contactData - Contact information
 * @param {string} contactData.firstName - First name
 * @param {string} contactData.lastName - Last name
 * @param {string} contactData.phoneNumber - Phone number
 * @param {string} contactData.email - Email address (optional)
 * @param {Object} contactData.address - Address information (optional)
 * @param {string} contactData.company - Company name (optional)
 * @returns {Object} Created contact data from Zoho CRM
 */
export const createContactInZohoCRM = async (contactData) => {
  try {
    console.log('🚀 [ZOHO CRM] Starting to push customer to Zoho CRM...', {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      phoneNumber: contactData.phoneNumber,
      email: contactData.email
    });

    console.log('🔍 [ZOHO CRM] Getting valid access token...');
    const accessToken = await getValidAccessToken();
    
    console.log('✅ [ZOHO CRM] Access token obtained successfully:', {
      tokenLength: accessToken ? accessToken.length : 0,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'null'
    });
    
    // Prepare contact data for Zoho CRM
    const zohoContactData = {
      data: [
        {
          First_Name: contactData.firstName,
          Last_Name: contactData.lastName,
          Phone: contactData.phoneNumber,
          Email: contactData.email || `${contactData.firstName.toLowerCase()}.${contactData.lastName.toLowerCase()}@example.com`,
          Mailing_Street: contactData.address?.street || '',
          Mailing_City: contactData.address?.city || '',
          Mailing_Zip: contactData.address?.pincode?.toString() || '',
          Account_Name: contactData.company || 'Individual Customer',
          Lead_Source: 'Website',
          Description: `Contact created from JayskeralaHM system on ${new Date().toISOString()}`
        }
      ]
    };

    console.log('📤 [ZOHO CRM] Sending contact data to Zoho CRM:', {
      contactName: `${contactData.firstName} ${contactData.lastName}`,
      phone: contactData.phoneNumber,
      company: contactData.company || 'Individual Customer'
    });

    const response = await axios.post(
      'https://www.zohoapis.in/crm/v2/Contacts',
      zohoContactData,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Debug: Log the full response to understand the structure
    console.log('🔍 [ZOHO CRM] Full API Response:', JSON.stringify(response.data, null, 2));

    // Extract contact ID from different possible response structures
    let zohoContactId = null;
    let contactResponseData = null;

    if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      // Standard response structure - check both direct id and nested details.id
      if (response.data.data[0].id) {
        zohoContactId = response.data.data[0].id;
        contactResponseData = response.data.data[0];
      } else if (response.data.data[0].details?.id) {
        zohoContactId = response.data.data[0].details.id;
        contactResponseData = response.data.data[0].details;
      } else {
        zohoContactId = response.data.data[0].details?.id;
        contactResponseData = response.data.data[0];
      }
    } else if (response.data?.details && Array.isArray(response.data.details) && response.data.details.length > 0) {
      // Alternative response structure
      zohoContactId = response.data.details[0].id;
      contactResponseData = response.data.details[0];
    } else if (response.data?.id) {
      // Direct ID in response
      zohoContactId = response.data.id;
      contactResponseData = response.data;
    } else if (response.data?.Contact && response.data.Contact.id) {
      // Nested Contact object
      zohoContactId = response.data.Contact.id;
      contactResponseData = response.data.Contact;
    }

    console.log('🎉 [ZOHO CRM] SUCCESS! Customer pushed to Zoho CRM:', {
      zohoContactId: zohoContactId,
      contactName: `${contactResponseData?.firstName || contactResponseData?.First_Name || contactData.firstName} ${contactResponseData?.lastName || contactResponseData?.Last_Name || contactData.lastName}`,
      phone: contactResponseData?.phoneNumber || contactResponseData?.Phone || contactData.phoneNumber,
      status: 'CREATED',
      responseStructure: {
        hasData: !!response.data?.data,
        hasDetails: !!response.data?.details,
        hasId: !!response.data?.id,
        hasContact: !!response.data?.Contact
      }
    });

    logInfo('EXTERNAL_API', 'Contact created in Zoho CRM successfully', {
      contactId: zohoContactId,
      firstName: contactResponseData?.firstName || contactResponseData?.First_Name,
      lastName: contactResponseData?.lastName || contactResponseData?.Last_Name,
      phoneNumber: contactResponseData?.phoneNumber || contactResponseData?.Phone
    });

    return {
      success: true,
      zohoContactId: zohoContactId,
      data: contactResponseData,
      fullResponse: response.data // Include full response for debugging
    };

  } catch (error) {
    console.log('❌ [ZOHO CRM] FAILED to push customer to Zoho CRM:', {
      contactName: `${contactData?.firstName || 'Unknown'} ${contactData?.lastName || 'Customer'}`,
      phone: contactData?.phoneNumber || 'Unknown',
      error: error.message,
      status: 'FAILED'
    });

    logError('EXTERNAL_API', 'Failed to create contact in Zoho CRM', {
      error: error.message,
      contactData: {
        firstName: contactData?.firstName || 'Unknown',
        lastName: contactData?.lastName || 'Customer',
        phoneNumber: contactData?.phoneNumber || 'Unknown'
      },
      response: error.response?.data
    });

    // Don't throw error - let the main contact creation continue even if Zoho fails
    return {
      success: false,
      error: error.message,
      zohoError: error.response?.data
    };
  }
};

/**
 * Update contact in Zoho CRM
 * @param {string} zohoContactId - Zoho CRM contact ID
 * @param {Object} updateData - Updated contact information
 * @returns {Object} Updated contact data from Zoho CRM
 */
export const updateContactInZohoCRM = async (zohoContactId, updateData) => {
  try {
    const accessToken = await getValidAccessToken();
    
    const zohoUpdateData = {
      data: [
        {
          id: zohoContactId,
          ...updateData
        }
      ]
    };

    const response = await axios.put(
      `https://www.zohoapis.in/crm/v2/Contacts/${zohoContactId}`,
      zohoUpdateData,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logInfo('EXTERNAL_API', 'Contact updated in Zoho CRM successfully', {
      zohoContactId,
      updateData
    });

    return {
      success: true,
      data: response.data?.data?.[0]
    };

  } catch (error) {
    logError('EXTERNAL_API', 'Failed to update contact in Zoho CRM', {
      error: error.message,
      zohoContactId,
      updateData,
      response: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      zohoError: error.response?.data
    };
  }
};

/**
 * Get contact from Zoho CRM by phone number
 * @param {string} phoneNumber - Phone number to search
 * @returns {Object} Contact data from Zoho CRM
 */
export const getContactFromZohoCRM = async (phoneNumber) => {
  try {
    const accessToken = await getValidAccessToken();
    
    const response = await axios.get(
      `https://www.zohoapis.in/crm/v2/Contacts/search?phone=${encodeURIComponent(phoneNumber)}`,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logInfo('EXTERNAL_API', 'Contact search completed in Zoho CRM', {
      phoneNumber,
      foundContacts: response.data?.data?.length || 0
    });

    return {
      success: true,
      contacts: response.data?.data || [],
      count: response.data?.data?.length || 0
    };

  } catch (error) {
    logError('EXTERNAL_API', 'Failed to search contact in Zoho CRM', {
      error: error.message,
      phoneNumber,
      response: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      contacts: [],
      count: 0
    };
  }
};

/**
 * Test Zoho CRM connection
 * @returns {Object} Connection test result
 */
export const testZohoCRMConnection = async () => {
  try {
    const accessToken = await getValidAccessToken();
    
    const response = await axios.get(
      'https://www.zohoapis.in/crm/v2/users',
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logInfo('EXTERNAL_API', 'Zoho CRM connection test successful', {
      userCount: response.data?.users?.length || 0
    });

    return {
      success: true,
      message: 'Successfully connected to Zoho CRM',
      data: {
        users: response.data?.users || [],
        connectionStatus: 'active'
      }
    };

  } catch (error) {
    logError('EXTERNAL_API', 'Zoho CRM connection test failed', {
      error: error.message,
      response: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      zohoError: error.response?.data
    };
  }
};

/**
 * Get current Zoho credentials status
 * @returns {Object} Credentials status
 */
export const getZohoCredentialsStatus = () => {
  return {
    hasAccessToken: !!zohoCredentials.access_token,
    hasRefreshToken: !!zohoCredentials.refresh_token,
    isTokenValid: isTokenValid(),
    expiresAt: zohoCredentials.expires_at
  };
};
