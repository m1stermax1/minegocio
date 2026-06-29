import express from "express";
import { getInventory } from "../controllers/inventory/inventory.controller.js";
import { getSessionUser } from "../controllers/session/session.controller.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/counts", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id
    const inventory = await getInventory(organizationId, 1, 10, null, true);

    const nuevoInv = {
      ...inventory,
      totalItems: inventory?.data?.length,
      inStockCount: inventory?.data?.filter((item) => item?.status == 'AVAILABLE')?.length,
      soldCount: inventory?.data?.filter((item) => item?.status == 'SOLD')?.length,
      profit: inventory?.data?.filter((item) => item?.status == 'SOLD'),
      profile: "test" || ""
    }
    res.json(nuevoInv);
  } catch (error) {
    console.error("Error al cargar inventario:", error);
    res.status(500).json({ error: "No se pudo cargar el inventario" });
  }
});

export default router;