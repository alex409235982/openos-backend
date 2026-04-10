import mongoose from 'mongoose';

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  duration: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'commands', 'system', 'networking', 'security', 'package-management', 'file-management', 'processes'],
    required: true
  },
  order: {
    type: Number,
    default: 999
  },
  timestamp: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Tutorial = mongoose.model('Tutorial', tutorialSchema);
export default Tutorial;