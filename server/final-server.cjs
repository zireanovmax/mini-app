import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API endpoint
app.post('/api/order', (req, res) => {
  console.log('📦 Заказ получен:', req.body);
  // TODO: сохранить в БД, отправить e-mail, Telegram и т.д.
  res.json({ success: true, message: 'Заказ принят' });
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Бот
const TOKEN = '8428998356:AAFPu3NwVage2hHNtnTko3HOvqaogJi_e28'; // ЗАМЕНИТЕ НА ВАШ ТОКЕН
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 Telegram бот запущен...');
console.log(`🌐 Web App URL: ${EXTERNAL_URL}`);

// Команда /start
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

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '📋 Доступные команды:\n\n' +
    '/start - Открыть магазин\n' +
    '/help - Помощь\n\n' +
    '🛒 Как сделать заказ:\n' +
    '1. Нажмите "Открыть магазин"\n' +
    '2. Выберите товары\n' +
    '3. Добавьте в корзину\n' +
    '4. Оформите заказ'
  );
});

// Обработка заказов из Web App
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    const chatId = msg.chat.id;
    try {
      const data = JSON.parse(msg.web_app_data.data);
      
      if (data.type === 'order') {
        handleOrder(chatId, data);
      }
    } catch (error) {
      console.error('Ошибка обработки заказа:', error);
      bot.sendMessage(chatId, '❌ Произошла ошибка при обработке заказа.');
    }
  }
});

function handleOrder(chatId, orderData) {
  const { cart, totalPrice, customerInfo } = orderData;
  
  // Текст для администратора (вас)
  let orderText = '🛒 *НОВЫЙ ЗАКАЗ!*\n\n';
  orderText += `👤 Имя: ${customerInfo.name || 'Не указано'}\n`;
  orderText += `📞 Телефон: ${customerInfo.phone || 'Не указано'}\n`;
  orderText += `📍 Адрес: ${customerInfo.address || 'Не указано'}\n`;
  
  if (customerInfo.comments) {
    orderText += `💬 Комментарий: ${customerInfo.comments}\n`;
  }
  
  orderText += '\n📦 Товары:\n';
  cart.forEach((item, index) => {
    orderText += `\n${index + 1}. ${item.model}\n`;
    orderText += `   Кол-во: ${item.quantity} шт.\n`;
    orderText += `   Цена: ${item.price} ₽ x ${item.quantity} = ${item.price * item.quantity} ₽\n`;
  });

  orderText += `\n💰 ИТОГО: ${totalPrice} ₽`;
  orderText += `\n⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

  // Отправляем заказ администратору (вам)
  bot.sendMessage(chatId, orderText);
  
  // Подтверждение клиенту
  bot.sendMessage(chatId, 
    `✅ Ваш заказ принят!\nСумма: ${totalPrice} ₽\n\nМы свяжемся с вами в ближайшее время для подтверждения.`
  );

  console.log('📦 Новый заказ:', orderData);
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Web App доступен по адресу: ${EXTERNAL_URL}`);
  console.log(`📱 Откройте вашего бота в Telegram и нажмите "Открыть магазин"`);
});