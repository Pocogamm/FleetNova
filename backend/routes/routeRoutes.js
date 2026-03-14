const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyToken = require("../middleware/verifyToken");

async function ensureRoutesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fleet_routes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      start_name TEXT NOT NULL,
      end_name TEXT NOT NULL,
      start_lat DOUBLE PRECISION NOT NULL,
      start_lng DOUBLE PRECISION NOT NULL,
      end_lat DOUBLE PRECISION NOT NULL,
      end_lng DOUBLE PRECISION NOT NULL,
      total_distance_km DOUBLE PRECISION NOT NULL,
      covered_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'created',
      delivery_id TEXT,
      vehicle_id INTEGER,
      driver_name TEXT,
      route_geometry JSONB,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

router.get("/delivery-options", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, pickup_location, drop_location, status
       FROM deliveries
       ORDER BY id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Delivery options error:", error);
    res.status(500).json({ message: "Failed to fetch delivery options" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    await ensureRoutesTable();

    const result = await pool.query(
      `SELECT
          id,
          name,
          start_name,
          end_name,
          start_lat,
          start_lng,
          end_lat,
          end_lng,
          total_distance_km,
          covered_distance_km,
          status,
          delivery_id,
          vehicle_id,
          driver_name,
          route_geometry,
          created_at
       FROM fleet_routes
       ORDER BY id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Route list error:", error);
    res.status(500).json({ message: "Failed to fetch routes" });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    await ensureRoutesTable();

    const {
      name,
      start_name,
      end_name,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      total_distance_km,
      route_geometry
    } = req.body;

    if (
      !name ||
      !start_name ||
      !end_name ||
      start_lat === undefined ||
      start_lng === undefined ||
      end_lat === undefined ||
      end_lng === undefined ||
      total_distance_km === undefined
    ) {
      return res.status(400).json({ message: "Missing required route fields" });
    }

    const result = await pool.query(
      `INSERT INTO fleet_routes (
         name, start_name, end_name,
         start_lat, start_lng, end_lat, end_lng,
         total_distance_km, route_geometry, created_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
       RETURNING *`,
      [
        name,
        start_name,
        end_name,
        Number(start_lat),
        Number(start_lng),
        Number(end_lat),
        Number(end_lng),
        Number(total_distance_km),
        JSON.stringify(route_geometry || []),
        req.user.id || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Route create error:", error);
    res.status(500).json({ message: "Failed to create route" });
  }
});

router.patch("/:id/assign", verifyToken, async (req, res) => {
  try {
    await ensureRoutesTable();

    const { delivery_id, vehicle_id, driver_name } = req.body;

    if (!delivery_id || !vehicle_id || !driver_name) {
      return res.status(400).json({ message: "delivery_id, vehicle_id, driver_name are required" });
    }

    const result = await pool.query(
      `UPDATE fleet_routes
       SET delivery_id = $1,
           vehicle_id = $2,
           driver_name = $3,
           status = 'assigned'
       WHERE id = $4
       RETURNING *`,
      [String(delivery_id), Number(vehicle_id), driver_name, Number(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Route assign error:", error);
    res.status(500).json({ message: "Failed to assign route" });
  }
});

router.patch("/:id/start", verifyToken, async (req, res) => {
  try {
    await ensureRoutesTable();

    const result = await pool.query(
      `UPDATE fleet_routes
       SET status = 'in_transit'
       WHERE id = $1
       RETURNING *`,
      [Number(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Route start error:", error);
    res.status(500).json({ message: "Failed to start route" });
  }
});

router.patch("/:id/progress", verifyToken, async (req, res) => {
  try {
    await ensureRoutesTable();

    const increment_km = Number(req.body.increment_km || 0);
    if (!increment_km || increment_km <= 0) {
      return res.status(400).json({ message: "increment_km must be greater than zero" });
    }

    const currentRes = await pool.query(
      `SELECT id, total_distance_km, covered_distance_km
       FROM fleet_routes
       WHERE id = $1`,
      [Number(req.params.id)]
    );

    if (currentRes.rows.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    const route = currentRes.rows[0];
    const covered = Math.min(
      Number(route.total_distance_km),
      Number(route.covered_distance_km) + increment_km
    );
    const status = covered >= Number(route.total_distance_km) ? "delivered" : "in_transit";

    const result = await pool.query(
      `UPDATE fleet_routes
       SET covered_distance_km = $1,
           status = $2
       WHERE id = $3
       RETURNING *`,
      [covered, status, Number(req.params.id)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Route progress error:", error);
    res.status(500).json({ message: "Failed to update route progress" });
  }
});

module.exports = router;
