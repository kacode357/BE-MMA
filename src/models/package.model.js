const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  package_name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  img_url: { type: String, trim: true, required: false },
  ai_model: { 
    type: String, 
    trim: true, 
    enum: ["gemini", "thehive", "none"], // Allowed AI models
    default: "none" // Default for packages not tied to a specific model
  },
  supported_features: { 
    type: [String], 
    enum: ["text", "image", "image_to_image"], // Allowed features
    default: ["text"] // Default to text if not specified
  },
  created_at: { type: Date, default: Date.now },
  is_delete: { type: Boolean, default: false },
  is_premium: { type: Boolean, default: false },
});

module.exports = mongoose.model("Package", packageSchema);