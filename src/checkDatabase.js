import mongoose from 'mongoose';

const checkDatabases = async () => {
  try {
    // Подключаемся к MongoDB
    const conn = await mongoose.connect('mongodb+srv://Alina:alinamama888@study-cluster.f5ow1.mongodb.net/GiGi');
    console.log('Connected to MongoDB');

    // Получаем список всех баз данных
    const adminDb = conn.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    
    console.log('\nAvailable databases:');
    for (const db of dbs.databases) {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
      
      // Подключаемся к каждой базе данных и смотрим коллекции
      const database = conn.connection.client.db(db.name);
      const collections = await database.listCollections().toArray();
      
      console.log('  Collections:');
      for (const collection of collections) {
        // Получаем количество документов в коллекции
        const count = await database.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name} (${count} documents)`);
      }
      console.log('');
    }

    // Проверяем текущую базу данных
    console.log('\nCurrent database:', conn.connection.db.databaseName);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in current database:');
    for (const collection of collections) {
      const count = await conn.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name} (${count} documents)`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

checkDatabases(); 