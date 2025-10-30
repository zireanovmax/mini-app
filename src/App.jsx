import React from 'react'
import Home from './pages/Home'

//console.log('🏠 App компонент загружен');

function App() {
  //console.log('🔄 App компонент рендерится');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Home />
    </div>
  )
}

export default App