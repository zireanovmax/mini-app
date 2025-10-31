// final-server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ⬇️ ВАШ URL с Vercel (берём из консоли Vercel)
const EXTERNAL_URL = 'https://mini-app-roan-nine.vercel.app';

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API → принимаем заказ из Mini App
app.post('/api/order', (req, res) => {
  console.log('📦 Заказ получен:', req.body);
  res.json({ success: true, message: 'Заказ принят' });
});

// SPA: все маршруты → index.html
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web App URL: ${EXTERNAL_URL}`);
});