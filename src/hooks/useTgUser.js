import { useEffect, useState } from 'react';

const DEV_ID = process.env.REACT_APP_DEV_TG_ID; // строка = вкл, undefined = выкл
const DEV_USER = DEV_ID ? { id: DEV_ID, first_name: 'Dev' } : null;

export function useTgUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      if (DEV_USER) setUser(DEV_USER);
      return;
    }

    tg.ready();
    const u = tg.initDataUnsafe?.user;
    if (u) setUser({ id: String(u.id), first_name: u.first_name });
  }, []);

  return user;
}