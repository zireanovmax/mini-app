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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Инициализируем бота с polling (лучший вариант для Vercel)
const bot = new TelegramBot(TOKEN, { 
  polling: true 
});

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
  
  // ЗАМЕНИТЕ 'ВАШ_CHAT_ID' на ваш реальный chat_id
  // Чтобы получить chat_id: напишите боту /start, затем проверьте:
  // https://api.telegram.org/bot8428998356:AAFPu3NwVage2hHNtnTko3HOvqaogJi_e28/getUpdates
  bot.sendMessage('1379007527', message)
    .catch(err => console.error('Ошибка отправки сообщения:', err));
  
  res.json({ success: true, message: 'Заказ принят' });
});

// Обработка /start команды
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🟢 Получена команда /start от:', chatId);
  
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

// Обработка сообщений из мини-приложения
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    const chatId = msg.chat.id;
    const data = msg.web_app_data.data;
    
    console.log('📦 Данные из мини-приложения:', data);
    
    try {
      const orderData = JSON.parse(data);
      
      // Отправляем подтверждение пользователю
      bot.sendMessage(chatId, '✅ Ваш заказ принят! Мы свяжемся с вами в ближайшее время.');
      
      // Отправляем уведомление администратору
      const adminMessage = `
🛒 Новый заказ из мини-приложения!
    
Товары: ${orderData.products.map(p => p.name).join(', ')}
Сумма: ${orderData.total} руб.
Контакт: ${orderData.contact}
      `;
      
      bot.sendMessage('ВАШ_CHAT_ID', adminMessage)
        .catch(err => console.error('Ошибка отправки администратору:', err));
        
    } catch (error) {
      console.error('Ошибка парсинга данных:', error);
      bot.sendMessage(chatId, '❌ Произошла ошибка при обработке заказа.');
    }
  }
});

// SPA fallback
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web App URL: ${EXTERNAL_URL}`);
  console.log(`🤖 Bot is running in polling mode`);
});

// Обработка ошибок бота
bot.on('error', (error) => {
  console.error('❌ Telegram Bot Error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Telegram Polling Error:', error);
});