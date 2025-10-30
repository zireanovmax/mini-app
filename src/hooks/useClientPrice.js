import { useEffect, useState } from 'react';
import { getClientLevel } from '../services/discountService';

export function useClientPrice(product, tgUser) {
  const [level, setLevel] = useState(null);

  useEffect(() => {
    if (!tgUser?.id) return; // розница
    getClientLevel(tgUser.id).then(setLevel).catch(() => setLevel(null));
  }, [tgUser?.id]);

  /* если уровня нет – розница */
  if (!level) return product.oldPrice || product.newPrice || '0';

  switch (level) {
    case 'opt1': return product.newPrice || product.oldPrice;
    case 'opt2': return product.opt2Price || product.newPrice || product.oldPrice;
    case 'opt3': return product.opt3Price || product.newPrice || product.oldPrice;
    default:     return product.oldPrice || product.newPrice;
  }
}