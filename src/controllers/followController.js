import Follow from '../models/followModel.js';
import User from '../models/userModel.js';
import { createNotification } from './notificationController.js';

// Подписаться на пользователя
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    // Проверка на самоподписку
    if (userId === followerId) {
      return res.status(400).json({ message: 'Нельзя подписаться на самого себя' });
    }

    // Проверка существования пользователя
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверка существующей подписки
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'Вы уже подписаны на этого пользователя' });
    }

    // Создание новой подписки
    const follow = new Follow({
      follower: followerId,
      following: userId
    });

    await follow.save();

    // Обновляем массивы подписчиков и подписок у обоих пользователей
    await User.findByIdAndUpdate(userId, { 
      $addToSet: { followers: followerId }
    });
    await User.findByIdAndUpdate(followerId, { 
      $addToSet: { following: userId }
    });

    // Создание уведомления о новом подписчике
    await createNotification(userId, followerId, 'follow');

    res.status(201).json({ message: 'Вы успешно подписались' });
  } catch (error) {
    console.error('Ошибка при подписке на пользователя:', error);
    res.status(500).json({ message: 'Ошибка при подписке на пользователя' });
  }
};

// Отписаться от пользователя
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    // Проверка существования подписки
    const follow = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    if (!follow) {
      return res.status(400).json({ message: 'Вы не подписаны на этого пользователя' });
    }

    await follow.deleteOne();

    // Обновляем массивы подписчиков и подписок у обоих пользователей
    await User.findByIdAndUpdate(userId, { 
      $pull: { followers: followerId }
    });
    await User.findByIdAndUpdate(followerId, { 
      $pull: { following: userId }
    });

    res.json({ message: 'Вы успешно отписались' });
  } catch (error) {
    console.error('Ошибка при отписке от пользователя:', error);
    res.status(500).json({ message: 'Ошибка при отписке от пользователя' });
  }
};

// Получить список подписчиков пользователя
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Проверяем существование пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'username avatar bio')
      .sort({ createdAt: -1 });

    const formattedFollowers = followers.map(follow => ({
      ...follow.follower.toObject(),
      isFollowing: false // Это поле будет обновлено на фронтенде
    }));

    res.json(formattedFollowers);
  } catch (error) {
    console.error('Ошибка при получении списка подписчиков:', error);
    res.status(500).json({ message: 'Ошибка при получении списка подписчиков' });
  }
};

// Получить список подписок пользователя
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    // Проверяем существование пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const following = await Follow.find({ follower: userId })
      .populate('following', 'username avatar bio')
      .sort({ createdAt: -1 });

    const formattedFollowing = following.map(follow => ({
      ...follow.following.toObject(),
      isFollowing: true
    }));

    res.json(formattedFollowing);
  } catch (error) {
    console.error('Ошибка при получении списка подписок:', error);
    res.status(500).json({ message: 'Ошибка при получении списка подписок' });
  }
};

// Проверить статус подписки
export const checkFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const follow = await Follow.findOne({
      follower: followerId,
      following: userId
    });

    res.json({ following: !!follow });
  } catch (error) {
    console.error('Ошибка при проверке статуса подписки:', error);
    res.status(500).json({ message: 'Ошибка при проверке статуса подписки' });
  }
}; 