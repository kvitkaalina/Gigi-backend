import jwt from 'jsonwebtoken';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// Map для хранения активных подключений
const activeConnections = new Map();
// Map для хранения таймеров отключения
const disconnectTimers = new Map();

// Функция для форматирования сообщения
const formatMessage = async (message) => {
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .lean();

  if (!populatedMessage) {
    throw new Error('Message not found');
  }

  return {
    _id: populatedMessage._id.toString(),
    content: populatedMessage.content,
    createdAt: populatedMessage.createdAt.toISOString(),
    read: populatedMessage.read,
    sender: {
      _id: populatedMessage.sender._id.toString(),
      name: populatedMessage.sender.username,
      avatar: populatedMessage.sender.avatar || '/default-avatar.jpg'
    },
    receiver: {
      _id: populatedMessage.receiver._id.toString(),
      name: populatedMessage.receiver.username,
      avatar: populatedMessage.receiver.avatar || '/default-avatar.jpg'
    }
  };
};

export const initializeSocketIO = (io) => {
  // Middleware для аутентификации
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;

      // Очищаем существующий таймер отключения, если он есть
      if (disconnectTimers.has(socket.userId)) {
        clearTimeout(disconnectTimers.get(socket.userId));
        disconnectTimers.delete(socket.userId);
      }

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Сохраняем новое подключение
    activeConnections.set(socket.userId, socket);

    // Присоединяем пользователя к его комнате
    socket.join(socket.userId);

    // Обновляем статус пользователя
    User.findByIdAndUpdate(socket.userId, { isOnline: true })
      .then(() => {
        io.emit('userStatusChanged', {
          userId: socket.userId,
          isOnline: true
        });
      })
      .catch(error => {
        console.error('Error updating user status:', error);
      });

    // Обработка отправки сообщения
    socket.on('sendMessage', async (data, callback) => {
      try {
        const { recipientId, content, type = 'text', postId, comment } = data;

        let newMessage;
        if (type === 'repost') {
          newMessage = await Message.create({
            sender: socket.userId,
            receiver: recipientId,
            type: 'repost',
            postId,
            comment,
            createdAt: new Date(),
            read: false
          });
        } else {
          newMessage = await Message.create({
            sender: socket.userId,
            receiver: recipientId,
            content,
            type,
            createdAt: new Date(),
            read: false
          });
        }

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar')
          .populate({
            path: 'postId',
            select: 'image description author',
            populate: { path: 'author', select: 'username avatar' }
          })
          .lean();

        const formattedMessage = {
          ...populatedMessage,
          _id: populatedMessage._id.toString(),
          sender: {
            _id: populatedMessage.sender._id.toString(),
            username: populatedMessage.sender.username,
            avatar: populatedMessage.sender.avatar || '/default-avatar.jpg'
          },
          receiver: {
            _id: populatedMessage.receiver._id.toString(),
            username: populatedMessage.receiver.username,
            avatar: populatedMessage.receiver.avatar || '/default-avatar.jpg'
          }
        };

        // Отправляем сообщение отправителю
        socket.emit('newMessage', formattedMessage);

        // Отправляем сообщение получателю
        const recipientSocket = activeConnections.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit('newMessage', formattedMessage);
        }

        if (callback) {
          callback({ success: true, message: formattedMessage });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (callback) {
          callback({ success: false, error: error.message });
        }
      }
    });

    // Обработка набора текста
    socket.on('typing', (data) => {
      const { recipientId } = data;
      const recipientSocket = activeConnections.get(recipientId);
      if (recipientSocket) {
        recipientSocket.emit('userTyping', socket.userId);
      }
    });

    // Обработка остановки набора текста
    socket.on('stopTyping', (data) => {
      const { recipientId } = data;
      const recipientSocket = activeConnections.get(recipientId);
      if (recipientSocket) {
        recipientSocket.emit('userStoppedTyping', socket.userId);
      }
    });

    // Обработка отключения
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);

      // Устанавливаем таймер для обновления статуса
      const timer = setTimeout(async () => {
        // Проверяем, нет ли активного подключения
        if (!activeConnections.has(socket.userId)) {
          const lastSeen = new Date();
          try {
            await User.findByIdAndUpdate(socket.userId, {
              isOnline: false,
              lastSeen
            });

            io.emit('userStatusChanged', {
              userId: socket.userId,
              isOnline: false,
              lastSeen: lastSeen.toISOString()
            });
          } catch (error) {
            console.error('Error updating user status:', error);
          }
        }
        disconnectTimers.delete(socket.userId);
      }, 5000); // Ждем 5 секунд перед обновлением статуса

      disconnectTimers.set(socket.userId, timer);
      activeConnections.delete(socket.userId);
    });

    // Обработка переподключения
    socket.on('reconnect', () => {
      console.log('User reconnected:', socket.userId);
      
      // Очищаем таймер отключения, если он есть
      if (disconnectTimers.has(socket.userId)) {
        clearTimeout(disconnectTimers.get(socket.userId));
        disconnectTimers.delete(socket.userId);
      }

      activeConnections.set(socket.userId, socket);
      
      // Обновляем статус пользователя
      User.findByIdAndUpdate(socket.userId, { isOnline: true })
        .then(() => {
          io.emit('userStatusChanged', {
            userId: socket.userId,
            isOnline: true
          });
        })
        .catch(error => {
          console.error('Error updating user status:', error);
        });
    });
  });
}; 