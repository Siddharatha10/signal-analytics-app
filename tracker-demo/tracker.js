/**
 * tracker.js
 * --------------------------------------------------------------
 * A tiny, dependency-free analytics tracking script.
 *
 * Usage: drop this file on any webpage, e.g.
 *
 *   <script
 *     src="tracker.js"
 *     data-api-url="http://localhost:5000/api/events"
 *   ></script>
 *
 * It will automatically:
 *   - Generate (or reuse) a session_id, persisted in localStorage
 *   - Fire a `page_view` event on load
 *   - Fire a `click` event (with x/y coordinates) on every click
 *
 * No external dependencies, no build step required.
 * --------------------------------------------------------------
 */

(function () {
  "use strict";

  var SESSION_STORAGE_KEY = "analytics_session_id";
  var SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes of inactivity = new session
  var LAST_ACTIVITY_KEY = "analytics_last_activity";

  // ---- Resolve config from the <script> tag's data attributes ----
  function getCurrentScriptConfig() {
    var scriptTag =
      document.currentScript ||
      (function () {
        var scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
      })();

    var apiUrl = scriptTag.getAttribute("data-api-url") || "http://localhost:5000/api/events";
    return { apiUrl: apiUrl };
  }

  var config = getCurrentScriptConfig();

  // ---- Session ID management ----
  function generateUUID() {
    // RFC4122-ish v4 UUID, good enough for session identification
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreateSessionId() {
    var now = Date.now();
    var lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY), 10);
    var existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

    var sessionExpired =
      !existingSessionId || !lastActivity || now - lastActivity > SESSION_TTL_MS;

    var sessionId = sessionExpired ? generateUUID() : existingSessionId;

    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));

    return sessionId;
  }

  var sessionId = getOrCreateSessionId();

  // ---- Event sending ----
  function sendEvent(payload) {
    var body = JSON.stringify(payload);

    fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      credentials: "omit",
    }).catch(function (err) {
      console.warn("[tracker.js] Failed to send event:", err);
    });
  }

  function basePayload(eventType) {
    // Refresh activity timestamp on every event sent
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    return {
      sessionId: sessionId,
      eventType: eventType,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: navigator.userAgent,
    };
  }

  // ---- Track page_view on load ----
  function trackPageView() {
    sendEvent(basePayload("page_view"));
  }

  // ---- Track click with coordinates ----
  function trackClick(e) {
    var payload = basePayload("click");
    payload.x = e.clientX;
    payload.y = e.clientY;
    sendEvent(payload);
  }

  // ---- Wire up listeners ----
  if (document.readyState === "complete" || document.readyState === "interactive") {
    trackPageView();
  } else {
    document.addEventListener("DOMContentLoaded", trackPageView);
  }

  document.addEventListener("click", trackClick, true);

  // Expose a tiny API in case the host page wants to fire custom events
  // or check the current session id.
  window.AnalyticsTracker = {
    getSessionId: function () {
      return sessionId;
    },
    trackPageView: trackPageView,
  };
})();
