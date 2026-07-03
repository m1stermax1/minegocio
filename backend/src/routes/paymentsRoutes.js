import express from "express";
import { getPayments } from "../controllers/payments/payments.controller.js";
import { supabase } from "../services/supabaseService.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await getPayments(organizationId, page, limit);

    res.json({
      success: true,
      data: result.data,
      total: result.count,
    });
  } catch (error) {
    console.error("Error al cargar payments:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put("/status", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const { codigos = [], status } = req.body;

    if (!Array.isArray(codigos) || codigos.length === 0) {
      return res.status(400).json({ success: false, error: "No se proporcionaron códigos." });
    }

    const normalizedCodes = codigos.map((codigo) => codigo.toString().trim()).filter(Boolean);
    const updates = [];

    if (normalizedCodes.length > 0) {
      const { data: dataCodigo, error: errorCodigo, count: countCodigo } = await supabase
        .from("payments")
        .update({ estado: status })
        .in("codigo", normalizedCodes)
        .eq("organization_id", organizationId)
        .eq("estado", "pendiente")
        .select("id", { count: "exact" });

      if (errorCodigo) throw errorCodigo;
      updates.push(countCodigo ?? 0);

      const { data: dataBarcode, error: errorBarcode, count: countBarcode } = await supabase
        .from("payments")
        .update({ estado: status })
        .in("barcode", normalizedCodes)
        .eq("organization_id", organizationId)
        .eq("estado", "pendiente")
        .select("id", { count: "exact" });

      if (errorBarcode) throw errorBarcode;
      updates.push(countBarcode ?? 0);
    }

    const totalUpdated = updates.reduce((sum, count) => sum + count, 0);

    res.json({ success: true, updated: totalUpdated });
  } catch (error) {
    console.error("Error actualizando estado de payments:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const {
      orgId,
      total_amout,
      profit,
      providerId,
      inventory_id,
      description,
      barcode,
      profile,
    } = req.body;
    console.log("Body: ", req.body);

    const { data, error } = await supabase
      .from("payments")
      .insert({
        inventory_id: inventory_id,
        barcode: barcode,
        description: description,
        organization_id: orgId,
        provider_id: providerId,
        total_amount: total_amout,
        payment_date: new Date().toISOString(),
        profile_id: profile,
      })
      .select();

    if (error) {
      throw error;
    }


    return res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;