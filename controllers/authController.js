import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // Assuming you have defined the User model

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d', // Defaults to 30 days if not set
  });
};

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields: name, email, and password.' });
    }

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role, // Can be set via an admin tool or defaulted to 'student'
      isWhitelisted: role === 'tutor' ? true : false, // Tutor accounts are whitelisted by default
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isWhitelisted: user.isWhitelisted,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error during registration', error: error.message });
  }
};

/**
 * @desc Authenticate a user & get token
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Received login attempt for:', email);

    // 1. Check for user existence
    const user = await User.findOne({ email }).select('+password'); // Select password hash for comparison
    
    // 2. User exists & password matches
    if (user && (await bcrypt.compare(password, user.password))) {

      // For students (Auth.tsx logic), ensure they are whitelisted before granting access
      if (user.role === 'student' && !user.isWhitelisted) {
        return res.status(403).json({ 
            message: "Access denied. Your Gmail ID is not whitelisted by Dr. Srivastava." 
        });
      }

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch: user.batch, // Include batch info for dashboard routing
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials or user not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error during login', error: error.message });
  }
};

/**
 * @desc Get current user data
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req, res) => {
  // req.user is populated by the `protect` middleware
  // We explicitly exclude the password in the middleware, so it's safe to return req.user
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(404).json({ message: 'User not found (invalid token)' });
  }
};