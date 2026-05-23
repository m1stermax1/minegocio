import express from 'express';
import {
  getInventoryData,
  getProvidersData,
  setInventoryRowStatus,
  appendInventoryItems,
  getProvidersListComplete,
  addNewProvider,
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

router.get('/counts', async (req, res) => {
  try {
    const inventory = await getInventoryData();
    const inStock = inventory.filter((i) => (i.estado || '').toLowerCase() === 'en stock').length;
    const sold = inventory.filter((i) => (i.estado || '').toLowerCase() === 'vendido').length;
    res.json({ inStockCount: inStock, soldCount: sold });
  } catch (error) {
    console.error('Error obteniendo counts:', error);
    res.status(500).json({ error: 'No se pudieron obtener los counts' });
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

// Endpoints para Proveedoras
router.get('/providers-list', async (req, res) => {
  try {
    const providers = await getProvidersListComplete();
    res.json(providers);
  } catch (error) {
    console.error('Error al cargar lista completa de proveedoras:', error);
    res.status(500).json({ error: 'No se pudo cargar la lista de proveedoras' });
  }
});

router.post('/providers', async (req, res) => {
  const { nombre, apellido, telefono, notas } = req.body;

  if (!nombre || !apellido || !telefono) {
    return res.status(400).json({ error: 'nombre, apellido y telefono son obligatorios' });
  }

  try {
    const result = await addNewProvider(nombre, apellido, telefono, notas || '');
    res.json(result);
  } catch (error) {
    console.error('Error agregando proveedora:', error);
    res.status(500).json({ error: 'No se pudo agregar la proveedora' });
  }
});

export default router;
