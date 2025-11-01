import { useState, useEffect } from 'react';

export const useTelegram = () => {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initTelegram = () => {
      try {
        // Проверяем, открыто ли в Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
          console.log('✅ Telegram WebApp обнаружен');
          setIsTelegram(true);
          const tg = window.Telegram.WebApp;
          
          // Инициализируем Web App
          tg.ready();
          tg.expand();
          
          // Получаем данные пользователя
          const userData = tg.initDataUnsafe?.user;
          if (userData) {
            setUser({
              id: userData.id?.toString(),
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              username: userData.username || ''
            });
          }
          
          console.log('👤 Данные пользователя Telegram:', userData);
        } else {
          console.log('❌ Telegram WebApp не обнаружен');
          setIsTelegram(false);
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
        setIsTelegram(false);
      } finally {
        setIsInitialized(true);
      }
    };

    // Задержка для гарантии инициализации Telegram
    setTimeout(initTelegram, 100);
  }, []);

  return {
    isTelegram,
    user,
    isInitialized,
    WebApp: window.Telegram?.WebApp
  };
};