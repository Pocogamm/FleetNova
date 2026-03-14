const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/verifyToken");

// ✅ GET ALL MANAGERS
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'fleet_manager'"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch managers" });
  }
});

// ✅ CREATE MANAGER
router.post("/", verifyToken, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, "fleet_manager"]
    );

    res.json({ message: "Manager created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create manager" });
  }
});

// ✅ DELETE MANAGER
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM users WHERE id = $1 AND role = 'fleet_manager'",
      [req.params.id]
    );

    res.json({ message: "Manager deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;