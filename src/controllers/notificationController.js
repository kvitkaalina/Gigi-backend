import Notification from '../models/notificationModel.js';

// Создать новое уведомление
export const createNotification = async (userId, actorId, type, targetId) => {
  try {
    const notification = new Notification({
      user: userId,      // Кому предназначено уведомление
      actor: actorId,    // Кто совершил действие
      type,             // Тип уведомления (like, comment, follow)
      target: targetId   // ID поста или другого объекта
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Ошибка при создании уведомления:', error);
    throw error;
  }
};

// Получить все уведомления пользователя
export const getNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const notifications = await Notification.find({ user: req.user.id })
      .populate('actor', 'username fullName avatar')
      .populate({
        path: 'target',
        select: 'image description likes',
        model: 'Post'
      })
      .sort({ createdAt: -1 });

    console.log('Fetched notifications:', {
      userId: req.user.id,
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        hasTarget: !!n.target
      }))
    });

    res.json(notifications);
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    res.status(500).json({ message: 'Ошибка при получении уведомлений' });
  }
};

// Отметить уведомление как прочитанное
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Ошибка при обновлении уведомления:', error);
    res.status(500).json({ message: 'Ошибка при обновлении уведомления' });
  }
};

// Отметить все уведомления как прочитанные
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    // Обновляем все непрочитанные уведомления пользователя
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    // Получаем обновленный список уведомлений
    const updatedNotifications = await Notification.find({ user: req.user.id })
      .populate('actor', 'username fullName avatar')
      .populate({
        path: 'target',
        select: 'image description',
        model: 'Post'
      })
      .sort({ createdAt: -1 });

    res.json(updatedNotifications);
  } catch (error) {
    console.error('Ошибка при обновлении уведомлений:', error);
    res.status(500).json({ message: 'Ошибка при обновлении уведомлений' });
  }
};

// Удалить уведомление
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Уведомление не найдено' });
    }

    await notification.deleteOne();
    res.json({ message: 'Уведомление удалено' });
  } catch (error) {
    console.error('Ошибка при удалении уведомления:', error);
    res.status(500).json({ message: 'Ошибка при удалении уведомления' });
  }
};

// Получить количество непрочитанных уведомлений
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Ошибка при подсчете уведомлений:', error);
    res.status(500).json({ message: 'Ошибка при подсчете уведомлений' });
  }
}; 