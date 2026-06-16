import express from "express";
import { getInventory } from "../controllers/inventory/inventory.controller.js";

const router = express.Router();

router.get("/counts", async (req, res) => {
  try {
    const inventory = await getInventory();

    const nuevoInv = {
        ...inventory,
        totalItems: inventory?.data?.length,
        inStockCount: inventory?.data?.filter((item) => item?.status == 'AVAILABLE')?.length,
        soldCount: inventory?.data?.filter((item) => item?.status == 'SOLD')?.length,
        profit: inventory?.data?.filter((item) => item?.status == 'SOLD')
    }
    res.json(nuevoInv);
  } catch (error) {
    console.error("Error al cargar inventario:", error);
    res.status(500).json({ error: "No se pudo cargar el inventario" });
  }
});

export default router;