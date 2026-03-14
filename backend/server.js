const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const managerRoutes = require("./routes/managerRoutes");
const driverRoutes = require("./routes/driverRoutes");
const routeRoutes = require("./routes/routeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);

// ================= BASIC TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("FleetNova Backend Running");
});

// ================= SOCKET SETUP =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendLocation", async (data) => {
    try {
      const { vehicleId, lat, lng } = data;

      if (!vehicleId || !lat || !lng) return;

      await pool.query(
        `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude)
         VALUES ($1, $2, $3)`,
        [vehicleId, lat, lng]
      );

      io.emit("receiveLocation", {
        vehicleId,
        lat,
        lng
      });
    } catch (error) {
      console.error("Socket error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= START SERVER =================
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
