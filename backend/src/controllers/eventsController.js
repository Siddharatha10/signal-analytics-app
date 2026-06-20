const Event = require("../models/Event");

/**
 * POST /api/events
 * Receive and store a single tracked event.
 */
async function createEvent(req, res) {
  try {
    const {
      sessionId,
      eventType,
      pageUrl,
      timestamp,
      x,
      y,
      viewportWidth,
      viewportHeight,
      userAgent,
    } = req.body;

    if (!sessionId || !eventType || !pageUrl) {
      return res.status(400).json({
        error: "sessionId, eventType, and pageUrl are required fields.",
      });
    }

    if (!["page_view", "click"].includes(eventType)) {
      return res.status(400).json({
        error: "eventType must be either 'page_view' or 'click'.",
      });
    }

    if (eventType === "click" && (x === undefined || y === undefined)) {
      return res.status(400).json({
        error: "click events require x and y coordinates.",
      });
    }

    const event = await Event.create({
      sessionId,
      eventType,
      pageUrl,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      x: eventType === "click" ? x : null,
      y: eventType === "click" ? y : null,
      viewportWidth: viewportWidth ?? null,
      viewportHeight: viewportHeight ?? null,
      userAgent: userAgent ?? req.headers["user-agent"] ?? null,
    });

    return res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("[createEvent]", err);
    return res.status(500).json({ error: "Failed to store event." });
  }
}

/**
 * GET /api/sessions
 * Fetch a list of all sessions with their total event count,
 * first-seen / last-seen timestamps, and the first page visited.
 */
async function getSessions(req, res) {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$sessionId",
          eventCount: { $sum: 1 },
          firstEventAt: { $min: "$timestamp" },
          lastEventAt: { $max: "$timestamp" },
          pages: { $addToSet: "$pageUrl" },
        },
      },
      {
        $project: {
          _id: 0,
          sessionId: "$_id",
          eventCount: 1,
          firstEventAt: 1,
          lastEventAt: 1,
          pageCount: { $size: "$pages" },
        },
      },
      { $sort: { lastEventAt: -1 } },
    ]);

    return res.json({ success: true, count: sessions.length, sessions });
  } catch (err) {
    console.error("[getSessions]", err);
    return res.status(500).json({ error: "Failed to fetch sessions." });
  }
}

/**
 * GET /api/sessions/:sessionId/events
 * Fetch the full ordered list of events for one session (user journey).
 */
async function getSessionEvents(req, res) {
  try {
    const { sessionId } = req.params;

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (events.length === 0) {
      return res.status(404).json({ error: "No events found for this session." });
    }

    return res.json({ success: true, sessionId, count: events.length, events });
  } catch (err) {
    console.error("[getSessionEvents]", err);
    return res.status(500).json({ error: "Failed to fetch session events." });
  }
}

/**
 * GET /api/pages
 * Fetch the distinct list of page URLs that have any tracked events.
 * Used by the frontend to populate the heatmap page selector.
 */
async function getPages(req, res) {
  try {
    const pages = await Event.distinct("pageUrl");
    return res.json({ success: true, count: pages.length, pages });
  } catch (err) {
    console.error("[getPages]", err);
    return res.status(500).json({ error: "Failed to fetch pages." });
  }
}

/**
 * GET /api/heatmap?pageUrl=...
 * Fetch all click coordinates for a given page URL.
 */
async function getHeatmapData(req, res) {
  try {
    const { pageUrl } = req.query;

    if (!pageUrl) {
      return res.status(400).json({ error: "pageUrl query parameter is required." });
    }

    const clicks = await Event.find(
      { pageUrl, eventType: "click" },
      { x: 1, y: 1, viewportWidth: 1, viewportHeight: 1, timestamp: 1, sessionId: 1, _id: 0 }
    ).lean();

    return res.json({ success: true, pageUrl, count: clicks.length, clicks });
  } catch (err) {
    console.error("[getHeatmapData]", err);
    return res.status(500).json({ error: "Failed to fetch heatmap data." });
  }
}

module.exports = {
  createEvent,
  getSessions,
  getSessionEvents,
  getPages,
  getHeatmapData,
};
