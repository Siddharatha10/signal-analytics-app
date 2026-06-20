const express = require("express");
const router = express.Router();
const {
  createEvent,
  getSessions,
  getSessionEvents,
  getPages,
  getHeatmapData,
} = require("../controllers/eventsController");

// Event ingestion
router.post("/events", createEvent);

// Sessions
router.get("/sessions", getSessions);
router.get("/sessions/:sessionId/events", getSessionEvents);

// Pages + Heatmap
router.get("/pages", getPages);
router.get("/heatmap", getHeatmapData);

module.exports = router;
