import User from '../models/userModel.js';

export const checkBlockedStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Your account has been blocked. You cannot perform this action.' 
      });
    }

    next();
  } catch (error) {
    console.error('Check blocked status middleware error:', error);
    res.status(500).json({ message: 'Server error checking user status' });
  }
}; 