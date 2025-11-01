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
    // Ищем параметр tgWebAppData в URL
    const tgWebAppDataMatch = url.match(/tgWebAppData=([^&]+)/);
    if (tgWebAppDataMatch) {
      const tgWebAppData = decodeURIComponent(tgWebAppDataMatch[1]);
      console.log('📦 Найден tgWebAppData в URL:', tgWebAppData);
      
      // Парсим данные
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
    
    // Проверяем hash параметры
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
      
      // Детальная диагностика Telegram WebApp
      console.log('🔍 Детальная диагностика Telegram WebApp:');
      console.log('   - window существует:', typeof window !== 'undefined');
      console.log('   - window.Telegram:', window.Telegram);
      console.log('   - window.Telegram?.WebApp:', window.Telegram?.WebApp);
      
      let telegramUser = null;

      // Пробуем получить данные через стандартный Telegram WebApp
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        console.log('✅ Telegram WebApp ОБНАРУЖЕН через window.Telegram');
        telegramUser = TelegramService.initTelegramAuth();
      } else {
        console.log('🔍 Telegram WebApp не обнаружен, проверяем данные в URL...');
        telegramUser = parseTelegramDataFromURL();
        
        if (telegramUser) {
          console.log('✅ Данные пользователя извлечены из URL');
        } else {
          console.log('❌ Данные пользователя не найдены в URL');
        }
      }

      console.log('📱 Результат инициализации Telegram:', telegramUser);

      if (telegramUser && telegramUser.id) {
        console.log('🎯 Telegram пользователь определен:', {
          id: telegramUser.id,
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName,
          username: telegramUser.username
        });
        
        console.log('🔍 Проверяем уровень клиента с ID:', telegramUser.id);
        const clientData = await getClientInfo(telegramUser.id);
        console.log('📊 Результат проверки клиента в базе:', clientData);
        
        if (clientData) {
          console.log('✅ Клиент найден в базе:', {
            id: telegramUser.id,
            level: clientData.level,
            name: clientData.name,
            phone: clientData.phone
          });
          
          setClientInfo(clientData);
          console.log('🎯 Устанавливаем уровень клиента для продуктов:', clientData.level);
          setClientLevel(clientData.level);
          

          // Показываем уведомление
          const levelNames = { 'opt1': 'ОПТ1', 'opt2': 'ОПТ2', 'opt3': 'ОПТ3' };
          const levelName = levelNames[clientData.level] || clientData.level;
          const clientName = clientData.name || telegramUser.firstName || 'Клиент';
          
          console.log('💬 Показываем приветственное уведомление для:', clientName);
          setTimeout(() => {
            TelegramService.showNotification(
              `🎉 Добро пожаловать, ${clientName}!\n\nВам доступны оптовые цены уровня: ${levelName}`
            );
          }, 1000);
          
        } else {
          console.log('❌ Клиент не найден в базе оптовых клиентов, используем розничные цены');
          console.log('ℹ️ ID для поиска:', telegramUser.id);
          setClientInfo(null);
          setClientLevel(null);
          
          // Уведомление для неоптового клиента
          setTimeout(() => {
            TelegramService.showNotification(
              `👋 Добро пожаловать!\n\nДля вас действуют розничные цены. По вопросам оптовых цен обращайтесь к менеджеру.`
            );
          }, 1000);
        }
      } else {
        console.log('🌐 Telegram пользователь не определен, работаем в режиме розничных цен');
        setClientInfo(null);
        setClientLevel(null);
      }
    } catch (err) {
      console.error('💥 Ошибка инициализации клиента:', err);
      console.error('🔧 Stack trace:', err.stack);
      setClientInfo(null);
      setClientLevel(null);
    }
  };

  // Логируем изменения clientInfo
  useEffect(() => {
    console.log('🔄 clientInfo изменился:', clientInfo);
    if (clientInfo) {
      console.log('💰 Установлен уровень цен:', clientInfo.level);
    } else {
      console.log('💰 Установлен уровень цен: РОЗНИЦА');
    }
  }, [clientInfo]);

  // Логируем изменения products
  useEffect(() => {
    if (products.length > 0) {
      console.log('📦 Продукты загружены:', {
        count: products.length,
        firstProduct: products[0] ? {
          id: products[0].id,
          model: products[0].model,
          priceLevel: products[0].priceLevel,
          newPrice: products[0].newPrice
        } : null
      });
      
      // Логируем разные ценовые уровни в продуктах
      const priceLevels = products.reduce((acc, product) => {
        acc[product.priceLevel] = (acc[product.priceLevel] || 0) + 1;
        return acc;
      }, {});
      console.log('💰 Распределение ценовых уровней:', priceLevels);
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
    console.log('⌨️ Ввод поиска:', e.target.value);
    setSearchTerm(e.target.value);
  };

  const handleAddToCart = (p) => {
    console.log('🛒 Добавление в корзину:', {
      id: p.id,
      model: p.model,
      price: p.newPrice || p.price,
      level: p.priceLevel
    });
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
    console.log('🎯 Выбрана категория:', key, '->', categories[key]);
    setSelectedCategory(key);
    setShowCategories(false);
  };

  /* ---------- управление выплывающими меню ---------- */
  const toggleDrawer = (type) => {
    console.log('📱 Переключение меню:', type);
    
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
          console.log('👆 Клик вне меню, закрываем выпадающие списки');
          setShowCategories(false);
          setShowFilters(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Функция проверки Telegram WebApp (исправленная)
  const isTelegramWebApp = () => {
    const isTg = typeof window !== 'undefined' && 
                 (!!window.Telegram?.WebApp || 
                  window.location.href.includes('tgWebAppData'));
    console.log('🔍 Проверка Telegram WebApp:', isTg ? 'обнаружен' : 'не обнаружен');
    return isTg;
  };

  /* ---------- загрузка ---------- */
  if (loading) {
    console.log('⏳ Показываем индикатор загрузки...');
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

  console.log('🎨 Рендерим основной интерфейс');
  console.log('📊 Статус:', {
    clientInfo,
    productsCount: products.length,
    filteredCount: filteredProducts.length,
    cartItems: getTotalItems(),
    isMobile
  });

  /* ---------- отображение ---------- */
  return (
    <div className="relative">
      
      {/* 1. ЛИПКОЕ МЕНЮ */}
      <div className="sticky-menu">
        <div
          className={`
            fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b border-gray-200
            ${isMobile ? 'px-2 py-2' : 'px-4 py-3'}
          `}
          
        >
          {/* Верхний ряд: поиск + корзина */}
          <div className="flex items-center gap-3 mb-2 h-8">
            {/* Поле поиска */}
            <div className="flex-1 max-w-[70%]">
              <input
                type="text"
                placeholder={isMobile ? 'Поиск...' : 'Поиск по товарам...'}
                value={searchTerm}
                onChange={handleSearchChange}
                className={`
                  w-full border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500
                  ${isMobile ? 'px-2 py-1 text-xs h-8' : 'px-3 py-2 text-sm h-8'}
                `}
              />
            </div>

            {/* Кнопка корзины */}
            <button
              onClick={() => {
                console.log('🛒 Открытие корзины, товаров:', getTotalItems());
                setIsCartOpen(true);
              }}
              className={`
                flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded
                font-medium relative h-4 px-4 text-sm min-w-[32px]
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Корзина</span>
              <span
                className={`
                  bg-white text-green-600 rounded-full font-bold absolute flex items-center justify-center
                  px-1 text-xs min-w-5 h-5 -top-1 -right-1
                `}
              >
                {getTotalItems()}
              </span>
            </button>
          </div>

          {/* Второй ряд: Категории (слева) + Фильтры (справа) + Бейдж уровня */}
          <div className="flex items-center justify-between mb-2 h-8 gap-2">
            <button
              onClick={() => toggleDrawer('cat')}
              className={`
                px-4 py-1 rounded text-sm h-full transition-colors
                ${showCategories ? 'bg-gray-300 text-gray-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}
              `}
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
                className={`
                  flex items-center gap-1 text-white px-4 py-1 rounded text-sm h-full transition-colors
                  ${showFilters ? 'bg-gray-700' : 'bg-gray-600 hover:bg-gray-700'}
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Фильтры
              </button>
            </div>
          </div>

          {/* Выплывающие блоки */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out bg-white
              ${showCategories || showFilters ? 'max-h-96 opacity-100 py-2' : 'max-h-0 opacity-0'}
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
            height:
              showCategories || showFilters
                ? isMobile
                  ? '180px'
                  : '220px'
                : isMobile
                ? '80px'
                : '90px',
          }}
        />
      </div>

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <div
        className={`${isMobile ? 'px-2' : 'px-4'}`}
        style={{
          paddingTop:
            showCategories || showFilters
              ? isMobile
                ? '180px'
                : '220px'
              : isMobile
              ? '80px'
              : '90px',
        }}
      >
        {/* Информация о клиенте для десктопной версии */}
        {!isMobile && clientInfo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
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
                  Оптовые цены активны
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
        onClose={() => {
          console.log('❌ Закрытие корзины');
          setIsCartOpen(false);
        }}
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
