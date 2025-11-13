// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // For email/password login
  role: { 
    type: String, 
    enum: ['student', 'tutor'], 
    default: 'student' 
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  avatar: { type: String, default: 'default-avatar.png' },
  progress: { type: Number, default: 0 }, // Student-specific
  isWhitelisted: { type: Boolean, default: false } // For Auth.tsx logic
});

export default mongoose.model('User', UserSchema);