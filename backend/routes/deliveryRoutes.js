const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/authMiddleware");


// ================= CREATE DELIVERY (Customer) =================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { pickup_location, drop_location } = req.body;

    if (!pickup_location || !drop_location) {
      return res.status(400).json({ message: "All fields required" });
    }

    const result = await pool.query(
      `INSERT INTO deliveries 
       (customer_id, pickup_location, drop_location, status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING *`,
      [req.user.id, pickup_location, drop_location]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET CUSTOMER DELIVERIES =================
router.get("/my", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM deliveries WHERE customer_id=$1 ORDER BY id DESC",
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET CUSTOMER STATS =================
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await pool.query(
      "SELECT COUNT(*) FROM deliveries WHERE customer_id=$1",
      [userId]
    );

    const inTransit = await pool.query(
      "SELECT COUNT(*) FROM deliveries WHERE customer_id=$1 AND status='in_transit'",
      [userId]
    );

    const delivered = await pool.query(
      "SELECT COUNT(*) FROM deliveries WHERE customer_id=$1 AND status='delivered'",
      [userId]
    );

    res.json({
      total: total.rows[0].count,
      inTransit: inTransit.rows[0].count,
      delivered: delivered.rows[0].count,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET ACTIVE DELIVERY =================
router.get("/active", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM deliveries 
       WHERE customer_id=$1 AND status='in_transit'
       LIMIT 1`,
      [req.user.id]
    );

    res.json(result.rows[0] || null);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ================= GET LATEST VEHICLE LOCATION =================
router.get("/vehicle-location/:vehicleId", verifyToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(
      `SELECT * FROM vehicle_locations
       WHERE vehicle_id=$1
       ORDER BY created_at DESC
       LIMIT 1`,
      [vehicleId]
    );

    res.json(result.rows[0] || null);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;