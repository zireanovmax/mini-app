import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// Глобальная обработка ошибок
console.log('🚀 Приложение запускается...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ React приложение успешно запущено');
} catch (error) {
  console.error('❌ Критическая ошибка при запуске:', error);
}