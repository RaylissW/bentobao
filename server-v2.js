import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Отдаём статические файлы второй версии
app.use(express.static(path.join(__dirname, 'dist-v2')));

// Главный маршрут для React SPA (ловит все пути)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist-v2', 'index.html'));
});

const PORT = 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Вторая версия сайта запущена на http://0.0.0.0:${PORT}`);
});