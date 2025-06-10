import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import { join } from 'path';
import fs from 'fs/promises';

// Получение всех постов (для ленты новостей)
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Получаем только необходимые данные для текущей страницы
    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('image description createdAt')
        .populate('author', 'username avatar')
        .populate({
          path: 'comments',
          options: { sort: { createdAt: -1 }, limit: 2 },
          populate: {
            path: 'user',
            select: 'username avatar'
          }
        })
        .lean(),
      Post.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // Оптимизированный ответ
    res.json({
      posts,
      currentPage: page,
      totalPages,
      hasMore,
      total,
      nextPage: hasMore ? page + 1 : null
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      message: 'Error fetching posts', 
      error: error.message 
    });
  }
};

// Получение всех постов конкретного пользователя
export const getUserPosts = async (req, res) => {
  try {
    // Сначала находим пользователя по username
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ограничиваем количество постов до 12 (3x4 сетка)
    const posts = await Post.find({ author: user._id })
      .populate('author', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        },
        options: { sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 })
      .limit(12);
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Error fetching user posts', error: error.message });
  }
};

// Получение конкретного поста по ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username avatar'
        },
        options: { sort: { createdAt: -1 } }
      });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
};

// Создание нового поста
export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'posts');
    await fs.mkdir(uploadDir, { recursive: true });

    // Create file name and path for saving
    const fileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = join('uploads', 'posts', fileName);
    const absolutePath = join(process.cwd(), filePath);
    
    // Save the file
    await fs.writeFile(absolutePath, req.file.buffer);
    
    const post = new Post({
      description: caption || '',  // Make caption optional by providing empty string as default
      image: `/${filePath.replace(/\\/g, '/')}`,
      author: req.user.id
    });

    await post.save();
    
    const populatedPost = await post.populate('author', 'username avatar');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};

// Обновление поста
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check update permissions
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update description
    if (req.body.caption) {
      post.description = req.body.caption;
    }

    // Update image if provided
    if (req.file) {
      // Delete old image if exists
      if (post.image) {
        const oldImagePath = join(process.cwd(), post.image.replace(/^\//, ''));
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      // Create directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'uploads', 'posts');
      await fs.mkdir(uploadDir, { recursive: true });

      // Save new image
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = join('uploads', 'posts', fileName);
      await fs.writeFile(join(process.cwd(), filePath), req.file.buffer);
      post.image = `/${filePath.replace(/\\/g, '/')}`;
    }

    await post.save();
    
    const updatedPost = await post.populate('author', 'username avatar');
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
};

// Удаление поста
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Проверка прав на удаление
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Удаляем изображение
    if (post.image) {
      const imagePath = join(process.cwd(), 'back', post.image);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
}; 