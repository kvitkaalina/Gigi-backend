import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowing
} from '../controllers/followController.js';

const router = express.Router();

// Подписаться на пользователя
router.post('/:userId/follow', authMiddleware, followUser);

// Отписаться от пользователя
router.delete('/:userId/follow', authMiddleware, unfollowUser);

// Получить список подписчиков пользователя
router.get('/:userId/followers', authMiddleware, getFollowers);

// Получить список подписок пользователя
router.get('/:userId/following', authMiddleware, getFollowing);

// Проверить, подписан ли текущий пользователь на указанного
router.get('/:userId/following/check', authMiddleware, checkFollowing);

export default router; 