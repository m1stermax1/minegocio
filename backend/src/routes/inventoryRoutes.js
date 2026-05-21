import express from 'express';
import {
  getInventoryData,
  getProvidersData,
  setInventoryRowStatus,
  appendInventoryItems,
} from '../services/sheetsService.js';

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

router.post('/', async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];

  if (!items.length) {
    return res.status(400).json({ error: 'No se recibieron items para agregar.' });
  }

  const preparedItems = [];

  for (const item of items) {
    const nombre = item.nombre?.toString().trim();
    const precio = item.precio?.toString().trim();
    const proveedora = item.proveedora?.toString().trim();

    if (!nombre || !precio || !proveedora) {
      return res.status(400).json({ error: 'Campos inválidos. nombre, precio y proveedora son obligatorios.' });
    }

    const precioNumero = Number(precio.replace(/,/g, '.'));
    if (Number.isNaN(precioNumero)) {
      return res.status(400).json({ error: 'Precio inválido' });
    }

    preparedItems.push({ nombre, precio: precioNumero, proveedora });
  }

  try {
    const result = await appendInventoryItems(preparedItems);
    const barcodeUrls = result.generatedBarcodes.map(({ codigo, fileName }) => ({
      codigo,
      url: `/barcodes/${fileName}`,
    }));
    res.json({ success: true, barcodes: barcodeUrls });
  } catch (error) {
    console.error('Error agregando item en Sheets:', error);
    res.status(500).json({ error: 'No se pudo agregar el item' });
  }
});

router.put('/:id/status', async (req, res) => {
  const rowIndex = Number(req.params.id);
  const { estado, metodoPago, precioVentaManual } = req.body;

  if (Number.isNaN(rowIndex) || rowIndex < 0) {
    return res.status(400).json({ error: 'ID de fila inválido' });
  }

  if (!estado || !['vendido', 'en stock'].includes(estado.toLowerCase())) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    await setInventoryRowStatus(rowIndex, estado, metodoPago, precioVentaManual);
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando estado en Sheets:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado' });
  }
});

export default router;
