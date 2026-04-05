import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distroId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distro',
    required: true
  },
  distroName: {
    type: String,
    required: true
  },
  distroLogo: {
    type: String,
    required: true
  },
  vmUsername: {
    type: String,
    required: true
  },
  vmPassword: {
    type: String,
    required: true
  },
  vmId: {
    type: String,
    required: true
  },
  vmPort: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['starting', 'running', 'ended', 'expired', 'failed'],
    default: 'running'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: Number
}, {
  timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;