import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { checkBlockedStatus } from '../middlewares/checkBlockedStatus.js';
import {
  toggleLike,
  getPostLikes,
  checkUserLike
} from '../controllers/likeController.js';

const router = express.Router();

// Защищенные маршруты
router.use(protect);
router.use(checkBlockedStatus);

// Маршруты для лайков
router.post('/:postId', toggleLike);
router.get('/:postId', getPostLikes);
router.get('/check/:postId', checkUserLike);

export default router; 