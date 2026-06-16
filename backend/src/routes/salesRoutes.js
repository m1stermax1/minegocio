import express from "express";
import { supabase } from "../services/supabaseService.js";
import { getSales, getSalesItems } from "../controllers/sales/sales.controller.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const inventory = await getSales();
    res.json(inventory);
  } catch (error) {
    console.error("Error al cargar inventario:", error);
    res.status(500).json({ error: "No se pudo cargar el inventario" });
  }
});

router.get(`/sales-items`, async (req, res) => {
  try {
    const salesItemsList = await getSalesItems();
    res.json(salesItemsList);
  } catch (error) {
    console.error("Error al cargar items vendidos:", error);
    res.status(500).json({ error: "No se pudo cargar los items vendidos" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const itemsId = req.body.items;

    const payload = {
      organization_id: req.body?.orgId,
      amount: req.body?.totalSale,
      payment_method: req.body?.metodoPago,
    };

    const { data, error } = await supabase
      .from("sales")
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: data,
    });

    // res.json(inventory);
  } catch (error) {
    console.log("Error guardando venta: ", error)
  }
});

router.post("/add-sale-item", async (req, res) => {
  try {
    const payload = req.body;

    const salesItems = req.body?.items?.map((item) => ({sale_id: req.body?.saleId, product_id: item?.id, quantity: 1, unit_price: item?.price, description: item?.description}))

    console.log("llegue: ", salesItems)

    const { data, error } = await supabase
      .from("sale_items")
      .insert(salesItems)
      .select();

       console.log("llegue: ", salesItems)

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: data,
    });

    // res.json(inventory);
  } catch (error) {
    console.log("Error guardando venta: ", error)
  }
});



export default router;
