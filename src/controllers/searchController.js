import User from '../models/userModel.js';
import Post from '../models/postModel.js';

// Поиск пользователей
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Создаем регулярное выражение для поиска (регистронезависимое)
    const searchRegex = new RegExp(query, 'i');

    // Ищем пользователей по username или email
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('username email avatar bio') // Выбираем только нужные поля
    .limit(20); // Ограничиваем количество результатов

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

// Получение случайных постов для раздела Explore
export const exploreContent = async (req, res) => {
  try {
    // Фиксированное количество постов для сетки 3x4
    const GRID_COLUMNS = 3;
    const GRID_ROWS = 4;
    const POSTS_LIMIT = GRID_COLUMNS * GRID_ROWS; // 12 постов
    
    // Получаем случайные посты
    const posts = await Post.aggregate([
      { $sample: { size: POSTS_LIMIT } }, // Получаем ровно 12 постов
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: '$comments' }
        }
      },
      {
        $project: {
          _id: 1,
          description: 1,
          image: 1,
          createdAt: 1,
          'author._id': 1,
          'author.username': 1,
          'author.avatar': 1,
          likes: 1,
          likesCount: 1,
          commentsCount: 1
        }
      }
    ]);

    res.json(posts);
  } catch (error) {
    console.error('Error getting explore content:', error);
    res.status(500).json({ message: 'Error getting explore content', error: error.message });
  }
}; 