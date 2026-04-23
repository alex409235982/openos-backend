import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
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
  distroCategory: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

favoriteSchema.index({ userId: 1, distroId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;