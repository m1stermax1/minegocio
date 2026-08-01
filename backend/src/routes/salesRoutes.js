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
    const organizationId = req.body?.orgId;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    const providerIds = [...new Set(items
      .map((item) => item?.provider_id || item?.providerId)
      .filter(Boolean))];

    let providerPercentages = {};
    if (providerIds.length > 0) {
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, percentage")
        .in("id", providerIds)
        .eq("organization_id", organizationId);

      if (!providersError) {
        providerPercentages = Object.fromEntries(
          (providersData || []).map((provider) => [
            String(provider.id),
            Number(provider.percentage ?? 0),
          ]),
        );
      }
    }

    const salesItems = await Promise.all(
      items.map(async (item) => {
        const price = Number(item?.price || 0);
        const paymentMethod = item?.paymentMethod || req.body?.paymethod || "";
        const providerId = item?.provider_id || item?.providerId;
        const providerPercentage = Number(
          item?.provider_percentage ??
            item?.percentage ??
            providerPercentages[String(providerId)] ??
            0,
        );
        const paymentDiscount =
          paymentMethod === "efectivo"
            ? 0.1
            : paymentMethod === "transferencia"
              ? 0.05
              : 0;

        const grossProfit = price - price * paymentDiscount;
        const providerShare =
          providerPercentage > 0 ? price * (providerPercentage / 100) : 0;
        const profit = item?.profile_id ? grossProfit : grossProfit - providerShare;

        return {
          organization_id: organizationId,
          sale_id: req.body?.saleId,
          product_id: item?.id,
          quantity: 1,
          unit_price: price,
          profit,
          description: item?.description,
          payment_method: paymentMethod,
        };
      }),
    );

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