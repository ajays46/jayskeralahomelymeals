import express from 'express';
import multer from 'multer';
import path from 'path';


const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // folder to save
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

  export default router;

  