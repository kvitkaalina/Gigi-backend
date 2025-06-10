import jwt from 'jsonwebtoken';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// Map для хранения активных подключений
const activeConnections = new Map();

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

      // Проверяем существующее подключение
      const existingSocket = activeConnections.get(socket.userId);
      if (existingSocket) {
        console.log('Closing existing connection for user:', socket.userId);
        existingSocket.disconnect(true);
        activeConnections.delete(socket.userId);
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
        const { recipientId, content } = data;
        console.log('Received message:', { recipientId, content });

        // Создаем новое сообщение
        const newMessage = await Message.create({
          sender: socket.userId,
          receiver: recipientId,
          content,
          createdAt: new Date(),
          read: false
        });

        // Форматируем сообщение
        const formattedMessage = await formatMessage(newMessage);
        console.log('Formatted message:', formattedMessage);

        // Отправляем сообщение отправителю
        socket.emit('newMessage', formattedMessage);

        // Отправляем сообщение получателю, если он онлайн
        const recipientSocket = activeConnections.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit('newMessage', formattedMessage);
        }
        
        // Отправляем подтверждение
        if (callback) {
          callback({ success: true, messageId: newMessage._id.toString() });
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
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);
      
      // Удаляем подключение из Map только если это то же самое сокет-соединение
      if (activeConnections.get(socket.userId) === socket) {
        activeConnections.delete(socket.userId);
        
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
    });

    // Переподключение
    socket.on('reconnect', () => {
      console.log('User reconnected:', socket.userId);
      activeConnections.set(socket.userId, socket);
    });
  });
}; 