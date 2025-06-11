import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { checkBlockedStatus } from '../middlewares/checkBlockedStatus.js';
import {
  getAllPosts,
  getUserPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import multer from 'multer';

const router = express.Router();

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Публичные маршруты (не требуют проверки блокировки)
router.get('/', getAllPosts);
router.get('/user/:username', getUserPosts);
router.get('/:id', getPostById);

// Защищенные маршруты (требуют проверки блокировки)
router.post('/', protect, checkBlockedStatus, upload.single('image'), createPost);
router.put('/:id', protect, checkBlockedStatus, upload.single('image'), updatePost);
router.delete('/:id', protect, checkBlockedStatus, deletePost);

export default router; 