// models/Announcement.js
import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  batch: { // Can be a single Batch ID or a value indicating "All"
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
  },
  priority: { 
    type: String, 
    enum: ['Notes', 'Live Class', 'Recorded Lecture', 'Notice'], 
    default: 'Notice' 
  },
  date: { type: Date, default: Date.now },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

export default mongoose.model('Announcement', AnnouncementSchema);