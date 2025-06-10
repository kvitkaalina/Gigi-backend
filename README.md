# GiGi Backend

Бэкенд часть социальной сети GiGi, построенная на Node.js и Express.

## 🚀 Быстрый старт

### Предварительные требования
- Node.js (версия 14 или выше)
- npm (устанавливается вместе с Node.js)
- MongoDB (локально или удаленно)

### Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/kvitkaalina/Gigi-backend.git back
cd back
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` в корневой директории и добавьте необходимые переменные окружения:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

4. Запустите сервер:
```bash
npm run dev
```

Сервер будет доступен по адресу [http://localhost:5001](http://localhost:5001)

## 📁 Структура проекта

```
back/
├── src/
│   ├── controllers/    # Контроллеры
│   ├── models/        # Mongoose модели
│   ├── routes/        # Express маршруты
│   ├── middlewares/   # Промежуточное ПО
│   ├── socket/        # Настройки Socket.IO
│   └── utils/         # Вспомогательные функции
├── uploads/           # Загруженные файлы
└── package.json       # Зависимости и скрипты
```

## 🔄 Работа с Git

### Получение последних изменений
```bash
git pull origin master
```

### Сохранение ваших изменений
```bash
git add .
git commit -m "Описание ваших изменений"
git push origin master
```

## 🛠 Основные команды

- `npm run dev` - Запуск сервера в режиме разработки
- `npm start` - Запуск сервера
- `npm test` - Запуск тестов

## 📝 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход

### Посты
- `GET /api/posts` - Получение постов
- `POST /api/posts` - Создание поста
- `PUT /api/posts/:id` - Обновление поста
- `DELETE /api/posts/:id` - Удаление поста

### Уведомления
- `GET /api/notifications` - Получение уведомлений
- `PUT /api/notifications/:id/read` - Отметить как прочитанное
- `PUT /api/notifications/read-all` - Отметить все как прочитанные
- `DELETE /api/notifications/:id` - Удалить уведомление

## 🔗 Связанные репозитории

- [GiGi Frontend](https://github.com/kvitkaalina/Gigi) - Фронтенд часть приложения 