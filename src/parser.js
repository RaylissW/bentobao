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
      'https://perm.valuta24.ru/perm/sberbank/',
      { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, 
        timeout: 10000 
      }
    );

    const html = data.replace(/\s+/g, ' ').trim();

    console.log('HTML загружен, длина:', html.length);

    // Улучшенная регулярка — ищем по названию + второй span (продажа)
    const usdMatch = html.match(/Доллар США в Сбербанке[\s\S]*?<span class="one">[^<]+<\/span>[\s\S]*?<span class="one">([^<]+)<\/span>/i);
    const cnyMatch = html.match(/Китайский юань в Сбербанке[\s\S]*?<span class="one">[^<]+<\/span>[\s\S]*?<span class="one">([^<]+)<\/span>/i);

    console.log('USD raw match:', usdMatch);
    console.log('CNY raw match:', cnyMatch);

    const usdVal = usdMatch && usdMatch[1] ? +usdMatch[1].replace(',', '.') : 0;
    const cnyVal = cnyMatch && cnyMatch[1] ? +cnyMatch[1].replace(',', '.') : 0;

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
