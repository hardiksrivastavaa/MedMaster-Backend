// MedMaster-Backend/controllers/studentController.js

import Content from '../models/Content.js';
import User from '../models/User.js'; // <-- NEW: Import User model to populate batch data
import { getStudentAnnouncements } from './announcementController.js'; 

/**
 * @desc Get all dashboard content (Classes, Notes, Announcements) for the student's batch
 * @route GET /api/student/dashboard/content
 * @access Private (Student)
 */
export const getDashboardContent = async (req, res) => {
  try {
    // 1. Re-fetch user and populate batch name for accurate display
    const userWithBatch = await User.findById(req.user.id)
      .populate('batch')
      .select('-password');
    
    if (!userWithBatch) {
      return res.status(404).json({ message: "Authenticated user not found." });
    }

    // Determine the batch ID for filtering (will be null if unassigned)
    const batchId = userWithBatch.batch ? userWithBatch.batch._id : null;
    
    // Create filter to get content assigned to student's batch OR content assigned to ALL batches (batch: null)
    const batchFilter = { 
        $or: [
            { batch: null },        // Content assigned to 'All Batches'
            { batch: batchId }      // Content assigned to the student's specific batch
        ] 
    };

    // 2. Fetch Upcoming Classes (live_class)
    const upcomingClasses = await Content.find({ 
        ...batchFilter, // Use the unified filter
        contentType: 'live_class', 
        date: { $gte: new Date() } // Filter for future dates
    })
    .sort('date')
    .limit(10)
    .lean(); // Use .lean() for faster query

    // 3. Fetch Recorded Lectures
    const recordedLectures = await Content.find({ 
        ...batchFilter, // Use the unified filter
        contentType: 'recorded_lecture', 
    })
    .sort('-uploadDate')
    .limit(20)
    .lean();

    // 4. Fetch Study Notes
    const notes = await Content.find({ 
        ...batchFilter, // Use the unified filter
        contentType: 'study_note', 
    })
    .sort('-uploadDate')
    .limit(10)
    .lean();
    
    // 5. Fetch Announcements (uses existing helper logic)
    const announcements = await getStudentAnnouncements(batchId);


    // 6. Return structured data to frontend
    res.status(200).json({
      student: {
        name: userWithBatch.name,
        email: userWithBatch.email,
        batch: userWithBatch.batch ? userWithBatch.batch.name : 'Unassigned', // <-- FIXED DISPLAY
        avatar: userWithBatch.avatar,
      },
      upcomingClasses,
      recordedLectures,
      notes,
      announcements,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching dashboard content', error: error.message });
  }
};


/**
 * @desc Log a view for a recorded lecture
 * @route POST /api/student/content/:id/view
 * @access Private (Student)
 */
export const logContentView = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content || content.contentType !== 'recorded_lecture') {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Increment views count atomically
    content.views = (content.views || 0) + 1; // Safely initialize if null
    await content.save();

    res.status(200).json({ message: 'View logged successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


/**
 * @desc Log a download for a study note
 * @route POST /api/student/content/:id/download
 * @access Private (Student)
 */
export const logNoteDownload = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content || content.contentType !== 'study_note') {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Increment downloads count atomically
    content.downloads = (content.downloads || 0) + 1; // Safely initialize if null
    await content.save();

    res.status(200).json({ message: 'Download logged successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};