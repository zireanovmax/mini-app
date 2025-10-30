import { useState, useEffect } from 'react';

export const useTelegram = () => {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверяем, открыто ли в Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
      setIsTelegram(true);
      const tg = window.Telegram.WebApp;
      
      // Инициализируем Web App
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Получаем данные пользователя
      setUser({
        id: tg.initDataUnsafe?.user?.id,
        firstName: tg.initDataUnsafe?.user?.first_name,
        lastName: tg.initDataUnsafe?.user?.last_name,
        username: tg.initDataUnsafe?.user?.username
      });
    }
  }, []);

  return {
    isTelegram,
    user,
    WebApp: window.Telegram?.WebApp
  };
};