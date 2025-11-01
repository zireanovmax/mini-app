import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import CategoryMenu from '../components/CategoryMenu';
import ProductList from '../components/ProductList';
import LoadingSpinner from '../components/LoadingSpinner';
import Filters from '../components/Filters';
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

/* ---------- Парсинг данных из URL Telegram WebApp ---------- */
const parseTelegramDataFromURL = () => {
  const url = window.location.href;
  console.log('🔗 Анализируем URL:', url);
  
  try {
    const tgWebAppDataMatch = url.match(/tgWebAppData=([^&]+)/);
    if (tgWebAppDataMatch) {
      const tgWebAppData = decodeURIComponent(tgWebAppDataMatch[1]);
      console.log('📦 Найден tgWebAppData в URL:', tgWebAppData);
      
      const params = new URLSearchParams(tgWebAppData);
      const userParam = params.get('user');
      
      if (userParam) {
        const userData = JSON.parse(userParam);
        console.log('👤 Данные пользователя из URL:', userData);
        
        return {
          id: userData.id?.toString(),
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          username: userData.username || '',
          fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
        };
      }
    }
    
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const tgWebAppDataHash = hashParams.get('tgWebAppData');
    
    if (tgWebAppDataHash) {
      console.log('📦 Найден tgWebAppData в hash:', tgWebAppDataHash);
      const params = new URLSearchParams(tgWebAppDataHash);
      const userParam = params.get('user');
      
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('👤 Данные пользователя из hash:', userData);
        
        return {
          id: userData.id?.toString(),
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          username: userData.username || '',
          fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
        };
      }
    }
  } catch (error) {
    console.error('❌ Ошибка парсинга данных из URL:', error);
  }
  
  return null;
};

/* ==========================================
   ГЛАВНЫЙ КОМПОНЕНТ
   ========================================== */
function Home() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  /* ---------- состояния ---------- */
  const [selectedCategory, setSelectedCategory] = useState('split');
  const [filters, setFilters] = useState({ brand: '', power: '', type: '', wifi: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  /* ---------- инициализация Telegram и проверка клиента ---------- */
  useEffect(() => {
    console.log('🏠 Home компонент монтируется');
    console.log('📍 Текущий URL:', window.location.href);
    console.log('📱 User Agent:', navigator.userAgent);
    initializeClient();
  }, []);

  const initializeClient = async () => {
    try {
      console.log('🚀 Начинаем инициализацию клиента...');
      
      let telegramUser = null;

      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        console.log('✅ Telegram WebApp ОБНАРУЖЕН через window.Telegram');
        telegramUser = TelegramService.initTelegramAuth();
      } else {
        console.log('🔍 Telegram WebApp не обнаружен, проверяем данные в URL...');
        telegramUser = parseTelegramDataFromURL();
      }

      console.log('📱 Результат инициализации Telegram:', telegramUser);

      if (telegramUser && telegramUser.id) {
        console.log('🎯 Telegram пользователь определен:', telegramUser.id);
        
        const clientData = await getClientInfo(telegramUser.id);
        console.log('📊 Результат проверки клиента в базе:', clientData);
        
        if (clientData) {
          console.log('✅ Клиент найден в базе:', clientData);
          setClientInfo(clientData);
          setClientLevel(clientData.level);
        } else {
          console.log('❌ Клиент не найден в базе оптовых клиентов');
          setClientInfo(null);
          setClientLevel(null);
        }
      } else {
        console.log('🌐 Telegram пользователь не определен');
        setClientInfo(null);
        setClientLevel(null);
      }
    } catch (err) {
      console.error('💥 Ошибка инициализации клиента:', err);
      setClientInfo(null);
      setClientLevel(null);
    }
  };

  useEffect(() => {
    console.log('🔄 clientInfo изменился:', clientInfo);
  }, [clientInfo]);

  useEffect(() => {
    if (products.length > 0) {
      console.log('📦 Продукты загружены:', products.length);
    }
  }, [products]);

  useEffect(() => {
    console.log('🔄 Сбрасываем фильтры при смене категории:', selectedCategory);
    setFilters({ brand: '', power: '', type: '', wifi: '' });
  }, [selectedCategory]);

  /* ---------- фильтры/поиск ---------- */
  const categoryProducts = products.filter(p => p.category === selectedCategory);
  const brands = [...new Set(categoryProducts.map(p => p.manufacturer).filter(Boolean))];
  const powers = [...new Set(categoryProducts.map(p => p.power).filter(Boolean))];
  const types = [...new Set(categoryProducts.map(p => p.type).filter(Boolean))];
  const wifis = [...new Set(categoryProducts.map(p => p.wifi).filter(Boolean))];

  console.log('🎯 Категория:', selectedCategory, 'Продуктов:', categoryProducts.length);

  const searchInAllProducts = (text) => {
    if (!text) return categoryProducts;
    const lower = text.toLowerCase();
    const results = products.filter(
      (p) =>
        p.model?.toLowerCase().includes(lower) ||
        p.productModel?.toLowerCase().includes(lower) ||
        p.manufacturer?.toLowerCase().includes(lower) ||
        p.code?.toLowerCase().includes(lower)
    );
    console.log('🔍 Поиск:', text, 'Найдено:', results.length);
    return results;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddToCart = (p) => {
    console.log('🛒 Добавление в корзину:', p.id);
    addToCart(p);
  };

  let filteredProducts = debouncedSearchTerm
    ? searchInAllProducts(debouncedSearchTerm)
    : categoryProducts;

  filteredProducts = filteredProducts
    .filter((p) => !filters.brand || p.manufacturer === filters.brand)
    .filter((p) => !filters.power || p.power === filters.power)
    .filter((p) => !filters.type || p.type === filters.type)
    .filter((p) => !filters.wifi || p.wifi === filters.wifi);

  console.log('✅ Отфильтрованные продукты:', filteredProducts.length);

  /* ---------- выбор категории ---------- */
  const handleSelectCategory = (key) => {
    console.log('🎯 Выбрана категория:', key);
    setSelectedCategory(key);
    setShowCategories(false);
  };

  /* ---------- управление выплывающими меню ---------- */
  const toggleDrawer = (type) => {
    if (type === 'cat') {
      setShowFilters(false);
      setShowCategories((p) => !p);
    } else {
      setShowCategories(false);
      setShowFilters((p) => !p);
    }
  };

  // Закрывать меню при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      const stickyMenu = document.querySelector('.sticky-menu');
      if (stickyMenu && !stickyMenu.contains(event.target)) {
        const isCategoryButton = event.target.closest('button')?.textContent === 'Категории';
        const isFilterButton = event.target.closest('button')?.textContent === 'Фильтры';
        if (!isCategoryButton && !isFilterButton) {
          setShowCategories(false);
          setShowFilters(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Функция проверки Telegram WebApp
  const isTelegramWebApp = () => {
    return typeof window !== 'undefined' && 
           (!!window.Telegram?.WebApp || 
            window.location.href.includes('tgWebAppData'));
  };

  /* ---------- загрузка ---------- */
  if (loading) {
    return (
      <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-8'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  /* ---------- отображение ---------- */
  return (
    <div className="relative min-h-screen bg-gray-50">
      
      {/* 1. ЛИПКОЕ МЕНЮ */}
      <div className="sticky-menu">
        <div
          className={`
            fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-gray-200
            ${isMobile ? 'px-3 py-3' : 'px-6 py-4'}
          `}
        >
          {/* Верхний ряд: заголовок + корзина */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Кондиционеры</h1>
            
            {/* Кнопка корзины */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`
                flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                font-medium relative ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'}
                transition-colors duration-200
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={isMobile ? 'hidden' : 'block'}>Корзина</span>
              <span
                className="
                  bg-white text-blue-600 rounded-full font-bold absolute flex items-center justify-center
                  px-1 text-xs min-w-5 h-5 -top-1 -right-1
                "
              >
                {getTotalItems()}
              </span>
            </button>
          </div>

          {/* Второй ряд: поиск */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по товарам..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`
                  w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-3'}
                  transition-all duration-200
                `}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Третий ряд: Категории + Фильтры + Бейдж уровня */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => toggleDrawer('cat')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${showCategories ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
                  flex-1 justify-center
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Категории
              </button>

              <button
                onClick={() => toggleDrawer('flt')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${showFilters ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </button>
            </div>

            {/* Бейдж уровня клиента */}
            <div className="flex-shrink-0">
              {clientInfo ? (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                  {clientInfo.level.toUpperCase()}
                </div>
              ) : isTelegramWebApp() ? (
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                  РОЗНИЦА
                </div>
              ) : null}
            </div>
          </div>

          {/* Выплывающие блоки */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out bg-white mt-3 rounded-lg border border-gray-200
              ${showCategories || showFilters ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0'}
            `}
          >
            {showCategories && (
              <CategoryMenu
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                deviceType={deviceType}
                largeButtons
              />
            )}

            {showFilters && (
              <Filters
                brands={brands}
                powers={powers}
                types={types}
                wifis={wifis}
                filters={filters}
                setFilters={setFilters}
                deviceType={deviceType}
              />
            )}
          </div>
        </div>

        {/* Плейсхолдер под меню */}
        <div
          className="invisible"
          style={{
            height: showCategories || showFilters 
              ? (isMobile ? '260px' : '280px')
              : (isMobile ? '180px' : '200px')
          }}
        />
      </div>

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <div
        className={isMobile ? 'px-3' : 'px-6'}
        style={{
          paddingTop: showCategories || showFilters 
            ? (isMobile ? '260px' : '280px')
            : (isMobile ? '180px' : '200px')
        }}
      >
        {/* Информация о клиенте */}
        {clientInfo && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 text-lg">Оптовые цены активны</h3>
                <p className="text-green-600 mt-1">
                  Уровень: <strong>{clientInfo.level.toUpperCase()}</strong> | 
                  Клиент: <strong>{clientInfo.name}</strong>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 bg-white px-3 py-2 rounded-lg border border-green-200">
                  {clientInfo.level.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        <ProductList
          products={filteredProducts}
          categoryName={
            debouncedSearchTerm
              ? `Результаты поиска: "${debouncedSearchTerm}"`
              : categories[selectedCategory]
          }
          onAddToCart={handleAddToCart}
          deviceType={deviceType}
          clientInfo={clientInfo}
        />
      </div>

      {/* 3. МОДАЛКА КОРЗИНЫ */}
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
