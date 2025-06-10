import User from '../models/userModel.js';

// @desc    Получить профиль текущего пользователя
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
};

// @desc    Получить профиль пользователя по username
// @route   GET /api/users/profile/:username
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля пользователя' });
  }
};

// @desc    Обновить профиль пользователя
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const { username, bio, fullName } = req.body;

    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (fullName) user.fullName = fullName;

    // Проверяем наличие файла изображения в запросе
    if (req.file) {
      // Используем путь к файлу, сохраненному multer
      user.avatar = req.file.path.replace(/\\/g, '/'); // Заменяем обратные слеши на прямые для URL
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка обновления профиля', error: error.message });
  }
};

// @desc    Обновить аватар пользователя
// @route   PUT /api/users/profile/avatar
// @access  Private
export const updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    // Используем путь к файлу, сохраненному multer
    user.avatar = '/' + req.file.path.replace(/\\/g, '/');
    
    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    console.error('Ошибка обновления аватара:', error);
    res.status(500).json({ message: 'Ошибка обновления аватара', error: error.message });
  }
}; 