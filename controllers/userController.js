import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * @desc Get user profile by ID (can be used by both student and tutor for their own profile)
 * @route GET /api/user/:id/profile
 * @access Private
 */
export const getUserProfile = async (req, res) => {
  try {
    // Ensure the authenticated user is only accessing their own profile
    if (req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to view this profile.' });
    }

    // Populate the batch information
    const user = await User.findById(req.params.id).populate('batch');

    if (user) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch: user.batch,
        avatar: user.avatar,
        progress: user.progress,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc Update user profile (name, email, avatar, password)
 * @route PUT /api/user/:id/profile
 * @access Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    // Ensure the authenticated user is only updating their own profile
    if (req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile.' });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar || user.avatar;
      
      // Update password if a new one is provided
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      
      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        batch: updatedUser.batch,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};