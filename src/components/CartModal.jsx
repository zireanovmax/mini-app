import React, { useState, useEffect } from 'react';
import OrderForm from './OrderForm';

const SHIPPING_LOCATIONS = [
  'Тирасполь Центр (ТЦТ)',
  'Тирасполь Балка',
  'Бендеры Центр',
  'Бендеры Бам (ТЦБ)',
  'Рыбница 2',
  'Рыбница',
  'Дубоссары',
  'Григориополь',
  'Каменка',
  'Слободзея',
  'Днестровск',
  'Первомайск',
  'Склад'
];

const CartModal = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  totalItems,
  totalPrice,
  clientInfo
}) => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (clientInfo?.name) {
      // АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ ИЗ ДАННЫХ КЛИЕНТА
      setCustomerName(clientInfo.name);
      setCustomerPhone(clientInfo.phone || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [clientInfo, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0 }).format(price);

  const getProductPrice = (product) => {
    const str = product.newPrice || product.oldPrice || '0';
    return Number(str.replace(/\s/g, '').replace(',', '.'));
  };

  // MarkdownV2-экранирование
  const escapeMd = (t) =>
    String(t)
      .replace(/([_*[\]()~`>#+=|{}.!\\])/g, '\\$1')
      .replace(/-/g, '\\-');

  const sendOrderToTelegram = async (orderData) => {
  try {
    // Форматируем сообщение БЕЗ MarkdownV2 экранирования для начала
    const msg = `
🛒 НОВЫЙ ЗАКАЗ

👤 Клиент: ${orderData.customerInfo.name}
📞 Телефон: ${orderData.customerInfo.phone}
📍 Место отгрузки: ${orderData.customerInfo.address}
💬 Комментарий: ${orderData.customerInfo.comments || 'нет комментария'}
📊 Уровень цен: ${clientInfo?.level?.toUpperCase() || 'РОЗНИЦА'}
${clientInfo?.telegramId ? `🆔 ID клиента: ${clientInfo.telegramId}` : ''}

📦 Состав заказа:
${orderData.cart
  .map(
    (item) =>
      `• ${item.manufacturer} ${item.model}
   Код: ${item.code}
   Количество: ${item.quantity} шт.
   Цена: ${formatPrice(item.price * item.quantity)} руб.
   Уровень: ${item.priceLevel || 'retail'}`
  )
  .join('\n\n')}

💰 ИТОГО: ${formatPrice(orderData.totalPrice)} руб.
📦 Общее количество: ${orderData.cart.reduce((s, i) => s + i.quantity, 0)} шт.
🕒 Время заказа: ${new Date().toLocaleString('ru-RU')}
    `.trim();

    const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
    const CHAT_ID = import.meta.env.VITE_CHAT_ID;

    console.log('🔧 Отправка заказа в Telegram:', {
      BOT_TOKEN: BOT_TOKEN ? '***' + BOT_TOKEN.slice(-4) : 'NOT SET',
      CHAT_ID: CHAT_ID ? 'SET' : 'NOT SET',
      messageLength: msg.length
    });

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('❌ Отсутствуют BOT_TOKEN или CHAT_ID в env');
      return false;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: msg,
          parse_mode: 'HTML' // Используем HTML вместо MarkdownV2
        })
      }
    );

    const result = await response.json();
    console.log('📨 Ответ от Telegram:', result);

    if (!response.ok) {
      throw new Error(result.description || `HTTP ${response.status}`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Ошибка отправки заказа в Telegram:', err);
    return false;
  }
};

  const handleOrderSubmit = async (orderData) => {
    const ok = await sendOrderToTelegram(orderData);
    if (ok) {
      alert('✅ Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');
    } else {
      alert('⚠️ Заказ сохранён, но уведомление не отправлено. Мы свяжемся для подтверждения.');
    }
    onClearCart();
    setShowOrderForm(false);
    onClose();
  };

  /* ---------------------------- UI ---------------------------- */
  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Корзина</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">Корзина пуста</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-white rounded border flex items-center justify-center">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.model}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <svg
                              className="w-8 h-8 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {item.model}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {item.manufacturer}
                          </p>
                          <p className="text-sm text-gray-500">
                            Код: {item.code}
                          </p>
                          
                        </div>

                        <button
                          onClick={() => onRemoveFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 font-medium"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 font-medium"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-blue-600 text-lg">
                            {formatPrice(
                              getProductPrice(item) * item.quantity
                            )}{' '}
                            руб.
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatPrice(getProductPrice(item))} руб. ×{' '}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* footer */}
            {cart.length > 0 && (
              <div className="border-t p-6 bg-gray-50 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-lg font-semibold">Итого:</p>
                    <p className="text-gray-600">
                      {totalItems} товар(ов) на сумму
                    </p>
                    
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(totalPrice)} руб.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClearCart}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Очистить корзину
                  </button>
                  <button
                    onClick={() => {
                      console.log('🎯 Открытие формы заказа', {
                        clientInfo,
                        customerName,
                        customerPhone
                      });
                      setShowOrderForm(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Оформить заказ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showOrderForm && (
  <OrderForm
    key={clientInfo?.id || 'no-client'}
    cart={cart}
    totalPrice={totalPrice}
    onClose={() => setShowOrderForm(false)}
    onOrderSubmit={handleOrderSubmit}
    clientInfo={clientInfo}
  />
)}
    </>
  );
};

export default CartModal;