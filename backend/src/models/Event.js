const mongoose = require("mongoose");

/**
 * Event schema
 *
 * Every tracked interaction (page_view, click) is stored as a single
 * document. Fields are flattened (rather than deeply nested) so that
 * the common queries — "events for a session" and "clicks for a page" —
 * can be served by simple indexed equality queries instead of aggregation.
 */
const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ["page_view", "click"],
      index: true,
    },
    pageUrl: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Only populated for click events
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    // Viewport size at time of click, useful for normalizing heatmap
    // coordinates across different screen sizes.
    viewportWidth: {
      type: Number,
      default: null,
    },
    viewportHeight: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false, // we use our own client-supplied `timestamp` field
    versionKey: false,
  }
);

// Compound index to speed up "all events for a session, in order"
eventSchema.index({ sessionId: 1, timestamp: 1 });

// Compound index to speed up "all clicks for a page" (heatmap query)
eventSchema.index({ pageUrl: 1, eventType: 1 });

module.exports = mongoose.model("Event", eventSchema);
