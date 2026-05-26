const express = require('express');
const path = require('path');
const multer = require('multer');

module.exports = function (db, uploadsDir) {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + '-' + file.originalname.replace(/\s+/g, '_'));
    }
  });
  const upload = multer({ storage });

  // Listar documentos
  router.get('/', async (req, res) => {
    try {
      const docs = await db.listDocuments();
      res.json(docs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
    }
  });

  // Subir documento (metadata + archivo)
  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Archivo requerido' });

      const doc = {
        id: Date.now(),
        title: req.body.title || file.originalname,
        description: req.body.description || '',
        filename: file.filename,
        originalName: file.originalname,
        uploadedAt: new Date()
      };

      const created = await db.createDocument(doc);
      res.status(201).json({ ok: true, doc: created });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
    }
  });

  // Obtener metadata
  router.get('/:id', async (req, res) => {
    try {
      const doc = await db.getDocumentById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
      res.json(doc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
    }
  });

  // Descargar por filename
  router.get('/download/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    res.download(filePath, err => {
      if (err) res.status(404).json({ error: 'Archivo no existe' });
    });
  });

  return router;
};
