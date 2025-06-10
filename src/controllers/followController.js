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
    console.log('Getting followers for user:', userId);

    // Проверяем существование пользователя
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Используем populate для получения информации о подписчиках
    const followers = await Follow.find({ following: userId })
      .populate({
        path: 'follower',
        select: 'username avatar bio'
      })
      .sort({ createdAt: -1 });

    console.log('Found followers:', followers.length);

    // Фильтруем и форматируем данные для фронтенда
    const formattedFollowers = followers
      .filter(follow => follow.follower !== null) // Фильтруем удаленных пользователей
      .map(follow => ({
        _id: follow.follower._id,
        username: follow.follower.username,
        avatar: follow.follower.avatar,
        bio: follow.follower.bio,
        isFollowing: false
      }));

    // Удаляем недействительные подписки
    const invalidFollows = followers.filter(follow => follow.follower === null);
    if (invalidFollows.length > 0) {
      console.log(`Removing ${invalidFollows.length} invalid follows`);
      await Follow.deleteMany({
        _id: { $in: invalidFollows.map(f => f._id) }
      });
      
      // Обновляем количество подписчиков у пользователя
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: { $in: invalidFollows.map(f => f.follower) } }
      });
    }

    res.json(formattedFollowers);
  } catch (error) {
    console.error('Error in getFollowers:', error);
    res.status(500).json({ message: 'Ошибка при получении списка подписчиков', error: error.message });
  }
};

// Получить список подписок пользователя
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Getting following for user:', userId);

    // Проверяем существование пользователя
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Используем populate для получения информации о подписках
    const following = await Follow.find({ follower: userId })
      .populate({
        path: 'following',
        select: 'username avatar bio'
      })
      .sort({ createdAt: -1 });

    console.log('Found following:', following.length);

    // Фильтруем и форматируем данные для фронтенда
    const formattedFollowing = following
      .filter(follow => follow.following !== null) // Фильтруем удаленных пользователей
      .map(follow => ({
        _id: follow.following._id,
        username: follow.following.username,
        avatar: follow.following.avatar,
        bio: follow.following.bio,
        isFollowing: true
      }));

    // Удаляем недействительные подписки
    const invalidFollows = following.filter(follow => follow.following === null);
    if (invalidFollows.length > 0) {
      console.log(`Removing ${invalidFollows.length} invalid follows`);
      await Follow.deleteMany({
        _id: { $in: invalidFollows.map(f => f._id) }
      });
      
      // Обновляем количество подписок у пользователя
      await User.findByIdAndUpdate(userId, {
        $pull: { following: { $in: invalidFollows.map(f => f.following) } }
      });
    }

    res.json(formattedFollowing);
  } catch (error) {
    console.error('Error in getFollowing:', error);
    res.status(500).json({ message: 'Ошибка при получении списка подписок', error: error.message });
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