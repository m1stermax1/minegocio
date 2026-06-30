import express from "express";
import { supabase } from "../services/supabaseService.js";
import {
  getSales,
  getSalesItems,
} from "../controllers/sales/sales.controller.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getSales(organizationId, page, limit);
    res.json({
      success: true,
      data: result.data,
      total: result.count,
    });
  } catch (error) {
    console.error("Error al cargar ventas:", error);
    res.status(500).json({ error: "No se pudo cargar las ventas" });
  }
});

router.get("/sales-items", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getSalesItems(organizationId, page, limit);
    res.json({
      success: true,
      data: result.data,
      total: result.count,
    });
  } catch (error) {
    console.error("Error al cargar items de venta:", error);
    res.status(500).json({ error: "No se pudo cargar los items de venta" });
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
    console.log("Error guardando venta: ", error);
  }
});

router.post("/add-sale-item", async (req, res) => {
  try {
    const payload = req.body;

    const salesItems = req.body?.items?.map((item) => ({
      organization_id: req.body.orgId,
      sale_id: req.body?.saleId,
      product_id: item?.id,
      quantity: 1,
      unit_price: item?.price,
      profit: item?.profile_id ? (item?.paymentMethod == 'efectivo' ? item?.price - item?.price * 0.1 : item?.paymentMethod == 'transferencia' ? item?.price - item?.price * 0.05 : '') : (item?.paymentMethod == 'efectivo' ? item?.price - item?.price * 0.1 : item?.paymentMethod == 'transferencia' ? item?.price - item?.price * 0.05 : '') - (item?.price * 0.6),
      description: item?.description,
      payment_method: item?.paymentMethod
    }));

    const { data, error } = await supabase
      .from("sale_items")
      .insert(salesItems)
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
    console.log("Error guardando venta: ", error);
  }
});

export default router;