// server.js
import express from 'express';
import { getSberRates } from './src/parser.js';
import { MARKUPS, CATEGORIES, calculatePrice } from './src/utils/formulas.js';

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// Получить курсы
app.get('/api/rates', async (req, res) => {
  try {
    const rates = await getSberRates();
    res.json({
      success: true,
      usd: rates.usd || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Не удалось получить курс' });
  }
});

// Расчёт с правильной комиссией
// Расчёт — простой и понятный подход
app.post('/api/calculate', (req, res) => {
  try {
    const { amountUSD, usdRate, category } = req.body;

    if (!amountUSD || !usdRate || !category) {
      return res.status(400).json({ success: false, error: 'Недостаточно данных' });
    }

    const markup = MARKUPS[category] || 1.0;

    // Простая и понятная формула
    const paidRate = usdRate + 2;                    // курс с наценкой Сбера
    const withPlatformFee = paidRate * 1.035;        // +3.5% комиссии платформы

    const finalMultiplier = withPlatformFee * markup; // применяем твою наценку

    const costRub = amountUSD * withPlatformFee;            // себестоимость после Сбера и наценки
    const totalCostRub = amountUSD * finalMultiplier; // полная стоимость

    const commissionRub = costRub - (amountUSD * usdRate); // комиссия платформы + перевод
    const commissionPercent = ((withPlatformFee / usdRate) - 1) * 100;

    const markupPercent = ((markup - 1) * 100).toFixed(0);

    res.json({
      success: true,
      costRub: Number(costRub.toFixed(2)),
      finalPrice: Math.ceil(totalCostRub),
      markupPercent: Number(markupPercent),
      commissionPercent: Number((commissionPercent).toFixed(2)),
      commissionRub: Number(commissionRub.toFixed(2)),
      categoryName: CATEGORIES[category] || category,
      usedRate: Number(paidRate.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка при расчёте' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});