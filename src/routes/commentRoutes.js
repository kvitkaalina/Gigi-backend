import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment
} from '../controllers/commentController.js';

const router = express.Router();

// Маршруты для комментариев
router.post('/:postId/comments', authMiddleware, createComment);
router.get('/:postId/comments', getPostComments);
router.put('/:postId/comments/:commentId', authMiddleware, updateComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

export default router; 