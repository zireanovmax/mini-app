import React from 'react';
import ProductCard from './ProductCard';

function ProductList({ products, categoryName, onAddToCart, deviceType, clientInfo }) { // ← ДОБАВИТЬ clientInfo
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  if (products.length === 0) {
    return (
      <div className="text-center">
        <h2 className={`font-bold text-gray-600 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
          {categoryName}
        </h2>
        <p className="text-gray-500 mt-2">Товары не найдены</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={`font-bold text-gray-800 text-center ${isMobile ? 'text-2xl mb-2' : 'text-4xl mb-3'}`}>
        {categoryName}
      </h2>
      <div className={`
        grid gap-3
        ${isMobile 
          ? 'grid-cols-2' 
          : isTablet 
            ? 'grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }
      `}>
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={onAddToCart}
            deviceType={deviceType}
            clientInfo={clientInfo} // ← ДОБАВИТЬ ЭТУ СТРОКУ
          />
        ))}
      </div>
    </div>
  );
}

export default ProductList;