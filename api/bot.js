import TelegramBot from 'node-telegram-bot-api';

const TOKEN = '8428998356:AAFPu3NwVage2hHNtnTko3HOvqaogJi_e28';
const EXTERNAL_URL = 'https://mini-app-roan-nine.vercel.app';

const bot = new TelegramBot(TOKEN);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const update = req.body;
    
    console.log('📨 Update from Telegram:', update);
    
    // Обработка /start
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

      try {
        await bot.sendMessage(chatId,
          'Добро пожаловать! \n\nВыберите оборудование и оформите заказ прямо в Telegram.',
          { reply_markup: keyboard }
        );
        console.log('✅ Start message sent to:', chatId);
      } catch (error) {
        console.error('❌ Error:', error);
      }
    }
    
    res.status(200).json({ ok: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}