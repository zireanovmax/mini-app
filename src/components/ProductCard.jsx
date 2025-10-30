import React from 'react'

function ProductCard({ product, onAddToCart, deviceType, clientInfo }) {
  const isMobile = deviceType === 'mobile';
  
  console.log('🔄 ProductCard рендерится:', { 
    productId: product.id, 
    clientInfo: clientInfo,
    productPriceLevel: product.priceLevel 
  });

  const formatPrice = (price) => {
    if (!price) return '';
    
    const cleanPrice = price.toString()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    
    const numPrice = parseFloat(cleanPrice);
    if (isNaN(numPrice)) return price;
    
    return new Intl.NumberFormat('ru-RU').format(numPrice);
  };

  const getWifiBadge = (wifiStatus) => {
    const styles = {
      'Есть': 'bg-green-100 text-green-800 border-green-200',
      'Опция': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Нет': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[wifiStatus] || styles['Нет']}`}>
        Wi-Fi: {wifiStatus}
      </span>
    );
  };

  // Получаем уровень цены из clientInfo или используем уровень из product
  const getPriceLevelName = () => {
    console.log('🎯 Определяем уровень цены:', {
      clientLevel: clientInfo?.level,
      productLevel: product.priceLevel
    });
    
    // Если есть clientInfo, используем его уровень, иначе используем уровень из product
    const level = clientInfo?.level || product.priceLevel || 'opt1';
    const levelNames = {
      'opt1': 'ОПТ1',
      'opt2': 'ОПТ2', 
      'opt3': 'ОПТ3',
      'retail': 'РОЗНИЦА'
    };
    
    const result = levelNames[level] || 'ОПТ1';
    console.log('📊 Итоговый уровень:', result);
    return result;
  };

  const hasDiscount = product.discount && parseFloat(product.discount) > 0;
  const oldPrice = formatPrice(product.oldPrice);
  const newPrice = formatPrice(product.newPrice);
  const priceLevelName = getPriceLevelName();

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  // Остальной код без изменений...
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow h-full flex flex-col ${isMobile ? 'p-2' : 'p-4'}`}>
      {/* 1. Фото */}
      <div className={`${isMobile ? 'h-32' : 'h-48'} bg-white flex items-center justify-center relative`}>
        {product.photo ? (
          <>
            <img 
              src={product.photo} 
              alt={product.model}
              className="h-full w-full object-contain bg-white"
              onError={(e) => {
                e.target.style.display = 'none';
                const placeholder = e.target.parentNode.querySelector('.photo-placeholder');
                if (placeholder) placeholder.classList.remove('hidden');
              }}
            />
            <div className="photo-placeholder hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-100">
              <svg className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Ошибка загрузки</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <svg className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Нет фото</span>
          </div>
        )}
      </div>
      
      <div className={`flex-grow ${isMobile ? 'p-1' : 'p-0'} mt-2`}>
        {/* Код */}
        {product.code && (
          <p className={`text-gray-500 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>Код: {product.code}</p>
        )}
        
        {/* Модель */}
        <h3 className={`font-semibold text-gray-800 mb-2 ${isMobile ? 'text-sm line-clamp-2 h-10' : 'text-lg'}`}>
          {product.model}
        </h3>
        
        {/* Дополнительная информация (не показываем для материалов) */}
        {product.category !== 'materials' && (
          <div className={`space-y-1 mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {product.power && (
              <p className="text-gray-600">
                <span className="font-medium">Мощность:</span> {product.power}
              </p>
            )}
            {product.type && (
              <p className="text-gray-600">
                <span className="font-medium">Тип:</span> {product.type}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Цены */}
      <div className={`${isMobile ? 'p-1' : 'p-0'} mt-auto`}>
        {/* Бейдж Wi-Fi над ценой (не показываем для материалов) */}
        {product.category !== 'materials' && product.wifi && (
          <div className="mb-2 flex justify-start">
            {getWifiBadge(product.wifi)}
          </div>
        )}

        <div className="space-y-2">
          {/* Динамическая цена с бейджем скидки в одной строке */}
          {newPrice && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
  <span className={`font-bold text-blue-600 ${isMobile ? 'text-sm' : 'text-xl'}`}>
    {priceLevelName}: {newPrice} руб.
  </span>
  
</div>
              </div>
              
            </div>
          )}
        </div>

        {/* Блок с розничной ценой и кнопкой корзины */}
        <div className="flex justify-between items-center mt-3">
          <div className="flex flex-col">
            {/* Розничная цена (показываем только если есть оптовая цена) */}
            {newPrice && oldPrice && (
             <div className="flex items-center gap-2 mr-2">
              <span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
               Розница: {oldPrice} руб.
             </span>
             {product.retailDiscount && parseFloat(product.retailDiscount) > 0 && (
             <span className={`bg-gray-100 text-orange-600 px-1.5 py-0.5 rounded-full text-[10px] font-medium border border-gray-300`}>
              -{product.retailDiscount}%
              </span>
              )}
             </div>
            )}
            {/* Если нет оптовой цены, показываем розничную как основную */}
            {!newPrice && oldPrice && (
              <span className={`font-bold text-blue-600 ${isMobile ? 'text-base' : 'text-xl'}`}>
                {oldPrice} руб.
              </span>
            )}
            {/* Если нет цен вообще */}
            {!newPrice && !oldPrice && (
              <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Цена по запросу</span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={`bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors ${
              isMobile ? 'px-3 py-2' : 'px-4 py-2 text-sm'
            }`}
          >
            {isMobile ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              'В корзину'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard