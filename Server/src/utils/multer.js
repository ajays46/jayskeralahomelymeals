import express from 'express';
import multer from 'multer';
import path from 'path';


const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Check if this is a payment receipt upload
      if (req.originalUrl.includes('/payments') && file.fieldname === 'receipt') {
        cb(null, 'src/services/payment-receipts/'); // Save payment receipts to dedicated folder
      } else {
        cb(null, 'uploads/'); // Save other files to general uploads folder
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + file.originalname;
      cb(null, uniqueSuffix);
    }
  });

  const upload = multer({ storage: storage });

  router.post('/upload', upload.single('image'), (req, res) => {
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ filePath });
  });

  export { upload };
  export default router;

  