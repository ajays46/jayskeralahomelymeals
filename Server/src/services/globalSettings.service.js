import prisma from '../config/prisma.js';

export const getGlobalSetting = async (key, defaultValue = null) => {
  try {
    const setting = await prisma.globalSettings.findUnique({
      where: { key }
    });
    
    if (!setting) return defaultValue;
    
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  } catch (error) {
    console.error('Error getting global setting:', error);
    return defaultValue;
  }
};

export const updateGlobalSetting = async (key, value, description = null, category = null) => {
  try {
    const result = await prisma.globalSettings.upsert({
      where: { key },
      update: { 
        value: JSON.stringify(value),
        description,
        category,
        updatedAt: new Date()
      },
      create: {
        key,
        value: JSON.stringify(value),
        description,
        category,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error updating global setting:', error);
    throw error;
  }
};

export const getAllGlobalSettings = async () => {
  try {
    const settings = await prisma.globalSettings.findMany({
      orderBy: { category: 'asc' }
    });
    return settings;
  } catch (error) {
    console.error('Error getting all global settings:', error);
    throw error;
  }
};
