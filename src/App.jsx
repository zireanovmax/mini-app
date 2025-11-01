import React from 'react'
import Home from './pages/Home'
import { useTelegram } from './hooks/useTelegram'

//console.log('🏠 App компонент загружен');

function App() {
  //console.log('🔄 App компонент рендерится');
  const { isTelegram, isInitialized } = useTelegram();

  // Показываем лоадер пока инициализируется Telegram
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isTelegram ? 'tg-webapp' : 'web-browser'}`}>
      <Home />
    </div>
  )
}

export default App