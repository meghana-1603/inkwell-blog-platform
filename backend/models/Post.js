
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20000
  },
  excerpt: {
    type: String,
    maxlength: 300,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'General'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
