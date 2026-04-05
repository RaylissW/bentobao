// public/script.js

const MARKUPS = {
  discount: 1.10,
  cosmetics: 1.15,
  other: 1.17,
  cosplay: 1.20,
  kpop: 1.25,
  tech: 1.30,
};

const CATEGORIES = {
  discount: "Ринкан",
  cosmetics: "Косметика",
  cosplay: "Косплей",
  other: "Другое",
  kpop: "К-поп",
  tech: "Техника",
};

// Создаём кнопки наценок
function createMarkupButtons() {
  const container = document.getElementById('markupButtons');
  container.innerHTML = '';

  Object.keys(MARKUPS).forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = `${CATEGORIES[key]} `;
    btn.dataset.category = key;
    if (key === 'cosplay') btn.classList.add('active');

    btn.addEventListener('click', () => {
      document.querySelectorAll('#markupButtons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    container.appendChild(btn);
  });
}

// Обновить курс доллара
async function updateRate() {
  const rateField = document.getElementById('usdRate');
  const resultDiv = document.getElementById('result');

  resultDiv.innerHTML = '<span style="color: #ffd700;">Загрузка актуального курса...</span>';

  try {
    const response = await fetch('/api/rates');
    const data = await response.json();

    if (data.success && data.usd > 0) {
      rateField.value = data.usd.toFixed(2);
      resultDiv.innerHTML = `✅ Курс доллара обновлён: <strong>${data.usd.toFixed(2)} ₽</strong>`;

      setTimeout(() => {
        resultDiv.innerHTML = 'Готов к расчёту';
      }, 3000);
    } else {
      resultDiv.innerHTML = 'Не удалось получить курс';
    }
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = 'Ошибка соединения с сервером';
  }
}

// Основной расчёт
async function calculatePrice() {
  const amountUSD = parseFloat(document.getElementById('amount').value);
  const usdRate = parseFloat(document.getElementById('usdRate').value);
  const activeBtn = document.querySelector('#markupButtons button.active');
  const category = activeBtn ? activeBtn.dataset.category : 'cosplay';

  if (!amountUSD || !usdRate) {
    document.getElementById('result').innerHTML = 'Пожалуйста, заполните стоимость и курс доллара';
    return;
  }

  try {
    const response = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUSD, usdRate, category })
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById('result').innerHTML = `
        <strong>Ввод:</strong> ${amountUSD} $<br>
        <strong>Себестоимость:</strong> ${data.costRub} ₽<br>
        <strong>КУРС:</strong> ${usdRate}₽<br><br>
        <strong>Комиссия:</strong> +${data.commissionPercent}% (${data.commissionRub} ₽)<br>
        <strong style="font-size: 26px; color: #fff;">
          Итоговая цена: ${data.finalPrice} ₽
        </strong>
      `;
    } else {
      document.getElementById('result').innerHTML = data.error || 'Ошибка расчёта';
    }
  } catch (err) {
    document.getElementById('result').innerHTML = 'Ошибка соединения с сервером';
  }
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
  createMarkupButtons();

  // Автоматически обновляем курс при открытии страницы
  updateRate();
});