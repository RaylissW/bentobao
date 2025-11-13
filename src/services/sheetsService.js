// services/sheetsService.js
import { GoogleSpreadsheet } from 'google-spreadsheet';

const SPREADSHEET_ID = '1P_oAnwPAGPCAJlXosglk09ED2YWdlDjy5Q20iwwm09k';
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

// Авторизация (через переменные окружения)
await doc.useServiceAccountAuth({
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
});
await doc.loadInfo();

const товарыSheet = doc.sheetsByTitle['Товары'];
const клиентыSheet = doc.sheetsByTitle['Клиенты'];
const расчетыSheet = doc.sheetsByTitle['Расчёты'];

// Добавление клиента
export async function addClientIfNotExists(input) {
  const rows = await клиентыSheet.getRows();
  const clean = input.replace(/^@/, '').toLowerCase();

  // Поиск по ЮЗ или Нику
  const existing = rows.find(r =>
    r.get('ЮЗ')?.toLowerCase() === clean ||
    r.get('Ник')?.toLowerCase() === clean
  );

  if (existing) return existing.get('ID');

  const lastId = rows.length ? Math.max(...rows.map(r => parseInt(r.get('ID').replace('C', '')))) : 0;
  const newId = `C${lastId + 1}`;

  await клиентыSheet.addRow({
    ID: newId,
    ЮЗ: input.startsWith('@') ? input : '',
    Ник: !input.startsWith('@') ? input : ''
  });

  return newId;
}

// Добавление товара
export async function addProduct(data) {
  try {
    const { rates, taobaoRate } = data;
    const usdRate = rates.usd + 1.5;
    const cnyRate = rates.cny + 1.5;

    let руб = 0;
    let usd = 0;
    let cny = 0;
    let курс = 0;

    if (data.currency === 'usd') {
      usd = data.cost;
      руб = usd * usdRate;
      курс = usdRate;
    } else {
      cny = data.cost;
      руб = cny * cnyRate;
      курс = cnyRate;
    }

    const Н = MARKUPS[data.category]; // из formulas.js
    const К = (курс + 1.5) - 1.5 + 0.032; // +3.2%
    const рубК = руб * К;
    const финал = руб * (1 + Н + К);

    await товарыSheet.addRow({
      'Поставка': data.поставка,
      'Клиент ID': data.clientId,
      'Товар': data.товар,
      'Кол-во': data.колво,
      'Характеристики': data.хар,
      'Ссылка': data.ссылка,
      '$': usd,
      '¥': cny,
      'КУРС': курс,
      '₽': руб,
      'Н': Н,
      'К': К,
      '₽+К': рубК,
      'Финал ₽': финал,
      'Статус': '',
      'ГГ': '',
      'Трек': ''
    });

    // Добавляем в Расчёты
    await расчетыSheet.addRow([
      data.поставка,
      data.clientId,
      0, 0, 0, 0, 0, финал - руб, '', ''
    ]);

    return { success: true, row: товарыSheet.rowCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
}