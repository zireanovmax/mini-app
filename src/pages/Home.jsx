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

function Home() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const menuRef = useRef(null);
  const [menuHeight, setMenuHeight] = useState(80);

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
      document.body.style.backgroundColor = 'white';
      document.documentElement.style.backgroundColor = 'white';
      
      // Фикс для мобильного viewport
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
        tg.setHeaderColor('#ffffff');
        tg.setBackgroundColor('#ffffff');
      }
      
      // Принудительный рефлоу
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      
      return () => window.removeEventListener('resize', setVH);
    };

    const timer = setTimeout(fixTelegramLayout, 200);
    return () => clearTimeout(timer);
  }, []);

  /* ---------- измерение высоты меню ---------- */
  useEffect(() => {
    const updateMenuHeight = () => {
      if (menuRef.current) {
        const height = menuRef.current.offsetHeight;
        setMenuHeight(height);
      }
    };

    updateMenuHeight();
    window.addEventListener('resize', updateMenuHeight);
    
    return () => window.removeEventListener('resize', updateMenuHeight);
  }, [showCategories, showFilters]);

  /* ---------- инициализация Telegram ---------- */
  useEffect(() => {
    initializeClient();
  }, []);

  const initializeClient = async () => {
    try {
      let telegramUser = null;

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
        const clientData = await getClientInfo(telegramUser.id);
        
        if (clientData) {
          setClientInfo(clientData);
          setClientLevel(clientData.level);
        } else {
          setClientInfo(null);
          setClientLevel(null);
        }
      } else {
        setClientInfo(null);
        setClientLevel(null);
      }
    } catch (err) {
      console.error('Ошибка инициализации:', err);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Товары временно недоступны</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  /* ---------- отображение ---------- */
  return (
    <div className="min-h-screen bg-white">
      
      {/* ЛИПКОЕ МЕНЮ */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200" ref={menuRef}>
        <div className={`${isMobile ? 'px-3 py-2' : 'px-4 py-3'}`}>
          
          {/* Верхний ряд: поиск + корзина */}
          <div className="flex items-center gap-2 mb-2">
            {/* Поле поиска */}
            <div className="flex-1">
              <input
                type="text"
                placeholder={isMobile ? 'Поиск...' : 'Поиск по товарам...'}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              />
            </div>

            {/* Кнопка корзины */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-colors relative"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {!isMobile && <span>Корзина</span>}
              {getTotalItems() > 0 && (
                <span className="bg-white text-green-600 rounded-full px-1 text-xs font-bold min-w-5 h-5 flex items-center justify-center absolute -top-1 -right-1">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Второй ряд: Категории + Фильтры */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleDrawer('cat')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showCategories ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              📁 Категории
            </button>

            <button
              onClick={() => toggleDrawer('flt')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              ⚙️ Фильтры
            </button>

            {/* Бейдж уровня клиента */}
            {clientInfo ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                {clientInfo.level.toUpperCase()}
              </span>
            ) : isTelegramWebApp() ? (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap">
                РОЗНИЦА
              </span>
            ) : null}
          </div>

          {/* Выплывающие блоки */}
          <div className={`transition-all duration-200 ease-in-out overflow-hidden ${
            showCategories || showFilters ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}>
            {showCategories && (
              <div className="bg-white border border-gray-200 rounded-lg p-2">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categories).map(([key, name]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectCategory(key)}
                      className={`p-2 rounded text-sm text-left transition-colors ${
                        selectedCategory === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showFilters && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="space-y-3">
                  {/* Бренды */}
                  {brands.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Бренд</label>
                      <select 
                        value={filters.brand}
                        onChange={(e) => setFilters(prev => ({...prev, brand: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Все бренды</option>
                        {brands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Мощность */}
                  {powers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Мощность</label>
                      <select 
                        value={filters.power}
                        onChange={(e) => setFilters(prev => ({...prev, power: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Любая мощность</option>
                        {powers.map(power => (
                          <option key={power} value={power}>{power}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Кнопка сброса */}
                  <button
                    onClick={() => setFilters({ brand: '', power: '', type: '', wifi: '' })}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded text-sm"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div 
        className={`bg-gray-50 min-h-screen ${isMobile ? 'px-2 py-3' : 'px-4 py-4'}`}
        style={{ paddingTop: `${menuHeight}px` }}
      >
        {/* Заголовок категории */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {debouncedSearchTerm
              ? `Результаты поиска: "${debouncedSearchTerm}"`
              : categories[selectedCategory]}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Найдено товаров: {filteredProducts.length}
          </p>
        </div>

        {/* Список товаров в сетке 2 колонки */}
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col">
              {/* Изображение товара */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.model}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    Нет изображения
                  </div>
                )}
              </div>

              {/* Информация о товаре */}
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                  {product.model}
                </h3>
                <p className="text-xs text-gray-600 mb-1">
                  {product.manufacturer}
                </p>
                {product.power && (
                  <p className="text-xs text-gray-500 mb-2">
                    Мощность: {product.power}
                  </p>
                )}
              </div>

              {/* Цена и кнопка */}
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {product.oldPrice && (
                      <div className="text-xs text-gray-500 line-through">
                        {product.oldPrice} ₽
                      </div>
                    )}
                    <div className="text-lg font-bold text-green-600">
                      {product.newPrice || product.price} ₽
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Сообщение если товаров нет */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Товары не найдены</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ brand: '', power: '', type: '', wifi: '' });
              }}
              className="mt-2 text-blue-500 text-sm hover:text-blue-600"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
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
