import mongoose from 'mongoose';
import User from './models/userModel.js';
import bcrypt from 'bcryptjs';

const resetPassword = async () => {
  try {
    await mongoose.connect('mongodb+srv://Alina:alinamama888@study-cluster.f5ow1.mongodb.net/GiGi');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'lana888@gmail.com' });
    
    if (user) {
      console.log('User found:', {
        username: user.username,
        email: user.email
      });

      // Хешируем новый пароль
      const newPassword = 'test123'; // Это будет ваш новый пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Обновляем пароль напрямую в базе данных
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      console.log('Password has been reset successfully');
      console.log('New password is: test123');
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

resetPassword(); 