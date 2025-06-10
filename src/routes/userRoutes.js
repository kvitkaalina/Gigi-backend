import express from 'express';
import { getProfile, getUserProfile, updateUserProfile, updateAvatar } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import upload from '../utils/multerConfig.js';

const router = express.Router();

// Маршруты для работы с профилем
router.get('/profile', authMiddleware, getProfile);
router.get('/profile/:username', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.put('/profile/avatar', authMiddleware, upload.single('avatar'), updateAvatar);

export default router; 