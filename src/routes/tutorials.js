import express from 'express';
import Tutorial from '../models/Tutorial.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const tutorials = await Tutorial.find(query).sort({ order: 1, createdAt: -1 });
    res.json(tutorials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);
    if (!tutorial) {
      return res.status(404).json({ error: 'Tutorial not found' });
    }
    res.json(tutorial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/progress', authenticateToken, async (req, res) => {
  try {
    const { tutorialId, completed } = req.body;
    
    const user = req.user;
    if (!user.tutorialProgress) {
      user.tutorialProgress = new Map();
    }
    
    user.tutorialProgress.set(tutorialId, { completed, completedAt: new Date() });
    await user.save();
    
    res.json({ message: 'Progress updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const progress = req.user.tutorialProgress || {};
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;