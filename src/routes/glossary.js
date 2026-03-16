import express from 'express';
import Glossary from '../models/Glossary.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const terms = await Glossary.find().sort({ order: 1, term: 1 });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const term = await Glossary.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ error: 'Term not found' });
    }
    res.json(term);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;