import axios from 'axios';

let cache = { usd: null, cny: null, ts: 0 };
const TTL = 5 * 60 * 1000;               // 5 мин

export async function getSberRates() {
  const now = Date.now();

  // ----- кэш -----
  if (cache.ts + TTL > now && cache.usd && cache.cny) {
    console.log('Кэш Сбер:', cache);
    return { usd: cache.usd, cny: cache.cny };
  }

  try {
    const { data } = await axios.get(
      'https://perm.valuta24.ru/perm/sberbank/',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );

    const html = data.replace(/\s+/g, ' ').trim();

    // USD: покупка – второй <span class="one">
    const usd = (html.match(/Доллар США в Сбербанке[\s\S]*?<span class="one">[^<]+<\/span>[\s\S]*?<span class="one">([^<]+)<\/span>/i) || [])[1];
    // CNY: покупка – второй <span class="one">
    const cny = (html.match(/Китайский юань в Сбербанке[\s\S]*?<span class="one">[^<]+<\/span>[\s\S]*?<span class="one">([^<]+)<\/span>/i) || [])[1];

    const usdVal = usd ? +usd.replace(',', '.') : 0;
    const cnyVal = cny ? +cny.replace(',', '.') : 0;

    console.log('Сбер (парсинг):', { usd: usdVal, cny: cnyVal });

    // обновляем кэш только если оба курса > 0
    if (usdVal && cnyVal) {
      cache = { usd: usdVal, cny: cnyVal, ts: now };
      return { usd: usdVal, cny: cnyVal };
    }
  } catch (e) {
    console.error('Ошибка парсинга Сбера:', e.message);
  }

  // Если Сбер недоступен – возвращаем нули
  console.log('Сбер недоступен → 0');
  return { usd: 0, cny: 0 };
}