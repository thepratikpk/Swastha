import multer from 'multer';
import path from 'path';

// Define the storage destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the directory for temporary file storage
    // Make sure this directory exists in your project
    cb(null, './public/temp'); 
  },
  filename: function (req, file, cb) {
    // Create a unique filename to avoid conflicts
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// Configure multer with the storage options
export const upload = multer({ 
  storage: storage 
});