// routes/uploadRoutes.js
const express = require('express');
const path = require('path');
const Image = require('../models/Image');
const upload = require('../utils/uploadImage'); // Multer upload middleware
const router = express.Router();

// Generalized image upload route
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Create a new Image document and save it
    const newImage = new Image({
      file_name: req.file.originalname,
      file_path: `/uploads/${req.file.filename}`,  // Save the relative file path
      file_size: req.file.size,
      file_type: req.file.mimetype,
    });

    await newImage.save();

    res.json({
      message: 'Image uploaded successfully!',
      image: newImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading image', error });
  }
});

module.exports = router;
