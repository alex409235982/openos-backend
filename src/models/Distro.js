import mongoose from 'mongoose';

const distroSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  logo: {
    type: String,
    required: true
  },
  screenshot: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'gaming', 'security'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  longDescription: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 999
  }
}, {
  timestamps: true
});

const Distro = mongoose.model('Distro', distroSchema);
export default Distro;