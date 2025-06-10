import mongoose from 'mongoose';
import User from './models/userModel.js';

const checkPassword = async () => {
  try {
    await mongoose.connect('mongodb+srv://Alina:alinamama888@study-cluster.f5ow1.mongodb.net/GiGi');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'lana888@gmail.com' }).select('+password');
    if (user) {
      console.log('User found:', {
        username: user.username,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

checkPassword(); 