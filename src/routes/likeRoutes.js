import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  toggleLike,
  getPostLikes,
  checkUserLike
} from '../controllers/likeController.js';

const router = express.Router();

// Маршруты для лайков
router.post('/:postId', authMiddleware, toggleLike);
router.get('/:postId', getPostLikes);
router.get('/:postId/check', authMiddleware, checkUserLike);

export default router; 