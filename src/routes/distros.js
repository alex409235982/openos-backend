import express from 'express';
import Distro from '../models/Distro.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const distros = await Distro.find(query).sort({ order: 1 });
    res.json(distros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;