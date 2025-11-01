import { useState, useEffect } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Загружаем корзину из localStorage только после монтирования
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки корзины:', error);
    }
  }, []);

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('❌ Ошибка сохранения корзины:', error);
      }
    }
  }, [cart, isMounted]);

  // Функция для получения цены товара
  const getProductPrice = (product) => {
    try {
      const priceStr = product.newPrice || product.oldPrice || '0';
      const price = parseFloat(priceStr.toString().replace(/\s/g, '').replace(',', '.'));
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.error('❌ Ошибка парсинга цены:', error);
      return 0;
    }
  };

  // Добавить товар в корзину
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { 
          ...product, 
          quantity: 1,
          price: getProductPrice(product)
        }];
      }
    });
  };

  // Удалить товар из корзины
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Изменить количество товара
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Очистить корзину
  const clearCart = () => {
    setCart([]);
  };

  // Подсчет общего количества товаров
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  // Подсчет общей стоимости
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.price || getProductPrice(item);
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getProductPrice
  };
};