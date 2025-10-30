import React, { useState, useEffect, useRef } from 'react';

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

const OrderForm = ({
  cart,
  totalPrice,
  onClose,
  onOrderSubmit,
  clientInfo
}) => {
  // 🎯 ЛОГ: форма открылась
  console.log('📋 OrderForm открыта');
  console.log('👤 clientInfo:', clientInfo);
  console.log('🧾 ФИО:', clientInfo?.name);
  console.log('📞 Телефон:', clientInfo?.phone);
  console.log('🔍 Тип clientInfo:', typeof clientInfo);
  console.log('📦 Поля clientInfo:', Object.keys(clientInfo));
  console.log('🧾 clientInfo.name:', clientInfo?.name);
  console.log('📞 clientInfo.phone:', clientInfo?.phone);

  const [formData, setFormData] = useState({
    name: clientInfo?.name || '',
    phone: clientInfo?.phone || '',
    address: '',
    comments: ''
  });

  console.log('🧪 formData после инициализации:', formData);

  const filledFromClient = useRef(false);

  useEffect(() => {
    console.log('🔁 useEffect сработал, clientInfo:', clientInfo);
    if (clientInfo?.name && !filledFromClient.current) {
      console.log('✅ Заполняем форму из clientInfo');
      setFormData({
        name: clientInfo.name,
        phone: clientInfo.phone || '',
        address: '',
        comments: ''
      });
      filledFromClient.current = true;
    }
  }, [JSON.stringify(clientInfo)]);

  useEffect(() => {
    if (!clientInfo) {
      filledFromClient.current = false;
    }
  }, [clientInfo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return alert('Укажите ФИО');
    if (!formData.phone.trim()) return alert('Укажите телефон');
    if (!formData.address) return alert('Выберите место отгрузки');

    const orderData = {
      type: 'order',
      cart: cart.map(item => ({
        id: item.id,
        model: item.model,
        manufacturer: item.manufacturer,
        code: item.code,
        quantity: item.quantity,
        price: parseFloat(item.newPrice?.replace(/\s/g, '') || item.oldPrice?.replace(/\s/g, '') || '0'),
        priceLevel: item.priceLevel || 'retail'
      })),
      totalPrice,
      customerInfo: formData
    };

    onOrderSubmit(orderData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* header */}
          <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
            <h2 className="text-2xl font-bold">Оформление заказа</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* form body */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* name */}
              <div>
                <label className="block text-sm font-medium mb-1">ФИО *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите ваше ФИО"
                />
                {clientInfo?.name && (
                  <p className="text-xs text-green-600 mt-1">✓ Автоматически заполнено из профиля</p>
                )}
              </div>

              {/* phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Телефон *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(XXX) XX-XXX"
                />
                {clientInfo?.phone && (
                  <p className="text-xs text-green-600 mt-1">✓ Автоматически заполнено из профиля</p>
                )}
              </div>

              {/* shipping */}
              <div>
                <label className="block text-sm font-medium mb-1">Место отгрузки *</label>
                <select
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите место отгрузки</option>
                  {SHIPPING_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* comments */}
              <div>
                <label className="block text-sm font-medium mb-1">Комментарий к заказу</label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Дополнительные пожелания"
                />
              </div>

              

              {/* total */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Сумма заказа: {new Intl.NumberFormat('ru-RU').format(totalPrice)} руб.</p>
                <p className="text-sm text-gray-600">Товаров: {cart.reduce((s, i) => s + i.quantity, 0)} шт.</p>
                
              </div>
            </form>
          </div>

          {/* footer buttons */}
          <div className="border-t p-6 bg-gray-50 flex-shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Назад
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Подтвердить заказ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;