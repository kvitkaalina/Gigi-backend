import express from 'express';
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUserRole
} from '../controllers/authController.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/update-role/:userId', protect, isAdmin, updateUserRole);

export default router; 