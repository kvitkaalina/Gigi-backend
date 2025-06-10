import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getAllPosts,
  getUserPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} from '../controllers/postController.js';

const router = express.Router();

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Публичные маршруты
router.get('/', authMiddleware, getAllPosts); // Получение всех постов
router.get('/user/:username', getUserPosts); // Получение постов конкретного пользователя по username
router.get('/:id', getPostById); // Получение конкретного поста

// Защищенные маршруты (требуют аутентификации)
router.post('/', authMiddleware, upload.single('image'), createPost); // Создание поста
router.put('/:id', authMiddleware, upload.single('image'), updatePost); // Обновление поста
router.delete('/:id', authMiddleware, deletePost); // Удаление поста

export default router; 