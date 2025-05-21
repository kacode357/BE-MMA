const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    package_name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    created_at: { type: Date, default: Date.now },
}
);

module.exports = mongoose.model("Package", packageSchema);