import mongoose from 'mongoose';

const checkGiGiUsers = async () => {
  try {
    // Подключаемся к MongoDB
    const conn = await mongoose.connect('mongodb+srv://Alina:alinamama888@study-cluster.f5ow1.mongodb.net/GiGi');
    console.log('Connected to MongoDB - GiGi database');

    // Получаем коллекцию users
    const users = await conn.connection.db.collection('users').find({}).toArray();
    
    console.log('\nUsers in GiGi database:');
    users.forEach(user => {
      console.log('-------------------');
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Full Name:', user.fullName);
      console.log('Created At:', user.createdAt);
    });

    console.log('\nTotal users:', users.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

checkGiGiUsers(); 