import mongoose from 'mongoose';
import User from './models/userModel.js';
import bcrypt from 'bcryptjs';

const testLogin = async () => {
  try {
    await mongoose.connect('mongodb+srv://Alina:alinamama888@study-cluster.f5ow1.mongodb.net/GiGi');
    console.log('Connected to MongoDB');

    const testPassword = 'test123'; // Замените на пароль, который вы используете
    const user = await User.findOne({ email: 'lana888@gmail.com' }).select('+password');
    
    if (user) {
      console.log('User found:', {
        username: user.username,
        email: user.email,
        hasPassword: !!user.password
      });

      // Пробуем сравнить пароль
      const isMatch = await user.matchPassword(testPassword);
      console.log('Password match result:', isMatch);

      // Создаем новый хеш для проверки
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);
      console.log('New hash for the same password:', newHash);
      
      // Сравниваем напрямую через bcrypt
      const directMatch = await bcrypt.compare(testPassword, user.password);
      console.log('Direct bcrypt compare result:', directMatch);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

testLogin(); 