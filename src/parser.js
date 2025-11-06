// src/parser.js
import axios from 'axios';

// Кэш: Сбер + Taobao
let cache = {
  usd: null,
  cny: null,
  taobao: null,     // ← новый: USD / CNY с Taobao
  ts: 0
};
const TTL = 5 * 60 * 1000; // 5 минут

export async function getSberRates() {
  const now = Date.now();

  // Кэш для Сбера (usd + cny)
  if (cache.ts + TTL > now && cache.usd && cache.cny) {
    console.log('Кэш Сбер:', { usd: cache.usd, cny: cache.cny });
    return { usd: cache.usd, cny: cache.cny };
  }

  try {
    const { data } = await axios.get(
      'https://perm.valuta24.ru/perm/sberbank/',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );

    const html = data.replace(/\s+/g, ' ').trim();

    const usd = (html.match(/Доллар США в Сбербанке[\s\S]*?<span class="one">[^<]+<\/span>[\s\S]*?<span class="one">([^<]+)<\/span>/i) || [])[1];
    const cny = (html.match(/Китайский юань в Сбербанке[\s\S]*?<span class="one">[^<]+<\/span>[\s\S]*?<span class="one">([^<]+)<\/span>/i) || [])[1];

    const usdVal = usd ? +usd.replace(',', '.') : 0;
    const cnyVal = cny ? +cny.replace(',', '.') : 0;

    console.log('Сбер (парсинг):', { usd: usdVal, cny: cnyVal });

    if (usdVal && cnyVal) {
      cache = { usd: usdVal, cny: cnyVal, taobao: cache.taobao, ts: now };
      return { usd: usdVal, cny: cnyVal };
    }
  } catch (e) {
    console.error('Ошибка парсинга Сбера:', e.message);
  }

  console.log('Сбер недоступен → 0');
  return { usd: 0, cny: 0 };
}

// --- Новый геттер: Taobao rate ---
export function getTaobaoRate() {
  return cache.taobao || 0;
}

export function setTaobaoRate(rate) {
  if (typeof rate === 'number' && rate > 0) {
    cache.taobao = parseFloat(rate.toFixed(4));
    console.log('Taobao курс сохранён в кэш:', cache.taobao);
  }
}