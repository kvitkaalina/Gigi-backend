import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Получить все уведомления пользователя
router.get('/', authMiddleware, getNotifications);

// Отметить уведомление как прочитанное
router.put('/:notificationId/read', authMiddleware, markNotificationAsRead);

// Отметить все уведомления как прочитанные
router.put('/read-all', authMiddleware, markAllNotificationsAsRead);

// Удалить уведомление
router.delete('/:notificationId', authMiddleware, deleteNotification);

export default router; 