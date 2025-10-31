import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';

const TOKEN = '8428998356:AAFPu3NwVage2hHNtnTko3HOvqaogJi_e28';
const EXTERNAL_URL = 'https://mini-app-roan-nine.vercel.app';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализируем бота в polling режиме для разработки
// На продакшене используйте вебхук через отдельный сервер
const bot = new TelegramBot(TOKEN, { 
  polling: process.env.NODE_ENV !== 'production'
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API для заказов
app.post('/api/order', (req, res) => {
  console.log('📦 Заказ получен:', req.body);
  
  // Отправляем уведомление в Telegram
  const { products, total, contact } = req.body;
  const message = `
🛒 Новый заказ!
    
Товары: ${products.map(p => p.name).join(', ')}
Сумма: ${total} руб.
Контакт: ${contact}
  `;
  
  // Отправляем сообщение администратору (замените CHAT_ID на ваш)
  bot.sendMessage('ВАШ_CHAT_ID', message)
    .catch(err => console.error('Ошибка отправки сообщения:', err));
  
  res.json({ success: true, message: 'Заказ принят' });
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
  ).catch(err => console.error('Ошибка отправки сообщения:', err));
});

// Webhook endpoint для Vercel (альтернативный вариант)
app.post('/api/webhook', (req, res) => {
  try {
    const update = req.body;
    if (update.message && update.message.text === '/start') {
      const chatId = update.message.chat.id;
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
      ).catch(err => console.error('Ошибка отправки сообщения:', err));
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// SPA fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web App URL: ${EXTERNAL_URL}`);
});

// Обработка ошибок бота
bot.on('error', (error) => {
  console.error('❌ Telegram Bot Error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Telegram Polling Error:', error);
});