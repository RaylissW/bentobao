import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Импорт бизнес-логики (курсы и расчёты)
import { getSberRates } from './src/parser.js';
import { MARKUPS, CATEGORIES } from './src/utils/formulas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Отключаем кэширование
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.json());

// ←←← ГЛАВНОЕ ИЗМЕНЕНИЕ: используем dist-v2
app.use(express.static(path.join(__dirname, 'dist-v2')));

// API роуты (одинаковые для обоих сайтов)
app.get('/api/rates', async (req, res) => {
  try {
    const rates = await getSberRates();
    res.json({ success: true, usd: rates.usd || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Не удалось получить курс' });
  }
});

app.post('/api/calculate', (req, res) => {
  try {
    const { amountUSD, usdRate, category } = req.body;

    if (!amountUSD || !usdRate || !category) {
      return res.status(400).json({ success: false, error: 'Недостаточно данных' });
    }

    const markup = MARKUPS[category] || 1.0;
    const paidRate = usdRate + 2;
    const withPlatformFee = paidRate * 1.035;
    const finalMultiplier = withPlatformFee * markup;

    const costRub = amountUSD * withPlatformFee;
    const totalCostRub = amountUSD * finalMultiplier;
    const commissionRub = costRub - (amountUSD * usdRate);
    const commissionPercent = ((withPlatformFee / usdRate) - 1) * 100;
    const markupPercent = ((markup - 1) * 100).toFixed(0);

    res.json({
      success: true,
      costRub: Number(costRub.toFixed(2)),
      finalPrice: Math.ceil(totalCostRub),
      markupPercent: Number(markupPercent),
      commissionPercent: Number(commissionPercent.toFixed(2)),
      commissionRub: Number(commissionRub.toFixed(2)),
      categoryName: CATEGORIES[category] || category,
      usedRate: Number(paidRate.toFixed(2))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Ошибка при расчёте' });
  }
});

// Для всех остальных путей отдаём index.html ИЗ dist-v2
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist-v2', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Вторая версия сайта запущена на http://0.0.0.0:${PORT}`);
  console.log(`Открыть: http://185.204.2.161:${PORT}`);
});