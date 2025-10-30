// src/services/discountService.js
import Papa from 'papaparse';

const CLIENTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQBouyBdwr2cokMaY5cazn6q3lF6VNmm2Djaq7I-8B1l_19hD63XRvt_XYfAkA-6wuGZlkVFS3liqfJ/pub?output=csv';

let clientsMap = null;
let loading = false;

async function loadClients() {
  if (clientsMap) return clientsMap;
  if (loading) {
    return new Promise(resolve => {
      const checkLoaded = () => {
        if (clientsMap) resolve(clientsMap);
        else setTimeout(checkLoaded, 100);
      };
      checkLoaded();
    });
  }

  loading = true;

  try {
    const resp = await fetch(CLIENTS_SHEET_URL);
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    const csv = await resp.text();

    const { data } = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase()
    });

    clientsMap = new Map();

    data.forEach((row) => {
      const telegramId = String(row['id'] || '').trim();

      if (!telegramId || telegramId === 'undefined' || telegramId === 'null' || telegramId === '') {
        return;
      }

      const level =
        String(row['опт1'] || '').toLowerCase().trim() === 'yes' ? 'opt1' :
        String(row['опт2'] || '').toLowerCase().trim() === 'yes' ? 'opt2' :
        String(row['опт3'] || '').toLowerCase().trim() === 'yes' ? 'opt3' :
        null;

      if (!level) return;

      // ✅ ВАЖНО: возвращаем name и phone из CSV
      const clientInfo = {
        level: level,
        name: row['клиент']?.trim() || '',
        phone: row['телефон']?.trim() || '',
        telegramId: telegramId
      };

      clientsMap.set(telegramId, clientInfo);
    });

    return clientsMap;
  } catch (error) {
    console.error('Ошибка загрузки клиентов:', error);
    clientsMap = new Map();
    return clientsMap;
  } finally {
    loading = false;
  }
}

export async function getClientInfo(tgId) {
  console.log('🔍 getClientInfo вызван с ID:', tgId);
  if (!tgId) return null;

  try {
    const map = await loadClients();
    const client = map.get(String(tgId));
    console.log('📋 Найден клиент:', client);
    return client || null;
  } catch (error) {
    console.error('Ошибка проверки клиента:', error);
    return null;
  }
}

// Для обратной совместимости
export async function getClientLevel(tgId) {
  console.log('🔍 getClientLevel вызван с ID:', tgId);
  const clientInfo = await getClientInfo(tgId);
  console.log('📦 getClientInfo вернул:', clientInfo);
  return clientInfo ? { level: clientInfo.level } : null;
}