const pool = require("../db");

// Add vehicle
const addVehicle = async (req, res) => {
  try {
    const { vehicle_number, type } = req.body;

    const result = await pool.query(
      "INSERT INTO vehicles (vehicle_number, type) VALUES ($1, $2) RETURNING *",
      [vehicle_number, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all vehicles
const getVehicles = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vehicles ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { addVehicle, getVehicles };
