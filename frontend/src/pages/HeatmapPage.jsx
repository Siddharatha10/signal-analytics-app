import { useEffect, useState, useCallback, useRef } from "react";
import { fetchPages, fetchHeatmapData } from "../api/client";
import { LoadingState, ErrorState, EmptyState } from "../components/StatusStates";
import "./HeatmapPage.css";

// Reference canvas size that click coordinates get normalized into,
// since different visitors may have had different viewport sizes.
const CANVAS_WIDTH = 1040;
const CANVAS_HEIGHT = 640;

function pathFromUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search || "/";
  } catch {
    return url;
  }
}

function HeatmapPage() {
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState(null);

  const [selectedPage, setSelectedPage] = useState(null);
  const [clicks, setClicks] = useState(null);
  const [clicksLoading, setClicksLoading] = useState(false);
  const [clicksError, setClicksError] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const canvasWrapRef = useRef(null);

  const loadPages = useCallback(() => {
    setPagesLoading(true);
    setPagesError(null);
    fetchPages()
      .then((data) => {
        setPages(data.pages);
        if (data.pages.length > 0) {
          setSelectedPage((prev) => prev ?? data.pages[0]);
        }
      })
      .catch((err) => setPagesError(err.message))
      .finally(() => setPagesLoading(false));
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (!selectedPage) return;
    setClicksLoading(true);
    setClicksError(null);
    fetchHeatmapData(selectedPage)
      .then((data) => setClicks(data.clicks))
      .catch((err) => setClicksError(err.message))
      .finally(() => setClicksLoading(false));
  }, [selectedPage]);

  // Normalize a click's raw (x, y, viewportWidth, viewportHeight) into
  // a 0..1 fraction so it can be plotted on the fixed-size canvas
  // regardless of the visitor's actual screen size.
  function normalize(click) {
    const vw = click.viewportWidth || CANVAS_WIDTH;
    const vh = click.viewportHeight || CANVAS_HEIGHT;
    return {
      fx: Math.min(Math.max(click.x / vw, 0), 1),
      fy: Math.min(Math.max(click.y / vh, 0), 1),
    };
  }

  return (
    <div className="heatmap-page">
      <div className="page-heading">
        <div>
          <h1>Heatmap</h1>
          <p className="page-heading__sub">
            Click positions plotted on a normalized canvas, pooled across every session.
          </p>
        </div>
      </div>

      {pagesLoading && <LoadingState label="Loading pages" />}
      {pagesError && <ErrorState message={pagesError} onRetry={loadPages} />}

      {!pagesLoading && !pagesError && pages.length === 0 && (
        <EmptyState
          title="No pages tracked yet"
          detail="Click events need a pageUrl to appear here. Generate some clicks on the demo page first."
        />
      )}

      {!pagesLoading && !pagesError && pages.length > 0 && (
        <>
          <div className="page-select-row">
            <label htmlFor="page-select" className="page-select-label">
              Page
            </label>
            <select
              id="page-select"
              className="page-select"
              value={selectedPage || ""}
              onChange={(e) => setSelectedPage(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p} value={p}>
                  {pathFromUrl(p)}
                </option>
              ))}
            </select>
            {clicks && (
              <span className="page-select-count">
                {clicks.length} click{clicks.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {clicksLoading && <LoadingState label="Loading click data" />}
          {clicksError && (
            <ErrorState message={clicksError} onRetry={() => setSelectedPage(selectedPage)} />
          )}

          {!clicksLoading && !clicksError && clicks && clicks.length === 0 && (
            <EmptyState
              title="No clicks recorded for this page"
              detail="Try a page with more activity, or generate clicks via the demo page."
            />
          )}

          {!clicksLoading && !clicksError && clicks && clicks.length > 0 && (
            <div className="heatmap-canvas-wrap" ref={canvasWrapRef}>
              <svg
                className="heatmap-canvas"
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`Click heatmap for ${pathFromUrl(selectedPage)}`}
              >
                <defs>
                  <radialGradient id="clickGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Faint grid for spatial reference */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={(CANVAS_WIDTH / 8) * i}
                    y1={0}
                    x2={(CANVAS_WIDTH / 8) * i}
                    y2={CANVAS_HEIGHT}
                    className="heatmap-grid-line"
                  />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={(CANVAS_HEIGHT / 5) * i}
                    x2={CANVAS_WIDTH}
                    y2={(CANVAS_HEIGHT / 5) * i}
                    className="heatmap-grid-line"
                  />
                ))}

                {clicks.map((click, idx) => {
                  const { fx, fy } = normalize(click);
                  const cx = fx * CANVAS_WIDTH;
                  const cy = fy * CANVAS_HEIGHT;
                  const isHovered = hoveredIdx === idx;
                  return (
                    <g key={idx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={22}
                        fill="url(#clickGlow)"
                        style={{ pointerEvents: "none" }}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : 4}
                        className="heatmap-dot"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {hoveredIdx !== null && clicks[hoveredIdx] && (
                <div className="heatmap-tooltip">
                  <div>session: {clicks[hoveredIdx].sessionId.slice(0, 8)}…</div>
                  <div>
                    x: {Math.round(clicks[hoveredIdx].x)}, y: {Math.round(clicks[hoveredIdx].y)}
                  </div>
                  <div>{new Date(clicks[hoveredIdx].timestamp).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HeatmapPage;
