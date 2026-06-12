import express from "express";
import { supabase } from "../services/supabaseService.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    console.log("Dentro del endpoint add", req.body);
    const itemsId = req.body.items?.map((item) => item?.id);
    console.log("Listas de id", itemsId);

    const payload = {
      organization_id: req.body?.orgId,
      products: itemsId,
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

export default router;
