// models/Batch.js
import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // We can derive studentCount from students array, but keep it simple
});

export default mongoose.model('Batch', BatchSchema);