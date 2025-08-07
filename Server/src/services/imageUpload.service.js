import fs from 'fs';
import path from 'path';

// Save base64 image to uploads folder
export const saveBase64Image = (base64String, filename) => {
  try {
    console.log('Starting to save base64 image...');
    console.log('Base64 string length:', base64String.length);
    
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Base64 data length after prefix removal:', base64Data.length);
    
    // Create buffer from base64
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('Buffer created, size:', buffer.length);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'src', 'services', 'uploads');
    console.log('Uploads directory path:', uploadsDir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    } else {
      console.log('Uploads directory already exists');
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `image-${uniqueSuffix}.jpg`;
    }
    console.log('Filename to save:', filename);
    
    // Save file
    const filePath = path.join(uploadsDir, filename);
    console.log('Full file path:', filePath);
    fs.writeFileSync(filePath, buffer);
    console.log('File saved successfully!');
    
    return filename;
  } catch (error) {
    console.error('Error in saveBase64Image:', error);
    throw new Error('Failed to save base64 image: ' + error.message);
  }
};

// Save file buffer to uploads folder
export const saveFileBuffer = (buffer, filename) => {
  try {
    console.log('Starting to save file buffer...');
    console.log('Buffer size:', buffer.length);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'src', 'services', 'uploads');
    console.log('Uploads directory path:', uploadsDir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    } else {
      console.log('Uploads directory already exists');
    }
    
    // Generate unique filename if not provided
    if (!filename) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      filename = `file-${uniqueSuffix}`;
    }
    console.log('Filename to save:', filename);
    
    // Save file
    const filePath = path.join(uploadsDir, filename);
    console.log('Full file path:', filePath);
    fs.writeFileSync(filePath, buffer);
    console.log('File saved successfully!');
    
    return filename;
  } catch (error) {
    console.error('Error in saveFileBuffer:', error);
    throw new Error('Failed to save file buffer: ' + error.message);
  }
}; 