import Content from '../models/Content.js';
import Batch from '../models/Batch.js'; // To validate batch existence


// Helper to reliably extract YouTube ID
const extractYoutubeId = (urlOrId) => {
  // Check if it's already a simple ID (e.g., 11 chars)
  if (urlOrId.length <= 11 && /^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }

  // Pattern to match common YouTube URL formats
  const urlPattern = /(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.match(urlPattern);

  // Return the captured ID (group 1) or the original string if no match
  return (match && match[1].length === 11) ? match[1] : urlOrId;
}

/**
 * @desc Get all content items by type (for Tutor Management tables)
 * @route GET /api/tutor/content?type=...
 * @access Private (Tutor)
 */
export const getTutorContent = async (req, res) => {
  try {
    const { type } = req.query; // 'live_class', 'recorded_lecture', 'study_note'
    let filter = {};

    if (type) {
      if (!['live_class', 'recorded_lecture', 'study_note'].includes(type)) {
        return res.status(400).json({ message: 'Invalid content type filter.' });
      }
      filter.contentType = type;
    }

    const content = await Content.find(filter)
      .populate({
        path: 'batch',
        select: 'name' // Only return the batch name
      })
      .sort(type === 'live_class' ? 'date' : '-uploadDate');

    // The frontend mock data uses 'batch' name, so we structure the output accordingly
    const formattedContent = content.map(item => ({
      ...item.toObject(),
      batch: item.batch ? item.batch.name : 'All Batches', // Format batch for UI display
    }));

    res.status(200).json(formattedContent);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching content', error: error.message });
  }
};

/**
 * @desc Create a new content item (Live Class, Recorded Lecture, or Note)
 * @route POST /api/tutor/content
 * @access Private (Tutor)
 */
export const createContent = async (req, res) => {
  try {
    const {
      title,
      contentType,
      batch,
      date,
      time,
      meetLink,
      youtubeId,
      duration,
      downloadUrl,
      fileSize,
      subject,
      description
    } = req.body;

    if (!title || !contentType || !batch) {
      return res.status(400).json({ message: 'Title, content type, and batch are required.' });
    }

    // 1. Validate Batch ID
    if (batch && batch.toLowerCase() !== 'all') { // <-- Check if it's not "all"
      const existingBatch = await Batch.findById(batch);
      if (!existingBatch) {
        return res.status(404).json({ message: 'Specified batch not found.' });
      }
    }

    // 2. Validate content-specific fields
    const newContentData = {
      title,
      contentType,
      batch: batch === 'all' ? null : batch, // Store null for "All Batches"
      uploadedBy: req.user.id,
      subject,
      description
    };

    switch (contentType) {
      case 'live_class':
        if (!date || !time || !meetLink) {
          return res.status(400).json({ message: 'Live class requires date, time, and meeting link.' });
        }
        Object.assign(newContentData, { date, time, meetLink });
        break;

      case 'recorded_lecture':
        if (!youtubeId || !duration) {
          return res.status(400).json({ message: 'Recorded lecture requires YouTube ID and duration.' });
        }
        // FIX: Extract the ID if a full URL was pasted
        const finalYoutubeId = extractYoutubeId(youtubeId);
        Object.assign(newContentData, { youtubeId: finalYoutubeId, duration });
        break;

      case 'study_note':
        if (!downloadUrl || !fileSize) {
          // In a real app, 'downloadUrl' would be returned after file upload to storage
          return res.status(400).json({ message: 'Study note requires download URL and file size.' });
        }
        Object.assign(newContentData, { downloadUrl, fileSize });
        break;

      default:
        return res.status(400).json({ message: 'Invalid content type.' });
    }

    const newContent = new Content(newContentData);
    const createdContent = await newContent.save();

    res.status(201).json({ message: `${contentType.replace('_', ' ')} created successfully`, content: createdContent });

  } catch (error) {
    res.status(500).json({ message: 'Server Error creating content', error: error.message });
  }
};

/**
 * @desc Update a content item
 * @route PUT /api/tutor/content/:id
 * @access Private (Tutor)
 */
export const updateContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content item not found.' });
    }

    // Prevent tutor from changing the content type after creation
    if (req.body.contentType && req.body.contentType !== content.contentType) {
      return res.status(400).json({ message: 'Cannot change content type on update.' });
    }

    // Handle 'batch' update (convert 'all' string to null for storage)
    if (req.body.batch && req.body.batch !== 'all') {
      const existingBatch = await Batch.findById(req.body.batch);
      if (!existingBatch) {
        return res.status(404).json({ message: 'Specified batch not found.' });
      }
      content.batch = req.body.batch;
    } else if (req.body.batch === 'all') {
      content.batch = null;
    }

    // Update all other fields generically
    Object.keys(req.body).forEach(key => {
      if (key !== 'contentType' && key !== 'batch') {
        content[key] = req.body[key];
      }
    });

    const updatedContent = await content.save();

    res.status(200).json({ message: 'Content updated successfully', content: updatedContent });
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating content', error: error.message });
  }
};

/**
 * @desc Delete a content item
 * @route DELETE /api/tutor/content/:id
 * @access Private (Tutor)
 */
export const deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content item not found.' });
    }

    res.status(200).json({ message: 'Content deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting content', error: error.message });
  }
};