import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';

// Ваш токен и URL
const TOKEN = '8428998356:AAFPu3NwVage2hHNtnTko3HOvqaogJi_e28';
const EXTERNAL_URL = 'https://mini-app-roan-nine.vercel.app';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


// Инициализируем бота с вебхуком
const bot = new TelegramBot(TOKEN, { webHook: true });

// Устанавливаем вебхук (Vercel сам выдаёт домен)
bot.setWebHook(`${EXTERNAL_URL}/bot${TOKEN}`);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API для заказов
app.post('/api/order', (req, res) => {
  console.log('📦 Заказ получен:', req.body);
  res.json({ success: true, message: 'Заказ принят' });
});

// Вебхук Telegram
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Обработка /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    inline_keyboard: [[
      {
        text: '🛍️ Открыть приложение',
        web_app: { url: EXTERNAL_URL }
      }
    ]]
  };

  bot.sendMessage(chatId,
    'Добро пожаловать! \n\n' +
    'Выберите оборудование и оформите заказ прямо в Telegram.',
    { reply_markup: keyboard }
  );
});

// SPA fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web App URL: ${EXTERNAL_URL}`);
});