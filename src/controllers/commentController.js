import Comment from '../models/commentModel.js';
import Post from '../models/postModel.js';
import { createNotification } from './notificationController.js';

// Создание комментария
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    // Проверяем существование поста
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    // Создаем комментарий
    const comment = new Comment({
      post: postId,
      user: userId,
      text: text
    });

    await comment.save();

    // Создаем уведомление только если комментарий оставляет не автор поста
    if (post.author.toString() !== userId.toString()) {
      await createNotification(post.author, userId, 'comment', postId);
    }

    // Возвращаем созданный комментарий с данными пользователя
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar');

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Ошибка при создании комментария:', error);
    res.status(500).json({ message: 'Ошибка при создании комментария' });
  }
};

// Получение комментариев к посту
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Проверяем существование поста
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    // Получаем комментарии с данными пользователей
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Ошибка при получении комментариев:', error);
    res.status(500).json({ message: 'Ошибка при получении комментариев' });
  }
};

// Удаление комментария
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    // Проверяем существование комментария и права на удаление
    const comment = await Comment.findOne({
      _id: commentId,
      post: postId,
      user: req.user.id
    });

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден или нет прав на удаление' });
    }

    await comment.deleteOne();
    res.json({ message: 'Комментарий удален' });
  } catch (error) {
    console.error('Ошибка при удалении комментария:', error);
    res.status(500).json({ message: 'Ошибка при удалении комментария' });
  }
};

// Обновление комментария
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    // Проверяем существование комментария и права на редактирование
    const comment = await Comment.findOne({
      _id: commentId,
      user: req.user.id
    });

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден или нет прав на редактирование' });
    }

    comment.text = content;
    await comment.save();

    // Возвращаем обновленный комментарий с данными пользователя
    const updatedComment = await Comment.findById(commentId)
      .populate('user', 'username avatar');

    res.json(updatedComment);
  } catch (error) {
    console.error('Ошибка при обновлении комментария:', error);
    res.status(500).json({ message: 'Ошибка при обновлении комментария' });
  }
}; 