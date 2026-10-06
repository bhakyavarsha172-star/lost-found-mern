const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics', 'Documents', 'Jewelry', 'Bags & Wallets',
  'Clothing', 'Keys', 'Pets', 'Books', 'Sports Equipment', 'Other'
];

const imageSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }
}, { _id: true });

const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },

  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  category: { type: String, enum: CATEGORIES, required: true },

  // Where / when the item was lost or found
  location: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) { return v <= new Date(); },
      message: 'Date cannot be in the future'
    }
  },

  images: { type: [imageSchema], validate: [arr => arr.length <= 5, 'Maximum 5 images per item'] },

  contactName: { type: String, required: true, trim: true, maxlength: 60 },
  contactPhone: { type: String, trim: true, maxlength: 20 },
  contactEmail: { type: String, trim: true, maxlength: 100 },

  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['open', 'claimed', 'resolved'], default: 'open' },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  claimNote: { type: String, trim: true, maxlength: 500, default: '' }
}, { timestamps: true });

itemSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
