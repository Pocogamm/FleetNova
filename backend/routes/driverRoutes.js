const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/verifyToken");

// GET all drivers for assignment dropdown/autocomplete
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE role = 'driver'
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Driver fetch error:", error);
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

module.exports = router;
