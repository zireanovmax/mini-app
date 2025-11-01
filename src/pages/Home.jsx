import React, { useState, useEffect, useRef } from 'react';
import ProductList from '../components/ProductList';
import LoadingSpinner from '../components/LoadingSpinner';
import CartModal from '../components/CartModal';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useDeviceType } from '../hooks/useDeviceType';
import { TelegramService } from '../services/telegramService';
import { getClientInfo } from '../services/discountService';

/* ---------- debounce ---------- */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function Home() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  /* ---------- состояния ---------- */
  const [selectedCategory, setSelectedCategory] = useState('split');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);

  /* ---------- хуки данных ---------- */
  const { products, loading, setClientLevel } = useProducts();
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const categories = {
    split: 'Сплит-системы',
    mobile: 'Мобильные',
    floorCeiling: 'Напольно-потолочные',
    duct: 'Канальные',
    cassette: 'Кассетные',
    multi: 'Мультисплиты',
    materials: 'Материалы',
  };

  /* ---------- ФИКС ДЛЯ TELEGRAM LAYOUT ---------- */
  useEffect(() => {
    const fixLayout = () => {
      console.log('🔧 Применяем фиксы для Telegram...');
      
      // Фиксы для body
      document.body.style.overflow = 'auto';
      document.body.style.position = 'relative';
      document.body.style.minHeight = '100vh';
      
      // Фикс viewport height
      const setVH = () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', setVH);
      
      // Расширяем Telegram WebApp
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation();
      }
      
      return () => window.removeEventListener('resize', setVH);
    };

    const timer = setTimeout(fixLayout, 100);
    return () => clearTimeout(timer);
  }, []);

  /* ---------- инициализация Telegram ---------- */
  useEffect(() => {
    console.log('🏠 Home компонент монтируется');
    initializeClient();
  }, []);

  const initializeClient = async () => {
    try {
      console.log('🚀 Инициализация клиента...');
      
      let telegramUser = null;

      // Пробуем получить данные через стандартный Telegram WebApp
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const userData = tg.initDataUnsafe?.user;
        
        if (userData) {
          telegramUser = {
            id: userData.id?.toString(),
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            username: userData.username || ''
          };
        }
      }

      if (telegramUser?.id) {
        console.log('👤 Telegram пользователь:', telegramUser);
        const clientData = await getClientInfo(telegramUser.id);
        
        if (clientData) {
          setClientInfo(clientData);
          setClientLevel(clientData.level);
          
          TelegramService.showNotification(
            `🎉 Добро пожаловать, ${clientData.name || telegramUser.firstName}!`
          );
        } else {
          setClientInfo(null);
          setClientLevel(null);
        }
      } else {
        setClientInfo(null);
        setClientLevel(null);
      }
    } catch (err) {
      console.error('❌ Ошибка инициализации:', err);
      setClientInfo(null);
      setClientLevel(null);
    }
  };

  /* ---------- фильтры/поиск ---------- */
  const categoryProducts = products.filter(p => p.category === selectedCategory);

  const searchInAllProducts = (text) => {
    if (!text) return categoryProducts;
    const lower = text.toLowerCase();
    return products.filter(
      (p) =>
        p.model?.toLowerCase().includes(lower) ||
        p.productModel?.toLowerCase().includes(lower) ||
        p.manufacturer?.toLowerCase().includes(lower) ||
        p.code?.toLowerCase().includes(lower)
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddToCart = (p) => {
    addToCart(p);
  };

  let filteredProducts = debouncedSearchTerm
    ? searchInAllProducts(debouncedSearchTerm)
    : categoryProducts;

  /* ---------- загрузка ---------- */
  if (loading) {
    return <LoadingSpinner />;
  }

  /* ---------- отображение ---------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ПРОСТОЕ СТИКИ МЕНЮ */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className={`${isMobile ? 'px-3 py-3' : 'px-6 py-4'}`}>
          {/* Поиск и корзина в одной строке */}
          <div className="flex items-center gap-3">
            {/* Поиск */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Корзина */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Корзина</span>
              <span className="bg-white text-green-600 rounded-full px-2 py-1 text-xs font-bold min-w-6">
                {getTotalItems()}
              </span>
            </button>
          </div>

          {/* Категории */}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(categories).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Инфо о клиенте */}
          {clientInfo && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">
                  Уровень: <strong>{clientInfo.level.toUpperCase()}</strong>
                </span>
                <span className="text-xs text-green-600">
                  {clientInfo.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className={`${isMobile ? 'px-3 py-4' : 'px-6 py-6'}`}>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {debouncedSearchTerm
              ? `Результаты поиска: "${debouncedSearchTerm}"`
              : categories[selectedCategory]}
          </h1>
          <p className="text-gray-600 mt-1">
            Найдено товаров: {filteredProducts.length}
          </p>
        </div>

        <ProductList
          products={filteredProducts}
          categoryName={categories[selectedCategory]}
          onAddToCart={handleAddToCart}
          deviceType={deviceType}
          clientInfo={clientInfo}
        />
      </div>

      {/* МОДАЛКА КОРЗИНЫ */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        totalItems={getTotalItems()}
        totalPrice={getTotalPrice()}
        deviceType={deviceType}
        clientInfo={clientInfo}
      />
    </div>
  );
}

export default Home;