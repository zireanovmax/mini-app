import { useState, useEffect } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);

  // Загружаем корзину из localStorage при монтировании
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Функция для получения цены товара
  const getProductPrice = (product) => {
    const price = parseFloat(product.newPrice?.replace(/\s/g, '') || product.oldPrice?.replace(/\s/g, '') || '0');
    return price;
  };

  // Добавить товар в корзину
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Если товар уже есть, увеличиваем количество
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Если товара нет, добавляем с количеством 1
        return [...prevCart, { ...product, quantity: 1 }];
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
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Подсчет общей стоимости
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      return total + (getProductPrice(item) * item.quantity);
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