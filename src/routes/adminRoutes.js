import express from 'express';
import { getAllUsers, toggleUserBlock, deleteUser, getUserDetails } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Все маршруты защищены middleware protect и isAdmin
router.use(protect); // Сначала проверяем аутентификацию
router.use(isAdmin); // Затем проверяем права админа

// Маршруты управления пользователями
router.get('/users', getAllUsers); // Получить список всех пользователей
router.get('/users/:userId', getUserDetails); // Получить детальную информацию о пользователе
router.put('/users/:userId/toggle-block', toggleUserBlock); // Заблокировать/разблокировать пользователя
router.delete('/users/:userId', deleteUser); // Удалить пользователя

export default router; 