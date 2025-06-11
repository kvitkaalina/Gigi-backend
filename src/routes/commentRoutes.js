import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { checkBlockedStatus } from '../middlewares/checkBlockedStatus.js';
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';

const router = express.Router();

// Публичные маршруты
router.get('/post/:postId', getPostComments);

// Защищенные маршруты
router.post('/posts/:postId/comments', protect, checkBlockedStatus, createComment);
router.put('/:postId/comments/:commentId', protect, checkBlockedStatus, updateComment);
router.delete('/:postId/comments/:commentId', protect, checkBlockedStatus, deleteComment);

export default router; 