import fetch from 'node-fetch';
import FormData from 'form-data';

// Upload image to external API
export const uploadImageToExternalAPI = async (file, userId) => {
  try {
    
    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });
    
    const response = await fetch(`${process.env.AI_ROUTE_API}/api/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mysecretkey123'
      },
      body: formData
    });
    
    if (!response.ok) {
      if (response.status === 400) {
        console.warn('External API returned 400 - service unavailable');
        return {
          success: false,
          error: 'External service unavailable (400 error)',
          status: 400
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success || result.status === 'success' || response.ok) {
      const imageUrl = result.url || result.imageUrl || result.data?.url || result.image_url || result.data?.image_url;
      if (imageUrl) {
        return {
          success: true,
          url: imageUrl,
          data: result
        };
      } else {
        console.warn('External API response successful but no URL found:', result);
        return {
          success: false,
          error: 'No URL returned from external service',
          data: result
        };
      }
    } else {
      throw new Error(result.message || result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('External upload error:', error);
    return {
      success: false,
      error: error.message,
      status: error.status || 500
    };
  }
};
