console.log("DB FILE LOADED");

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "fleetnova",
  password: "India@11",
  port: 8437,
});

pool.connect()
  .then(() => console.log("Database connected successfully 🚛"))
  .catch(err => console.error("Database connection error", err));

module.exports = pool;
