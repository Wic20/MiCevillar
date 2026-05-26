const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  // Listar solicitudes
  router.get('/', async (req, res) => {
    try {
      const items = await db.listRequests();
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
    }
  });

  // Crear solicitud
  router.post('/', async (req, res) => {
    const { userId, type, reason, copies, delivery } = req.body;
    if (!userId || !type) return res.status(400).json({ error: 'userId y type requeridos' });

    try {
      const newReq = {
        id: Date.now(),
        userId,
        type,
        reason: reason || '',
        copies: copies || 1,
        delivery: delivery || 'digital',
        status: 'pendiente',
        createdAt: new Date()
      };
      const created = await db.createRequest(newReq);
      res.status(201).json({ ok: true, request: created });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
    }
  });

  // Actualizar estado
  router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status requerido' });

    try {
      const updated = await db.updateRequestStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: 'Solicitud no encontrada' });
      res.json({ ok: true, request: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'error interno' });
    }
  });

  return router;
};
