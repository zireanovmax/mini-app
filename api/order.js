import TelegramBot from 'node-telegram-bot-api';

const TOKEN = '8428998356:AAFPu3NwVage2hHNtnTko3HOvqaogJi_e28';
const bot = new TelegramBot(TOKEN);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('📦 Order received:', req.body);
    
    try {
      const { products, total, contact } = req.body;
      
      const message = `
🛒 Новый заказ!
Товары: ${products.map(p => p.name).join(', ')}
Сумма: ${total} руб.
Контакт: ${contact}
      `;
      
      // ЗАМЕНИТЕ на ваш chat_id!
      await bot.sendMessage('1379007527', message);
      
      res.json({ success: true, message: 'Заказ принят' });
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}