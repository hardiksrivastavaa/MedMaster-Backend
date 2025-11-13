import Announcement from '../models/Announcement.js';
import Batch from '../models/Batch.js';

// --- TUTOR CONTROLLER FUNCTIONS ---

/**
 * @desc Create and send a new announcement
 * @route POST /api/tutor/announcements
 * @access Private (Tutor)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, announcementBatch: batch, priority = 'Notice' } = req.body;
    
    // The frontend sends 'all' for all batches, otherwise an ID.
    // We store null in the DB for 'all' or the actual Batch ID.
    const batchId = batch === 'all' ? null : batch;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required for an announcement.' });
    }

    // Optional: Validate if the provided batch ID actually exists
    if (batchId) {
      const existingBatch = await Batch.findById(batchId);
      if (!existingBatch) {
        return res.status(404).json({ message: 'Target batch not found.' });
      }
    }

    const newAnnouncement = new Announcement({
      title,
      message,
      batch: batchId,
      priority,
      sentBy: req.user.id, // Tutor's ID from middleware
      date: new Date()
    });

    const createdAnnouncement = await newAnnouncement.save();

    res.status(201).json({ 
      message: 'Announcement sent successfully.', 
      announcement: createdAnnouncement 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error sending announcement', error: error.message });
  }
};


// --- STUDENT CONTROLLER FUNCTION (Called via studentController.js) ---

/**
 * @desc Retrieve announcements for a specific student (by batch)
 * @param {string} batchId - The ObjectId of the student's batch or null for unassigned.
 * @returns {Array} List of relevant announcements
 */
export const getStudentAnnouncements = async (batchId) => {
  if (!batchId) {
      // If student is unassigned, they only see 'all' announcements (batch: null)
      return await Announcement.find({ batch: null }).sort('-date').lean();
  }

  // Find announcements sent to their specific batch OR sent to all batches (batch: null)
  const announcements = await Announcement.find({
    $or: [
      { batch: batchId },
      { batch: null }
    ]
  })
  .sort('-date')
  .lean(); 

  return announcements;
};

// You might also want a dedicated endpoint for tutors to view all past announcements
/**
 * @desc Get all past announcements (for Tutor Dashboard history)
 * @route GET /api/tutor/announcements
 * @access Private (Tutor)
 */
export const getTutorAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate({ path: 'batch', select: 'name' }) // Show which batch it was sent to
      .populate({ path: 'sentBy', select: 'name' }) // Show which tutor sent it
      .sort('-date');

    const formattedAnnouncements = announcements.map(ann => ({
      ...ann.toObject(),
      batchName: ann.batch ? ann.batch.name : 'All Students',
      sentByName: ann.sentBy ? ann.sentBy.name : 'System',
    }));

    res.status(200).json(formattedAnnouncements);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching announcements', error: error.message });
  }
};