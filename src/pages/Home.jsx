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
      
      document.body.style.overflow = 'auto';
      document.body.style.position = 'relative';
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        tg.enableClosingConfirmation();
      }
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
    <div className="min-h-screen bg-gray-50">
      
      {/* ЛИПКОЕ МЕНЮ */}
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

          {/* Второй ряд: Категории + Фильтры */}
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

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div 
        className={`${isMobile ? 'px-3 py-4' : 'px-4 py-6'}`}
        style={{ paddingTop: `${menuHeight}px` }}
      >
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