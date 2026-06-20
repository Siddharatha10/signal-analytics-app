import { useEffect, useState, useCallback } from "react";
import { fetchSessions, fetchSessionEvents } from "../api/client";
import { LoadingState, ErrorState, EmptyState } from "../components/StatusStates";
import "./SessionsPage.css";

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeDuration(startIso, endIso) {
  const ms = new Date(endIso) - new Date(startIso);
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  return `${minutes}m ${remSeconds}s`;
}

function eventLabel(event) {
  if (event.eventType === "page_view") return "Page view";
  if (event.eventType === "click") return `Click (${Math.round(event.x)}, ${Math.round(event.y)})`;
  return event.eventType;
}

function pathFromUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search || "/";
  } catch {
    return url;
  }
}

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [journey, setJourney] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState(null);

  const loadSessions = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchSessions()
      .then((data) => setSessions(data.sessions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  function handleSelectSession(sessionId) {
    setSelectedSessionId(sessionId);
    setJourneyLoading(true);
    setJourneyError(null);
    setJourney(null);

    fetchSessionEvents(sessionId)
      .then((data) => setJourney(data.events))
      .catch((err) => setJourneyError(err.message))
      .finally(() => setJourneyLoading(false));
  }

  return (
    <div className="sessions-page">
      <div className="page-heading">
        <div>
          <h1>Sessions</h1>
          <p className="page-heading__sub">
            Every browsing session tracked by the script, newest first.
          </p>
        </div>
        <button className="ghost-button" onClick={loadSessions}>
          Refresh
        </button>
      </div>

      <div className="sessions-layout">
        <section className="sessions-list">
          {loading && <LoadingState label="Loading sessions" />}
          {error && <ErrorState message={error} onRetry={loadSessions} />}
          {!loading && !error && sessions.length === 0 && (
            <EmptyState
              title="No sessions yet"
              detail="Open the demo page with tracker.js installed to generate your first session."
            />
          )}
          {!loading &&
            !error &&
            sessions.map((s) => (
              <button
                key={s.sessionId}
                className={
                  "session-row" + (s.sessionId === selectedSessionId ? " is-selected" : "")
                }
                onClick={() => handleSelectSession(s.sessionId)}
              >
                <div className="session-row__id">{s.sessionId}</div>
                <div className="session-row__meta">
                  <span className="session-row__stat">
                    <strong>{s.eventCount}</strong> events
                  </span>
                  <span className="session-row__stat">
                    <strong>{s.pageCount}</strong> page{s.pageCount === 1 ? "" : "s"}
                  </span>
                  <span className="session-row__time">{formatTimestamp(s.lastEventAt)}</span>
                </div>
              </button>
            ))}
        </section>

        <section className="sessions-detail">
          {!selectedSessionId && (
            <EmptyState
              title="Select a session"
              detail="Pick a session from the list to see its ordered event journey."
            />
          )}

          {selectedSessionId && journeyLoading && <LoadingState label="Loading journey" />}
          {selectedSessionId && journeyError && (
            <ErrorState message={journeyError} onRetry={() => handleSelectSession(selectedSessionId)} />
          )}

          {selectedSessionId && journey && (
            <>
              <div className="journey-header">
                <h2>Journey</h2>
                <span className="journey-header__id">{selectedSessionId}</span>
              </div>

              <ol className="journey-list">
                {journey.map((event, idx) => (
                  <li className="journey-item" key={idx}>
                    <div className="journey-item__rail">
                      <span
                        className={
                          "journey-item__dot" +
                          (event.eventType === "click" ? " journey-item__dot--click" : "")
                        }
                      />
                      {idx < journey.length - 1 && <span className="journey-item__line" />}
                    </div>
                    <div className="journey-item__body">
                      <div className="journey-item__top">
                        <span className="journey-item__label">{eventLabel(event)}</span>
                        <span className="journey-item__time">{formatTimestamp(event.timestamp)}</span>
                      </div>
                      <div className="journey-item__url" title={event.pageUrl}>
                        {pathFromUrl(event.pageUrl)}
                      </div>
                      {idx > 0 && (
                        <div className="journey-item__delta">
                          +{relativeDuration(journey[idx - 1].timestamp, event.timestamp)}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default SessionsPage;
