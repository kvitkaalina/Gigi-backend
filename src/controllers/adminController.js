import User from '../models/userModel.js';

// Получить список всех пользователей
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 }); // Сортировка по дате создания (новые первые)

        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Error getting users list' });
    }
};

// Заблокировать/разблокировать пользователя
const toggleUserBlock = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Нельзя заблокировать админа
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot block admin users' });
        }

        // Переключаем статус блокировки
        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ 
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        console.error('Error toggling user block:', error);
        res.status(500).json({ message: 'Error updating user status' });
    }
};

// Удалить пользователя
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Нельзя удалить админа
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }

        await User.deleteOne({ _id: req.params.userId });
        
        res.json({ 
            message: 'User deleted successfully',
            userId: req.params.userId
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

// Получить детальную информацию о пользователе
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error getting user details:', error);
        res.status(500).json({ message: 'Error getting user details' });
    }
};

export {
    getAllUsers,
    toggleUserBlock,
    deleteUser,
    getUserDetails
}; 