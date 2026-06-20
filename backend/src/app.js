const express = require("express");
const cors = require("cors");
const eventRoutes = require("./routes/eventRoutes");

function createApp() {
  const app = express();

  app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  })
);

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "user-analytics-backend" });
  });

  app.use("/api", eventRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Route not found." });
  });

  // Generic error handler
  app.use((err, req, res, next) => {
    console.error("[Unhandled Error]", err);
    res.status(500).json({ error: "Internal server error." });
  });

  return app;
}

module.exports = createApp;
