import mongoose from 'mongoose';

const glossarySchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    unique: true
  },
  definition: {
    type: String,
    required: true
  },
  url: {
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

const Glossary = mongoose.model('Glossary', glossarySchema);
export default Glossary;