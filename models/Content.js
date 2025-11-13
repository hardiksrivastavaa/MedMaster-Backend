// models/Content.js
import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  contentType: {
    type: String,
    enum: ['live_class', 'recorded_lecture', 'study_note'],
    required: true
  },
  batch: { // The batch(es) this content is shared with
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: false,
    default: null
  },
  description: { type: String },
  // Fields for LIVE_CLASS
  date: { type: Date },
  time: { type: String }, // e.g., "10:00 AM"
  meetLink: { type: String },
  // Fields for RECORDED_LECTURE
  youtubeId: { type: String },
  duration: { type: String }, // e.g., "1h 45m"
  views: { type: Number, default: 0 },
  // Fields for STUDY_NOTE
  downloadUrl: { type: String }, // URL to S3, Firebase Storage, etc.
  fileSize: { type: String }, // e.g., "2.4 MB"
  downloads: { type: Number, default: 0 },
  
  // General Fields
  subject: { type: String }, // e.g., "Pathology", "Anatomy"
  uploadDate: { type: Date, default: Date.now },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

export default mongoose.model('Content', ContentSchema);