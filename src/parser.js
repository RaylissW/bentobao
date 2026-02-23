// src/parser.js
import axios from 'axios';

let cache = {
  usd: null,
  cny: null,
  taobao: null,
  ts: 0
};

const TTL = 5 * 60 * 1000;

export async function getSberRates() {
  const now = Date.now();

  if (cache.ts + TTL > now && cache.usd && cache.cny) {
    console.log('Кэш Сбер:', { usd: cache.usd, cny: cache.cny });
    return { usd: cache.usd, cny: cache.cny };
  }

  try {
    const { data } = await axios.get(
      'https://bankiros.ru/bank/sberbank/currency',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      }
    );

    const html = data.replace(/\s+/g, ' ').trim();

    console.log('HTML загружен, длина:', html.length);

    // Ищем строку с USD и извлекаем курс продажи (3-й столбец)
  //  const usdMatch = html.match(/<tr[^>]*class="[^"]*xxx-currency-grid__row--cur[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="[^"]*USD[^"]*"[^>]*>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text="[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text="[^"]*"[^>]*>([^<]+)<\/span>/i);
    // Ищем строку с CNY и извлекаем курс продажи (3-й столбец)
    //const cnyMatch = html.match(/<tr[^>]*class="[^"]*xxx-currency-grid__row--cur[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="[^"]*CNY[^"]*"[^>]*>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text="[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text="[^"]*"[^>]*>([^<]+)<\/span>/i);

    const usdMatch = html.match(/<tr[^>]*class="[^"]*xxx-currency-grid__row--cur[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="[^"]*USD[^"]*"[^>]*>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text[^>]*>([^<]+)<\/span>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text[^>]*>([^<]+)<\/span>/i);

// Ищем строку с CNY
    const cnyMatch = html.match(/<tr[^>]*class="[^"]*xxx-currency-grid__row--cur[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="[^"]*CNY[^"]*"[^>]*>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text[^>]*>([^<]+)<\/span>[\s\S]*?<td[^>]*class="[^"]*xxx-currency-grid__default-h[^"]*"[^>]*>[\s\S]*?<span[^>]*class="cursor-pointer"[^>]*data-js-copy-text[^>]*>([^<]+)<\/span>/i);

// Извлекаем курсы продажи (вторая группа - [2])
    const usdSellRate = usdMatch && usdMatch[2] ? parseFloat(usdMatch[2].replace(',', '.')) : 0;
    const cnySellRate = cnyMatch && cnyMatch[2] ? parseFloat(cnyMatch[2].replace(',', '.')) : 0;

    console.log('USD курс продажи:', usdSellRate); // Должно быть 78.2
    console.log('CNY курс продажи:', cnySellRate); // Должно быть 11.78
    console.log('USD raw match:', usdMatch);
    console.log('CNY raw match:', cnyMatch);

    const usdVal = usdMatch && usdMatch[2] ? +usdMatch[2].replace(',', '.') : 0;
    const cnyVal = cnyMatch && cnyMatch[2] ? +cnyMatch[2].replace(',', '.') : 0;

    console.log('Сбер (парсинг):', { usd: usdVal, cny: cnyVal });

    if (usdVal > 0 && cnyVal > 0) {
      cache = { usd: usdVal, cny: cnyVal, taobao: cache.taobao, ts: now };
      return { usd: usdVal, cny: cnyVal };
    }

  } catch (e) {
    console.error('Ошибка парсинга Сбера:', e.message);
  }

  console.log('Сбер недоступен → возвращаем 0');
  return { usd: 0, cny: 0 };
}

// Taobao функции
export function getTaobaoRate() {
  return cache.taobao || 0;
}

export function setTaobaoRate(rate) {
  if (typeof rate === 'number' && rate > 0) {
    cache.taobao = parseFloat(rate.toFixed(4));
    console.log('Taobao курс сохранён в кэш:', cache.taobao);
  }
}
