import React from 'react'

function CategoryMenu({ categories, selectedCategory, onSelectCategory, deviceType, largeButtons = false }) {
  const isMobile = deviceType === 'mobile';
  
  // Выравниваем высоту кнопок
  const buttonClass = largeButtons 
    ? `px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left`
    : `px-3 py-2 rounded text-sm transition-colors w-full text-left`;

  return (
    <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {Object.entries(categories).map(([key, name]) => (
        <button
          key={key}
          onClick={() => onSelectCategory(key)}
          className={`
            ${buttonClass}
            ${selectedCategory === key 
              ? 'bg-green-600 text-white border-2 border-green-600' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-2 border-transparent'
            }
          `}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export default CategoryMenu