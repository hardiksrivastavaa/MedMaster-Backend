import Batch from '../models/Batch.js';
import User from '../models/User.js';

/**
 * @desc Get all batches, including the count of enrolled students
 * @route GET /api/tutor/batches
 * @access Private (Tutor)
 */
export const getAllBatches = async (req, res) => {
  try {
    // 1. Fetch all batches
    const batches = await Batch.find({});
    
    // 2. Get student counts for each batch from the User model
    const batchesWithCounts = await Promise.all(
      batches.map(async (batch) => {
        const studentCount = await User.countDocuments({ batch: batch._id, role: 'student' });
        
        return {
          id: batch._id,
          name: batch.name,
          description: batch.description,
          studentCount: studentCount,
        };
      })
    );

    res.status(200).json(batchesWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching batches', error: error.message });
  }
};

/**
 * @desc Create a new batch
 * @route POST /api/tutor/batches
 * @access Private (Tutor)
 */
export const createBatch = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Batch name and description are required.' });
    }

    const newBatch = new Batch({ name, description });
    const createdBatch = await newBatch.save();

    // Return the new batch object, mimicking the structure expected by the frontend
    res.status(201).json({
      id: createdBatch._id,
      name: createdBatch.name,
      description: createdBatch.description,
      studentCount: 0,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A batch with this name already exists.' });
    }
    res.status(500).json({ message: 'Server Error creating batch', error: error.message });
  }
};

/**
 * @desc Update an existing batch
 * @route PUT /api/tutor/batches/:id
 * @access Private (Tutor)
 */
export const updateBatch = async (req, res) => {
  try {
    const { name, description } = req.body;
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    if (name) batch.name = name;
    if (description) batch.description = description;

    const updatedBatch = await batch.save();

    // Re-calculate count for accurate response
    const studentCount = await User.countDocuments({ batch: updatedBatch._id, role: 'student' });

    res.status(200).json({
      id: updatedBatch._id,
      name: updatedBatch.name,
      description: updatedBatch.description,
      studentCount: studentCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating batch', error: error.message });
  }
};

/**
 * @desc Delete a batch and unassign all related students
 * @route DELETE /api/tutor/batches/:id
 * @access Private (Tutor)
 */
export const deleteBatch = async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await Batch.findByIdAndDelete(batchId);

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    // Crucial step: Unset the 'batch' field for all students in this batch
    await User.updateMany({ batch: batchId }, { $unset: { batch: 1 } });

    res.status(200).json({ message: 'Batch deleted and students unassigned successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting batch', error: error.message });
  }
};