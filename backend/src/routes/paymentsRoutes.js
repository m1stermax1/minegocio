import express from "express";
import { getPayments } from "../controllers/payments/payments.controller.js";
import { supabase } from "../services/supabaseService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const payments = await getPayments();

    res.json({
      success: true,
      data: payments || [],
    });
  } catch (error) {
    console.error("Error al cargar payments:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { orgId, total_amout, profit, providerId } = req.body;
    console.log("Body: ", req.body);

    const { data, error } = await supabase
      .from("payments")
      .insert({
          organization_id: orgId,
          provider_id: providerId,
          total_amount: total_amout,
          payment_date: new Date().toISOString(),
        })
      .select();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      provider: "test",
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
