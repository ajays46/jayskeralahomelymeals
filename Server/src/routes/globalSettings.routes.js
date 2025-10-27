import express from 'express';
import { 
  getGlobalSetting, 
  updateGlobalSetting, 
  getAllGlobalSettings 
} from '../services/globalSettings.service.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// Apply authentication middleware (temporarily disabled for testing)
// router.use(authenticateToken);

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await getAllGlobalSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const setting = await getGlobalSetting(req.params.key);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update setting
router.put('/:key', async (req, res) => {
  try {
    const { value, description, category } = req.body;
    await updateGlobalSetting(req.params.key, value, description, category);
    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new setting
router.post('/', async (req, res) => {
  try {
    const { key, value, description, category } = req.body;
    await updateGlobalSetting(key, value, description, category);
    res.json({ success: true, message: 'Setting created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
