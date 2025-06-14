import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';
import { uploadImage } from '../utils/imageUpload.js';

// Получение истории сообщений между двумя пользователями
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Проверяем существование пользователя
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Получаем сообщения между пользователями
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .lean();

    // Преобразуем данные в нужный формат
    const formattedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt.toISOString(),
      read: msg.read,
      sender: {
        _id: msg.sender._id.toString(),
        name: msg.sender.username,
        avatar: msg.sender.avatar || '/default-avatar.jpg'
      },
      receiver: {
        _id: msg.receiver._id.toString(),
        name: msg.receiver.username,
        avatar: msg.receiver.avatar || '/default-avatar.jpg'
      }
    }));

    console.log('Formatted messages:', formattedMessages);
    res.json(formattedMessages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error getting messages', error: error.message });
  }
};

// Отправка сообщения
export const sendMessage = async (req, res) => {
  try {
    const { userId: receiverId } = req.params;
    const { content, type = 'text' } = req.body;
    const senderId = req.user.id;
    let messageContent = content;

    // Проверяем существование получателя
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Если это изображение, загружаем его
    if (type === 'image' && req.file) {
      try {
        const imageUrl = await uploadImage(req.file);
        messageContent = imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ message: 'Error uploading image' });
      }
    }

    // Создаем новое сообщение
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: messageContent,
      type,
      createdAt: new Date()
    });

    await message.save();

    // Получаем заполненное сообщение
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .lean();

    // Преобразуем данные в нужный формат
    const formattedMessage = {
      ...populatedMessage,
      sender: {
        _id: populatedMessage.sender._id,
        name: populatedMessage.sender.username,
        avatar: populatedMessage.sender.avatar || '/default-avatar.jpg'
      },
      receiver: {
        _id: populatedMessage.receiver._id,
        name: populatedMessage.receiver.username,
        avatar: populatedMessage.receiver.avatar || '/default-avatar.jpg'
      }
    };

    // Отправляем сообщение через Socket.IO
    req.io.to(receiverId).emit('newMessage', formattedMessage);
    req.io.to(senderId).emit('newMessage', formattedMessage);

    console.log('Message sent:', formattedMessage);

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Отметить сообщения как прочитанные
export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

// Получение списка чатов пользователя
export const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Находим все сообщения, где пользователь является отправителем или получателем
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userObjectId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', userObjectId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            username: '$user.username',
            avatar: { $ifNull: ['$user.avatar', '/default-avatar.jpg'] }
          },
          lastMessage: 1,
          unreadCount: 1
        }
      }
    ]);

    res.json(messages);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Error getting chats', error: error.message });
  }
};

// Создание нового чата
export const createChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    // Проверяем существование пользователя
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Создаем первое сообщение-приветствие
    const message = new Message({
      sender: currentUserId,
      receiver: userId,
      content: 'Started a chat',
      createdAt: new Date()
    });

    await message.save();

    // Получаем заполненное сообщение
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .lean();

    // Получаем информацию о чате
    const chat = {
      _id: otherUser._id,
      user: {
        _id: otherUser._id,
        username: otherUser.username,
        avatar: otherUser.avatar || '/default-avatar.jpg'
      },
      lastMessage: {
        ...populatedMessage,
        sender: {
          _id: populatedMessage.sender._id,
          username: populatedMessage.sender.username,
          avatar: populatedMessage.sender.avatar || '/default-avatar.jpg'
        },
        receiver: {
          _id: populatedMessage.receiver._id,
          username: populatedMessage.receiver.username,
          avatar: populatedMessage.receiver.avatar || '/default-avatar.jpg'
        }
      },
      unreadCount: 0
    };

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Error creating chat', error: error.message });
  }
};

// Удаление сообщения
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can delete only your own messages' });
    }
    await message.deleteOne();
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};

// Редактирование сообщения
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can edit only your own messages' });
    }
    message.content = content;
    await message.save();
    res.json({ message: 'Message updated', content });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Error editing message', error: error.message });
  }
}; 