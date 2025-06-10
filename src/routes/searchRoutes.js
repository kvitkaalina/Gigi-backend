import express from 'express';
import { searchUsers, exploreContent } from '../controllers/searchController.js';

const router = express.Router();

// Маршрут для поиска пользователей
router.get('/users', searchUsers);

// Маршрут для раздела Explore
router.get('/explore', exploreContent);

export default router; 