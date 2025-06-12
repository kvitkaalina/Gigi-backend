import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Middleware для защиты маршрутов
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Проверяем наличие JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET не найден в переменных окружения');
        return res.status(500).json({ message: 'Ошибка конфигурации сервера' });
      }

      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];

      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Получаем пользователя без пароля
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      // Проверяем статус админа при каждом запросе
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      const shouldBeAdmin = adminEmails.includes(user.email);
      
      // Обновляем роль если необходимо
      if (shouldBeAdmin && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`Updated user ${user.email} role to admin during request`);
      } else if (!shouldBeAdmin && user.role === 'admin') {
        user.role = 'user';
        await user.save();
        console.log(`Removed admin role from user ${user.email} during request`);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Недействительный токен' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Срок действия токена истек' });
      }
      return res.status(401).json({ message: 'Не авторизован, ошибка проверки токена' });
    }
  } else {
    return res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
  }
};

// Алиас для обратной совместимости
export const authMiddleware = protect; 