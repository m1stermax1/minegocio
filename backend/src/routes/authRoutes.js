import express from "express";
import { createUserOrganization } from "../services/authService.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      businessName,
      createdAt,
    } = req.body;

    const organization =
      await createUserOrganization({
        userId,
        email,
        businessName,
      });

    res.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;