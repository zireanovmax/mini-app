// src/services/telegramService.js
export class TelegramService {
  static initTelegramAuth() {
    console.log('🔍 Начинаем проверку Telegram WebApp...');
    console.log('typeof window:', typeof window);
    console.log('window.Telegram:', window.Telegram);
    console.log('window.Telegram?.WebApp:', window.Telegram?.WebApp);
    
    // Проверяем, запущено ли в Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      console.log('✅ Telegram WebApp ОБНАРУЖЕН!');
      const tg = window.Telegram.WebApp;
      
      try {
        console.log('🔧 Инициализируем Telegram WebApp...');
        // Инициализируем приложение
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe?.user;
        console.log('👤 Данные пользователя:', user);
        console.log('📋 Все initDataUnsafe:', tg.initDataUnsafe);
        
        if (user && user.id) {
          const telegramId = user.id.toString();
          console.log('🎯 Telegram ID найден:', telegramId);
          
          return {
            id: telegramId,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            username: user.username || '',
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim()
          };
        } else {
          console.log('⚠️ Пользователь Telegram не авторизован');
          return null;
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
        return null;
      }
    } else {
      console.log('🌐 РАБОТАЕМ В БРАУЗЕРЕ - Telegram WebApp не обнаружен');
      console.log('Причина:');
      if (typeof window === 'undefined') console.log('- window не определен');
      if (!window.Telegram) console.log('- window.Telegram отсутствует');
      if (!window.Telegram?.WebApp) console.log('- window.Telegram.WebApp отсутствует');
      return null;
    }
  }
}