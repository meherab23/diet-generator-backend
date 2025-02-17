// utils/uploadImage.js
const multer = require('multer');
const path = require('path');

// Setup storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');  // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique file name
  }
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type, only JPEG, PNG and GIF are allowed!'), false);
  }
};

// Create the upload middleware
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // Maximum file size (5MB)
});

module.exports = upload;
