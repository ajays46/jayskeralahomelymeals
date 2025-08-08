import fs from 'fs';
import path from 'path';

// Save base64 image to uploads folder
export const saveBase64Image = (base64String, filename) => {
  try {
    
    
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');

    
    // Create buffer from base64
    const buffer = Buffer.from(base64Data, 'base64');

    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'src', 'services', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `image-${uniqueSuffix}.jpg`;
    }
    
    // Save file
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    return filename;
  } catch (error) {
    console.error('Error in saveBase64Image:', error);
    throw new Error('Failed to save base64 image: ' + error.message);
  }
};

// Save file buffer to uploads folder
export const saveFileBuffer = (buffer, filename) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'src', 'services', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `file-${uniqueSuffix}`;
    }
    
    // Save file
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    return filename;
  } catch (error) {
    console.error('Error in saveFileBuffer:', error);
    throw new Error('Failed to save file buffer: ' + error.message);
  }
}; 