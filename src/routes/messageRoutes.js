import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getChats,
  createChat,
  deleteMessage,
  editMessage
} from '../controllers/messageController.js';
import multer from 'multer';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Получение списка чатов пользователя
router.get('/chats', authMiddleware, getChats);

// Создание нового чата
router.post('/chats', authMiddleware, createChat);

// Получение сообщений с конкретным пользователем
router.get('/:userId', authMiddleware, getMessages);

// Отправка сообщения конкретному пользователю
router.post(
  '/:userId',
  authMiddleware,
  upload.single('file'),
  sendMessage
);

// Отметить сообщения как прочитанные
router.put('/:userId/read', authMiddleware, markMessagesAsRead);

// Удаление сообщения по ID
router.delete('/:messageId', authMiddleware, deleteMessage);

// Редактирование сообщения по ID
router.patch('/:messageId', authMiddleware, editMessage);

export default router; 