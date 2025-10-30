// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import { GoogleSheetsService } from '../services/googleSheets';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientLevel, setClientLevel] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [clientLevel]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Загрузка продуктов с уровнем:', clientLevel);
      
      const productsData = await GoogleSheetsService.fetchProducts(clientLevel);
      setProducts(productsData);
      
      console.log('✅ Продукты загружены:', productsData.length);
    } catch (err) {
      console.error('❌ Ошибка загрузки продуктов:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    clientLevel,
    setClientLevel,
    reloadProducts: loadProducts
  };
};