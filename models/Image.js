// models/Image.js
const mongoose = require('mongoose');

// Image Schema
const imageSchema = new mongoose.Schema(
  {
    file_name: { type: String, required: true }, 
    file_path: { type: String, required: true },   
    file_size: { type: Number, required: true },   
    file_type: { type: String, required: true }, 
    uploaded_at: { type: Date, default: Date.now }, 
    entity_type: { type: String }, 
    entity_id: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
