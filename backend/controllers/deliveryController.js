const pool = require("../db");

// Create delivery (customer)
const createDelivery = async (req, res) => {
  try {
    const { pickup_location, drop_location } = req.body;

    const result = await pool.query(
      "INSERT INTO deliveries (customer_id, pickup_location, drop_location) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, pickup_location, drop_location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Assign vehicle (admin or manager)
const assignVehicle = async (req, res) => {
  try {
    const { deliveryId, vehicleId } = req.body;

    const result = await pool.query(
      "UPDATE deliveries SET vehicle_id=$1, status='assigned' WHERE id=$2 RETURNING *",
      [vehicleId, deliveryId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all deliveries
const getDeliveries = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM deliveries ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDelivery,
  assignVehicle,
  getDeliveries
};
