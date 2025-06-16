# Используем официальный Node.js образ
FROM node:20-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект в рабочую директорию контейнера
COPY . .

# Открываем порт 5000 - основной порт для backend
EXPOSE 5000

# Устанавливаем переменные окружения
ENV NODE_ENV=development

# Запускаем приложение
CMD ["npm", "run", "dev"]

