import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  let { username, email, password, fullName } = req.body;

  try {
    console.log('Starting registration process with data:', {
      username,
      email,
      fullName,
      password: '***'
    });

    // Normalize input
    email = email.trim().toLowerCase();
    username = username.trim();
    fullName = fullName.trim();

    console.log('Normalized input:', { username, email, fullName });

    if (!email || !username || !password || !fullName) {
      console.log('Missing required fields:', {
        hasEmail: !!email,
        hasUsername: !!username,
        hasPassword: !!password,
        hasFullName: !!fullName
      });
      res.status(400);
      throw new Error('Please enter all required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    console.log('Checking if user already exists...');
    // Check if user exists
    const userExists = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    });

    if (userExists) {
      console.log('User already exists:', {
        existingEmail: userExists.email,
        existingUsername: userExists.username
      });
      res.status(400);
      throw new Error(
        userExists.email === email 
          ? 'Email is already registered' 
          : 'Username is already taken'
      );
    }

    console.log('Creating new user in database...');
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
    });

    console.log('User created successfully:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    if (user) {
      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      console.log('Sending success response with token');
      res.status(201).json({
        ...userResponse,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Full error stack:', error.stack);
    console.error('MongoDB connection state:', mongoose.connection.readyState);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for:', email);
    console.log('Request body:', { ...req.body, password: '***' });

    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      res.status(400);
      throw new Error('Please enter all required fields');
    }

    // Trim email and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    // Find user by email or username and explicitly select password field
    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: email.trim() }
      ]
    }).select('+password');

    console.log('User found:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      hasPassword: !!user.password
    } : 'No user found');

    if (user) {
      const isMatch = await user.matchPassword(password);
      console.log('Password match result:', isMatch);

      if (isMatch) {
        console.log('Password matched for user:', user.username);
        
        const token = generateToken(user._id);
        console.log('Token generated:', !!token);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
          ...userResponse,
          token
        });
      } else {
        console.log('Password did not match');
        res.status(401);
        throw new Error('Invalid email/username or password');
      }
    } else {
      console.log('No user found with email/username:', email);
      res.status(401);
      throw new Error('Invalid email/username or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// @desc    Send password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Please enter your email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    // Find user by email only
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false }); // Skip validation

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);
    
    res.json({
      message: 'Password reset link has been sent to your email'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    if (!password) {
      res.status(400);
      throw new Error('Please enter a new password');
    }

    // Hash token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired password reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate authentication token
    const authToken = generateToken(user._id);

    // Return user data and token
    res.json({
      message: 'Password has been reset successfully',
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      token: authToken
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// Добавляем новую функцию после существующих
const updateAdminRole = async () => {
  try {
    // Проверяем наличие ADMIN_EMAIL
    if (!process.env.ADMIN_EMAIL) {
      console.log('ADMIN_EMAIL not found in environment variables');
      return;
    }

    // Ищем пользователя с админским email
    const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    
    if (adminUser && adminUser.role !== 'admin') {
      console.log('Updating user to admin role:', adminUser.email);
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Successfully updated user to admin role');
    }
  } catch (error) {
    console.error('Error updating admin role:', error);
  }
};

// Вызываем функцию при старте сервера
updateAdminRole();

export { registerUser, loginUser, forgotPassword, resetPassword }; 