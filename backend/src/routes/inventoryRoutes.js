import express from 'express';
import { getInventoryData, getProvidersData, setInventoryRowStatus } from '../services/sheetsService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const inventory = await getInventoryData();
    res.json(inventory);
  } catch (error) {
    console.error('Error al cargar inventario:', error);
    res.status(500).json({ error: 'No se pudo cargar el inventario' });
  }
});

router.get('/providers', async (req, res) => {
  try {
    const providers = await getProvidersData();
    res.json(providers);
  } catch (error) {
    console.error('Error al cargar proveedoras:', error);
    res.status(500).json({ error: 'No se pudo cargar las proveedoras' });
  }
});

router.put('/:id/status', async (req, res) => {
  const rowIndex = Number(req.params.id);
  const { estado } = req.body;

  if (Number.isNaN(rowIndex) || rowIndex < 0) {
    return res.status(400).json({ error: 'ID de fila inválido' });
  }

  if (!estado || !['vendido', 'en stock'].includes(estado.toLowerCase())) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    await setInventoryRowStatus(rowIndex, estado);
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando estado en Sheets:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado' });
  }
});

export default router;
