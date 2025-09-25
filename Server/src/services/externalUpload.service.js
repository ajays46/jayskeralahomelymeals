import fetch from 'node-fetch';
import FormData from 'form-data';

// Upload image to external API
export const uploadImageToExternalAPI = async (file, userId, expectedAmount) => {
  try {
    
    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });
    
    // Add expected amount to the form data
    formData.append('expected_amount', expectedAmount.toString());
    
    const response = await fetch(`${process.env.AI_ROUTE_API}/api/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mysecretkey123'
      },
      body: formData
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        return {
          success: false,
          error: 'External service unavailable (400 error)',
          status: 400
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check if the external API validation was successful
    if (result.success || result.status === 'success' || response.ok) {
      // Look for URL in multiple possible locations including s3_url
      const imageUrl = result.url || 
                      result.imageUrl || 
                      result.s3_url || 
                      result.data?.url || 
                      result.image_url || 
                      result.data?.image_url ||
                      result.data?.s3_url;
      
      if (imageUrl) {
        return {
          success: true,
          url: imageUrl,
          data: result
        };
      } else {
        return {
          success: false,
          error: 'No URL returned from external service',
          data: result
        };
      }
    } else {
      // External API validation failed - return detailed error information
      return {
        success: false,
        error: result.error || result.message || 'Payment receipt verification failed',
        details: result.details || [],
        data: result
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.status || 500
    };
  }
};
