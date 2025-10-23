# Zoho CRM Integration Guide

This guide explains how to connect your application with Zoho CRM for SMS functionality.

## Prerequisites

1. **Zoho CRM Account**: You need a Zoho CRM account
2. **Zoho Developer Console**: Access to create OAuth applications
3. **Environment Variables**: Configure the required credentials

## Setup Steps

### 1. Create Zoho OAuth Application

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Click "Add Client" and select "Server-based Applications"
3. Fill in the application details:
   - **Client Name**: Your application name
   - **Homepage URL**: Your application URL
   - **Authorized Redirect URIs**: 
     - For testing: `http://localhost:5000/api/zoho/callback`
     - For production: `https://www.jayskeralainnovations.com/jkhm/oauth/callback`
4. Note down the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Create a `.env` file in your Server directory with the following variables:

**For Local Testing:**
```env
# Zoho CRM OAuth App Credentials (Localhost)
ZOHO_CLIENT_ID=your_actual_client_id_here
ZOHO_CLIENT_SECRET=your_actual_client_secret_here
ZOHO_REDIRECT_URI=http://localhost:5000/api/zoho/callback
```

**For Production:**
```env
# Zoho CRM OAuth App Credentials (Production)
ZOHO_CLIENT_ID=your_actual_client_id_here
ZOHO_CLIENT_SECRET=your_actual_client_secret_here
ZOHO_REDIRECT_URI=https://www.jayskeralainnovations.com/jkhm/oauth/callback
```

**Important**: Replace the placeholder values with your actual Zoho credentials.

### 3. API Endpoints

The following endpoints are now available:

#### Get Authorization URL
```http
GET /api/zoho/auth-url
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.zoho.com/oauth/v2/auth?scope=...",
  "message": "Visit this URL to authorize the application with Zoho CRM"
}
```

#### Exchange Code for Tokens
```http
POST /api/zoho/exchange-tokens
Content-Type: application/json

{
  "code": "authorization_code_from_zoho"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully obtained access token and refresh token",
  "data": {
    "access_token": "1000.abc123...",
    "refresh_token": "1000.def456...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

#### Refresh Access Token
```http
POST /api/zoho/refresh-token
Content-Type: application/json

{
  "refresh_token": "your_refresh_token_here"
}
```

#### Test Connection
```http
POST /api/zoho/test-connection
Content-Type: application/json

{
  "access_token": "your_access_token_here"
}
```

#### OAuth Callback (Automatic)
```http
GET /api/zoho/callback?code=authorization_code&state=optional_state
```

**Note**: This endpoint is automatically called by Zoho after user authorization. It handles the OAuth callback and returns the tokens.

## Usage Flow

### For Localhost Testing

#### Step 1: Start Your Server
```bash
cd Server
npm start
# Server will run on http://localhost:5000
```

#### Step 2: Get Authorization URL
```bash
# Test the auth URL endpoint
curl http://localhost:5000/api/zoho/auth-url
```

#### Step 3: Authorize Application
1. Copy the `authUrl` from the response
2. Visit the URL in your browser
3. Log in to your Zoho account and authorize the application
4. Zoho will redirect to: `http://localhost:5000/api/zoho/callback`

#### Step 4: Get Tokens
The callback endpoint will automatically handle the authorization code and return:
```json
{
  "success": true,
  "message": "Successfully authorized with Zoho CRM",
  "data": {
    "access_token": "1000.abc123...",
    "refresh_token": "1000.def456...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

### For Production

#### Step 1: Get Authorization URL
1. Call `GET /api/zoho/auth-url` to get the authorization URL
2. Visit the returned URL in your browser
3. Log in to your Zoho account and authorize the application
4. Zoho will automatically redirect to: `https://www.jayskeralainnovations.com/jkhm/oauth/callback`

#### Step 2: Handle OAuth Callback
1. The callback endpoint (`GET /api/zoho/callback`) will automatically receive the authorization code
2. It will exchange the code for access_token and refresh_token
3. The tokens will be returned in the response

#### Step 3: Use Access Token
1. Use the `access_token` for making API calls to Zoho CRM
2. When the token expires, use `refresh_token` to get a new access token

## Security Notes

1. **Never expose credentials**: Keep your Client ID and Client Secret secure
2. **Store tokens securely**: Access and refresh tokens should be stored securely
3. **Use HTTPS in production**: Always use HTTPS for production deployments
4. **Token expiration**: Access tokens expire in 1 hour, refresh tokens last longer

## Error Handling

The API includes comprehensive error handling and logging:

- **400 Bad Request**: Missing required parameters or invalid credentials
- **500 Internal Server Error**: Zoho API errors or network issues

All errors are logged using the application's logging system for debugging.

## Next Steps

Once you have the access token, you can:

1. **Send SMS**: Use Zoho CRM's SMS API to send messages
2. **Manage Contacts**: Create, update, and manage CRM contacts
3. **Track Activities**: Log calls, emails, and other activities
4. **Automate Workflows**: Set up automated processes

## Testing

You can test the integration using tools like Postman or curl:

```bash
# Get authorization URL
curl -X GET http://localhost:5000/api/zoho/auth-url

# Exchange code for tokens (replace with actual code)
curl -X POST http://localhost:5000/api/zoho/exchange-tokens \
  -H "Content-Type: application/json" \
  -d '{"code":"your_authorization_code_here"}'
```

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your Zoho credentials are correct
3. Ensure your redirect URI matches exactly
4. Check Zoho CRM API documentation for any changes
