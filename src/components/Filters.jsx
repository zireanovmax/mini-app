export default function Filters({ brands, powers, types, wifis, filters, setFilters, deviceType }) {
  const isMobile = deviceType === 'mobile';

  return (
    <div className={`
      grid gap-2.5 h-full
      ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}
    `}>
      <div className="flex flex-col">
        <label className={`block font-medium mb-1.5 ${isMobile ? 'text-sm' : 'text-base'}`}>
          Бренд
        </label>
        <select
          className={`
            w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0
            ${isMobile ? 'px-2.5 py-2 text-sm h-9' : 'px-3 py-2.5 text-base h-10'}
          `}
          value={filters.brand}
          onChange={e => setFilters({ ...filters, brand: e.target.value })}
        >
          <option value="">Все</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <label className={`block font-medium mb-1.5 ${isMobile ? 'text-sm' : 'text-base'}`}>
          Мощность
        </label>
        <select
          className={`
            w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0
            ${isMobile ? 'px-2.5 py-2 text-sm h-9' : 'px-3 py-2.5 text-base h-10'}
          `}
          value={filters.power}
          onChange={e => setFilters({ ...filters, power: e.target.value })}
        >
          <option value="">Все</option>
          {powers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <label className={`block font-medium mb-1.5 ${isMobile ? 'text-sm' : 'text-base'}`}>
          Тип
        </label>
        <select
          className={`
            w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0
            ${isMobile ? 'px-2.5 py-2 text-sm h-9' : 'px-3 py-2.5 text-base h-10'}
          `}
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">Все</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex flex-col">
        <label className={`block font-medium mb-1.5 ${isMobile ? 'text-sm' : 'text-base'}`}>
          Wi-Fi
        </label>
        <select
          className={`
            w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0
            ${isMobile ? 'px-2.5 py-2 text-sm h-9' : 'px-3 py-2.5 text-base h-10'}
          `}
          value={filters.wifi}
          onChange={e => setFilters({ ...filters, wifi: e.target.value })}
        >
          <option value="">Все</option>
          {wifis.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
    </div>
  );
}