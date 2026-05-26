const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const AUTH_ROUTES = require('./routes/auth');
const DOC_ROUTES = require('./routes/documents');
const REQ_ROUTES = require('./routes/requests');
const db = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Asegurar carpeta uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Inicializar DB MySQL y luego montar rutas
(async () => {
  try {
    await db.init();
    app.use('/api/auth', AUTH_ROUTES(db));
    app.use('/api/documents', DOC_ROUTES(db, uploadsDir));
    app.use('/api/requests', REQ_ROUTES(db));
  } catch (err) {
    console.error('Error inicializando DB:', err);
    process.exit(1);
  }
})();

// Endpoint simple
app.get('/api/ping', (req, res) => res.json({ ok: true, time: new Date() }));

// Endpoint de respaldo simulado
app.post('/api/admin/backup', (req, res) => {
  // Aquí se podría integrar S3, Drive, etc. Por ahora simulamos
  setTimeout(() => {
    res.json({ ok: true, message: 'Respaldo simulado completado.' });
  }, 1200);
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Mi Cevillar backend escuchando en http://localhost:${port}`);
});
