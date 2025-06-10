import Like from '../models/likeModel.js';
import Post from '../models/postModel.js';
import { createNotification } from './notificationController.js';

// Переключение лайка (добавление/удаление)
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Проверяем существование поста
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    // Проверяем, есть ли уже лайк
    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // Если лайк существует - удаляем его
      await existingLike.deleteOne();
      // Удаляем ID пользователя из массива лайков поста
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
      res.json({ 
        message: 'Лайк удален', 
        hasLiked: false,
        likesCount: updatedPost.likes.length 
      });
    } else {
      // Если лайка нет - создаем новый
      const newLike = new Like({
        user: userId,
        post: postId
      });
      await newLike.save();
      // Добавляем ID пользователя в массив лайков поста
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      );

      // Создаем уведомление только если лайк ставит не автор поста
      if (post.author.toString() !== userId.toString()) {
        await createNotification(post.author, userId, 'like', postId);
      }

      res.json({ 
        message: 'Лайк добавлен', 
        hasLiked: true,
        likesCount: updatedPost.likes.length 
      });
    }
  } catch (error) {
    console.error('Ошибка при обработке лайка:', error);
    res.status(500).json({ message: 'Ошибка при обработке лайка' });
  }
};

// Получение всех лайков поста
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;

    // Проверяем существование поста
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    // Получаем все лайки для поста с информацией о пользователях
    const likes = await Like.find({ post: postId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    // Получаем общее количество лайков
    const likesCount = await Like.countDocuments({ post: postId });

    res.json({
      likes,
      count: likesCount
    });
  } catch (error) {
    console.error('Ошибка при получении лайков поста:', error);
    res.status(500).json({ message: 'Ошибка при получении лайков поста' });
  }
};

// Проверка, поставил ли пользователь лайк посту
export const checkUserLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const like = await Like.findOne({ user: userId, post: postId });
    const post = await Post.findById(postId);
    
    // Синхронизируем данные, если они различаются
    if (like && !post.likes.includes(userId)) {
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId }
      });
    } else if (!like && post.likes.includes(userId)) {
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId }
      });
    }

    res.json({ 
      hasLiked: !!like,
      likesCount: post.likes.length 
    });
  } catch (error) {
    console.error('Ошибка при проверке лайка:', error);
    res.status(500).json({ message: 'Ошибка при проверке лайка' });
  }
}; 