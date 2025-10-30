// src/services/googleSheets.js
import Papa from 'papaparse';

const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJ8tsvuiWl7mgYleNNGzJwc663w1NTysU5RkHmWJj___4vvOXaUoM0mPqW8F4iYr_RbWmi1ixShNcv/pub?output=csv';

function fixImage(url, size = 'w300-h300-c') {
  if (!url) return '';
  let id = '';
  if (url.includes('/file/d/')) id = url.split('/file/d/')[1]?.split('/')[0];
  else if (url.includes('id=')) id = url.split('id=')[1].split('&')[0];
  else return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=${size}`;
}

export class GoogleSheetsService {
  static async fetchProducts(clientLevel = null) {
    try {
      console.log('🔄 Загружаем данные из Google Sheets...');
      const response = await fetch(GOOGLE_SHEETS_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      console.log('✅ CSV данные получены');

      const products = this.parseCSVWithPapaParse(csvText, clientLevel);
      console.log('📊 Распарсено продуктов:', products.length);
      return products;
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      throw error;
    }
  }

  static parseCSVWithPapaParse(csvText, clientLevel) {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase(),
    });

    if (result.errors.length) {
      console.warn('⚠️ Предупреждения PapaParse:', result.errors);
    }

    return result.data
      .map((raw, idx) => this.formatProduct(raw, idx + 1, clientLevel))
      .filter(Boolean);
  }

  static formatProduct(raw, id, clientLevel) {
    console.log('🔧 Форматируем продукт:', {
      model: raw['модель'],
      clientLevel: clientLevel
    });

    const originalPhotoUrl = raw['фото'] || '';
    const fixedPhotoUrl = fixImage(originalPhotoUrl);

    // Определяем цену в зависимости от уровня клиента
    const priceData = this.getPriceForLevel(raw, clientLevel);
    console.log('💰 Результат выбора цены:', priceData);

    const product = {
      id,
      photo: fixedPhotoUrl,
      code: raw['код'] || '',
      model: this.createModelName(raw),
      wifi: this.extractWifi(raw),
      oldPrice: raw['розница (руб.)'] || raw['розница'] || '',
      discount: raw['скидка оптовая %'] || raw['скидка'] || '',
      retailDiscount: raw['скидка розница %'] || raw['скидка розница'] || '',
      newPrice: priceData.price,
      priceLevel: priceData.level,
      category: this.determineCategory(raw),
      description: raw['описание товара'] || raw['описание'] || '',
      manufacturer: raw['производитель'] || '',
      productModel: raw['модель'] || '',
      type: this.extractType(raw),
      power: this.extractPower(raw),
      originalPhoto: originalPhotoUrl,
    };

    return product.model ? product : null;
  }

  static getPriceForLevel(raw, clientLevel) {
    console.log('🎯 Определяем цену для уровня:', clientLevel);
    
    // Если клиент не оптовый или уровень не указан - розничная цена
    if (!clientLevel) {
      return {
        price: raw['розница (руб.)'] || raw['розница'] || '',
        level: 'retail'
      };
    }

    // Ищем цену для соответствующего уровня
    const priceColumn = this.getPriceColumnForLevel(clientLevel);
    const price = raw[priceColumn] || '';

    console.log('📊 Найдена цена:', { priceColumn, price });

    // Если цена для уровня не найдена, используем розничную
    if (!price) {
      console.warn(`⚠️ Цена для уровня ${clientLevel} не найдена, используем розничную`);
      return {
        price: raw['розница (руб.)'] || raw['розница'] || '',
        level: 'retail'
      };
    }

    return {
      price: price,
      level: clientLevel
    };
  }

  static getPriceColumnForLevel(level) {
    const columnMap = {
      'opt1': 'опт1 (руб.)',
      'opt2': 'опт2 (руб.)', 
      'opt3': 'опт3 (руб.)'
    };
    
    return columnMap[level] || 'розница (руб.)';
  }

  /* ---------- остальные вспомогательные методы ---------- */

  static createModelName(rawProduct) {
    const manufacturer = rawProduct['производитель'];
    const model = rawProduct['модель'];
    if (manufacturer && model) {
      return `${manufacturer} ${model}`;
    }
    return model || manufacturer || null;
  }

  static extractWifi(rawProduct) {
    const raw = (rawProduct['описание товара'] || '').trim();
    if (!raw) return 'Нет';

    const parts = raw.split('\\').filter(Boolean);
    const last = parts.at(-1)?.toLowerCase().replace(/\d+$/, '').trim();
    switch (last) {
      case 'есть': return 'Есть';
      case 'опционально': return 'Опция';
      default: return 'Нет';
    }
  }

  static extractPower(rawProduct) {
    const raw = rawProduct['описание товара'] || '';
    const m = raw.match(/\b(\d{4,5})\b/);
    return m ? `${m[1]} BTU` : null;
  }

  static extractType(rawProduct) {
    const raw = (rawProduct['описание'] || '').toLowerCase();
    if (raw.includes('invertor')) return 'Инвертор';
    if (raw.includes('on') && (raw.includes('off') || raw.includes('|'))) return 'ON-OFF';
    return 'ON-OFF';
  }

  static determineCategory(rawProduct) {
    const menu = (rawProduct['меню'] || '').toLowerCase();

    if (menu.includes('мобиль')) return 'mobile';
    if (menu.includes('напольно') || menu.includes('потолоч')) return 'floorCeiling';
    if (menu.includes('канал')) return 'duct';
    if (menu.includes('кассет')) return 'cassette';
    if (menu.includes('мульти')) return 'multi';
    if (menu.includes('труб') || menu.includes('материал') || menu.includes('фитинг') || menu.includes('изол')) return 'materials';
    return 'split';
  }
}