import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем директорию для загрузки, если её нет
const uploadDir = path.join(__dirname, '../../uploads/messages');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadImage = async (file) => {
  try {
    // Генерируем уникальное имя файла
    const extension = path.extname(file.originalname);
    const filename = `${uuidv4()}${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Сохраняем файл
    await fs.promises.writeFile(filepath, file.buffer);

    // Возвращаем путь к файлу относительно /uploads
    return `/uploads/messages/${filename}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 