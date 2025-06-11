import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { checkBlockedStatus } from '../middlewares/checkBlockedStatus.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowing
} from '../controllers/followController.js';

const router = express.Router();

// Публичные маршруты
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

// Защищенные маршруты
router.use(protect);
router.use(checkBlockedStatus);

router.post('/:userId', followUser);
router.delete('/:userId', unfollowUser);
router.get('/check/:userId', checkFollowing);

export default router; 