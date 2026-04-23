import express from 'express';
import Favorite from '../models/Favorite.js';
import Distro from '../models/Distro.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

router.post('/:distroId', authenticateToken, async (req, res, next) => {
  try {
    const { distroId } = req.params;
    
    const distro = await Distro.findById(distroId);
    if (!distro) {
      return res.status(404).json({ error: 'Distribution not found' });
    }
    
    const existing = await Favorite.findOne({ userId: req.user._id, distroId });
    
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ favorited: false, message: 'Removed from favorites' });
    }
    
    const favorite = new Favorite({
      userId: req.user._id,
      distroId,
      distroName: distro.name,
      distroLogo: distro.logo,
      distroCategory: distro.category
    });
    
    await favorite.save();
    
    res.json({ favorited: true, favorite, message: 'Added to favorites' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:distroId', authenticateToken, async (req, res, next) => {
  try {
    const { distroId } = req.params;
    
    const favorite = await Favorite.findOne({ userId: req.user._id, distroId });
    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    await Favorite.deleteOne({ _id: favorite._id });
    
    res.json({ favorited: false, message: 'Removed from favorites' });
  } catch (error) {
    next(error);
  }
});

router.get('/check/:distroId', authenticateToken, async (req, res, next) => {
  try {
    const { distroId } = req.params;
    const favorite = await Favorite.findOne({ userId: req.user._id, distroId });
    res.json({ favorited: !!favorite });
  } catch (error) {
    next(error);
  }
});

export default router;