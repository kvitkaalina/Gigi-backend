import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getChats,
  createChat
} from '../controllers/messageController.js';

const router = express.Router();

// Получение списка чатов пользователя
router.get('/chats', authMiddleware, getChats);

// Создание нового чата
router.post('/chats', authMiddleware, createChat);

// Получение сообщений с конкретным пользователем
router.get('/:userId', authMiddleware, getMessages);

// Отправка сообщения конкретному пользователю
router.post('/:userId', authMiddleware, sendMessage);

// Отметить сообщения как прочитанные
router.put('/:userId/read', authMiddleware, markMessagesAsRead);

export default router; 