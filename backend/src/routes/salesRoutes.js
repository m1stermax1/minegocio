import express from "express";

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    console.log("Dentro del endpoint add");
    res.send("Hello World");

    // res.json(inventory);
  } catch (error) {}
});

export default router;
