// В начало Home.jsx ДОБАВЬТЕ ЭТОТ КОД:
import React, { useState, useEffect, useRef } from 'react';

// ЯРКИЙ ТЕСТОВЫЙ БАННЕР
const TestBanner = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'red',
    color: 'white',
    padding: '10px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 9999
  }}>
    🚨 ТЕСТ: Home.jsx ЗАГРУЖЕН - {new Date().toLocaleTimeString()} 🚨
  </div>
);

function Home() {
  // В НАЧАЛО КОМПОНЕНТА ДОБАВЬТЕ:
  console.log('🔥 HOME COMPONENT RENDERED - VERSION 3.0');
  
  // В return ДОБАВЬТЕ ПЕРВОЙ СТРОКОЙ:
  return (
    <div className="min-h-screen bg-gray-50">
      <TestBanner /> {/* ДОБАВИТЬ ЭТУ СТРОКУ */}
      
      {/* остальная верстка */}
    </div>
  );
}


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
  const menuRef = useRef(null);
  const [menuHeight, setMenuHeight] = useState(80); // начальная высота

  /* ---------- состояния ---------- */
  const [selectedCategory, setSelectedCategory] = useState('split');
  const [filters, setFilters] = useState({ brand: '', power: '', type: '', wifi: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
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
    const fixTelegramLayout = () => {
      console.log('🔧 Применяем фиксы для Telegram...');
      
      // Основные фиксы
      document.body.style.overflow = 'auto';
      document.body.style.position = 'relative';
      document.body.style.minHeight = '100vh';
      
      // Фикс viewport height для мобильных
      const setVH = () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setVH();
      window.addEventListener('resize', setVH);
      
      // Инициализация Telegram WebApp
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        tg.enableClosingConfirmation();
        tg.ready();
      }
      
      return () => window.removeEventListener('resize', setVH);
    };

    const timer = setTimeout(fixTelegramLayout, 150);
    return () => clearTimeout(timer);
  }, []);

  /* ---------- измерение высоты меню ---------- */
  useEffect(() => {
    const updateMenuHeight = () => {
      if (menuRef.current) {
        const height = menuRef.current.offsetHeight;
        setMenuHeight(height);
        console.log('📏 Высота меню:', height);
      }
    };

    // Обновляем высоту при изменениях
    updateMenuHeight();
    const resizeObserver = new ResizeObserver(updateMenuHeight);
    if (menuRef.current) {
      resizeObserver.observe(menuRef.current);
    }
    
    window.addEventListener('resize', updateMenuHeight);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMenuHeight);
    };
  }, [showCategories, showFilters]);

  /* ---------- инициализация Telegram и проверка клиента ---------- */
  useEffect(() => {
    console.log('🏠 Home компонент монтируется');
    initializeClient();
  }, []);

  const initializeClient = async () => {
    try {
      console.log('🚀 Начинаем инициализацию клиента...');
      
      let telegramUser = null;

      if (window.Telegram?.WebApp) {
        console.log('✅ Telegram WebApp обнаружен');
        const tg = window.Telegram.WebApp;
        const userData = tg.initDataUnsafe?.user;
        
        if (userData) {
          telegramUser = {
            id: userData.id?.toString(),
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            username: userData.username || '',
            fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
          };
        }
      } else {
        console.log('🔍 Проверяем данные в URL...');
        telegramUser = parseTelegramDataFromURL();
      }

      console.log('📱 Результат инициализации Telegram:', telegramUser);

      if (telegramUser?.id) {
        console.log('🎯 Telegram пользователь определен');
        
        const clientData = await getClientInfo(telegramUser.id);
        console.log('📊 Результат проверки клиента:', clientData);
        
        if (clientData) {
          setClientInfo(clientData);
          setClientLevel(clientData.level);
          
          const levelNames = { 'opt1': 'ОПТ1', 'opt2': 'ОПТ2', 'opt3': 'ОПТ3' };
          const levelName = levelNames[clientData.level] || clientData.level;
          const clientName = clientData.name || telegramUser.firstName || 'Клиент';
          
          setTimeout(() => {
            TelegramService.showNotification(
              `🎉 Добро пожаловать, ${clientName}!\n\nВам доступны оптовые цены уровня: ${levelName}`
            );
          }, 1000);
          
        } else {
          setClientInfo(null);
          setClientLevel(null);
          
          setTimeout(() => {
            TelegramService.showNotification(
              `👋 Добро пожаловать!\n\nДля вас действуют розничные цены.`
            );
          }, 1000);
        }
      } else {
        setClientInfo(null);
        setClientLevel(null);
      }
    } catch (err) {
      console.error('💥 Ошибка инициализации клиента:', err);
      setClientInfo(null);
      setClientLevel(null);
    }
  };

  /* ---------- фильтры/поиск ---------- */
  const categoryProducts = products.filter(p => p.category === selectedCategory);
  const brands = [...new Set(categoryProducts.map(p => p.manufacturer).filter(Boolean))];
  const powers = [...new Set(categoryProducts.map(p => p.power).filter(Boolean))];
  const types = [...new Set(categoryProducts.map(p => p.type).filter(Boolean))];
  const wifis = [...new Set(categoryProducts.map(p => p.wifi).filter(Boolean))];

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
    return results;
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

  filteredProducts = filteredProducts
    .filter((p) => !filters.brand || p.manufacturer === filters.brand)
    .filter((p) => !filters.power || p.power === filters.power)
    .filter((p) => !filters.type || p.type === filters.type)
    .filter((p) => !filters.wifi || p.wifi === filters.wifi);

  /* ---------- выбор категории ---------- */
  const handleSelectCategory = (key) => {
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
           (!!window.Telegram?.WebApp || window.location.href.includes('tgWebAppData'));
  };

  /* ---------- загрузка ---------- */
  if (loading) {
    return (
      <div className={`mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-8'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
          {clientInfo && (
            <p className="text-sm text-green-600 mt-2">
              {clientInfo.level.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---------- отображение ---------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. ЛИПКОЕ МЕНЮ */}
      <div className="sticky-menu sticky top-0 z-40 bg-white shadow-lg border-b border-gray-200" ref={menuRef}>
        <div className={`${isMobile ? 'px-3 py-3' : 'px-4 py-3'}`}>
          {/* Верхний ряд: поиск + корзина */}
          <div className="flex items-center gap-3 mb-3">
            {/* Поле поиска */}
            <div className="flex-1">
              <input
                type="text"
                placeholder={isMobile ? 'Поиск...' : 'Поиск по товарам...'}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Кнопка корзины */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors relative min-w-[100px] justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Корзина</span>
              <span className="bg-white text-green-600 rounded-full px-1 text-xs font-bold min-w-5 h-5 flex items-center justify-center absolute -top-1 -right-1">
                {getTotalItems()}
              </span>
            </button>
          </div>

          {/* Второй ряд: Категории + Фильтры + Бейдж уровня */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => toggleDrawer('cat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                showCategories ? 'bg-gray-300 text-gray-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Категории
            </button>

            <div className="flex items-center gap-2">
              {!clientInfo && isTelegramWebApp() && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap">
                  РОЗНИЦА
                </span>
              )}

              <button
                onClick={() => toggleDrawer('flt')}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters ? 'bg-gray-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="hidden sm:inline">Фильтры</span>
              </button>
            </div>
          </div>

          {/* Выплывающие блоки */}
          <div className={`transition-all duration-300 ease-in-out ${
            showCategories || showFilters ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}>
            {showCategories && (
              <CategoryMenu
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                deviceType={deviceType}
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
      </div>

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <div 
        className={`${isMobile ? 'px-3 py-4' : 'px-4 py-6'}`}
        style={{ paddingTop: `${menuHeight}px` }}
      >
        {/* Информация о клиенте для десктопной версии */}
        {!isMobile && clientInfo && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">Оптовые цены активны</h3>
                <p className="text-sm text-green-600">
                  Уровень: <strong>{clientInfo.level.toUpperCase()}</strong> | 
                  Клиент: <strong>{clientInfo.name}</strong>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {clientInfo.level.toUpperCase()}
                </div>
                <div className="text-xs text-green-500">
                  Оптовые цены
                </div>
              </div>
            </div>
          </div>
        )}

        <ProductList
          products={filteredProducts}
          categoryName={
            debouncedSearchTerm
              ? `Результаты: "${debouncedSearchTerm}"`
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