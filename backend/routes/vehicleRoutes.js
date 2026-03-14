const express = require("express");
const router = express.Router();

const pool = require("../db");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ✅ GET all vehicles
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vehicles ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.log("Vehicle GET error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ ADD vehicle (Admin only)
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { vehicle_number, type } = req.body;

      if (!vehicle_number || !type) {
        return res.status(400).json({
          message: "Vehicle number and type required"
        });
      }

      const result = await pool.query(
        "INSERT INTO vehicles (vehicle_number, type, status) VALUES ($1, $2, 'available') RETURNING *",
        [vehicle_number, type]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.log("Vehicle POST error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ DELETE vehicle (Admin only)
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM vehicles WHERE id = $1",
        [req.params.id]
      );

      res.json({ message: "Vehicle deleted" });
    } catch (error) {
      console.log("Vehicle DELETE error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;